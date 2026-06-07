#!/usr/bin/env python3
"""
TelChurn IQ — ETL Pipeline
EY Telecom Analytics Practice

Full Extract-Transform-Load pipeline for telecom customer data.
Supports CSV, JSON, and PostgreSQL sources with data quality checks,
logging, alerting, and incremental load patterns.

Usage:
    python pipeline.py --source csv --file data/customers.csv
    python pipeline.py --source postgres --query "SELECT * FROM raw_customers"
    python pipeline.py --source json --file data/customers.json
    python pipeline.py --full-refresh
"""

import os
import sys
import json
import time
import hashlib
import argparse
import logging
from datetime import datetime, timezone
from typing import Optional

# ── External dependencies ──────────────────────────────────────
try:
    import psycopg2
    import psycopg2.extras
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

# ── Logger setup ───────────────────────────────────────────────
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def setup_logger(name: str, log_file: Optional[str] = None, level=logging.INFO) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(level)
    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger

logger = setup_logger(
    "telchurn.etl",
    log_file=f"logs/etl/pipeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
)

# ── Constants ──────────────────────────────────────────────────
VALID_SUBSCRIPTION_TYPES = {"Basic", "Standard", "Premium", "Enterprise"}
VALID_CONTRACT_TYPES      = {"Month-to-Month", "One Year", "Two Year"}
VALID_PAYMENT_METHODS     = {"UPI", "Credit Card", "Net Banking", "Debit Card", "Cash"}
VALID_GENDERS             = {"Male", "Female", "Other"}
VALID_RISK_TIERS          = {"High", "Medium", "Low"}
BATCH_SIZE                = 5000


# ══════════════════════════════════════════════════════════════
# EXTRACTORS
# ══════════════════════════════════════════════════════════════

class BaseExtractor:
    def __init__(self, name: str):
        self.name   = name
        self.logger = setup_logger(f"telchurn.extractor.{name}")

    def extract(self) -> list[dict]:
        raise NotImplementedError


