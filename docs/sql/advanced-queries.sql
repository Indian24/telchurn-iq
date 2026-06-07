-- ============================================================
-- TelChurn IQ — Advanced SQL Query Library
-- EY Telecom Analytics Practice
-- 50 Production-Grade Analytical Queries
-- Database: PostgreSQL 15+ | Schema: customers
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION 1: CHURN ANALYSIS (Queries 1–15)
-- ─────────────────────────────────────────────────────────────

-- Q01: Overall Churn Summary — Executive KPIs
SELECT
  COUNT(*)                                                           AS total_customers,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                        AS churned,
  SUM(CASE WHEN churn = 0 THEN 1 ELSE 0 END)                        AS active,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1 ELSE 0 END) * 100, 2)        AS churn_rate_pct,
  ROUND(AVG(CASE WHEN churn = 0 THEN 1 ELSE 0 END) * 100, 2)        AS retention_rate_pct,
  ROUND(SUM(CASE WHEN churn = 1 THEN revenue ELSE 0 END)::NUMERIC, 2) AS revenue_lost,
  ROUND(AVG(churn_probability) * 100, 2)                             AS avg_churn_score
FROM customers;

-- Q02: Monthly Churn Rate Trend (Rolling 12-Month Simulation)
SELECT
  month_num,
  TO_CHAR(DATE '2025-01-01' + (month_num - 1) * INTERVAL '1 month', 'Mon-YY') AS month_label,
  COUNT(*)                                                                       AS total,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                                    AS churned,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2)               AS churn_rate_pct
FROM customers
CROSS JOIN LATERAL (
  SELECT ((id % 12) + 1) AS month_num
) m
GROUP BY month_num
ORDER BY month_num;

-- Q03: Churn by Subscription Plan with Revenue Impact
SELECT
  subscription_type                                                          AS plan,
  COUNT(*)                                                                   AS total_customers,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                                AS churned,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2)            AS churn_rate_pct,
  ROUND(AVG(monthly_charges)::NUMERIC, 2)                                    AS avg_monthly_charges,
  ROUND(SUM(CASE WHEN churn = 1 THEN arpu ELSE 0 END)::NUMERIC, 2)          AS revenue_at_risk,
  ROUND(AVG(customer_lifetime_value)::NUMERIC, 2)                            AS avg_clv
FROM customers
GROUP BY subscription_type
ORDER BY churn_rate_pct DESC;

-- Q04: Churn by Contract Type — Retention Intelligence
SELECT
  contract_type,
  COUNT(*)                                                                  AS total,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                               AS churned,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2)           AS churn_rate_pct,
  ROUND(AVG(tenure)::NUMERIC, 1)                                            AS avg_tenure_months,
  ROUND(AVG(customer_lifetime_value)::NUMERIC, 2)                           AS avg_clv,
  ROUND(SUM(revenue)::NUMERIC, 2)                                           AS total_revenue
FROM customers
GROUP BY contract_type
ORDER BY churn_rate_pct DESC;

-- Q05: Churn by Customer Tenure Band
SELECT
  CASE
    WHEN tenure BETWEEN 0  AND 6   THEN '0–6 months'
    WHEN tenure BETWEEN 7  AND 12  THEN '7–12 months'
    WHEN tenure BETWEEN 13 AND 24  THEN '13–24 months'
    WHEN tenure BETWEEN 25 AND 36  THEN '25–36 months'
    WHEN tenure BETWEEN 37 AND 60  THEN '37–60 months'
    ELSE '60+ months'
  END                                                                        AS tenure_band,
  COUNT(*)                                                                   AS customers,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                                AS churned,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2)            AS churn_rate_pct,
  ROUND(AVG(monthly_charges)::NUMERIC, 2)                                    AS avg_monthly_charges
FROM customers
GROUP BY tenure_band
ORDER BY MIN(tenure);

-- Q06: Churn by Customer Satisfaction Score
SELECT
  ROUND(customer_satisfaction_score)                                         AS satisfaction_score,
  COUNT(*)                                                                   AS customers,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                                AS churned,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2)            AS churn_rate_pct,
  ROUND(AVG(complaint_count)::NUMERIC, 2)                                    AS avg_complaints,
  ROUND(AVG(network_issues)::NUMERIC, 2)                                     AS avg_network_issues
FROM customers
GROUP BY ROUND(customer_satisfaction_score)
ORDER BY satisfaction_score;

-- Q07: State-Wise Churn Analysis with Revenue
SELECT
  state,
  COUNT(*)                                                                   AS total_customers,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                                AS churned,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2)            AS churn_rate_pct,
  ROUND(SUM(revenue)::NUMERIC, 2)                                            AS total_revenue,
  ROUND(SUM(CASE WHEN churn = 1 THEN revenue ELSE 0 END)::NUMERIC, 2)        AS revenue_lost,
  ROUND(AVG(customer_satisfaction_score)::NUMERIC, 2)                        AS avg_satisfaction
FROM customers
GROUP BY state
ORDER BY churn_rate_pct DESC;

-- Q08: Early Churn Detection — Customers Leaving Before 6 Months
SELECT
  subscription_type,
  state,
  COUNT(*)                                                                   AS early_churners,
  ROUND(AVG(monthly_charges)::NUMERIC, 2)                                    AS avg_monthly_charges,
  ROUND(AVG(customer_satisfaction_score)::NUMERIC, 2)                        AS avg_satisfaction,
  ROUND(AVG(complaint_count)::NUMERIC, 2)                                    AS avg_complaints
