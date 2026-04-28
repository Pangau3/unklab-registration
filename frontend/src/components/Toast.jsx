function Toast({ message, variant = "success", onClose }) {
  return (
    <div className={`toast toast-${variant}`}>
      <span className="toast-icon">
        {variant === "success" && "✓"}
        {variant === "error" && "✕"}
        {variant === "info" && "ℹ"}
      </span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} type="button" aria-label="Tutup notifikasi">
        ✕
      </button>
    </div>
  );
}

export default Toast;
