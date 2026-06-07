import { useGetChurnOverview, useGetChurnDrivers } from "@workspace/api-client-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { KPICard } from "@/components/dashboard/kpi-card";
import { formatPercent, formatNumber, CHART_COLORS, CHART_COLOR_LIST } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, Cell,
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
             entry.name === "Total" || entry.name === "Churned" ? formatNumber(entry.value) :
             entry.value}
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

export default function Churn() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const churnQ = useGetChurnOverview();
  const driversQ = useGetChurnDrivers();

  const loading = churnQ.isLoading || churnQ.isFetching || driversQ.isLoading || driversQ.isFetching;

  const churnRate = churnQ.data?.churnByPlan.reduce((acc, p) => acc + p.churned, 0) || 0;
  const totalCustomers = churnQ.data?.churnByPlan.reduce((acc, p) => acc + p.total, 0) || 0;
  const overallChurnRate = totalCustomers > 0 ? (churnRate / totalCustomers) * 100 : 0;

  const highestRiskPlan = churnQ.data?.churnByPlan.sort((a, b) => b.churnRate - a.churnRate)[0];

  const lastRefreshed = churnQ.dataUpdatedAt
    ? new Date(churnQ.dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase() + " on " + new Date(churnQ.dataUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-[1400px] mx-auto">
        <DashboardHeader
          title="Churn Analytics"
          subtitle="Detailed churn drivers, risk segmentation, and retention intelligence"
          lastRefreshed={lastRefreshed}
          loading={loading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KPICard
            title="Overall Churn Rate"
            value={formatPercent(overallChurnRate)}
            trend="down"
            change="-0.8%"
            valueColor={CHART_COLORS.red}
            loading={loading}
          />
          <KPICard
            title="Churned Customers"
            value={formatNumber(churnRate)}
            trend="down"
            change="-120"
            valueColor={CHART_COLORS.red}
            loading={loading}
          />
          <KPICard
            title="Month-to-Month Churn"
            value={loading ? "" : formatPercent(churnQ.data?.churnByContract.find(c => c.category === "Month-to-Month")?.churnRate || 0)}
            loading={loading}
            valueColor={CHART_COLORS.purple}
          />
          <KPICard
            title="Highest Risk Plan"
            value={loading ? "" : highestRiskPlan?.category || "—"}
            change={loading ? "" : `${formatPercent(highestRiskPlan?.churnRate || 0)} churn`}
            loading={loading}
            valueColor={CHART_COLORS.blue}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Churn by Subscription Plan</CardTitle>
              {!loading && churnQ.data?.churnByPlan && (
                <CSVLink data={churnQ.data.churnByPlan} filename="churn-by-plan.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[260px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={260} debounce={0}>
                  <BarChart data={churnQ.data?.churnByPlan} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Legend content={<CustomLegend />} />
                    <Bar dataKey="churnRate" name="Churn Rate %" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Churn by Contract Type</CardTitle>
              {!loading && churnQ.data?.churnByContract && (
                <CSVLink data={churnQ.data.churnByContract} filename="churn-by-contract.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[260px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={260} debounce={0}>
                  <BarChart data={churnQ.data?.churnByContract} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Legend content={<CustomLegend />} />
                    <Bar dataKey="churnRate" name="Churn Rate %" fill={CHART_COLORS.purple} radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Monthly Churn Rate Trend</CardTitle>
              {!loading && churnQ.data?.monthlyChurnRate && (
                <CSVLink data={churnQ.data.monthlyChurnRate} filename="monthly-churn.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[260px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={260} debounce={0}>
                  <LineChart data={churnQ.data?.monthlyChurnRate} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ stroke: tickColor, strokeDasharray: "3 3" }} />
                    <Legend content={<CustomLegend />} />
                    <Line type="monotone" dataKey="churnRate" name="Churn Rate %" stroke={CHART_COLORS.red} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Churn by Customer Tenure</CardTitle>
              {!loading && churnQ.data?.churnByTenureBand && (
                <CSVLink data={churnQ.data.churnByTenureBand} filename="churn-by-tenure.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[260px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={260} debounce={0}>
                  <BarChart data={churnQ.data?.churnByTenureBand} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 10, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Legend content={<CustomLegend />} />
                    <Bar dataKey="churnRate" name="Churn Rate %" isAnimationActive={false} radius={[3, 3, 0, 0]} maxBarSize={48}>
                      {churnQ.data?.churnByTenureBand.map((_, i) => (
                        <Cell key={i} fill={CHART_COLOR_LIST[i % CHART_COLOR_LIST.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Churn by Satisfaction Score</CardTitle>
              {!loading && churnQ.data?.churnBySatisfaction && (
                <CSVLink data={churnQ.data.churnBySatisfaction} filename="churn-by-satisfaction.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[260px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={260} debounce={0}>
                  <BarChart data={churnQ.data?.churnBySatisfaction} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Legend content={<CustomLegend />} />
                    <Bar dataKey="churnRate" name="Churn Rate %" fill={CHART_COLORS.pink} radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Feature Importance (Churn Drivers)</CardTitle>
              {!loading && driversQ.data?.featureImportance && (
                <CSVLink data={driversQ.data.featureImportance} filename="feature-importance.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loading ? (
                <div className="space-y-3 pt-2">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {driversQ.data?.featureImportance.sort((a, b) => b.importance - a.importance).map((f) => (
                    <div key={f.feature}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-foreground font-medium">{f.feature}</span>
                        <span className="text-muted-foreground font-mono text-xs">{(f.importance * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${f.importance * 100}%`,
                            backgroundColor: f.direction === "positive" ? CHART_COLORS.red : CHART_COLORS.green,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-2">
                    <span style={{ color: CHART_COLORS.red }}>Red</span> = increases churn risk &nbsp;|&nbsp; <span style={{ color: CHART_COLORS.green }}>Green</span> = reduces churn risk
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
