# Power BI Connection Guide
## TelChurn IQ — Telecom Analytics Dashboard
**EY Telecom Analytics Practice | June 2025**

---

## Overview

This guide explains how to connect **Microsoft Power BI Desktop** to the TelChurn IQ PostgreSQL database and recreate the analytics reports using DirectQuery or Import mode.

---

## Prerequisites

1. **Power BI Desktop** (June 2025 or later) — [Download free](https://powerbi.microsoft.com/desktop/)
2. **PostgreSQL ODBC Driver** — Download from [postgresql.org/ftp/odbc/](https://www.postgresql.org/ftp/odbc/versions/msi/)
3. Database credentials (provided by your DBA):
   - Host: `your-server.example.com`
   - Port: `5432`
   - Database: `telchurn_iq`
   - Username: `powerbi_readonly`
   - Password: *(from secure vault)*

---

## Step 1: Connect to PostgreSQL

1. Open Power BI Desktop
2. Click **Get Data** → Search for **PostgreSQL**
3. Enter connection details:
   ```
   Server:   your-server.example.com:5432
   Database: telchurn_iq
   ```
4. Select **DirectQuery** (recommended for real-time data) or **Import** (better performance)
5. Enter credentials when prompted
6. Click **Connect**

---

## Step 2: Select Tables

In the Navigator, select the `customers` table and click **Transform Data**.

---

## Step 3: Recommended Calculated Columns

In Power Query Editor, add these columns:

```m
// Risk Tier Color
RiskTierColor = 
    if [risk_tier] = "High" then "#A60808"
    else if [risk_tier] = "Medium" then "#f59e0b"
    else "#009118"

// Tenure Band
TenureBand = 
    if [tenure] <= 6 then "0-6 months"
    else if [tenure] <= 12 then "7-12 months"
    else if [tenure] <= 24 then "13-24 months"
    else if [tenure] <= 36 then "25-36 months"
    else if [tenure] <= 60 then "37-60 months"
    else "60+ months"

// CLV Bucket
CLVBucket = 
    if [customer_lifetime_value] < 2000 then "₹0-2K"
    else if [customer_lifetime_value] < 5000 then "₹2K-5K"
    else if [customer_lifetime_value] < 8000 then "₹5K-8K"
    else if [customer_lifetime_value] < 12000 then "₹8K-12K"
    else if [customer_lifetime_value] < 20000 then "₹12K-20K"
    else "₹20K+"
```

---

## Step 4: DAX Measures

Create these measures in your Power BI model. See `dax-measures.dax` for the full list.

### Core KPIs

```dax
Total Customers = COUNTROWS(customers)

Active Customers = 
CALCULATE(COUNTROWS(customers), customers[churn] = 0)

Churned Customers = 
CALCULATE(COUNTROWS(customers), customers[churn] = 1)

Churn Rate % = 
DIVIDE([Churned Customers], [Total Customers], 0) * 100

Total Revenue = SUM(customers[revenue])

Avg ARPU = AVERAGE(customers[arpu])

Avg CLV = AVERAGE(customers[customer_lifetime_value])

Avg Satisfaction = AVERAGE(customers[customer_satisfaction_score])

Revenue at Risk = 
CALCULATE(
    SUM(customers[arpu]),
    customers[churn] = 0,
    customers[risk_tier] = "High"
)
```

### Advanced Measures

```dax
Retention Rate % = 100 - [Churn Rate %]

High Risk Count = 
CALCULATE(COUNTROWS(customers), customers[risk_tier] = "High", customers[churn] = 0)

Medium Risk Count = 
CALCULATE(COUNTROWS(customers), customers[risk_tier] = "Medium", customers[churn] = 0)

Low Risk Count = 
CALCULATE(COUNTROWS(customers), customers[risk_tier] = "Low", customers[churn] = 0)

Expected Revenue Loss = 
SUMX(customers, customers[arpu] * customers[churn_probability])

Model Accuracy % = 
DIVIDE(
    CALCULATE(COUNTROWS(customers), customers[churn] = 1, customers[churn_probability] >= 0.5) +
    CALCULATE(COUNTROWS(customers), customers[churn] = 0, customers[churn_probability] < 0.5),
    [Total Customers]
) * 100
```

---

## Step 5: Recommended Report Pages

### Page 1: Executive Dashboard
| Visual | Fields | Notes |
|--------|--------|-------|
| Card (×8) | All KPI measures | Bold formatting, color-coded |
| Area Chart | revenue by month_num | Green fill, monthly labels |
| Line Chart | churn_rate by month_num | Red line |
| Donut Chart | revenue by subscription_type | 4 color segments |
| Table | Top 10 at-risk customers | Sorted by CLV desc |

### Page 2: Churn Analysis
| Visual | Fields | Notes |
|--------|--------|-------|
| Bar Chart | churn_rate by subscription_type | Red bars |
| Bar Chart | churn_rate by contract_type | Purple bars |
| Bar Chart | churn_rate by TenureBand | Multicolor bars |
| Line Chart | monthly_churn by month_num | Red line |
| Bar Chart | feature importance | Horizontal, sorted desc |

### Page 3: Revenue Analytics
| Visual | Fields | Notes |
|--------|--------|-------|
| Area Chart | revenue by month_num | Green fill |
| Line Chart | avg_arpu by month_num and plan | 4 colored lines |
| Table | Plan performance summary | Conditional formatting on churn_rate |
| Bar Chart | count by CLVBucket | Multicolor |
| Clustered Bar | revenue + churn_rate by payment_method | Dual axis |

### Page 4: Customer Explorer
| Visual | Fields | Notes |
|--------|--------|-------|
| Table | All customer fields | Conditional formatting on risk_tier |
| Slicer | subscription_type | Multi-select |
| Slicer | risk_tier | Multi-select |
| Slicer | state | Dropdown |
| Search Box | customer_id | Text filter |

### Page 5: Regional Performance
| Visual | Fields | Notes |
|--------|--------|-------|
| Map | state with revenue | Bubble size = revenue |
| Bar Chart (H) | revenue by state (top 10) | Sorted desc |
| Bar Chart (H) | churn_rate by state (top 10) | Red, sorted desc |
| Table | All state metrics | Sortable |

---

## Step 6: Slicers and Filters

Recommended global slicers (apply across all pages):

1. **Date Slicer** — created_at (between)
2. **Plan Slicer** — subscription_type (multi-select)
3. **State Slicer** — state (dropdown)
4. **Risk Tier Slicer** — risk_tier (multi-select)
5. **Contract Type Slicer** — contract_type (multi-select)

---

## Refresh Schedule

For Import mode, configure scheduled refresh:
1. Publish to Power BI Service
2. Go to Dataset Settings → Scheduled Refresh
3. Set frequency: **Daily at 06:00 IST** (after ETL pipeline completes at 02:00 IST)
4. Enable **Email notifications on refresh failure**

---

## Performance Tips

1. Use **Import mode** for < 1M rows — faster visuals
2. Use **DirectQuery** for real-time data requirements
3. Create **aggregation tables** for summary-level queries
4. Enable **Query folding** in Power Query for pushdown optimization
5. Use **incremental refresh** for large historical datasets

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Cannot connect to PostgreSQL | Verify ODBC driver is installed; check firewall rules |
| Slow query performance | Switch to Import mode; add database indexes |
| DAX measure shows BLANK | Check table relationship; verify filter context |
| Refresh fails | Check database credentials; verify network connectivity |

---

*For support, contact the EY Telecom Analytics Practice.*
