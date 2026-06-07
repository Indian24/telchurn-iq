import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TECH_STACK = [
  { layer: "Frontend",  items: ["React 19", "Vite 7", "TanStack Query", "Recharts", "Tailwind CSS", "shadcn/ui", "Wouter"] },
  { layer: "API",       items: ["Express 5", "Node.js 24", "TypeScript 5.9", "Zod v4", "OpenAPI 3.1", "Pino Logger"] },
  { layer: "Database",  items: ["PostgreSQL 15", "Drizzle ORM", "50K Records", "Indexed Queries"] },
  { layer: "ETL",       items: ["Python 3.12", "psycopg2", "pandas", "Quality Checks", "Logging"] },
  { layer: "ML",        items: ["Logistic Regression", "83.1% Accuracy", "87.5% ROC-AUC", "Risk Scoring"] },
  { layer: "DevOps",    items: ["Docker", "Docker Compose", "Nginx", "pnpm Workspaces"] },
];

const LAYER_COLORS: Record<string, string> = {
  Frontend: "#0079F2",
  API: "#795EFF",
  Database: "#009118",
  ETL: "#f59e0b",
  ML: "#ec4899",
  DevOps: "#06b6d4",
};

const ENDPOINTS = [
  "/telecom/summary", "/telecom/churn-overview", "/telecom/revenue-trends",
  "/telecom/customer-segments", "/telecom/regional-performance", "/telecom/churn-drivers",
  "/telecom/plan-performance", "/telecom/top-at-risk", "/telecom/ml-metrics",
  "/telecom/network-analysis", "/telecom/arpu-trends", "/telecom/clv-distribution",
  "/telecom/customers", "/telecom/customers/:id", "/telecom/satisfaction-distribution",
  "/telecom/payment-methods", "/telecom/contract-analysis", "/telecom/data-quality",
];

const DB_COLUMNS = [
  { name: "customer_id", type: "text (PK)" },
  { name: "subscription_type", type: "text" },
  { name: "contract_type", type: "text" },
  { name: "monthly_charges", type: "real" },
  { name: "arpu", type: "real" },
  { name: "revenue", type: "real" },
  { name: "churn", type: "integer" },
  { name: "churn_probability", type: "real" },
  { name: "risk_tier", type: "text" },
  { name: "customer_lifetime_value", type: "real" },
  { name: "customer_satisfaction_score", type: "real" },
  { name: "tenure", type: "integer" },
  { name: "state", type: "text" },
];

