import { useState, useRef, useEffect } from "react";
import { RefreshCw, ChevronDown, Check, Sun, Moon, Printer } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";

const INTERVAL_OPTIONS = [
  { label: "Off", ms: 0 },
  { label: "Every 5 min", ms: 5 * 60 * 1000 },
  { label: "Every 15 min", ms: 15 * 60 * 1000 },
  { label: "Every 1 hour", ms: 60 * 60 * 1000 },
];

export const DATA_SOURCES = ["Telecom DB", "Billing API", "ML Engine"];

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  lastRefreshed?: string | null;
  loading?: boolean;
  onRefresh?: () => void;
  showAutoRefresh?: boolean;
}

export function DashboardHeader({ title, subtitle, lastRefreshed, loading = false, onRefresh, showAutoRefresh = true }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) {
      setIsSpinning(true);
    } else {
      const t = setTimeout(() => setIsSpinning(false), 600);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedInterval > 0) {
      const timer = setInterval(() => {
        if (onRefresh) onRefresh();
        else queryClient.invalidateQueries();
      }, selectedInterval);
      return () => clearInterval(timer);
    }
  }, [selectedInterval, onRefresh, queryClient]);

  const handleManualRefresh = () => {
    if (onRefresh) onRefresh();
    else queryClient.invalidateQueries();
  };

  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-4">
      <div className="pt-2">
        <h1 className="font-bold text-[32px] tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1.5 text-[14px]">{subtitle}</p>
        
        {DATA_SOURCES.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[12px] text-muted-foreground shrink-0">Data Sources:</span>
            {DATA_SOURCES.map((source) => (
              <span
                key={source}
                className="text-[12px] font-bold rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
                title={source}
                style={{
                  maxWidth: "20ch",
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgb(229, 231, 235)",
                  color: isDark ? "#c8c9cc" : "rgb(75, 85, 99)",
                }}
              >
                {source}
              </span>
            ))}
          </div>
        )}
        
        {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3">Last refresh: {lastRefreshed}</p>}
      </div>
      
      <div className="flex items-center gap-3 pt-2 print:hidden">
        {showAutoRefresh ? (
          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center rounded-[6px] overflow-hidden h-[26px] text-[12px] border"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F0F1F2",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent",
                color: isDark ? "#c8c9cc" : "#4b5563",
              }}
            >
              <button onClick={handleManualRefresh} disabled={loading} className="flex items-center gap-1 px-2 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3 h-3 ${isSpinning ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <div className="w-px h-4 shrink-0" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
              <button onClick={() => setDropdownOpen((o) => !o)} className="flex items-center justify-center px-1.5 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            {dropdownOpen && (
              <div className="absolute right-0 top-[30px] w-40 rounded-md border shadow-md py-1 z-50 text-[13px]" style={{ backgroundColor: isDark ? "#1a1a1a" : "#fff" }}>
                {INTERVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => { setSelectedInterval(opt.ms); setDropdownOpen(false); }}
                    className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    {opt.label}
                    {selectedInterval === opt.ms && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-1 px-2 h-[26px] rounded-[6px] text-[12px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50 border"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F0F1F2",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent",
              color: isDark ? "#c8c9cc" : "#4b5563",
            }}
          >
            <RefreshCw className={`w-3 h-3 ${isSpinning ? "animate-spin" : ""}`} />
            Refresh
          </button>
        )}

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors border"
          style={{ 
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F0F1F2", 
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent",
            color: isDark ? "#c8c9cc" : "#4b5563" 
          }}
          aria-label="Export as PDF"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors border"
          style={{ 
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F0F1F2", 
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent",
            color: isDark ? "#c8c9cc" : "#4b5563" 
          }}
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
