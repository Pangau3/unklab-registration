function SummaryCard({ description, label, value, variant }) {
  return (
    <div className={`summary-card ${variant || ""}`.trim()}>
      <div className="summary-card-top">
        <span>{label}</span>
        <span aria-hidden="true" className="summary-card-accent" />
      </div>
      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  );
}

export default SummaryCard;