FROM customers
WHERE churn = 1 AND tenure < 6
GROUP BY subscription_type, state
ORDER BY early_churners DESC
LIMIT 20;

-- Q09: High-Value Churners — Revenue Impact Analysis
SELECT
  customer_id,
  state,
  subscription_type,
  tenure,
  monthly_charges,
  customer_lifetime_value,
  churn_probability,
  customer_satisfaction_score
FROM customers
WHERE churn = 1
  AND customer_lifetime_value > (SELECT AVG(customer_lifetime_value) * 1.5 FROM customers)
ORDER BY customer_lifetime_value DESC
LIMIT 50;

-- Q10: Churn by Payment Method with ARPU Analysis
SELECT
  payment_method,
  COUNT(*)                                                                   AS customers,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                                AS churned,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2)            AS churn_rate_pct,
  ROUND(AVG(arpu)::NUMERIC, 2)                                               AS avg_arpu,
  ROUND(SUM(revenue)::NUMERIC, 2)                                            AS total_revenue
FROM customers
GROUP BY payment_method
ORDER BY churn_rate_pct DESC;

-- Q11: Complaint-Driven Churn Analysis
SELECT
  complaint_count                                                            AS complaints,
  COUNT(*)                                                                   AS customers,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                                AS churned,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2)            AS churn_rate_pct,
  ROUND(AVG(customer_satisfaction_score)::NUMERIC, 2)                        AS avg_satisfaction,
  ROUND(AVG(network_issues)::NUMERIC, 2)                                     AS avg_network_issues
FROM customers
GROUP BY complaint_count
ORDER BY complaint_count;

-- Q12: Network Issues Impact on Churn
SELECT
  network_issues,
  COUNT(*)                                                                   AS customers,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                                AS churned,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2)            AS churn_rate_pct,
  ROUND(AVG(customer_satisfaction_score)::NUMERIC, 2)                        AS avg_satisfaction,
  ROUND(AVG(complaint_count)::NUMERIC, 2)                                    AS avg_complaints,
  ROUND(AVG(arpu)::NUMERIC, 2)                                               AS avg_arpu
FROM customers
GROUP BY network_issues
ORDER BY network_issues;

-- Q13: Churn Risk Cohort Analysis — High Risk Segment Deep Dive
SELECT
  risk_tier,
  subscription_type,
  contract_type,
  COUNT(*)                                                                   AS customers,
  ROUND(AVG(churn_probability) * 100, 2)                                    AS avg_churn_prob_pct,
  ROUND(AVG(monthly_charges)::NUMERIC, 2)                                    AS avg_monthly,
  ROUND(AVG(customer_lifetime_value)::NUMERIC, 2)                            AS avg_clv,
  ROUND(AVG(customer_satisfaction_score)::NUMERIC, 2)                        AS avg_satisfaction,
  ROUND(SUM(arpu)::NUMERIC, 2)                                               AS total_arpu_at_risk
FROM customers
WHERE churn = 0
GROUP BY risk_tier, subscription_type, contract_type
ORDER BY avg_churn_prob_pct DESC;

-- Q14: Month-to-Month Contract Churn — Action Required
SELECT
  state,
  subscription_type,
  COUNT(*)                                                                   AS mtm_customers,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                                AS churned,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2)            AS churn_rate_pct,
  ROUND(SUM(arpu)::NUMERIC, 2)                                               AS revenue_at_risk,
  ROUND(AVG(tenure)::NUMERIC, 1)                                             AS avg_tenure
FROM customers
WHERE contract_type = 'Month-to-Month'
GROUP BY state, subscription_type
HAVING COUNT(*) > 50
ORDER BY revenue_at_risk DESC;

-- Q15: Churn Velocity — Rate of Churn Acceleration by Plan
WITH monthly_churn AS (
  SELECT
    subscription_type,
    ((id % 12) + 1) AS month_num,
    COUNT(*) AS total,
    SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END) AS churned
  FROM customers
  CROSS JOIN LATERAL (SELECT ((id % 12) + 1)) AS m(month_num)
  GROUP BY subscription_type, month_num
)
SELECT
  subscription_type,
  month_num,
  total,
  churned,
  ROUND((churned::NUMERIC / NULLIF(total, 0)) * 100, 2)                     AS churn_rate_pct,
  LAG(churned) OVER (PARTITION BY subscription_type ORDER BY month_num)     AS prev_month_churned,
  churned - LAG(churned) OVER (PARTITION BY subscription_type ORDER BY month_num) AS churn_delta
FROM monthly_churn
ORDER BY subscription_type, month_num;

-- ─────────────────────────────────────────────────────────────
-- SECTION 2: REVENUE ANALYTICS (Queries 16–25)
-- ─────────────────────────────────────────────────────────────

