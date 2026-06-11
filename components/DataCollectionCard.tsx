import type { DataCollectionStatus } from "@/types/opsProduct";
import { PRODUCT_COPY } from "@/lib/copy";

interface DataCollectionCardProps {
  status: DataCollectionStatus;
}

export default function DataCollectionCard({ status }: DataCollectionCardProps) {
  const L = PRODUCT_COPY.labels;

  const items = [
    { label: L.lastCollected, value: status.lastCollectedAt },
    { label: L.schedule, value: status.collectionSchedule },
    { label: L.totalReviews, value: `${status.totalReviews.toLocaleString()}건` },
    { label: L.nextCollection, value: status.nextCollectionAt },
  ];

  return (
    <section
      id="collection"
      className="ops-section ops-section--collection"
      aria-labelledby="collection-heading"
    >
      <header className="ops-section__head">
        <h2 id="collection-heading">{PRODUCT_COPY.sections.collection.title}</h2>
        <p>{PRODUCT_COPY.sections.collection.desc}</p>
      </header>

      <div className="collection-card">
        <div className="collection-card__snapshots" aria-label="스냅샷 이력">
          {status.snapshotDates.map((d, i) => (
            <span
              key={d}
              className={`collection-snapshot${i === status.snapshotDates.length - 1 ? " collection-snapshot--current" : ""}`}
            >
              {d}
            </span>
          ))}
        </div>
        <div className="collection-grid" role="list">
          {items.map((item) => (
            <article key={item.label} className="collection-item" role="listitem">
              <span className="collection-item__label">{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
