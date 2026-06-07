import { useState } from "react";
import { useGetRegionalPerformance } from "@workspace/api-client-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { KPICard } from "@/components/dashboard/kpi-card";
import { formatCurrency, formatPercent, formatNumber, CHART_COLORS, CHART_COLOR_LIST } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { CSVLink } from "react-csv";
import { Download, ChevronUp, ChevronDown } from "lucide-react";
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
            {entry.name.toLowerCase().includes("revenue") ? formatCurrency(entry.value, true) :
             entry.name.toLowerCase().includes("rate") ? formatPercent(entry.value) :
             formatNumber(entry.value)}
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

type SortKey = "revenue" | "totalCustomers" | "churnRate" | "arpu" | "avgSatisfaction";
type SortDir = "asc" | "desc";

export default function Regional() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const regQ = useGetRegionalPerformance();
  const loading = regQ.isLoading || regQ.isFetching;

  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...(regQ.data || [])].sort((a, b) =>
    sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
  );

  const top10Revenue = [...(regQ.data || [])].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const top10Churn = [...(regQ.data || [])].sort((a, b) => b.churnRate - a.churnRate).slice(0, 10);

  const topState = top10Revenue[0];
  const totalRevenue = regQ.data?.reduce((a, r) => a + r.revenue, 0) || 0;
  const avgChurn = regQ.data ? regQ.data.reduce((a, r) => a + r.churnRate, 0) / regQ.data.length : 0;

  const lastRefreshed = regQ.dataUpdatedAt
    ? new Date(regQ.dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase() + " on " + new Date(regQ.dataUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? sortDir === "desc" ? <ChevronDown className="inline w-3.5 h-3.5 ml-1" /> : <ChevronUp className="inline w-3.5 h-3.5 ml-1" />
      : null;

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-[1400px] mx-auto">
        <DashboardHeader
          title="Regional Performance"
          subtitle="State-level customer distribution, revenue, and churn analysis across India"
          lastRefreshed={lastRefreshed}
          loading={loading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KPICard title="Total States" value={loading ? "" : formatNumber(regQ.data?.length || 0)} loading={loading} />
          <KPICard title="Top Revenue State" value={loading ? "" : topState?.state || "—"} change={loading ? "" : formatCurrency(topState?.revenue || 0, true)} valueColor={CHART_COLORS.green} loading={loading} />
          <KPICard title="Total Revenue" value={formatCurrency(totalRevenue, true)} trend="up" change="+4.2%" valueColor={CHART_COLORS.green} loading={loading} />
          <KPICard title="Avg State Churn Rate" value={formatPercent(avgChurn)} valueColor={CHART_COLORS.red} loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Top 10 States by Revenue</CardTitle>
              {!loading && top10Revenue.length > 0 && (
                <CSVLink data={top10Revenue} filename="top-states-revenue.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[280px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={280} debounce={0}>
                  <BarChart data={top10Revenue} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="state" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Bar dataKey="revenue" name="Revenue" radius={[0, 3, 3, 0]} isAnimationActive={false}>
                      {top10Revenue.map((_, i) => <Cell key={i} fill={CHART_COLOR_LIST[i % CHART_COLOR_LIST.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Top 10 States by Churn Rate</CardTitle>
              {!loading && top10Churn.length > 0 && (
                <CSVLink data={top10Churn} filename="top-states-churn.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loading ? <Skeleton className="w-full h-[280px] rounded-sm" /> : (
                <ResponsiveContainer width="100%" height={280} debounce={0}>
                  <BarChart data={top10Churn} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="state" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Bar dataKey="churnRate" name="Churn Rate %" fill={CHART_COLORS.red} radius={[0, 3, 3, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">All States Performance</CardTitle>
            {!loading && regQ.data && (
              <CSVLink data={regQ.data} filename="all-regional-performance.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] border rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-medium">State</th>
                      {(["totalCustomers", "revenue", "arpu", "churnRate", "avgSatisfaction"] as SortKey[]).map((col) => (
                        <th key={col} className="px-4 py-3 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => handleSort(col)}>
                          {{ totalCustomers: "Customers", revenue: "Revenue", arpu: "ARPU", churnRate: "Churn Rate", avgSatisfaction: "Satisfaction" }[col]}
                          <SortIcon col={col} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sorted.map((r) => (
                      <tr key={r.state} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{r.state}</td>
                        <td className="px-4 py-3">{formatNumber(r.totalCustomers)}</td>
                        <td className="px-4 py-3 font-mono">{formatCurrency(r.revenue, true)}</td>
                        <td className="px-4 py-3 font-mono">{formatCurrency(r.arpu)}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${r.churnRate > 25 ? "text-red-500" : r.churnRate > 15 ? "text-amber-500" : "text-green-600"}`}>
                            {formatPercent(r.churnRate)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{r.avgSatisfaction.toFixed(1)}/5</span>
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${(r.avgSatisfaction / 5) * 100}%`, backgroundColor: r.avgSatisfaction >= 4 ? CHART_COLORS.green : r.avgSatisfaction >= 3 ? CHART_COLORS.blue : CHART_COLORS.red }} />
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
