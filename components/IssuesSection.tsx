import type { IssueRankingRow } from "@/types/dashboard";
import IssueRanking from "./IssueRanking";

interface IssuesSectionProps {
  rows: IssueRankingRow[];
}

export default function IssuesSection({ rows }: IssuesSectionProps) {
  return <IssueRanking rows={rows} />;
}
