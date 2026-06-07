import {
  useGetMlMetrics,
  useGetTopAtRisk,
  useGetChurnDrivers,
  useGetNetworkAnalysis,
} from "@workspace/api-client-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { KPICard } from "@/components/dashboard/kpi-card";
import { formatPercent, formatNumber, formatCurrency, formatProbability, CHART_COLORS, CHART_COLOR_LIST } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { CSVLink } from "react-csv";
import { Download } from "lucide-react";
import { useTheme } from "next-themes";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "6px", padding: "10px 14px", border: "1px solid #e0e0e0", color: "#1a1a1a", fontSize: "13px" }}>
      <div style={{ marginBottom: "6px", fontWeight: 500 }}>{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color || entry.fill }} />
          <span style={{ color: "#444" }}>{entry.name}</span>
          <span style={{ marginLeft: "auto", fontWeight: 600 }}>
            {entry.name.toLowerCase().includes("rate") ? formatPercent(entry.value) :
             typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }: any) {
  if (!payload || payload.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 16px", fontSize: "13px", marginTop: "10px" }}>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

const RISK_COLORS: Record<string, string> = {
  "High Risk": CHART_COLORS.red,
  "Medium Risk": "#f59e0b",
  "Low Risk": CHART_COLORS.green,
};

export default function Ml() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const mlQ = useGetMlMetrics();
  const riskQ = useGetTopAtRisk({ limit: 20 });
  const driversQ = useGetChurnDrivers();
  const networkQ = useGetNetworkAnalysis();

  const loading = mlQ.isLoading || mlQ.isFetching;

  const m = mlQ.data;
  const riskPieData = m ? [
    { name: "High Risk", value: m.highRisk },
    { name: "Medium Risk", value: m.mediumRisk },
    { name: "Low Risk", value: m.lowRisk },
  ] : [];

  const lastRefreshed = mlQ.dataUpdatedAt
    ? new Date(mlQ.dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase() + " on " + new Date(mlQ.dataUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-[1400px] mx-auto">
        <DashboardHeader
          title="ML & Prediction"
          subtitle="Churn prediction model performance, risk scoring, and feature analysis (Logistic Regression)"
          lastRefreshed={lastRefreshed}
          loading={loading}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <KPICard title="Accuracy" value={loading ? "" : formatPercent((m?.accuracy || 0) * 100)} valueColor={CHART_COLORS.green} loading={loading} />
          <KPICard title="Precision" value={loading ? "" : formatPercent((m?.precision || 0) * 100)} valueColor={CHART_COLORS.blue} loading={loading} />
          <KPICard title="Recall" value={loading ? "" : formatPercent((m?.recall || 0) * 100)} valueColor={CHART_COLORS.blue} loading={loading} />
          <KPICard title="F1 Score" value={loading ? "" : formatPercent((m?.f1Score || 0) * 100)} valueColor={CHART_COLORS.purple} loading={loading} />
          <KPICard title="ROC-AUC" value={loading ? "" : formatPercent((m?.rocAuc || 0) * 100)} valueColor={CHART_COLORS.green} loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-base font-semibold">Confusion Matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {loading ? <Skeleton className="w-full h-[180px] rounded-sm" /> : (
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "True Positive", value: m?.confusionMatrix.truePositive, color: CHART_COLORS.green, desc: "Correctly predicted churned" },
                      { label: "False Positive", value: m?.confusionMatrix.falsePositive, color: CHART_COLORS.red, desc: "Wrongly flagged as churn" },
                      { label: "False Negative", value: m?.confusionMatrix.falseNegative, color: "#f59e0b", desc: "Missed actual churn" },
                      { label: "True Negative", value: m?.confusionMatrix.trueNegative, color: CHART_COLORS.blue, desc: "Correctly predicted retained" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border p-3 text-center" style={{ borderColor: item.color + "40", backgroundColor: item.color + "10" }}>
                        <div className="text-xl font-bold" style={{ color: item.color }}>{formatNumber(item.value || 0)}</div>
                        <div className="text-xs font-semibold mt-1">{item.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3">Model: Logistic Regression | Threshold: 0.50</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Risk Tier Distribution</CardTitle>
              {!loading && (
                <CSVLink data={riskPieData} filename="risk-distribution.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? <Skeleton className="w-full h-[220px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={220} debounce={0}>
                  <PieChart>
                    <Pie data={riskPieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={75} cornerRadius={2} paddingAngle={2} isAnimationActive={false} stroke="none">
                      {riskPieData.map((entry) => <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Legend content={<CustomLegend />} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-base font-semibold">Feature Importance</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {driversQ.isLoading ? (
                <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}</div>
              ) : (
                <div className="space-y-3">
                  {driversQ.data?.featureImportance.sort((a, b) => b.importance - a.importance).map((f) => (
                    <div key={f.feature}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{f.feature}</span>
                        <span className="text-muted-foreground font-mono">{(f.importance * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${f.importance * 100}%`, backgroundColor: f.direction === "positive" ? CHART_COLORS.red : CHART_COLORS.green }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Network Issues Impact on Churn</CardTitle>
              {!networkQ.isLoading && networkQ.data && (
                <CSVLink data={networkQ.data} filename="network-analysis.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {networkQ.isLoading || networkQ.isFetching ? <Skeleton className="w-full h-[240px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={240} debounce={0}>
                  <BarChart data={networkQ.data?.map(r => ({ ...r, networkIssuesLabel: `${r.networkIssues} issues` }))} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="networkIssuesLabel" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Legend content={<CustomLegend />} />
                    <Bar yAxisId="left" dataKey="churnRate" name="Churn Rate %" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={40} />
                    <Bar yAxisId="right" dataKey="customerCount" name="Customers" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Network Issues — Satisfaction & Complaints</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {networkQ.isLoading || networkQ.isFetching ? (
                <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-medium">Network Issues</th>
                        <th className="px-4 py-3 font-medium">Customers</th>
                        <th className="px-4 py-3 font-medium">Churn Rate</th>
                        <th className="px-4 py-3 font-medium">Avg Satisfaction</th>
                        <th className="px-4 py-3 font-medium">Avg Complaints</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {networkQ.data?.map((r) => (
                        <tr key={r.networkIssues} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{r.networkIssues}</td>
                          <td className="px-4 py-3">{formatNumber(r.customerCount)}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${r.churnRate > 40 ? "text-red-500" : r.churnRate > 25 ? "text-amber-500" : "text-green-600"}`}>
                              {formatPercent(r.churnRate)}
                            </span>
                          </td>
                          <td className="px-4 py-3">{r.avgSatisfaction.toFixed(1)}/5</td>
                          <td className="px-4 py-3">{r.avgComplaintCount.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">Top 20 At-Risk Active Customers</CardTitle>
            {!riskQ.isLoading && riskQ.data && (
              <CSVLink data={riskQ.data} filename="at-risk-customers.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {riskQ.isLoading || riskQ.isFetching ? (
              <div className="p-4 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      {["Customer ID", "State", "Plan", "Tenure", "Monthly Charges", "Complaints", "Satisfaction", "Risk Tier", "Churn Prob"].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {riskQ.data?.map((c) => (
                      <tr key={c.customerId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{c.customerId}</td>
                        <td className="px-4 py-3">{c.state}</td>
                        <td className="px-4 py-3">{c.subscriptionType}</td>
                        <td className="px-4 py-3">{c.tenure} mos</td>
                        <td className="px-4 py-3 font-mono">{formatCurrency(c.monthlyCharges)}</td>
                        <td className="px-4 py-3 text-center">{c.complaintCount}</td>
                        <td className="px-4 py-3">{c.customerSatisfactionScore.toFixed(1)}/5</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.riskTier === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : c.riskTier === "Medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                            {c.riskTier}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-red-500 font-mono text-xs w-10">{formatProbability(c.churnProbability)}</span>
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${c.churnProbability * 100}%`, backgroundColor: c.churnProbability > 0.7 ? CHART_COLORS.red : c.churnProbability > 0.4 ? "#f59e0b" : CHART_COLORS.green }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
