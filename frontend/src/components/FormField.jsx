function FormField({ children, error, helpText, label }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {helpText ? <span className="field-help">{helpText}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

export default FormField;