class CsvExtractor(BaseExtractor):
    def __init__(self, file_path: str):
        super().__init__("csv")
        self.file_path = file_path

    def extract(self) -> list[dict]:
        self.logger.info(f"Extracting from CSV: {self.file_path}")
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"CSV file not found: {self.file_path}")

        records: list[dict] = []
        if PANDAS_AVAILABLE:
            df = pd.read_csv(self.file_path, dtype=str)
            records = df.where(pd.notnull(df), None).to_dict(orient="records")
        else:
            import csv
            with open(self.file_path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                records = [dict(row) for row in reader]

        self.logger.info(f"Extracted {len(records):,} records from CSV")
        return records


class JsonExtractor(BaseExtractor):
    def __init__(self, file_path: str):
        super().__init__("json")
        self.file_path = file_path

    def extract(self) -> list[dict]:
        self.logger.info(f"Extracting from JSON: {self.file_path}")
        with open(self.file_path, encoding="utf-8") as f:
            data = json.load(f)
        records = data if isinstance(data, list) else data.get("records", [])
        self.logger.info(f"Extracted {len(records):,} records from JSON")
        return records


class PostgresExtractor(BaseExtractor):
    def __init__(self, dsn: str, query: str):
        super().__init__("postgres")
        self.dsn   = dsn
        self.query = query

    def extract(self) -> list[dict]:
        if not PSYCOPG2_AVAILABLE:
            raise ImportError("psycopg2 is required: pip install psycopg2-binary")
        self.logger.info("Extracting from PostgreSQL source")
        conn = psycopg2.connect(self.dsn)
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(self.query)
                records = [dict(row) for row in cur.fetchall()]
        finally:
            conn.close()
        self.logger.info(f"Extracted {len(records):,} records from PostgreSQL")
        return records


# ══════════════════════════════════════════════════════════════
# TRANSFORMERS
# ══════════════════════════════════════════════════════════════

class DataTransformer:
    """Applies business rules, type coercions, and derived columns."""

    def __init__(self):
        self.logger = setup_logger("telchurn.transformer")
        self.rejected: list[dict] = []

    def _safe_float(self, val, default=0.0) -> float:
        try:
            return float(val) if val is not None else default
        except (ValueError, TypeError):
            return default

    def _safe_int(self, val, default=0) -> int:
        try:
            return int(float(val)) if val is not None else default
        except (ValueError, TypeError):
            return default

    def _compute_churn_probability(self, record: dict) -> float:
        """
        Logistic regression surrogate scoring using key drivers:
        - Customer satisfaction (negative weight)
        - Complaint count (positive weight)
        - Network issues (positive weight)
        - Tenure (negative weight — longer = lower risk)
        - Contract type (month-to-month = higher risk)
        """
        score = 0.0
        satisfaction = self._safe_float(record.get("customer_satisfaction_score"), 3.0)
        complaints   = self._safe_int(record.get("complaint_count"), 0)
        network      = self._safe_int(record.get("network_issues"), 0)
        tenure       = self._safe_int(record.get("tenure"), 12)
        contract     = str(record.get("contract_type", "Month-to-Month"))

        score += (5.0 - satisfaction) * 0.25
        score += min(complaints, 10) * 0.15
        score += min(network, 10) * 0.12
        score -= min(tenure, 72) / 72 * 0.20
        score += 0.15 if contract == "Month-to-Month" else (-0.08 if contract == "Two Year" else 0)

        # Sigmoid normalization
        import math
        score = 1 / (1 + math.exp(-score))
        return round(max(0.0, min(1.0, score)), 4)

    def _compute_risk_tier(self, prob: float) -> str:
        if prob >= 0.65:
            return "High"
        if prob >= 0.35:
            return "Medium"
        return "Low"

    def _compute_clv(self, arpu: float, tenure: int, churn_prob: float) -> float:
        """CLV = ARPU × Expected_Remaining_Months × Retention_Factor"""
        retention_prob     = max(0.05, 1 - churn_prob)
        expected_remaining = (1 / (1 - retention_prob)) if retention_prob < 1 else 72
        return round(arpu * min(expected_remaining, 84) * 0.85, 2)

    def transform(self, records: list[dict]) -> list[dict]:
        self.logger.info(f"Transforming {len(records):,} records")
        transformed: list[dict] = []

        for i, raw in enumerate(records):
            try:
                t: dict = {}

                # --- Identity ---
                t["customer_id"] = str(raw.get("customer_id") or f"CUST{i:07d}")
                t["gender"]      = str(raw.get("gender", "Other")).strip().title()
                if t["gender"] not in VALID_GENDERS:
                    t["gender"] = "Other"

                t["age"]   = max(18, min(100, self._safe_int(raw.get("age"), 35)))
                t["state"] = str(raw.get("state", "Unknown")).strip().title()
                t["city"]  = str(raw.get("city", "Unknown")).strip().title()

                # --- Subscription ---
                t["tenure"]            = max(0, self._safe_int(raw.get("tenure"), 1))
                t["subscription_type"] = str(raw.get("subscription_type", "Basic")).strip().title()
                if t["subscription_type"] not in VALID_SUBSCRIPTION_TYPES:
                    t["subscription_type"] = "Basic"

                t["contract_type"] = str(raw.get("contract_type", "Month-to-Month")).strip()
                if t["contract_type"] not in VALID_CONTRACT_TYPES:
                    t["contract_type"] = "Month-to-Month"

                t["payment_method"] = str(raw.get("payment_method", "UPI")).strip()
                if t["payment_method"] not in VALID_PAYMENT_METHODS:
                    t["payment_method"] = "UPI"

                # --- Financials ---
                t["monthly_charges"] = max(0.0, self._safe_float(raw.get("monthly_charges"), 300.0))
                t["total_charges"]   = max(0.0, self._safe_float(raw.get("total_charges"), t["monthly_charges"] * t["tenure"]))

                # --- Usage ---
                t["internet_usage_gb"]    = max(0.0, self._safe_float(raw.get("internet_usage_gb"), 5.0))
                t["voice_minutes"]        = max(0.0, self._safe_float(raw.get("voice_minutes"), 100.0))
                t["sms_usage"]            = max(0.0, self._safe_float(raw.get("sms_usage"), 50.0))
                t["recharge_frequency"]   = max(1, self._safe_int(raw.get("recharge_frequency"), 1))
                t["customer_support_calls"] = max(0, self._safe_int(raw.get("customer_support_calls"), 0))
                t["complaint_count"]      = max(0, self._safe_int(raw.get("complaint_count"), 0))
                t["network_issues"]       = max(0, self._safe_int(raw.get("network_issues"), 0))

                # --- Satisfaction & Churn ---
                t["customer_satisfaction_score"] = round(
                    max(1.0, min(5.0, self._safe_float(raw.get("customer_satisfaction_score"), 3.0))), 2
                )
                t["churn"] = 1 if self._safe_int(raw.get("churn"), 0) in (1, True) else 0

                # --- Derived metrics ---
                t["arpu"] = round(t["monthly_charges"] * 0.92, 2)
                t["revenue"] = round(t["arpu"] * max(t["tenure"], 1), 2)
                t["churn_probability"] = self._compute_churn_probability(t)
                t["risk_tier"] = self._compute_risk_tier(t["churn_probability"])
                t["customer_lifetime_value"] = self._compute_clv(t["arpu"], t["tenure"], t["churn_probability"])

                transformed.append(t)

            except Exception as exc:
                self.rejected.append({"index": i, "error": str(exc), "raw": raw})
                self.logger.warning(f"Record {i} rejected: {exc}")

        self.logger.info(
            f"Transformation complete: {len(transformed):,} accepted, {len(self.rejected):,} rejected"
        )
        return transformed


# ══════════════════════════════════════════════════════════════
# DATA QUALITY ENGINE
# ══════════════════════════════════════════════════════════════

class DataQualityEngine:
    """Runs pre-load and post-load quality checks."""

    def __init__(self):
        self.logger = setup_logger("telchurn.quality")
        self.results: list[dict] = []

    def _check(self, name: str, passed: bool, details: str, severity: str = "ERROR"):
        status = "PASS" if passed else severity
        self.results.append({"check": name, "status": status, "details": details})
        if passed:
            self.logger.info(f"[PASS] {name}: {details}")
        else:
            self.logger.warning(f"[{severity}] {name}: {details}")

    def run(self, records: list[dict]) -> bool:
        self.logger.info(f"Running data quality checks on {len(records):,} records")
        all_pass = True

        # 1. Volume check
        self._check("minimum_record_count", len(records) >= 1000, f"{len(records):,} records (min 1,000)")
        if len(records) < 1000:
            all_pass = False

        # 2. Null checks
        for field in ["customer_id", "subscription_type", "monthly_charges", "churn"]:
            null_count = sum(1 for r in records if r.get(field) is None)
            pct = null_count / len(records) * 100
            passed = pct < 5.0
            self._check(f"null_{field}", passed, f"{null_count:,} nulls ({pct:.2f}%)")
            if not passed:
                all_pass = False

        # 3. Duplicate IDs
        ids = [r["customer_id"] for r in records if r.get("customer_id")]
        dups = len(ids) - len(set(ids))
        self._check("no_duplicate_ids", dups == 0, f"{dups:,} duplicates found")
        if dups > 0:
            all_pass = False

        # 4. Value range validation
        invalid_age     = sum(1 for r in records if not (18 <= (r.get("age") or 35) <= 100))
        invalid_charges = sum(1 for r in records if (r.get("monthly_charges") or 0) < 0)
        invalid_churn   = sum(1 for r in records if r.get("churn") not in (0, 1))
        invalid_sat     = sum(1 for r in records if not (1.0 <= (r.get("customer_satisfaction_score") or 3.0) <= 5.0))

        self._check("age_in_range",          invalid_age == 0,     f"{invalid_age:,} out-of-range age values")
        self._check("non_negative_charges",  invalid_charges == 0, f"{invalid_charges:,} negative charges")
        self._check("valid_churn_flag",      invalid_churn == 0,   f"{invalid_churn:,} invalid churn values")
        self._check("satisfaction_in_range", invalid_sat == 0,     f"{invalid_sat:,} out-of-range satisfaction scores")

        # 5. Category validation
        for field, valid_set in [
            ("subscription_type", VALID_SUBSCRIPTION_TYPES),
            ("contract_type",     VALID_CONTRACT_TYPES),
            ("risk_tier",         VALID_RISK_TIERS),
        ]:
            invalid = sum(1 for r in records if r.get(field) not in valid_set)
            self._check(f"valid_{field}", invalid == 0, f"{invalid:,} invalid {field} values")

        self.logger.info(f"Quality checks complete: {sum(1 for r in self.results if r['status'] == 'PASS')}/{len(self.results)} passed")
        return all_pass

    def report(self) -> dict:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_checks": len(self.results),
            "passed": sum(1 for r in self.results if r["status"] == "PASS"),
            "failed": sum(1 for r in self.results if r["status"] != "PASS"),
            "checks": self.results
        }