-- Q16: Monthly Revenue Trend with Growth Rate
WITH monthly_rev AS (
  SELECT
    ((id % 12) + 1)                                               AS month_num,
    ROUND(SUM(revenue)::NUMERIC, 2)                               AS revenue,
    ROUND(AVG(arpu)::NUMERIC, 2)                                  AS avg_arpu,
    COUNT(*)                                                      AS subscribers
  FROM customers
  CROSS JOIN LATERAL (SELECT ((id % 12) + 1)) AS m(month_num)
  GROUP BY month_num
)
SELECT
  month_num,
  TO_CHAR(DATE '2025-01-01' + (month_num - 1) * INTERVAL '1 month', 'Mon YYYY') AS month,
  revenue,
  avg_arpu,
  subscribers,
  ROUND((revenue - LAG(revenue) OVER (ORDER BY month_num)) / NULLIF(LAG(revenue) OVER (ORDER BY month_num), 0) * 100, 2) AS mom_growth_pct
FROM monthly_rev
ORDER BY month_num;

-- Q17: ARPU by Plan Over Time
SELECT
  ((id % 12) + 1)                                AS month_num,
  subscription_type                               AS plan,
  ROUND(AVG(arpu)::NUMERIC, 2)                   AS avg_arpu,
  ROUND(AVG(monthly_charges)::NUMERIC, 2)        AS avg_monthly_charges,
  COUNT(*)                                        AS subscribers
FROM customers
GROUP BY ((id % 12) + 1), subscription_type
ORDER BY month_num, plan;

-- Q18: Revenue at Risk by State and Risk Tier
SELECT
  state,
  risk_tier,
  COUNT(*)                                                         AS customers,
  ROUND(SUM(arpu)::NUMERIC, 2)                                    AS revenue_at_risk,
  ROUND(AVG(churn_probability) * 100, 2)                          AS avg_churn_score,
  ROUND(AVG(customer_lifetime_value)::NUMERIC, 2)                 AS avg_clv
FROM customers
WHERE churn = 0
GROUP BY state, risk_tier
ORDER BY revenue_at_risk DESC;

-- Q19: Customer Lifetime Value Distribution
SELECT
  CASE
    WHEN customer_lifetime_value < 2000    THEN '₹0–2K'
    WHEN customer_lifetime_value < 5000    THEN '₹2K–5K'
    WHEN customer_lifetime_value < 8000    THEN '₹5K–8K'
    WHEN customer_lifetime_value < 12000   THEN '₹8K–12K'
    WHEN customer_lifetime_value < 20000   THEN '₹12K–20K'
    ELSE '₹20K+'
  END                                                              AS clv_bucket,
  COUNT(*)                                                         AS customers,
  ROUND(AVG(customer_lifetime_value)::NUMERIC, 2)                 AS avg_clv,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
  ROUND(SUM(revenue)::NUMERIC, 2)                                  AS total_revenue
FROM customers
GROUP BY clv_bucket
ORDER BY MIN(customer_lifetime_value);

-- Q20: Revenue Concentration — Pareto Analysis
WITH ranked AS (
  SELECT
    customer_id,
    revenue,
    SUM(revenue) OVER ()                                          AS total_revenue,
    SUM(revenue) OVER (ORDER BY revenue DESC)                     AS cumulative_revenue,
    ROW_NUMBER() OVER (ORDER BY revenue DESC)                     AS rank,
    COUNT(*) OVER ()                                              AS total_count
  FROM customers
  WHERE churn = 0
)
SELECT
  ROUND(rank::NUMERIC / total_count * 100, 1)                    AS customer_pct,
  ROUND(cumulative_revenue / total_revenue * 100, 1)             AS cumulative_revenue_pct,
  ROUND(revenue::NUMERIC, 2)                                      AS threshold_revenue
FROM ranked
WHERE rank::NUMERIC / total_count IN (0.1, 0.2, 0.3, 0.5, 0.8)
   OR rank IN (1, 100, 500, 1000, 5000)
ORDER BY rank;

-- Q21: Plan Revenue Share and Growth Potential
SELECT
  subscription_type                                              AS plan,
  COUNT(*)                                                       AS subscribers,
  ROUND(SUM(revenue)::NUMERIC, 2)                               AS total_revenue,
  ROUND(SUM(revenue)::NUMERIC / SUM(SUM(revenue)) OVER () * 100, 2) AS revenue_share_pct,
  ROUND(AVG(arpu)::NUMERIC, 2)                                  AS avg_arpu,
  ROUND(AVG(customer_lifetime_value)::NUMERIC, 2)               AS avg_clv,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
  ROUND(SUM(CASE WHEN churn = 1 THEN revenue ELSE 0 END)::NUMERIC, 2) AS revenue_lost
FROM customers
GROUP BY subscription_type
ORDER BY total_revenue DESC;

-- Q22: Revenue vs Churn Correlation by State
SELECT
  state,
  ROUND(AVG(revenue)::NUMERIC, 2)                               AS avg_revenue_per_customer,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
  ROUND(CORR(revenue, churn::NUMERIC)::NUMERIC, 4)              AS revenue_churn_correlation,
  COUNT(*)                                                       AS total_customers
FROM customers
GROUP BY state
HAVING COUNT(*) > 100
ORDER BY revenue_churn_correlation;

-- Q23: Payment Method Revenue and Churn Breakdown
SELECT
  payment_method,
  COUNT(*)                                                       AS customers,
  ROUND(AVG(monthly_charges)::NUMERIC, 2)                       AS avg_monthly_charges,
  ROUND(SUM(revenue)::NUMERIC, 2)                               AS total_revenue,
  ROUND(SUM(revenue)::NUMERIC / SUM(SUM(revenue)) OVER () * 100, 2) AS revenue_share_pct,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
  ROUND(AVG(arpu)::NUMERIC, 2)                                  AS avg_arpu
