function DetailItem({ className, label, value }) {
  return (
    <div className={className ? `detail-item ${className}` : "detail-item"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default DetailItem;
