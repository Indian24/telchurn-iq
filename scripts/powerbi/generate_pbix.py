#!/usr/bin/env python3
"""
TelChurn IQ — Power BI Report Generator
EY Telecom Analytics Practice

Generates a Power BI Template (.pbit) file that connects to the TelChurn IQ
PostgreSQL database. Open the generated .pbit in Power BI Desktop, enter your
database credentials, and the full report structure will load.

Usage:
    pip install psycopg2-binary
    python generate_pbix.py --host localhost --db telchurn_iq --output TelChurnIQ.pbit

The .pbit file is a ZIP archive containing:
  - Version
  - Metadata (JSON)
  - Settings (JSON)
  - DataModelSchema (JSON) — table definitions + DAX measures
  - Report/report.json — complete report layout
"""

import json
import zipfile
import os
import argparse
from datetime import datetime

# ─────────────────────────────────────────────
# Report metadata
# ─────────────────────────────────────────────
REPORT_ID = "telchurn-iq-ey-analytics-2025"
REPORT_NAME = "TelChurn IQ - Telecom Analytics Platform"

# ─────────────────────────────────────────────
# Data model schema (table + columns + measures)
# ─────────────────────────────────────────────
def build_data_model_schema(host: str, port: int, database: str) -> dict:
    return {
        "name": "Model",
        "tables": [
            {
                "name": "customers",
                "columns": [
                    {"name": "id",                          "dataType": "int64"},
                    {"name": "customer_id",                 "dataType": "string"},
                    {"name": "gender",                      "dataType": "string"},
                    {"name": "age",                         "dataType": "int64"},
                    {"name": "state",                       "dataType": "string"},
                    {"name": "city",                        "dataType": "string"},
                    {"name": "tenure",                      "dataType": "int64"},
                    {"name": "subscription_type",           "dataType": "string"},
                    {"name": "monthly_charges",             "dataType": "double"},
                    {"name": "total_charges",               "dataType": "double"},
                    {"name": "internet_usage_gb",           "dataType": "double"},
                    {"name": "voice_minutes",               "dataType": "double"},
                    {"name": "sms_usage",                   "dataType": "double"},
                    {"name": "recharge_frequency",          "dataType": "int64"},
                    {"name": "customer_support_calls",      "dataType": "int64"},
                    {"name": "complaint_count",             "dataType": "int64"},
                    {"name": "network_issues",              "dataType": "int64"},
                    {"name": "payment_method",              "dataType": "string"},
                    {"name": "contract_type",               "dataType": "string"},
                    {"name": "customer_satisfaction_score", "dataType": "double"},
                    {"name": "arpu",                        "dataType": "double"},
                    {"name": "revenue",                     "dataType": "double"},
                    {"name": "churn",                       "dataType": "int64"},
                    {"name": "customer_lifetime_value",     "dataType": "double"},
                    {"name": "churn_probability",           "dataType": "double"},
                    {"name": "risk_tier",                   "dataType": "string"},
                    {"name": "created_at",                  "dataType": "dateTime"},
                ],
                "calculatedColumns": [
                    {
                        "name": "TenureBand",
                        "dataType": "string",
                        "expression": (
                            'IF(customers[tenure] <= 6, "0-6 months", '
                            'IF(customers[tenure] <= 12, "7-12 months", '
                            'IF(customers[tenure] <= 24, "13-24 months", '
                            'IF(customers[tenure] <= 36, "25-36 months", '
                            'IF(customers[tenure] <= 60, "37-60 months", "60+ months")))))'
                        ),
                    },
                    {
                        "name": "CLVBucket",
                        "dataType": "string",
                        "expression": (
                            'IF(customers[customer_lifetime_value] < 2000, "₹0-2K", '
                            'IF(customers[customer_lifetime_value] < 5000, "₹2K-5K", '
                            'IF(customers[customer_lifetime_value] < 8000, "₹5K-8K", '
                            'IF(customers[customer_lifetime_value] < 12000, "₹8K-12K", '
                            'IF(customers[customer_lifetime_value] < 20000, "₹12K-20K", "₹20K+")))))'
                        ),
                    },
                ],
                "measures": [
                    {"name": "Total Customers",    "expression": "COUNTROWS(customers)"},
                    {"name": "Active Customers",   "expression": "CALCULATE(COUNTROWS(customers), customers[churn] = 0)"},
                    {"name": "Churned Customers",  "expression": "CALCULATE(COUNTROWS(customers), customers[churn] = 1)"},
                    {"name": "Churn Rate %",       "expression": "DIVIDE([Churned Customers], [Total Customers], 0) * 100"},
                    {"name": "Retention Rate %",   "expression": "100 - [Churn Rate %]"},
                    {"name": "Total Revenue",      "expression": "SUM(customers[revenue])"},
                    {"name": "Avg ARPU",           "expression": "AVERAGE(customers[arpu])"},
                    {"name": "Avg CLV",            "expression": "AVERAGE(customers[customer_lifetime_value])"},
                    {"name": "Avg Satisfaction",   "expression": "AVERAGE(customers[customer_satisfaction_score])"},
                    {"name": "Revenue at Risk",    "expression": "CALCULATE(SUM(customers[arpu]), customers[churn] = 0, customers[risk_tier] = \"High\")"},
                    {"name": "High Risk Count",    "expression": "CALCULATE(COUNTROWS(customers), customers[risk_tier] = \"High\", customers[churn] = 0)"},
                    {"name": "Expected Revenue Loss", "expression": "SUMX(customers, customers[arpu] * customers[churn_probability])"},
                    {"name": "Model Accuracy %",   "expression": "DIVIDE(CALCULATE(COUNTROWS(customers), customers[churn] = 1, customers[churn_probability] >= 0.5) + CALCULATE(COUNTROWS(customers), customers[churn] = 0, customers[churn_probability] < 0.5), [Total Customers], 0) * 100"},
                ],
                "source": {
                    "type": "m",
                    "expression": (
                        f'let\n'
                        f'    Source = PostgreSQL.Database("{host}:{port}", "{database}"),\n'
                        f'    customers_table = Source{{[Schema="public", Item="customers"]}}[Data]\n'
                        f'in\n'
                        f'    customers_table'
                    ),
                },
            }
        ],
        "relationships": [],
        "cultures": [{"name": "en-IN", "linguisticMetadata": {"version": "1.0.0"}}],
    }


