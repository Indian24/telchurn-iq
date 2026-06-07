import { useState } from "react";
import { useGetCustomers, useGetCustomerById } from "@workspace/api-client-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { formatCurrency, formatPercent, formatNumber, formatProbability, CHART_COLORS } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CSVLink } from "react-csv";
import { Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLANS = ["All", "Basic", "Standard", "Premium", "Enterprise"];
const CHURN_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Active", value: "0" },
  { label: "Churned", value: "1" },
];

function RiskBadge({ tier }: { tier: string }) {
  const cls = tier === "High"
    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    : tier === "Medium"
    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{tier}</span>;
}

type SortCol = "monthlyCharges" | "tenure" | "churnProbability" | "customerLifetimeValue" | "arpu";

function CustomerDrawer({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const { data: c, isLoading } = useGetCustomerById(customerId, { query: { enabled: !!customerId } });
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold">Customer Detail</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-4">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : c ? (
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-muted-foreground">{c.customerId}</p>
                <h3 className="text-xl font-bold mt-0.5">{c.subscriptionType} Plan</h3>
              </div>
              <RiskBadge tier={c.riskTier} />
            </div>

            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Churn Probability</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold" style={{ color: c.churnProbability > 0.7 ? CHART_COLORS.red : c.churnProbability > 0.4 ? "#f59e0b" : CHART_COLORS.green }}>
                  {formatProbability(c.churnProbability)}
                </span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.churnProbability * 100}%`, backgroundColor: c.churnProbability > 0.7 ? CHART_COLORS.red : c.churnProbability > 0.4 ? "#f59e0b" : CHART_COLORS.green }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Status: <span className={c.churn === 1 ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}>{c.churn === 1 ? "Churned" : "Active"}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Monthly Charges", value: formatCurrency(c.monthlyCharges) },
                { label: "Total Charges", value: formatCurrency(c.totalCharges, true) },
                { label: "ARPU", value: formatCurrency(c.arpu) },
                { label: "CLV", value: formatCurrency(c.customerLifetimeValue, true) },
                { label: "Tenure", value: `${c.tenure} months` },
                { label: "Contract", value: c.contractType },
                { label: "Payment", value: c.paymentMethod },
                { label: "Satisfaction", value: `${c.customerSatisfactionScore.toFixed(1)}/5` },
              ].map((item) => (
                <div key={item.label} className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Demographics</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Age", value: c.age },
                  { label: "Gender", value: c.gender },
                  { label: "State", value: c.state },
                  { label: "City", value: c.city },
                ].map((item) => (
                  <div key={item.label} className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Usage & Service</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Internet Usage", value: `${c.internetUsageGb.toFixed(1)} GB` },
                  { label: "Voice Minutes", value: `${c.voiceMinutes.toFixed(0)} min` },
                  { label: "SMS Usage", value: c.smsUsage.toFixed(0) },
                  { label: "Recharge Freq.", value: `${c.rechargeFrequency}x/month` },
                  { label: "Support Calls", value: c.customerSupportCalls },
                  { label: "Complaints", value: c.complaintCount },
                  { label: "Network Issues", value: c.networkIssues },
                ].map((item) => (
                  <div key={item.label} className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 text-muted-foreground">Customer not found</div>
        )}
      </div>
    </div>
  );
}

export default function Customers() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [churnFilter, setChurnFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [sortCol, setSortCol] = useState<SortCol>("churnProbability");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const LIMIT = 50;

  const params = {
    page,
    limit: LIMIT,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(churnFilter !== "All" ? { churn: churnFilter } : {}),
    ...(planFilter !== "All" ? { plan: planFilter } : {}),
    sortBy: sortCol,
    sortDir,
  };

  const custQ = useGetCustomers(params);
  const loading = custQ.isLoading || custQ.isFetching;

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
    setTimeout(() => setDebouncedSearch(v), 300);
  };

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: SortCol }) =>
    sortCol === col
      ? sortDir === "desc" ? <ChevronDown className="inline w-3 h-3 ml-1" /> : <ChevronUp className="inline w-3 h-3 ml-1" />
      : null;

  const total = custQ.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);
  const lastRefreshed = custQ.dataUpdatedAt
    ? new Date(custQ.dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase()
    : null;

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      {selectedCustomerId && (
        <CustomerDrawer customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
      )}

      <div className="max-w-[1400px] mx-auto">
        <DashboardHeader
          title="Customer Explorer"
          subtitle="Browse, search, and analyze individual customer records and churn risk profiles"
          lastRefreshed={lastRefreshed}
          loading={loading}
        />

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Input
                type="search"
                placeholder="Search by Customer ID, State, City..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-64 h-9 text-sm"
              />
              <Select value={churnFilter} onValueChange={(v) => { setChurnFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Churn Status" />
                </SelectTrigger>
                <SelectContent>
                  {CHURN_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-auto">
                {loading ? "Loading..." : `${formatNumber(total)} records`}
              </span>
              {!loading && custQ.data?.data && (
                <CSVLink data={custQ.data.data} filename="customers-export.csv" className="print:hidden flex items-center gap-1.5 px-3 h-9 border rounded-md text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </CSVLink>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-medium">Customer ID</th>
                        <th className="px-4 py-3 font-medium">State</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                        <th className="px-4 py-3 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("monthlyCharges")}>
                          Monthly <SortIcon col="monthlyCharges" />
                        </th>
                        <th className="px-4 py-3 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("tenure")}>
                          Tenure <SortIcon col="tenure" />
                        </th>
                        <th className="px-4 py-3 font-medium">Contract</th>
                        <th className="px-4 py-3 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("churnProbability")}>
                          Churn Prob <SortIcon col="churnProbability" />
                        </th>
                        <th className="px-4 py-3 font-medium">Risk Tier</th>
                        <th className="px-4 py-3 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("customerLifetimeValue")}>
                          CLV <SortIcon col="customerLifetimeValue" />
                        </th>
                        <th className="px-4 py-3 font-medium">Satisfaction</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {custQ.data?.data.map((c) => (
                        <tr
                          key={c.customerId}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedCustomerId(c.customerId)}
                        >
                          <td className="px-4 py-3 font-mono text-xs">{c.customerId}</td>
                          <td className="px-4 py-3">{c.state}</td>
                          <td className="px-4 py-3">{c.subscriptionType}</td>
                          <td className="px-4 py-3 font-mono text-xs">{formatCurrency(c.monthlyCharges)}</td>
                          <td className="px-4 py-3">{c.tenure} mos</td>
                          <td className="px-4 py-3 text-xs">{c.contractType}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs w-10" style={{ color: c.churnProbability > 0.7 ? CHART_COLORS.red : c.churnProbability > 0.4 ? "#f59e0b" : CHART_COLORS.green }}>
                                {formatProbability(c.churnProbability)}
                              </span>
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${c.churnProbability * 100}%`, backgroundColor: c.churnProbability > 0.7 ? CHART_COLORS.red : c.churnProbability > 0.4 ? "#f59e0b" : CHART_COLORS.green }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><RiskBadge tier={c.riskTier} /></td>
                          <td className="px-4 py-3 font-mono text-xs">{formatCurrency(c.customerLifetimeValue, true)}</td>
                          <td className="px-4 py-3">{c.customerSatisfactionScore.toFixed(1)}/5</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold ${c.churn === 1 ? "text-red-500" : "text-green-600"}`}>
                              {c.churn === 1 ? "Churned" : "Active"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} &bull; {formatNumber(total)} records
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      className="flex items-center justify-center w-8 h-8 rounded border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="flex items-center justify-center w-8 h-8 rounded border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
