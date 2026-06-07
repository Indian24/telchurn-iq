import { useGetExecutiveSummary, useGetRevenueTrends, useGetChurnOverview, useGetCustomerSegments, useGetTopAtRisk } from "@workspace/api-client-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { KPICard } from "@/components/dashboard/kpi-card";
import { formatNumber, formatCurrency, formatPercent, formatSatisfaction, CHART_COLORS, CHART_COLOR_LIST } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { CSVLink } from "react-csv";
import { Download } from "lucide-react";
import { useTheme } from "next-themes";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "6px", padding: "10px 14px", border: "1px solid #e0e0e0", color: "#1a1a1a", fontSize: "13px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
      <div style={{ marginBottom: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>{label}</div>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color || entry.payload.fill, flexShrink: 0 }} />
          <span style={{ color: "#444" }}>{entry.name}</span>
          <span style={{ marginLeft: "auto", fontWeight: 600 }}>
            {entry.name.toLowerCase().includes("revenue") || entry.name.toLowerCase().includes("arpu") ? formatCurrency(entry.value, true) :
             entry.name.toLowerCase().includes("rate") ? formatPercent(entry.value) :
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
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Overview() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const sumQ = useGetExecutiveSummary();
  const revQ = useGetRevenueTrends();
  const churnQ = useGetChurnOverview();
  const segQ = useGetCustomerSegments();
  const riskQ = useGetTopAtRisk({ limit: 5 });

  const loading = sumQ.isLoading || sumQ.isFetching || revQ.isLoading || revQ.isFetching || churnQ.isLoading || churnQ.isFetching || segQ.isLoading || segQ.isFetching || riskQ.isLoading || riskQ.isFetching;

  const s = sumQ.data;
  
  const lastRefreshed = sumQ.dataUpdatedAt ? new Date(sumQ.dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase() + " on " + new Date(sumQ.dataUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;

  return (
    <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
      <div className="max-w-[1400px] mx-auto">
        <DashboardHeader title="Executive Overview" subtitle="High-level business performance and churn risks" lastRefreshed={lastRefreshed} loading={loading} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KPICard title="Total Customers" value={s ? formatNumber(s.totalCustomers) : ""} loading={loading} />
          <KPICard title="Active Customers" value={s ? formatNumber(s.activeCustomers) : ""} loading={loading} />
          <KPICard title="Total Revenue" value={s ? formatCurrency(s.totalRevenue, true) : ""} trend="up" change="+4.2%" valueColor={CHART_COLORS.green} loading={loading} />
          <KPICard title="Revenue at Risk" value={s ? formatCurrency(s.revenueAtRisk, true) : ""} trend="down" change="+1.5%" valueColor={CHART_COLORS.red} loading={loading} />
          <KPICard title="Avg ARPU" value={s ? formatCurrency(s.avgArpu) : ""} trend="up" change="+2.1%" loading={loading} />
          <KPICard title="Avg CLV" value={s ? formatCurrency(s.avgClv) : ""} loading={loading} />
          <KPICard title="Churn Rate" value={s ? formatPercent(s.churnRate) : ""} trend="down" change="-0.3%" valueColor={CHART_COLORS.red} loading={loading} />
          <KPICard title="Avg Satisfaction" value={s ? formatSatisfaction(s.avgSatisfactionScore) : ""} loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Monthly Revenue Trend</CardTitle>
              {!loading && revQ.data && revQ.data.length > 0 && (
                <CSVLink data={revQ.data} filename="monthly-revenue.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[300px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <AreaChart data={revQ.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `₹${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" fill="url(#gradRev)" stroke={CHART_COLORS.green} fillOpacity={1} strokeWidth={2} activeDot={{ r: 4, strokeWidth: 2 }} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Churn Rate Trend</CardTitle>
              {!loading && churnQ.data?.monthlyChurnRate && (
                <CSVLink data={churnQ.data.monthlyChurnRate} filename="churn-trend.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[300px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <LineChart data={churnQ.data?.monthlyChurnRate} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ stroke: tickColor, strokeDasharray: '3 3' }} />
                    <Line type="monotone" dataKey="churnRate" name="Churn Rate" stroke={CHART_COLORS.red} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Segments by Value</CardTitle>
              {!loading && segQ.data && (
                <CSVLink data={segQ.data} filename="segments.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? <Skeleton className="w-full h-[300px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <PieChart>
                    <Pie data={segQ.data} dataKey="revenue" nameKey="segment" cx="50%" cy="45%" innerRadius={60} outerRadius={90} cornerRadius={2} paddingAngle={2} isAnimationActive={false} stroke="none">
                      {segQ.data?.map((_, idx) => <Cell key={idx} fill={CHART_COLOR_LIST[idx % CHART_COLOR_LIST.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Legend content={<CustomLegend />} verticalAlign="bottom" wrapperStyle={{ paddingTop: "20px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-base font-semibold">Top At-Risk Customers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-medium">Customer ID</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                        <th className="px-4 py-3 font-medium">Tenure</th>
                        <th className="px-4 py-3 font-medium">Risk Score</th>
                        <th className="px-4 py-3 font-medium">Monthly</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {riskQ.data?.map((c) => (
                        <tr key={c.customerId} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium font-mono text-xs">{c.customerId.substring(0,8)}...</td>
                          <td className="px-4 py-3">{c.subscriptionType}</td>
                          <td className="px-4 py-3">{c.tenure} mos</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${c.churnProbability > 75 ? "text-red-500" : "text-amber-500"}`}>
                                {c.churnProbability.toFixed(1)}%
                              </span>
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${c.churnProbability}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono">{formatCurrency(c.monthlyCharges)}</td>
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
    </div>
  );
}
