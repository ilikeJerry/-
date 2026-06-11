import { severityClass } from "@/lib/badges";
import { koSeverity } from "@/lib/korean";

interface BadgeProps {
  label: string;
}

export default function Badge({ label }: BadgeProps) {
  const ko = koSeverity(label);
  return (
    <span className={severityClass(label)} aria-label={`위험도 ${ko}`}>
      {ko}
    </span>
  );
}