FROM customers
GROUP BY payment_method
ORDER BY total_revenue DESC;

-- Q24: Contract Type Revenue Intelligence
SELECT
  contract_type,
  COUNT(*)                                                       AS customers,
  ROUND(AVG(tenure)::NUMERIC, 1)                                AS avg_tenure_months,
  ROUND(SUM(revenue)::NUMERIC, 2)                               AS total_revenue,
  ROUND(AVG(arpu)::NUMERIC, 2)                                  AS avg_arpu,
  ROUND(AVG(customer_lifetime_value)::NUMERIC, 2)               AS avg_clv,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct
FROM customers
GROUP BY contract_type
ORDER BY avg_clv DESC;

-- Q25: Top 100 Highest Revenue Active Customers
SELECT
  customer_id,
  state,
  subscription_type,
  contract_type,
  monthly_charges,
  revenue,
  arpu,
  customer_lifetime_value,
  tenure,
  risk_tier,
  churn_probability,
  customer_satisfaction_score
FROM customers
WHERE churn = 0
ORDER BY revenue DESC
LIMIT 100;

-- ─────────────────────────────────────────────────────────────
-- SECTION 3: CUSTOMER SEGMENTATION (Queries 26–35)
-- ─────────────────────────────────────────────────────────────

-- Q26: RFM Segmentation — Recency, Frequency, Monetary
WITH rfm_scores AS (
  SELECT
    customer_id,
    tenure                                                        AS recency_score,
    recharge_frequency                                            AS frequency_score,
    arpu                                                          AS monetary_score,
    NTILE(4) OVER (ORDER BY tenure)                               AS r_quartile,
    NTILE(4) OVER (ORDER BY recharge_frequency)                   AS f_quartile,
    NTILE(4) OVER (ORDER BY arpu)                                 AS m_quartile
  FROM customers
  WHERE churn = 0
)
SELECT
  CASE
    WHEN r_quartile = 4 AND f_quartile = 4 AND m_quartile = 4 THEN 'Champions'
    WHEN r_quartile >= 3 AND f_quartile >= 3 AND m_quartile >= 3 THEN 'Loyal'
    WHEN r_quartile = 1 AND f_quartile >= 3 THEN 'At Risk'
    WHEN r_quartile <= 2 AND f_quartile <= 2 THEN 'Hibernating'
    ELSE 'Potential Loyalists'
  END                                                             AS rfm_segment,
  COUNT(*)                                                        AS customers,
  ROUND(AVG(monetary_score)::NUMERIC, 2)                         AS avg_arpu,
  ROUND(AVG(recency_score)::NUMERIC, 1)                          AS avg_tenure,
  ROUND(AVG(frequency_score)::NUMERIC, 1)                        AS avg_recharge_freq
FROM rfm_scores
GROUP BY rfm_segment
ORDER BY avg_arpu DESC;