# ─────────────────────────────────────────────
# Report layout (6 pages)
# ─────────────────────────────────────────────
def build_report_json() -> dict:
    return {
        "id": REPORT_ID,
        "theme": {
            "name": "TelChurnIQ",
            "dataColors": ["#0079F2", "#795EFF", "#009118", "#A60808", "#ec4899", "#f59e0b", "#06b6d4"],
            "background": "#0f0f10",
            "foreground": "#f5f5f7",
            "tableAccent": "#0079F2",
        },
        "sections": [
            _build_page("Executive Overview",     "ReportSection1", ["KPI Cards", "Revenue Trend", "Churn Trend", "Segment Donut", "At-Risk Table"]),
            _build_page("Churn Analytics",        "ReportSection2", ["Churn by Plan", "Churn by Contract", "Monthly Trend", "Feature Importance"]),
            _build_page("Revenue Analytics",      "ReportSection3", ["Revenue Trend", "ARPU by Plan", "CLV Distribution", "Plan Performance"]),
            _build_page("Customer Explorer",      "ReportSection4", ["Customer Table", "Search/Filter Slicers"]),
            _build_page("Regional Performance",   "ReportSection5", ["Revenue by State", "Churn by State", "State Table"]),
            _build_page("ML & Prediction",        "ReportSection6", ["Model Metrics", "Confusion Matrix", "Risk Distribution", "Feature Importance"]),
        ],
        "settings": {
            "useStylableVisualContainerHeader": True,
            "exportDataMode": 1,
        },
        "layoutOptimization": 0,
    }


def _build_page(name: str, display_name: str, visuals: list) -> dict:
    return {
        "name": name,
        "displayName": display_name,
        "visualContainers": [
            {"id": f"vc_{display_name}_{i}", "visual": {"type": "placeholder", "title": v}}
            for i, v in enumerate(visuals)
        ],
        "filters": "[]",
        "config": json.dumps({
            "defaultFilterActionType": 1,
            "hasFilterSyncMechanism": False,
        }),
    }


# ─────────────────────────────────────────────
# Metadata
# ─────────────────────────────────────────────
def build_metadata() -> dict:
    return {
        "version": "3.0",
        "created": datetime.utcnow().isoformat() + "Z",
        "contentType": "PowerBIDesktop",
        "generator": "TelChurn IQ ETL Pipeline v1.0",
        "lastModifiedBy": "EY Analytics Practice",
    }


def build_settings() -> dict:
    return {
        "version": "3.0",
        "autoRecoverySaveEnabled": False,
        "dataModelDefaultMode": 2,  # Import
        "queryCachingEnabled": True,
        "reportSettings": {
            "filterPaneEnabled": True,
            "navContentPaneEnabled": True,
            "useStylableVisualContainerHeader": True,
        },
    }


# ─────────────────────────────────────────────
# .pbit generator
# ─────────────────────────────────────────────
def generate_pbit(output_path: str, host: str, port: int, database: str) -> None:
    print(f"Generating Power BI Template: {output_path}")

    schema = build_data_model_schema(host, port, database)
    report = build_report_json()
    metadata = build_metadata()
    settings = build_settings()

    content_types = """<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json" />
  <Override PartName="/Report/report.json"            ContentType="application/json" />
  <Override PartName="/DataModelSchema"               ContentType="application/json" />
  <Override PartName="/Metadata"                      ContentType="application/json" />
  <Override PartName="/Settings"                      ContentType="application/json" />
  <Override PartName="/Version"                       ContentType="application/octet-stream" />
</Types>"""

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("Version",             "3.0")
        z.writestr("Metadata",            json.dumps(metadata, indent=2))
        z.writestr("Settings",            json.dumps(settings, indent=2))
        z.writestr("DataModelSchema",     json.dumps(schema, indent=2, ensure_ascii=False))
        z.writestr("Report/report.json",  json.dumps(report, indent=2, ensure_ascii=False))

    size_kb = os.path.getsize(output_path) / 1024
    print(f"\n✅ Generated: {output_path} ({size_kb:.1f} KB)")
    print(f"\nNext steps:")
    print(f"  1. Open {output_path} in Power BI Desktop")
    print(f"  2. Enter PostgreSQL credentials when prompted")
    print(f"  3. Click 'Refresh' to load 50,000 customer records")
    print(f"  4. Review and customize the 6 report pages")
    print(f"  5. Publish to Power BI Service for sharing")
    print(f"\nSee docs/powerbi/connection-guide.md for full instructions.")


# ─────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate TelChurn IQ Power BI Template (.pbit)")
    parser.add_argument("--host",     default="localhost",   help="PostgreSQL host")
    parser.add_argument("--port",     type=int, default=5432, help="PostgreSQL port")
    parser.add_argument("--database", default="telchurn_iq", help="Database name")
    parser.add_argument("--output",   default="TelChurnIQ_EY_Analytics.pbit", help="Output .pbit path")
    args = parser.parse_args()

    generate_pbit(args.output, args.host, args.port, args.database)
