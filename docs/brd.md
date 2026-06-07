# Business Requirements Document (BRD)
## TelChurn IQ — Telecom Customer Churn & Revenue Intelligence Platform
**EY Analytics Practice | Client: [Telecom Operator Name]**  
**Version:** 2.0 | **Date:** June 2025 | **Status:** Approved

---

## 1. Executive Summary

A major Indian telecom operator is experiencing an annualized churn rate of 38–42%, significantly above the industry benchmark of 25–28%. Each percentage point of churn represents approximately ₹12–15 Cr in annual revenue erosion. The operator requires an enterprise-grade analytics platform to identify at-risk customers, understand churn drivers, and enable data-driven retention interventions.

**TelChurn IQ** delivers a real-time customer intelligence platform combining ML-based churn prediction, revenue analytics, regional performance tracking, and executive reporting — built on the operator's existing PostgreSQL data infrastructure.

---

## 2. Business Context

### 2.1 Problem Statement

| Symptom | Current State | Target State |
|---------|--------------|-------------|
| Churn Rate | 39.44% (17,700 customers/month) | < 28% |
| Revenue at Risk | ₹2.05 Cr/month | < ₹0.80 Cr/month |
| Churn Detection Lag | 30–45 days (reactive) | ≤ 7 days (predictive) |
| Analyst Productivity | 3–5 days per report | Real-time self-service |
| Retention Campaign ROI | Untargeted (3% conversion) | Targeted (12–18% conversion) |

### 2.2 Business Drivers

1. **Revenue Protection:** Arrest ₹2.05 Cr monthly revenue leakage from High-Risk active customers
2. **Competitive Intelligence:** Match competitors' customer experience scores (industry avg 3.8/5 vs current 3.0/5)
3. **Regulatory Compliance:** TRAI reporting requirements for churn data and customer complaint tracking
4. **Operational Efficiency:** Reduce analyst time-to-insight from days to minutes
5. **Executive Visibility:** CXO-level real-time dashboard for board meetings and investor calls

---

## 3. Stakeholders

| Stakeholder | Role | Interest Level | Influence |
|-------------|------|---------------|-----------|
| Chief Revenue Officer | Executive Sponsor | High | High |
| Head of Customer Experience | Business Owner | High | High |
| VP Retention & Loyalty | Primary User | High | Medium |
| Data Science Team Lead | Technical Owner | High | Medium |
| Regional Heads (20 states) | Secondary Users | Medium | Low |
| Finance Controller | Approver | Medium | Medium |
| IT / Infrastructure | Delivery Partner | Low | High |
| TRAI Compliance Officer | Regulatory Stakeholder | Low | Low |

---

## 4. Functional Requirements

### FR-01: Executive Dashboard
- **FR-01.1** Display real-time KPIs: Total Customers, Active, Churned, Churn Rate %, Total Revenue, ARPU, CLV, Satisfaction Score
- **FR-01.2** Show 12-month revenue trend with month-over-month growth rates
- **FR-01.3** Display churn rate trend with plan-level breakdown
- **FR-01.4** Present top 5 at-risk customers by CLV for immediate intervention
- **FR-01.5** Refresh data on-demand or on a configurable schedule (min 5-minute intervals)

### FR-02: Churn Analytics
- **FR-02.1** Segment churn by: Plan, Contract Type, Tenure Band, Satisfaction Score, Payment Method
- **FR-02.2** Display feature importance — which attributes most predict churn
- **FR-02.3** Show monthly churn rate trend for the past 12 months
- **FR-02.4** Enable CSV export of all churn breakdowns
- **FR-02.5** Calculate and display Month-to-Month contract churn separately as highest-risk segment

### FR-03: Revenue Analytics
- **FR-03.1** Show monthly revenue trend (area chart) with ₹ INR formatting
- **FR-03.2** Display ARPU trends broken down by subscription plan (4 lines)
- **FR-03.3** Present plan performance table: subscribers, revenue, ARPU, churn rate, CLV
- **FR-03.4** Show CLV distribution histogram across 6 value bands
- **FR-03.5** Analyze payment method revenue and churn relationship

