import type { SeverityLevel } from "@/types/dashboard";

export function severityClass(level: string): string {
  const normalized = (level || "Low").toLowerCase();
  if (normalized === "critical") return "badge badge--critical";
  if (normalized === "high") return "badge badge--high";
  if (normalized === "medium") return "badge badge--medium";
  return "badge badge--low";
}

export function rowHighlightClass(priority: string): string {
  const normalized = (priority || "").toLowerCase();
  if (normalized === "critical") return "row--critical";
  if (normalized === "high") return "row--high";
  return "";
}

export function cardRiskClass(riskLevel: SeverityLevel): string {
  if (riskLevel === "Critical") return "game-card game-card--critical";
  if (riskLevel === "High") return "game-card game-card--high";
  return "game-card";
}

export function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
