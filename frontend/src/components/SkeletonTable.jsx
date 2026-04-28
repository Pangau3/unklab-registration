function SkeletonTable({ rows = 5 }) {
  return (
    <div className="table-card data-table-card">
      <div className="data-table-header">
        <div>
          <div className="skeleton skeleton-text" style={{ width: "120px" }} />
          <div className="skeleton skeleton-text medium" style={{ marginTop: "8px" }} />
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(122, 27, 111, 0.08)" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div className="skeleton-row" key={i}>
            <div className="skeleton skeleton-avatar" />
            <div className="skeleton skeleton-cell" />
            <div className="skeleton skeleton-cell" />
            <div className="skeleton skeleton-cell" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkeletonTable;