# ══════════════════════════════════════════════════════════════
# LOADER
# ══════════════════════════════════════════════════════════════

class PostgresLoader:
    """Loads transformed records into PostgreSQL using upsert."""

    def __init__(self, dsn: str):
        if not PSYCOPG2_AVAILABLE:
            raise ImportError("psycopg2 is required: pip install psycopg2-binary")
        self.dsn    = dsn
        self.logger = setup_logger("telchurn.loader")

    def load(self, records: list[dict], full_refresh: bool = False) -> dict:
        conn = psycopg2.connect(self.dsn)
        conn.autocommit = False
        cursor = conn.cursor()

        inserted = 0
        updated  = 0
        errors   = 0

        try:
            if full_refresh:
                self.logger.info("Full refresh: truncating customers table")
                cursor.execute("TRUNCATE TABLE customers RESTART IDENTITY CASCADE")

            upsert_sql = """
                INSERT INTO customers (
                    customer_id, gender, age, state, city, tenure, subscription_type,
                    monthly_charges, total_charges, internet_usage_gb, voice_minutes,
                    sms_usage, recharge_frequency, customer_support_calls, complaint_count,
                    network_issues, payment_method, contract_type, customer_satisfaction_score,
                    arpu, revenue, churn, customer_lifetime_value, churn_probability, risk_tier
                ) VALUES (
                    %(customer_id)s, %(gender)s, %(age)s, %(state)s, %(city)s, %(tenure)s,
                    %(subscription_type)s, %(monthly_charges)s, %(total_charges)s,
                    %(internet_usage_gb)s, %(voice_minutes)s, %(sms_usage)s,
                    %(recharge_frequency)s, %(customer_support_calls)s, %(complaint_count)s,
                    %(network_issues)s, %(payment_method)s, %(contract_type)s,
                    %(customer_satisfaction_score)s, %(arpu)s, %(revenue)s, %(churn)s,
                    %(customer_lifetime_value)s, %(churn_probability)s, %(risk_tier)s
                )
                ON CONFLICT (customer_id) DO UPDATE SET
                    monthly_charges            = EXCLUDED.monthly_charges,
                    churn                      = EXCLUDED.churn,
                    churn_probability          = EXCLUDED.churn_probability,
                    risk_tier                  = EXCLUDED.risk_tier,
                    customer_satisfaction_score = EXCLUDED.customer_satisfaction_score,
                    complaint_count            = EXCLUDED.complaint_count,
                    network_issues             = EXCLUDED.network_issues,
                    arpu                       = EXCLUDED.arpu,
                    revenue                    = EXCLUDED.revenue,
                    customer_lifetime_value    = EXCLUDED.customer_lifetime_value
            """

            for batch_start in range(0, len(records), BATCH_SIZE):
                batch = records[batch_start: batch_start + BATCH_SIZE]
                try:
                    psycopg2.extras.execute_batch(cursor, upsert_sql, batch, page_size=1000)
                    conn.commit()
                    inserted += len(batch)
                    self.logger.info(
                        f"Batch {batch_start // BATCH_SIZE + 1}: loaded {len(batch):,} records "
                        f"(total: {inserted:,}/{len(records):,})"
                    )
                except Exception as batch_err:
                    conn.rollback()
                    errors += len(batch)
                    self.logger.error(f"Batch {batch_start // BATCH_SIZE + 1} failed: {batch_err}")

        finally:
            cursor.close()
            conn.close()

        return {"inserted": inserted, "updated": updated, "errors": errors}


