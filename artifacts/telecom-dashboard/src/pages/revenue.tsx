import {
  useGetRevenueTrends,
  useGetArpuTrends,
  useGetPlanPerformance,
  useGetClvDistribution,
  useGetPaymentMethods,
  useGetContractAnalysis,
} from "@workspace/api-client-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { KPICard } from "@/components/dashboard/kpi-card";
import { formatCurrency, formatPercent, formatNumber, CHART_COLORS, CHART_COLOR_LIST } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell,
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
            {entry.name.toLowerCase().includes("revenue") || entry.name.toLowerCase().includes("arpu") || entry.name.toLowerCase().includes("clv") || entry.name.toLowerCase().includes("₹")
              ? formatCurrency(entry.value, true)
              : entry.name.toLowerCase().includes("rate") || entry.name.toLowerCase().includes("%")
              ? formatPercent(entry.value)
              : entry.value.toLocaleString()}
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

export default function Revenue() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const revQ = useGetRevenueTrends();
  const arpuQ = useGetArpuTrends();
  const planQ = useGetPlanPerformance();
  const clvQ = useGetClvDistribution();
  const payQ = useGetPaymentMethods();
  const contractQ = useGetContractAnalysis();

  const loading = revQ.isLoading || revQ.isFetching || arpuQ.isLoading || arpuQ.isFetching
    || planQ.isLoading || planQ.isFetching || clvQ.isLoading || clvQ.isFetching;

  const totalRevenue = revQ.data?.reduce((a, r) => a + r.revenue, 0) || 0;
  const latestArpu = arpuQ.data?.[arpuQ.data.length - 1];
  const topPlan = planQ.data?.sort((a, b) => b.revenue - a.revenue)[0];
  const lastRefreshed = revQ.dataUpdatedAt
    ? new Date(revQ.dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase() + " on " + new Date(revQ.dataUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-[1400px] mx-auto">
        <DashboardHeader
          title="Revenue Analytics"
          subtitle="Revenue trends, ARPU analysis, CLV distribution, and plan performance"
          lastRefreshed={lastRefreshed}
          loading={loading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KPICard title="Annual Revenue" value={formatCurrency(totalRevenue, true)} trend="up" change="+7.2%" valueColor={CHART_COLORS.green} loading={loading} />
          <KPICard title="Top Revenue Plan" value={loading ? "" : topPlan?.plan || "—"} change={loading ? "" : formatCurrency(topPlan?.revenue || 0, true)} loading={loading} />
          <KPICard title="Latest ARPU (Basic)" value={loading ? "" : formatCurrency(latestArpu?.basic || 0)} trend="up" change="+1.5%" loading={loading} />
          <KPICard title="Latest ARPU (Premium)" value={loading ? "" : formatCurrency(latestArpu?.premium || 0)} trend="up" change="+2.3%" valueColor={CHART_COLORS.purple} loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Monthly Revenue Trend (2025)</CardTitle>
              {!loading && revQ.data && (
                <CSVLink data={revQ.data} filename="revenue-trends.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[280px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={280} debounce={0}>
                  <AreaChart data={revQ.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `₹${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" fill="url(#gradRevRev)" stroke={CHART_COLORS.green} strokeWidth={2} activeDot={{ r: 4 }} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">ARPU Trends by Plan</CardTitle>
              {!loading && arpuQ.data && (
                <CSVLink data={arpuQ.data} filename="arpu-trends.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[280px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={280} debounce={0}>
                  <LineChart data={arpuQ.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ stroke: tickColor, strokeDasharray: "3 3" }} />
                    <Legend content={<CustomLegend />} />
                    <Line type="monotone" dataKey="basic" name="Basic" stroke={CHART_COLOR_LIST[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="standard" name="Standard" stroke={CHART_COLOR_LIST[1]} strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="premium" name="Premium" stroke={CHART_COLOR_LIST[2]} strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="enterprise" name="Enterprise" stroke={CHART_COLOR_LIST[3]} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">CLV Distribution by Bucket</CardTitle>
              {!loading && clvQ.data && (
                <CSVLink data={clvQ.data} filename="clv-distribution.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[260px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={260} debounce={0}>
                  <BarChart data={clvQ.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Bar dataKey="count" name="Customers" radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={56}>
                      {clvQ.data?.map((_, i) => <Cell key={i} fill={CHART_COLOR_LIST[i % CHART_COLOR_LIST.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Payment Methods — Revenue & Churn Rate</CardTitle>
              {!loading && payQ.data && (
                <CSVLink data={payQ.data} filename="payment-methods.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {payQ.isLoading || payQ.isFetching ? <Skeleton className="w-full h-[260px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={260} debounce={0}>
                  <BarChart data={payQ.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="method" tick={{ fontSize: 10, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" tickFormatter={(v) => `₹${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Legend content={<CustomLegend />} />
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={36} />
                    <Bar yAxisId="right" dataKey="churnRate" name="Churn Rate %" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">Plan Performance Summary</CardTitle>
            {!loading && planQ.data && (
              <CSVLink data={planQ.data} filename="plan-performance.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      {["Plan", "Subscribers", "Total Revenue", "ARPU", "Churn Rate", "Avg CLV"].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {planQ.data?.map((p) => (
                      <tr key={p.plan} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold">{p.plan}</td>
                        <td className="px-4 py-3">{formatNumber(p.subscribers)}</td>
                        <td className="px-4 py-3 font-mono">{formatCurrency(p.revenue, true)}</td>
                        <td className="px-4 py-3 font-mono">{formatCurrency(p.arpu)}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${p.churnRate > 25 ? "text-red-500" : p.churnRate > 15 ? "text-amber-500" : "text-green-600"}`}>
                            {formatPercent(p.churnRate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono">{formatCurrency(p.avgClv, true)}</td>
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
