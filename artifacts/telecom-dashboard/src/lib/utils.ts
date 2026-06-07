import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CHART_COLORS = {
  blue: "#0079F2",
  purple: "#795EFF",
  green: "#009118",
  red: "#A60808",
  pink: "#ec4899",
};

export const CHART_COLOR_LIST = [
  "#0079F2",
  "#795EFF",
  "#009118",
  "#A60808",
  "#ec4899",
  "#f59e0b",
  "#06b6d4",
  "#8b5cf6",
];

export function formatNumber(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString("en-IN");
}

export function formatCurrency(n: number, compact = false): string {
  if (compact) {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  }
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatPercent(n: number): string {
  return `${n.toFixed(2)}%`;
}

export function formatSatisfaction(n: number): string {
  return `${n.toFixed(1)}/5`;
}

export function formatProbability(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}
