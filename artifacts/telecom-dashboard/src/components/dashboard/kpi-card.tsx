import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { CHART_COLORS } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
  valueColor?: string;
}

export function KPICard({ title, value, change, trend = "neutral", loading, valueColor = CHART_COLORS.blue }: KPICardProps) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";
  
  let trendColor = "text-muted-foreground";
  if (isPositive) trendColor = "text-green-600 dark:text-green-400";
  if (isNegative) trendColor = "text-red-600 dark:text-red-400";

  return (
    <Card>
      <CardContent className="p-5 flex flex-col justify-center h-full min-h-[110px]">
        {loading ? (
          <>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40 mt-2" />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: valueColor }}>{value}</p>
            {change && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive && <ArrowUpIcon className={`w-3.5 h-3.5 ${trendColor}`} />}
                {isNegative && <ArrowDownIcon className={`w-3.5 h-3.5 ${trendColor}`} />}
                <span className={`text-xs font-medium ${trendColor}`}>{change}</span>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
