import FileMeta from "./FileMeta";

function FileUploadField({ accept, error, file, helpText, label, name, onChange }) {
  const inputId = `upload-${name}`;
  const statusLabel = file ? "File dipilih" : "Belum dipilih";

  return (
    <div className={`file-upload-field${file ? " has-file" : ""}${error ? " has-error" : ""}`}>
      <div className="file-upload-header">
        <span className="field-label">{label}</span>
        <span className="file-upload-status">{statusLabel}</span>
      </div>

      <input
        accept={accept}
        className="file-input-native"
        id={inputId}
        name={name}
        onChange={onChange}
        type="file"
      />

      <label className="file-upload-card" htmlFor={inputId}>
        <span className="file-upload-mark" aria-hidden="true">
          <span className="file-upload-mark-inner" />
        </span>

        <span className="file-upload-copy">
          <strong>{file ? "Ganti dokumen yang dipilih" : "Pilih dokumen dari perangkat"}</strong>
          <span>
            {file
              ? "Klik area ini jika ingin mengganti file sebelum formulir dikirim."
              : "Klik untuk membuka file picker lalu pilih dokumen yang akan diunggah."}
          </span>
        </span>

        <span className="file-upload-action">{file ? "Ganti" : "Pilih"}</span>
      </label>

      <div className="file-upload-footer">
        {helpText ? <span className="field-help">{helpText}</span> : null}
        <FileMeta file={file} />
      </div>

      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

export default FileUploadField;