export default function Architecture() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="System Architecture"
        subtitle="TelChurn IQ platform architecture, data flows, API surface, and technology stack"
        dataSources={["Telecom DB", "Billing API", "ML Engine"]}
      />
      <div className="flex-1 p-6 space-y-6">

        {/* Architecture SVG Diagram */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Platform Architecture Diagram</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <svg viewBox="0 0 900 520" className="w-full max-w-5xl mx-auto" style={{ minWidth: 700 }}>
                {/* ── Defs ── */}
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#6b7280" />
                  </marker>
                  <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
                  </filter>
                </defs>

                {/* ── Background zones ── */}
                {/* Client zone */}
                <rect x="10" y="10" width="880" height="90" rx="10" fill="#1a1a2e" stroke="#0079F2" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
                <text x="24" y="28" fontSize="10" fill="#0079F2" fontFamily="monospace" opacity="0.8">CLIENT LAYER</text>

                {/* Proxy zone */}
                <rect x="10" y="120" width="880" height="70" rx="10" fill="#1a1a2e" stroke="#795EFF" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
                <text x="24" y="138" fontSize="10" fill="#795EFF" fontFamily="monospace" opacity="0.8">PROXY LAYER</text>

                {/* Services zone */}
                <rect x="10" y="210" width="880" height="100" rx="10" fill="#1a1a2e" stroke="#009118" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
                <text x="24" y="228" fontSize="10" fill="#009118" fontFamily="monospace" opacity="0.8">SERVICE LAYER</text>

                {/* Data zone */}
                <rect x="10" y="330" width="880" height="90" rx="10" fill="#1a1a2e" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
                <text x="24" y="348" fontSize="10" fill="#f59e0b" fontFamily="monospace" opacity="0.8">DATA LAYER</text>

                {/* Analytics zone */}
                <rect x="10" y="440" width="880" height="70" rx="10" fill="#1a1a2e" stroke="#ec4899" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
                <text x="24" y="458" fontSize="10" fill="#ec4899" fontFamily="monospace" opacity="0.8">ANALYTICS LAYER</text>

                {/* ── Boxes ── */}
                {/* React Dashboard */}
                <rect x="50" y="30" width="200" height="56" rx="8" fill="#0079F2" filter="url(#shadow)" />
                <text x="150" y="54" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">React Dashboard</text>
                <text x="150" y="72" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)">Vite + TanStack Query + Recharts</text>

                {/* Browser */}
                <rect x="680" y="30" width="180" height="56" rx="8" fill="#1d4ed8" filter="url(#shadow)" />
                <text x="770" y="54" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">Power BI</text>
                <text x="770" y="72" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)">DirectQuery / Import</text>

                {/* Nginx */}
                <rect x="290" y="135" width="320" height="44" rx="8" fill="#795EFF" filter="url(#shadow)" />
                <text x="450" y="153" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">Nginx Reverse Proxy</text>
                <text x="450" y="169" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.85)">/api → :8080 | / → :22742</text>

                {/* API Server */}
                <rect x="50" y="225" width="340" height="72" rx="8" fill="#009118" filter="url(#shadow)" />
                <text x="220" y="247" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">Express API Server</text>
                <text x="220" y="263" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)">Port 8080 | 18 REST Endpoints</text>
                <text x="220" y="279" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.7)">OpenAPI 3.1 | Zod validation | Pino logging</text>

                {/* Static Dashboard Server */}
                <rect x="510" y="225" width="360" height="72" rx="8" fill="#059669" filter="url(#shadow)" />
                <text x="690" y="247" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">React + Vite Dev Server</text>
                <text x="690" y="263" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)">Port 22742 | 8 Pages | 30+ Charts</text>
                <text x="690" y="279" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.7)">Dark mode | CSV export | PDF print</text>

                {/* PostgreSQL */}
                <rect x="150" y="347" width="270" height="60" rx="8" fill="#b45309" filter="url(#shadow)" />
                <text x="285" y="371" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">PostgreSQL 15</text>
                <text x="285" y="388" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.85)">50,000 customers | Drizzle ORM</text>

                {/* ETL Pipeline */}
                <rect x="560" y="347" width="260" height="60" rx="8" fill="#d97706" filter="url(#shadow)" />
                <text x="690" y="371" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">Python ETL Pipeline</text>
                <text x="690" y="388" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.85)">Extract → Transform → QA → Load</text>

                {/* ML Engine */}
                <rect x="80" y="456" width="220" height="44" rx="8" fill="#be185d" filter="url(#shadow)" />
                <text x="190" y="476" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">ML Scoring Engine</text>
                <text x="190" y="492" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)">Logistic Regression | Risk Tier</text>

                {/* Data Quality */}
                <rect x="360" y="456" width="220" height="44" rx="8" fill="#9333ea" filter="url(#shadow)" />
                <text x="470" y="476" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">Data Quality Engine</text>
                <text x="470" y="492" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)">50 SQL Checks | 99.5% SLA</text>

                {/* External Sources */}
                <rect x="650" y="456" width="220" height="44" rx="8" fill="#0891b2" filter="url(#shadow)" />
                <text x="760" y="476" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">External Sources</text>
                <text x="760" y="492" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)">CSV | JSON | Source DB</text>

                {/* ── Arrows ── */}
                {/* React → Nginx */}
                <line x1="250" y1="86" x2="370" y2="135" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
                {/* PowerBI → Nginx */}
                <line x1="700" y1="86" x2="590" y2="135" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
                {/* Nginx → API */}
                <line x1="390" y1="179" x2="280" y2="225" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
                {/* Nginx → Dashboard */}
                <line x1="510" y1="179" x2="620" y2="225" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
                {/* API → PostgreSQL */}
                <line x1="220" y1="297" x2="260" y2="347" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
                {/* ETL → PostgreSQL */}
                <line x1="620" y1="377" x2="420" y2="377" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
                {/* External → ETL */}
                <line x1="690" y1="456" x2="690" y2="407" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
                {/* ML → API */}
                <line x1="240" y1="456" x2="240" y2="297" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrow)" />
                {/* DQ → PostgreSQL */}
                <line x1="420" y1="456" x2="340" y2="407" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrow)" />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Two columns: API Endpoints + DB Schema */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Endpoints */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#009118] inline-block" />
                REST API Endpoints (18)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {ENDPOINTS.map((ep) => (
                  <div key={ep} className="flex items-center gap-2 py-1 border-b border-border/40 last:border-0">
                    <Badge variant="outline" className="text-[10px] text-green-400 border-green-900 font-mono px-1.5">GET</Badge>
                    <code className="text-xs text-muted-foreground font-mono">/api{ep}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DB Schema */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#b45309] inline-block" />
                Database Schema: customers (50K rows)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {DB_COLUMNS.map((col) => (
                  <div key={col.name} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                    <code className="text-xs text-foreground font-mono">{col.name}</code>
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">{col.type}</Badge>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">+ 12 more columns — see Data Dictionary</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tech stack grid */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Technology Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {TECH_STACK.map((cat) => (
                <div key={cat.layer}>
                  <div className="text-xs font-semibold mb-2 pb-1 border-b border-border" style={{ color: LAYER_COLORS[cat.layer] }}>
                    {cat.layer}
                  </div>
                  <div className="space-y-1">
                    {cat.items.map((item) => (
                      <div key={item} className="text-xs text-muted-foreground py-0.5">{item}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data flow + deployment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Data Flow Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { step: "1. Extract", desc: "Pull from CSV, JSON, or source PostgreSQL via ETL pipeline", color: "#0079F2" },
                  { step: "2. Transform", desc: "Type coercion, business rule validation, derived field computation", color: "#795EFF" },
                  { step: "3. Quality Gate", desc: "50 SQL checks — completeness, validity, outliers, duplicates", color: "#9333ea" },
                  { step: "4. ML Scoring", desc: "Logistic regression churn probability + risk tier assignment", color: "#ec4899" },
                  { step: "5. Load", desc: "Upsert into PostgreSQL (5,000 records/batch) with conflict resolution", color: "#009118" },
                  { step: "6. Serve", desc: "Express API queries DB and responds in < 500ms to React dashboard", color: "#f59e0b" },
                ].map((s) => (
                  <div key={s.step} className="flex gap-3 items-start">
                    <div className="text-xs font-bold font-mono px-2 py-1 rounded shrink-0" style={{ background: s.color + "22", color: s.color }}>
                      {s.step}
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Deployment Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-[#06b6d4] mb-2">Docker Compose (Local / On-Prem)</div>
                  <pre className="text-[11px] bg-background rounded p-3 text-muted-foreground overflow-x-auto">{`docker compose up -d
# Starts:
# ├── nginx      :80   reverse proxy
# ├── api        :8080 Express server
# ├── dashboard  :3000 React app
# └── db         :5432 PostgreSQL`}</pre>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#06b6d4] mb-2">Replit (Cloud Preview)</div>
                  <pre className="text-[11px] bg-background rounded p-3 text-muted-foreground overflow-x-auto">{`# Already running — shared proxy at :80
# api-server:  pnpm --filter @workspace/api-server run dev
# dashboard:   pnpm --filter @workspace/telecom-dashboard run dev`}</pre>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#06b6d4] mb-2">Performance SLAs</div>
                  <div className="space-y-1">
                    {[
                      ["API P95 latency", "< 500ms"],
                      ["Dashboard load (P95)", "< 3 seconds"],
                      ["Concurrent users", "≥ 50"],
                      ["Data freshness SLA", "≤ 24 hours"],
                      ["Uptime target", "99.5%"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs py-0.5 border-b border-border/30 last:border-0">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="text-foreground font-mono">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
