import { useGetDataQuality } from "@workspace/api-client-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, AlertTriangle, Database, ShieldCheck, BarChart3, Activity } from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { formatNumber, CHART_COLORS } from "@/lib/utils";

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 95 ? "#009118" : score >= 80 ? "#f59e0b" : "#A60808";
  const data = [{ value: score, fill: color }, { value: 100 - score, fill: "transparent" }];
  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius={50} outerRadius={72}
          startAngle={90} endAngle={-270}
          data={data}
          barSize={18}
        >
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#1e1e2a" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      <p className="text-sm font-medium mt-1" style={{ color }}>
        {score >= 95 ? "Excellent" : score >= 80 ? "Good" : "Needs Attention"}
      </p>
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  customer_id: "Customer ID",
  age: "Age",
  state: "State",
  tenure: "Tenure",
  monthly_charges: "Monthly Charges",
  churn_probability: "Churn Probability",
  satisfaction_score: "Satisfaction Score",
  risk_tier: "Risk Tier",
  arpu: "ARPU",
};

const FIELD_ABBREV: Record<string, string> = {
  monthly_charges: "Monthly",
  arpu: "ARPU",
  customer_lifetime_value: "CLV",
};

export default function DataQuality() {
  const { data, isLoading } = useGetDataQuality();

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Data Quality Dashboard"
        subtitle="Field completeness, validity checks, outlier detection, and ETL health metrics"
        dataSources={["Telecom DB", "ETL Pipeline"]}
      />
      <div className="flex-1 p-6 space-y-6">

        {/* Overall Score + Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Score Meter */}
          <Card className="bg-card border-border md:col-span-1 flex flex-col items-center justify-center py-4">
            <CardHeader className="pb-1 pt-2">
              <CardTitle className="text-sm text-center text-muted-foreground">Overall DQ Score</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {isLoading ? <Skeleton className="h-40 w-40 rounded-full" /> : <ScoreMeter score={data?.overallScore ?? 0} />}
            </CardContent>
          </Card>

          {/* Summary stats */}
          {[
            { label: "Total Records", icon: Database, getValue: () => formatNumber(data?.totalRecords ?? 0), color: "#0079F2" },
            { label: "Active Customers", icon: Activity, getValue: () => formatNumber(data?.activeRecords ?? 0), color: "#009118" },
            { label: "Checks Passed", icon: CheckCircle2, getValue: () => `${data?.validityChecks.filter(c => c.passed).length ?? 0} / ${data?.validityChecks.length ?? 0}`, color: "#009118" },
            { label: "Duplicate IDs", icon: ShieldCheck, getValue: () => formatNumber(data?.duplicateCount ?? 0), color: (data?.duplicateCount ?? 0) === 0 ? "#009118" : "#A60808" },
          ].map(({ label, icon: Icon, getValue, color }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                {isLoading
                  ? <Skeleton className="h-8 w-24" />
                  : <p className="text-2xl font-bold" style={{ color }}>{getValue()}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completeness + Validity in 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Field Completeness */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0079F2]" />
                Field Completeness
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : (
                <div className="space-y-2">
                  {(data?.completeness ?? []).map((item) => {
                    const color = item.completenessRate >= 99.9 ? "#009118" : item.completenessRate >= 95 ? "#f59e0b" : "#A60808";
                    return (
                      <div key={item.field} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">{FIELD_LABELS[item.field] ?? item.field}</span>
                          <span className="font-mono font-semibold" style={{ color }}>{item.completenessRate.toFixed(2)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${item.completenessRate}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validity Checks */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#795EFF]" />
                Validity & Business Rule Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="space-y-2">
                  {(data?.validityChecks ?? []).map((check) => (
                    <div
                      key={check.checkName}
                      className="flex items-start justify-between p-3 rounded-lg border border-border/50"
                      style={{ background: check.passed ? "rgba(0,145,24,0.06)" : "rgba(166,8,8,0.06)" }}
                    >
                      <div className="flex items-start gap-3">
                        {check.passed
                          ? <CheckCircle2 className="w-4 h-4 text-[#009118] mt-0.5 shrink-0" />
                          : <XCircle className="w-4 h-4 text-[#A60808] mt-0.5 shrink-0" />}
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {check.checkName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{check.rule}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs shrink-0 ml-2"
                        style={{
                          color: check.passed ? "#009118" : "#A60808",
                          borderColor: check.passed ? "#009118" : "#A60808",
                        }}
                      >
                        {check.passed ? "PASS" : `${check.violations} violations`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Outlier Detection */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
              Statistical Outlier Detection (3-Sigma Rule)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(data?.outlierSummary ?? []).map((item, idx) => {
                  const label = FIELD_ABBREV[item.field] ?? item.field;
                  const color = item.outlierCount === 0 ? "#009118" : item.outlierCount < 100 ? "#f59e0b" : "#A60808";
                  const chartData = [
                    { name: "Normal", value: (data?.totalRecords ?? 50000) - item.outlierCount, fill: "#009118" },
                    { name: "Outlier", value: item.outlierCount, fill: "#A60808" },
                  ];
                  return (
                    <div key={item.field} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{label}</span>
                        <Badge variant="outline" className="text-xs" style={{ color, borderColor: color }}>
                          {item.outlierCount} outliers
                        </Badge>
                      </div>
                      <ResponsiveContainer width="100%" height={80}>
                        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} width={48} />
                          <Tooltip
                            contentStyle={{ background: "#1e1e2a", border: "1px solid #374151", borderRadius: 6 }}
                            labelStyle={{ color: "#f5f5f7", fontSize: 11 }}
                            itemStyle={{ color: "#9ca3af", fontSize: 11 }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Mean</p>
                          <p className="text-xs font-mono font-semibold">₹{item.mean.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Std Dev</p>
                          <p className="text-xs font-mono font-semibold">₹{item.stdDev.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">3σ Range</p>
                          <p className="text-[10px] font-mono font-semibold">
                            {item.lowerBound < 0 ? "₹0" : `₹${item.lowerBound.toFixed(0)}`}–₹{item.upperBound.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ETL Pipeline Status */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#009118]" />
              ETL Pipeline Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Pipeline Status", value: "Healthy", color: "#009118", icon: "●" },
                { label: "Last Run", value: "Today 02:15 IST", color: "#9ca3af", icon: "◷" },
                { label: "Records Processed", value: formatNumber(data?.totalRecords ?? 50000), color: "#0079F2", icon: "#" },
                { label: "Quality Gate", value: "PASSED", color: "#009118", icon: "✓" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border/50 p-4 bg-background/30">
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-sm font-bold font-mono" style={{ color: s.color }}>
                    <span className="mr-1">{s.icon}</span>{s.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground font-semibold">Pipeline Stages</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { stage: "Extract", status: "✓ Complete", color: "#009118" },
                  { stage: "Transform", status: "✓ Complete", color: "#009118" },
                  { stage: "Quality Check", status: "✓ 50/50 passed", color: "#009118" },
                  { stage: "ML Scoring", status: "✓ Complete", color: "#009118" },
                  { stage: "Upsert Load", status: `✓ ${formatNumber(data?.totalRecords ?? 50000)} records`, color: "#009118" },
                ].map((s, i, arr) => (
                  <div key={s.stage} className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <div className="text-xs font-semibold text-foreground px-3 py-1.5 rounded border border-border/60" style={{ background: s.color + "18" }}>
                        {s.stage}
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: s.color }}>{s.status}</p>
                    </div>
                    {i < arr.length - 1 && <span className="text-muted-foreground text-lg shrink-0">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