### FR-04: Customer Explorer
- **FR-04.1** Paginated table of all 50,000 customers (50 per page)
- **FR-04.2** Real-time search by Customer ID, State, City
- **FR-04.3** Filter by: Churn Status (Active/Churned/All), Plan, State
- **FR-04.4** Sort by: Monthly Charges, Tenure, Churn Probability, CLV
- **FR-04.5** Clickable row to show full customer detail drawer (18+ attributes)
- **FR-04.6** CSV export of current filtered view

### FR-05: Regional Performance
- **FR-05.1** State-wise performance table: 20 Indian states
- **FR-05.2** Sortable columns: Customers, Revenue, ARPU, Churn Rate, Satisfaction
- **FR-05.3** Top 10 states by Revenue (horizontal bar chart)
- **FR-05.4** Top 10 states by Churn Rate (horizontal bar chart)

### FR-06: ML & Prediction
- **FR-06.1** Display model performance metrics: Accuracy, Precision, Recall, F1, ROC-AUC
- **FR-06.2** Visual confusion matrix (2×2 grid with TP/FP/TN/FN)
- **FR-06.3** Risk tier distribution pie chart (High/Medium/Low)
- **FR-06.4** Feature importance bar chart (top 8 churn drivers)
- **FR-06.5** Top 20 at-risk active customers with churn probability bars
- **FR-06.6** Network issues impact analysis on churn rate

### FR-07: Data Quality Dashboard
- **FR-07.1** Show completeness score per data field (% non-null)
- **FR-07.2** Display validity checks: range violations, category violations
- **FR-07.3** Record count trends and data freshness indicators
- **FR-07.4** Outlier detection summary with statistical bounds
- **FR-07.5** ETL pipeline run history and status

### FR-08: Export & Integration
- **FR-08.1** PDF export via browser print on every page (print-optimized CSS)
- **FR-08.2** CSV export button on every chart/table card
- **FR-08.3** REST API with OpenAPI 3.1 specification for BI tool integration
- **FR-08.4** Power BI DirectQuery connectivity via PostgreSQL connector

---

## 5. Non-Functional Requirements

### NFR-01: Performance
| Metric | Requirement |
|--------|------------|
| Dashboard page load (P95) | < 3 seconds on 50K row dataset |
| API response time (P95) | < 500ms for summary endpoints |
| Customer search latency | < 1 second for filtered queries |
| Concurrent users | ≥ 50 simultaneous analysts |

### NFR-02: Availability
| Metric | Requirement |
|--------|------------|
| System uptime | 99.5% (excluding planned maintenance) |
| Planned maintenance window | Sunday 02:00–04:00 IST |
| RTO (Recovery Time Objective) | < 2 hours |
| RPO (Recovery Point Objective) | < 24 hours |

### NFR-03: Security
- Role-based access control (RBAC) — view-only vs. admin roles
- All API communication over HTTPS/TLS 1.3
- No PII in API logs (customer_id is pseudonymized)
- PostgreSQL connections via SSL with certificate verification
- Session timeout after 30 minutes of inactivity

### NFR-04: Scalability
- System must support growth to 500,000 customer records without architectural changes
- Database partitioning strategy ready for time-based data growth
- API server horizontally scalable via Docker/container orchestration

### NFR-05: Usability
- WCAG 2.1 AA accessibility compliance
- Mobile-responsive layout (minimum 768px viewport)
- Dark mode default with light mode toggle
- No technical training required for business users (self-service)

---

## 6. Data Requirements

### 6.1 Source Data

| Source | Type | Frequency | Volume |
|--------|------|-----------|--------|
| CRM System | PostgreSQL | Daily | 50K records/day |
| Billing System | CSV | Daily | 50K rows/day |
| Network Operations Center | JSON API | Hourly | ~5K events/hour |
| Customer Care System | REST API | Real-time | ~500 calls/day |
| Survey Platform | CSV | Weekly | ~2K responses/week |

