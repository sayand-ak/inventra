interface PageHeaderProps {
  /** First word of the heading rendered normally, rest wrapped in <span> */
  title: string;
  /** Subtitle / count line below the heading */
  subtitle: string;
  /** Label for the primary action button */
  addLabel: string;
  /** Called when the primary button is clicked */
  onAdd: () => void;
}

export default function PageHeader({
  title,
  subtitle,
  addLabel,
  onAdd,
}: PageHeaderProps) {
  // Split on first space so e.g. "Product Catalog" → "Product" + "Catalog"
  const spaceIdx = title.indexOf(" ");
  const first = spaceIdx === -1 ? title : title.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? "" : title.slice(spaceIdx + 1);

  return (
    <div className="ph">
      <div className="ph-left">
        <h1>
          {first} {rest && <span>{rest}</span>}
        </h1>
        <p>{subtitle}</p>
      </div>
      <button className="add-btn" onClick={onAdd}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {addLabel}
      </button>
    </div>
  );
}