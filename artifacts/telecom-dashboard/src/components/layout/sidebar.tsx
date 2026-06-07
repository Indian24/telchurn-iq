import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, TrendingDown, DollarSign, Map, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Executive Overview", icon: LayoutDashboard },
  { href: "/churn", label: "Churn Analytics", icon: TrendingDown },
  { href: "/revenue", label: "Revenue Analytics", icon: DollarSign },
  { href: "/customers", label: "Customer Explorer", icon: Users },
  { href: "/regional", label: "Regional Performance", icon: Map },
  { href: "/ml", label: "ML & Prediction", icon: BrainCircuit },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 border-r bg-sidebar flex-shrink-0 flex flex-col hidden md:flex sticky top-0 h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-xl font-bold tracking-tight text-sidebar-foreground">TelChurn IQ</h2>
        <p className="text-xs text-sidebar-foreground/60 font-medium mt-1">EY Analytics Platform</p>
      </div>
      <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