### 6.2 Data Retention
- Hot data (current month): PostgreSQL primary storage
- Warm data (12 months): PostgreSQL with archival partitions
- Cold data (> 12 months): S3/object storage with Parquet format

---

## 7. Integration Requirements

| System | Type | Priority |
|--------|------|---------|
| Power BI Service | DirectQuery via PostgreSQL | High |
| Salesforce CRM | Churn score API push | Medium |
| Marketing Cloud | At-risk customer list sync | Medium |
| WhatsApp Business API | Automated retention outreach | Low |
| TRAI Reporting Portal | Scheduled churn reports | High |
| Azure Active Directory | SSO / RBAC | Medium |

---

## 8. Acceptance Criteria

| ID | Requirement | Acceptance Test |
|----|------------|----------------|
| AC-01 | Dashboard loads in < 3s | Load test with 50K records, verify P95 latency |
| AC-02 | Churn rate matches source data | Compare dashboard KPI to SQL Q01 result |
| AC-03 | CSV exports are accurate | Export 100 rows, verify against DB query |
| AC-04 | Customer search returns correct results | Test 10 known customer IDs |
| AC-05 | PDF export prints all charts | Print-preview all 6 pages, verify chart rendering |
| AC-06 | ML metrics within ±1% of ground truth | Run Q44 SQL, compare to dashboard |
| AC-07 | Data quality checks pass | Run Q46-Q50, verify 0 critical violations |
| AC-08 | Dark/light mode toggle works | Toggle and verify all charts remain readable |

---

## 9. Project Timeline

| Phase | Deliverable | Duration | Status |
|-------|------------|---------|--------|
| Phase 1 | Database schema, 50K seed data, API endpoints | Week 1–2 | ✅ Complete |
| Phase 2 | Executive, Churn, Revenue, Customer, Regional, ML pages | Week 2–3 | ✅ Complete |
| Phase 3 | Data Quality Dashboard, ETL pipeline | Week 3–4 | ✅ Complete |
| Phase 4 | Power BI integration, Data Dictionary | Week 4 | ✅ Complete |
| Phase 5 | Docker deployment, CI/CD pipeline | Week 4–5 | ✅ Complete |
| Phase 6 | UAT, performance testing, documentation | Week 5–6 | In Progress |
| Phase 7 | Production deployment, handover | Week 6 | Planned |

---

## 10. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Data quality issues in source CRM | Medium | High | ETL validation pipeline with automated quality gate |
| Churn model accuracy below 80% | Low | High | Model recalibration quarterly; human-in-the-loop review |
| Performance degradation at scale | Low | Medium | Database indexing, query optimization, Redis caching |
| TRAI regulatory change | Low | Low | Modular reporting layer; configuration-driven report specs |
| Key person dependency (data team) | Medium | Medium | Comprehensive documentation; knowledge transfer sessions |

---

## 11. Assumptions & Constraints

### Assumptions
1. Source data is pseudonymized and contains no real customer PII
2. PostgreSQL 14+ is available in production environment
3. Business users have modern browsers (Chrome/Firefox/Edge)
4. IT team can provision Docker-capable infrastructure
5. Power BI Premium or Pro licenses are available for BI users

### Constraints
1. Go-live date is fixed for Q3 2025
2. Budget ceiling: ₹45 Lakhs (development + infrastructure year 1)
3. Must deploy on existing on-premises servers initially (cloud migration in Year 2)
4. Cannot access production customer data during development (use synthetic data)

---

## 12. Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Business Owner | VP Retention & Loyalty | _______________ | _____ |
| Technical Lead | Head of Data Engineering | _______________ | _____ |
| Project Sponsor | Chief Revenue Officer | _______________ | _____ |
| EY Engagement Lead | Senior Manager, Analytics | _______________ | _____ |

---

*Document prepared by EY Analytics Practice. Confidential — For client use only.*