# ══════════════════════════════════════════════════════════════
# PIPELINE ORCHESTRATOR
# ══════════════════════════════════════════════════════════════

class ETLPipeline:
    def __init__(self, config: dict):
        self.config = config
        self.logger = setup_logger("telchurn.pipeline")
        self.run_id = hashlib.md5(datetime.now().isoformat().encode()).hexdigest()[:8]
        self.metrics: dict = {
            "run_id": self.run_id,
            "started_at": None,
            "completed_at": None,
            "status": "pending",
            "extract": {},
            "transform": {},
            "quality": {},
            "load": {},
        }

    def run(self) -> dict:
        self.metrics["started_at"] = datetime.now(timezone.utc).isoformat()
        self.logger.info(f"Pipeline started | run_id={self.run_id}")
        start = time.time()

        try:
            # ── EXTRACT ──────────────────────────────────────
            self.logger.info("Phase 1/4: Extraction")
            extractor = self._build_extractor()
            records = extractor.extract()
            self.metrics["extract"] = {"records": len(records), "source": self.config["source"]}
            self.logger.info(f"Extracted {len(records):,} records in {time.time()-start:.1f}s")

            # ── TRANSFORM ────────────────────────────────────
            self.logger.info("Phase 2/4: Transformation")
            t0 = time.time()
            transformer = DataTransformer()
            transformed = transformer.transform(records)
            self.metrics["transform"] = {
                "accepted": len(transformed),
                "rejected": len(transformer.rejected),
                "duration_s": round(time.time() - t0, 2)
            }

            # ── DATA QUALITY ─────────────────────────────────
            self.logger.info("Phase 3/4: Data Quality")
            q0 = time.time()
            qe = DataQualityEngine()
            quality_passed = qe.run(transformed)
            report = qe.report()
            self.metrics["quality"] = {
                "passed": report["passed"],
                "failed": report["failed"],
                "duration_s": round(time.time() - q0, 2)
            }

            if not quality_passed and not self.config.get("skip_quality", False):
                raise ValueError(f"Data quality checks failed: {report['failed']} failures. Use --skip-quality to override.")

            # Save quality report
            os.makedirs("logs/quality", exist_ok=True)
            with open(f"logs/quality/dq_report_{self.run_id}.json", "w") as f:
                json.dump(report, f, indent=2)

            # ── LOAD ─────────────────────────────────────────
            self.logger.info("Phase 4/4: Loading")
            l0 = time.time()
            dsn = self.config.get("database_url") or os.environ.get("DATABASE_URL")
            if not dsn:
                raise ValueError("DATABASE_URL environment variable is required")

            loader = PostgresLoader(dsn)
            load_result = loader.load(transformed, full_refresh=self.config.get("full_refresh", False))
            self.metrics["load"] = {**load_result, "duration_s": round(time.time() - l0, 2)}

            self.metrics["status"] = "success"
            self.logger.info(
                f"Pipeline complete | run_id={self.run_id} | "
                f"loaded={load_result['inserted']:,} | "
                f"errors={load_result['errors']:,} | "
                f"total_time={round(time.time()-start, 1)}s"
            )

        except Exception as exc:
            self.metrics["status"] = "failed"
            self.metrics["error"] = str(exc)
            self.logger.error(f"Pipeline failed | run_id={self.run_id} | error={exc}", exc_info=True)

        finally:
            self.metrics["completed_at"] = datetime.now(timezone.utc).isoformat()
            self._save_run_log()

        return self.metrics

    def _build_extractor(self) -> BaseExtractor:
        source = self.config["source"]
        if source == "csv":
            return CsvExtractor(self.config["file"])
        if source == "json":
            return JsonExtractor(self.config["file"])
        if source == "postgres":
            return PostgresExtractor(
                self.config.get("source_dsn") or os.environ.get("SOURCE_DATABASE_URL", ""),
                self.config.get("query", "SELECT * FROM raw_customers"),
            )
        raise ValueError(f"Unknown source type: {source}")

    def _save_run_log(self):
        os.makedirs("logs/runs", exist_ok=True)
        with open(f"logs/runs/run_{self.run_id}.json", "w") as f:
            json.dump(self.metrics, f, indent=2)
        self.logger.info(f"Run log saved: logs/runs/run_{self.run_id}.json")