-- Q27: Customer Value Tiers — Strategic Segmentation
WITH clv_percentiles AS (
  SELECT
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY customer_lifetime_value) AS p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY customer_lifetime_value) AS p50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY customer_lifetime_value) AS p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY customer_lifetime_value) AS p90
  FROM customers
)
SELECT
  CASE
    WHEN c.customer_lifetime_value >= p.p90 THEN 'Platinum (Top 10%)'
    WHEN c.customer_lifetime_value >= p.p75 THEN 'Gold (Top 25%)'
    WHEN c.customer_lifetime_value >= p.p50 THEN 'Silver (Top 50%)'
    WHEN c.customer_lifetime_value >= p.p25 THEN 'Bronze (Top 75%)'
    ELSE 'Standard'
  END                                                             AS value_tier,
  COUNT(*)                                                        AS customers,
  ROUND(AVG(c.customer_lifetime_value)::NUMERIC, 2)             AS avg_clv,
  ROUND(AVG(c.arpu)::NUMERIC, 2)                                AS avg_arpu,
  ROUND(SUM(c.revenue)::NUMERIC, 2)                              AS total_revenue,
  ROUND(AVG(CASE WHEN c.churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct
FROM customers c, clv_percentiles p
GROUP BY value_tier
ORDER BY avg_clv DESC;

-- Q28: Behavioral Cluster Analysis
SELECT
  CASE
    WHEN internet_usage_gb > 50 AND voice_minutes > 500 THEN 'Heavy Users'
    WHEN internet_usage_gb > 50 AND voice_minutes <= 500 THEN 'Data-Heavy'
    WHEN internet_usage_gb <= 10 AND voice_minutes > 500 THEN 'Voice-Heavy'
    WHEN internet_usage_gb <= 10 AND voice_minutes <= 200 THEN 'Light Users'
    ELSE 'Moderate Users'
  END                                                             AS usage_cluster,
  COUNT(*)                                                        AS customers,
  ROUND(AVG(monthly_charges)::NUMERIC, 2)                        AS avg_monthly,
  ROUND(AVG(arpu)::NUMERIC, 2)                                   AS avg_arpu,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
  ROUND(AVG(customer_satisfaction_score)::NUMERIC, 2)            AS avg_satisfaction
FROM customers
GROUP BY usage_cluster
ORDER BY avg_arpu DESC;

-- Q29: At-Risk Active Customer Profiles
SELECT
  customer_id,
  state,
  subscription_type,
  contract_type,
  tenure,
  monthly_charges,
  churn_probability,
  risk_tier,
  customer_satisfaction_score,
  complaint_count,
  network_issues,
  arpu,
  customer_lifetime_value
FROM customers
WHERE churn = 0
  AND risk_tier = 'High'
  AND churn_probability > 0.7
ORDER BY customer_lifetime_value DESC, churn_probability DESC
LIMIT 100;

-- Q30: Long-Tenure Customer Loyalty Analysis
SELECT
  contract_type,
  subscription_type,
  COUNT(*)                                                        AS loyal_customers,
  ROUND(AVG(monthly_charges)::NUMERIC, 2)                        AS avg_monthly,
  ROUND(AVG(arpu)::NUMERIC, 2)                                   AS avg_arpu,
  ROUND(AVG(customer_lifetime_value)::NUMERIC, 2)                AS avg_clv,
  ROUND(AVG(customer_satisfaction_score)::NUMERIC, 2)            AS avg_satisfaction,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct
FROM customers
WHERE tenure > 36
GROUP BY contract_type, subscription_type
ORDER BY avg_clv DESC;

-- Q31: Young vs Senior Customer Comparison
SELECT
  CASE WHEN age < 30 THEN 'Gen Z (< 30)'
       WHEN age < 45 THEN 'Millennial (30–44)'
       WHEN age < 60 THEN 'Gen X (45–59)'
       ELSE 'Boomer (60+)' END                                  AS age_group,
  COUNT(*)                                                       AS customers,
  ROUND(AVG(monthly_charges)::NUMERIC, 2)                       AS avg_monthly,
  ROUND(AVG(arpu)::NUMERIC, 2)                                  AS avg_arpu,
  ROUND(AVG(customer_lifetime_value)::NUMERIC, 2)               AS avg_clv,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
  ROUND(AVG(customer_satisfaction_score)::NUMERIC, 2)           AS avg_satisfaction,
  ROUND(AVG(internet_usage_gb)::NUMERIC, 2)                     AS avg_data_gb
FROM customers
GROUP BY age_group
ORDER BY MIN(age);

-- Q32: Gender-Based Subscription and Revenue Analysis
SELECT
  gender,
  subscription_type,
  COUNT(*)                                                       AS customers,
  ROUND(AVG(arpu)::NUMERIC, 2)                                  AS avg_arpu,
  ROUND(AVG(customer_lifetime_value)::NUMERIC, 2)               AS avg_clv,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
  ROUND(SUM(revenue)::NUMERIC, 2)                               AS total_revenue
FROM customers
GROUP BY gender, subscription_type
ORDER BY gender, avg_arpu DESC;

-- Q33: High-Complaint Customer Segment
SELECT
  CASE
    WHEN complaint_count = 0 THEN '0 Complaints'
    WHEN complaint_count = 1 THEN '1 Complaint'
    WHEN complaint_count BETWEEN 2 AND 3 THEN '2–3 Complaints'
    WHEN complaint_count BETWEEN 4 AND 6 THEN '4–6 Complaints'
    ELSE '7+ Complaints'
  END                                                            AS complaint_band,
  COUNT(*)                                                       AS customers,
  ROUND(AVG(customer_satisfaction_score)::NUMERIC, 2)           AS avg_satisfaction,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
  ROUND(AVG(arpu)::NUMERIC, 2)                                  AS avg_arpu,
  ROUND(AVG(network_issues)::NUMERIC, 2)                        AS avg_network_issues
FROM customers
GROUP BY complaint_band
ORDER BY MIN(complaint_count);

-- Q34: Support Call Intensity and Churn Relationship
SELECT
  customer_support_calls,
  COUNT(*)                                                       AS customers,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
  ROUND(AVG(customer_satisfaction_score)::NUMERIC, 2)           AS avg_satisfaction,
  ROUND(AVG(complaint_count)::NUMERIC, 2)                       AS avg_complaints
FROM customers
GROUP BY customer_support_calls
ORDER BY customer_support_calls;

-- Q35: Customer Lifecycle Stage Analysis
SELECT
  CASE
    WHEN tenure <= 3  AND churn = 0 THEN 'Onboarding'
    WHEN tenure <= 12 AND churn = 0 THEN 'Early Stage'
    WHEN tenure <= 36 AND churn = 0 THEN 'Growth Stage'
    WHEN tenure > 36  AND churn = 0 THEN 'Mature Loyal'
    WHEN churn = 1    AND tenure <= 6  THEN 'Early Churned'
    WHEN churn = 1    AND tenure <= 24 THEN 'Mid Churned'
    ELSE 'Late Churned'
  END                                                            AS lifecycle_stage,
  COUNT(*)                                                       AS customers,
  ROUND(AVG(arpu)::NUMERIC, 2)                                  AS avg_arpu,
  ROUND(AVG(customer_lifetime_value)::NUMERIC, 2)               AS avg_clv,
  ROUND(AVG(customer_satisfaction_score)::NUMERIC, 2)           AS avg_satisfaction
FROM customers
GROUP BY lifecycle_stage
ORDER BY avg_clv DESC;

-- ─────────────────────────────────────────────────────────────
-- SECTION 4: ML FEATURE ENGINEERING (Queries 36–45)
-- ─────────────────────────────────────────────────────────────

-- Q36: Feature Importance Proxy — Logistic Regression Coefficients
SELECT
  'complaint_count'      AS feature, ROUND(AVG(complaint_count)::NUMERIC * ROUND(CORR(churn::NUMERIC, complaint_count::NUMERIC)::NUMERIC, 4), 4) AS importance_proxy, ROUND(CORR(churn::NUMERIC, complaint_count::NUMERIC)::NUMERIC, 4) AS correlation FROM customers
UNION ALL
SELECT 'network_issues', ROUND(AVG(network_issues)::NUMERIC * ABS(ROUND(CORR(churn::NUMERIC, network_issues::NUMERIC)::NUMERIC, 4)), 4), ROUND(CORR(churn::NUMERIC, network_issues::NUMERIC)::NUMERIC, 4) FROM customers
UNION ALL
SELECT 'tenure',         ROUND(ABS(CORR(churn::NUMERIC, tenure::NUMERIC)::NUMERIC), 4) * 0.3, ROUND(CORR(churn::NUMERIC, tenure::NUMERIC)::NUMERIC, 4) FROM customers
UNION ALL
SELECT 'monthly_charges',ROUND(ABS(CORR(churn::NUMERIC, monthly_charges)::NUMERIC), 4) * 0.2, ROUND(CORR(churn::NUMERIC, monthly_charges)::NUMERIC, 4) FROM customers
UNION ALL
SELECT 'customer_satisfaction_score', ROUND(ABS(CORR(churn::NUMERIC, customer_satisfaction_score)::NUMERIC), 4) * 0.5, ROUND(CORR(churn::NUMERIC, customer_satisfaction_score)::NUMERIC, 4) FROM customers
ORDER BY importance_proxy DESC;

-- Q37: Churn Probability Distribution Buckets
SELECT
  CASE
    WHEN churn_probability < 0.2 THEN '0–20% (Very Low Risk)'
    WHEN churn_probability < 0.4 THEN '20–40% (Low Risk)'
    WHEN churn_probability < 0.6 THEN '40–60% (Moderate Risk)'
    WHEN churn_probability < 0.8 THEN '60–80% (High Risk)'
    ELSE '80–100% (Critical Risk)'
  END                                                            AS prob_bucket,
  COUNT(*)                                                       AS customers,
  SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END)                    AS actual_churned,
  ROUND(AVG(churn_probability) * 100, 2)                        AS avg_prob_pct,
  ROUND(AVG(CASE WHEN churn = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS actual_churn_rate
FROM customers
GROUP BY prob_bucket
ORDER BY MIN(churn_probability);

-- Q38: Model Calibration — Predicted vs Actual Churn
SELECT
  ROUND(churn_probability * 10) / 10                            AS prob_decile,
  COUNT(*)                                                       AS customers,
  SUM(churn)                                                    AS actual_churned,
  ROUND(AVG(churn::NUMERIC) * 100, 2)                          AS actual_churn_rate_pct,
  ROUND(AVG(churn_probability) * 100, 2)                       AS avg_predicted_pct,
  ROUND((AVG(churn::NUMERIC) - AVG(churn_probability)) * 100, 2) AS calibration_error
FROM customers
GROUP BY prob_decile
ORDER BY prob_decile;

-- Q39: Retention Intervention Score — Prioritize Intervention
SELECT
  customer_id,
  subscription_type,
  state,
  churn_probability,
  customer_lifetime_value,
  arpu,
  ROUND(
    (churn_probability * 0.4 + (1 - customer_satisfaction_score / 5.0) * 0.3 + (complaint_count::NUMERIC / 10) * 0.2 + (network_issues::NUMERIC / 10) * 0.1)
    * customer_lifetime_value, 2
  )                                                              AS intervention_priority_score,
  customer_satisfaction_score,
  complaint_count,
  tenure
FROM customers
WHERE churn = 0 AND risk_tier = 'High'
ORDER BY intervention_priority_score DESC
LIMIT 100;

-- Q40: Risk Score Decomposition
SELECT
  customer_id,
  churn_probability,
  risk_tier,
  ROUND(churn_probability * 100, 2)                             AS churn_score,
  ROUND((1 - customer_satisfaction_score / 5.0) * 100, 2)      AS dissatisfaction_score,
  ROUND((complaint_count::NUMERIC / 10) * 100, 2)              AS complaint_score,
  ROUND((network_issues::NUMERIC / 10) * 100, 2)               AS network_score,
  ROUND(GREATEST(0, 1 - tenure::NUMERIC / 72) * 100, 2)        AS early_tenure_risk,
  CASE WHEN contract_type = 'Month-to-Month' THEN 100 ELSE 20 END AS contract_risk
FROM customers
WHERE churn = 0
ORDER BY churn_probability DESC
LIMIT 50;

-- Q41: Usage Pattern Features for ML Enrichment
SELECT
  customer_id,
  ROUND(internet_usage_gb::NUMERIC, 2)                          AS data_usage_gb,
  ROUND(voice_minutes::NUMERIC, 2)                              AS voice_mins,
  ROUND(sms_usage::NUMERIC, 2)                                  AS sms_count,
  recharge_frequency,
  ROUND((internet_usage_gb + voice_minutes / 60 + sms_usage / 100)::NUMERIC, 2) AS composite_usage_index,
  ROUND(internet_usage_gb / NULLIF(monthly_charges, 0)::NUMERIC, 4) AS data_per_rupee,
  ROUND(voice_minutes / NULLIF(monthly_charges, 0)::NUMERIC, 4) AS voice_per_rupee,
  churn
FROM customers
ORDER BY composite_usage_index DESC
LIMIT 200;

-- Q42: Engagement Score Calculation
SELECT
  customer_id,
  tenure,
  recharge_frequency,
  customer_support_calls,
  ROUND(
    (recharge_frequency * 0.4 + GREATEST(0, 5 - customer_support_calls) * 0.3 + LEAST(tenure / 12.0, 5) * 0.3)
    / 5.0 * 100, 2
  )                                                              AS engagement_score,
  churn_probability,
  churn
FROM customers
ORDER BY engagement_score DESC
LIMIT 100;

-- Q43: Confusion Matrix for Model Evaluation
SELECT
  'True Positive'  AS category, COUNT(*) AS count, 'Predicted Churn, Actual Churn' AS description
FROM customers WHERE churn = 1 AND churn_probability >= 0.5
UNION ALL
SELECT 'False Positive', COUNT(*), 'Predicted Churn, Actual Retained'
FROM customers WHERE churn = 0 AND churn_probability >= 0.5
UNION ALL
SELECT 'False Negative', COUNT(*), 'Predicted Retained, Actual Churn'
FROM customers WHERE churn = 1 AND churn_probability < 0.5
UNION ALL
SELECT 'True Negative', COUNT(*), 'Predicted Retained, Actual Retained'
FROM customers WHERE churn = 0 AND churn_probability < 0.5;

-- Q44: Model Performance Metrics Derivation
WITH cm AS (
  SELECT
    SUM(CASE WHEN churn = 1 AND churn_probability >= 0.5 THEN 1 ELSE 0 END)  AS tp,
    SUM(CASE WHEN churn = 0 AND churn_probability >= 0.5 THEN 1 ELSE 0 END)  AS fp,
    SUM(CASE WHEN churn = 1 AND churn_probability < 0.5  THEN 1 ELSE 0 END)  AS fn,
    SUM(CASE WHEN churn = 0 AND churn_probability < 0.5  THEN 1 ELSE 0 END)  AS tn
  FROM customers
)
SELECT
  tp, fp, fn, tn,
  ROUND((tp + tn)::NUMERIC / (tp + fp + fn + tn) * 100, 2)     AS accuracy_pct,
  ROUND(tp::NUMERIC / NULLIF(tp + fp, 0) * 100, 2)             AS precision_pct,
  ROUND(tp::NUMERIC / NULLIF(tp + fn, 0) * 100, 2)             AS recall_pct,
  ROUND(2.0 * tp / NULLIF(2 * tp + fp + fn, 0) * 100, 2)       AS f1_score_pct
FROM cm;

-- Q45: Value at Risk — Revenue Exposure by Risk Tier
SELECT
  risk_tier,
  COUNT(*)                                                       AS at_risk_customers,
  ROUND(SUM(arpu)::NUMERIC, 2)                                  AS total_arpu_at_risk,
  ROUND(SUM(customer_lifetime_value)::NUMERIC, 2)               AS total_clv_at_risk,
  ROUND(AVG(churn_probability) * 100, 2)                        AS avg_churn_probability,
  ROUND(SUM(arpu * churn_probability)::NUMERIC, 2)              AS expected_revenue_loss,
  ROUND(SUM(customer_lifetime_value * churn_probability)::NUMERIC, 2) AS expected_clv_loss
FROM customers
WHERE churn = 0
GROUP BY risk_tier
ORDER BY expected_revenue_loss DESC;

-- ─────────────────────────────────────────────────────────────
-- SECTION 5: DATA QUALITY CHECKS (Queries 46–50)
-- ─────────────────────────────────────────────────────────────

-- Q46: Comprehensive Null Audit Across All Columns
SELECT
  'customer_id'               AS column_name, COUNT(*) - COUNT(customer_id)              AS null_count, ROUND((COUNT(*) - COUNT(customer_id))::NUMERIC / COUNT(*) * 100, 4) AS null_pct FROM customers
UNION ALL SELECT 'gender',              COUNT(*) - COUNT(gender),              ROUND((COUNT(*) - COUNT(gender))::NUMERIC              / COUNT(*) * 100, 4) FROM customers
UNION ALL SELECT 'age',                 COUNT(*) - COUNT(age),                 ROUND((COUNT(*) - COUNT(age))::NUMERIC                 / COUNT(*) * 100, 4) FROM customers
UNION ALL SELECT 'state',               COUNT(*) - COUNT(state),               ROUND((COUNT(*) - COUNT(state))::NUMERIC               / COUNT(*) * 100, 4) FROM customers
UNION ALL SELECT 'tenure',              COUNT(*) - COUNT(tenure),              ROUND((COUNT(*) - COUNT(tenure))::NUMERIC              / COUNT(*) * 100, 4) FROM customers
UNION ALL SELECT 'monthly_charges',     COUNT(*) - COUNT(monthly_charges),     ROUND((COUNT(*) - COUNT(monthly_charges))::NUMERIC     / COUNT(*) * 100, 4) FROM customers
UNION ALL SELECT 'churn_probability',   COUNT(*) - COUNT(churn_probability),   ROUND((COUNT(*) - COUNT(churn_probability))::NUMERIC   / COUNT(*) * 100, 4) FROM customers
UNION ALL SELECT 'risk_tier',           COUNT(*) - COUNT(risk_tier),           ROUND((COUNT(*) - COUNT(risk_tier))::NUMERIC           / COUNT(*) * 100, 4) FROM customers
ORDER BY null_count DESC;

-- Q47: Duplicate Customer Detection
SELECT
  customer_id,
  COUNT(*)                                                       AS duplicate_count
FROM customers
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Q48: Value Range Validation — Business Rules
SELECT
  'age_out_of_range'           AS check_name, COUNT(*) AS violations, 'Age must be 18-100' AS rule FROM customers WHERE age < 18 OR age > 100
UNION ALL SELECT 'negative_monthly_charges',  COUNT(*), 'Monthly charges cannot be negative'    FROM customers WHERE monthly_charges < 0
UNION ALL SELECT 'invalid_churn_flag',         COUNT(*), 'Churn must be 0 or 1'                 FROM customers WHERE churn NOT IN (0, 1)
UNION ALL SELECT 'satisfaction_out_of_range',  COUNT(*), 'Satisfaction must be 1-5'             FROM customers WHERE customer_satisfaction_score < 1 OR customer_satisfaction_score > 5
UNION ALL SELECT 'invalid_churn_probability',  COUNT(*), 'Churn probability must be 0-1'        FROM customers WHERE churn_probability < 0 OR churn_probability > 1
UNION ALL SELECT 'negative_tenure',            COUNT(*), 'Tenure cannot be negative'            FROM customers WHERE tenure < 0
UNION ALL SELECT 'invalid_risk_tier',          COUNT(*), 'Risk tier must be High/Medium/Low'    FROM customers WHERE risk_tier NOT IN ('High', 'Medium', 'Low')
ORDER BY violations DESC;

-- Q49: Statistical Distribution Outlier Detection
SELECT
  column_name,
  ROUND(mean_val::NUMERIC, 2)  AS mean,
  ROUND(std_val::NUMERIC, 2)   AS std_dev,
  ROUND(lower_bound::NUMERIC, 2) AS lower_3sigma,
  ROUND(upper_bound::NUMERIC, 2) AS upper_3sigma,
  outlier_count
FROM (
  SELECT 'monthly_charges' AS column_name,
    AVG(monthly_charges) AS mean_val, STDDEV(monthly_charges) AS std_val,
    AVG(monthly_charges) - 3 * STDDEV(monthly_charges) AS lower_bound,
    AVG(monthly_charges) + 3 * STDDEV(monthly_charges) AS upper_bound,
    SUM(CASE WHEN monthly_charges < AVG(monthly_charges) - 3 * STDDEV(monthly_charges) OR monthly_charges > AVG(monthly_charges) + 3 * STDDEV(monthly_charges) THEN 1 ELSE 0 END) AS outlier_count
  FROM customers
  UNION ALL
  SELECT 'arpu',
    AVG(arpu), STDDEV(arpu), AVG(arpu) - 3 * STDDEV(arpu), AVG(arpu) + 3 * STDDEV(arpu),
    SUM(CASE WHEN arpu < AVG(arpu) - 3 * STDDEV(arpu) OR arpu > AVG(arpu) + 3 * STDDEV(arpu) THEN 1 ELSE 0 END)
  FROM customers
  UNION ALL
  SELECT 'customer_lifetime_value',
    AVG(customer_lifetime_value), STDDEV(customer_lifetime_value),
    AVG(customer_lifetime_value) - 3 * STDDEV(customer_lifetime_value),
    AVG(customer_lifetime_value) + 3 * STDDEV(customer_lifetime_value),
    SUM(CASE WHEN customer_lifetime_value < AVG(customer_lifetime_value) - 3 * STDDEV(customer_lifetime_value) OR customer_lifetime_value > AVG(customer_lifetime_value) + 3 * STDDEV(customer_lifetime_value) THEN 1 ELSE 0 END)
  FROM customers
) outliers
ORDER BY outlier_count DESC;

-- Q50: Data Freshness and Completeness Health Report
SELECT
  'Total Records'            AS metric, COUNT(*)::TEXT AS value, 'record count' AS unit FROM customers
UNION ALL SELECT 'Date Range',    (MIN(created_at)::DATE || ' to ' || MAX(created_at)::DATE), 'date range' FROM customers
UNION ALL SELECT 'Unique States', COUNT(DISTINCT state)::TEXT, 'states' FROM customers
UNION ALL SELECT 'Unique Plans',  COUNT(DISTINCT subscription_type)::TEXT, 'plans' FROM customers
UNION ALL SELECT 'Unique Contracts', COUNT(DISTINCT contract_type)::TEXT, 'contract types' FROM customers
UNION ALL SELECT 'Data Completeness', ROUND((1 - (COUNT(*) FILTER (WHERE customer_id IS NULL))::NUMERIC / COUNT(*)) * 100, 2)::TEXT || '%', 'completeness' FROM customers
UNION ALL SELECT 'Churn Rate',     ROUND(AVG(churn::NUMERIC) * 100, 2)::TEXT || '%', 'overall churn' FROM customers
UNION ALL SELECT 'High Risk Active', COUNT(*) FILTER (WHERE churn = 0 AND risk_tier = 'High')::TEXT, 'customers needing attention' FROM customers;
