"use client";

import { useState } from "react";
import type { EvidenceItem } from "@/types/dashboard";
import { SECTIONS } from "@/lib/copy";

interface PortfolioEvidenceProps {
  items: EvidenceItem[];
}

export default function PortfolioEvidence({ items }: PortfolioEvidenceProps) {
  const [open, setOpen] = useState(false);

  if (!items.length) {
    return null;
  }

  return (
    <details
      id="evidence"
      className="evidence-collapsible"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="evidence-collapsible__trigger">
        <span>{SECTIONS.evidence.title}</span>
        <span className="evidence-collapsible__hint">
          {open ? "접기" : "펼치기"} · {items.length}항목
        </span>
      </summary>
      <ul className="evidence-grid" role="list">
        {items.map((item) => (
          <li key={item.label} className="evidence-item">
            <span className="evidence-item__label">{item.label}</span>
            <strong className="evidence-item__value">{item.value}</strong>
          </li>
        ))}
      </ul>
    </details>
  );
}