# ══════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="TelChurn IQ ETL Pipeline — EY Telecom Analytics",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--source",       choices=["csv", "json", "postgres"], default="csv")
    parser.add_argument("--file",         help="Path to CSV or JSON file")
    parser.add_argument("--query",        help="SQL query for PostgreSQL source")
    parser.add_argument("--source-dsn",   help="Source PostgreSQL DSN (overrides SOURCE_DATABASE_URL)")
    parser.add_argument("--database-url", help="Target PostgreSQL DSN (overrides DATABASE_URL)")
    parser.add_argument("--full-refresh", action="store_true", help="Truncate and reload all records")
    parser.add_argument("--skip-quality", action="store_true", help="Skip quality gate (load anyway)")
    parser.add_argument("--dry-run",      action="store_true", help="Extract + transform + QA without loading")
    args = parser.parse_args()

    config = {
        "source":       args.source,
        "file":         args.file,
        "query":        args.query,
        "source_dsn":   args.source_dsn,
        "database_url": args.database_url,
        "full_refresh": args.full_refresh,
        "skip_quality": args.skip_quality,
        "dry_run":      args.dry_run,
    }

    pipeline = ETLPipeline(config)
    result   = pipeline.run()

    print(json.dumps(result, indent=2))
    sys.exit(0 if result["status"] == "success" else 1)


if __name__ == "__main__":
    main()
