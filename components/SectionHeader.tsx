interface SectionHeaderProps {
  title: string;
  description: string;
  id?: string;
}

export default function SectionHeader({
  title,
  description,
  id,
}: SectionHeaderProps) {
  return (
    <header className="section-header">
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
    </header>
  );
}
