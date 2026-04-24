function LoadingPanel({ label }) {
  return (
    <div className="content-card loading-card">
      <div className="loader" />
      <p>{label}</p>
    </div>
  );
}

export default LoadingPanel;
