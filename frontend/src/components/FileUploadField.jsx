import { useEffect, useState } from "react";
import FileMeta from "./FileMeta";

function FileUploadField({
  accept,
  error,
  file,
  helpText,
  label,
  name,
  onChange,
}) {
  const inputId = `upload-${name}`;
  const statusLabel = file ? "File dipilih" : "Belum dipilih";
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const previewKind = getPreviewKind(file);

  useEffect(() => {
    if (!file || previewKind === "none") {
      setPreviewUrl("");
      setIsPreviewOpen(false);
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [file, previewKind]);

  useEffect(() => {
    if (!previewUrl) {
      setIsPreviewOpen(false);
    }
  }, [previewUrl]);

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

      {previewUrl ? (
        <>
          <div className="file-upload-extra-actions">
            <button
              className="file-preview-button"
              onClick={() => setIsPreviewOpen(true)}
              type="button"
            >
              Lihat file
            </button>
          </div>

          {isPreviewOpen ? (
            <div
              aria-hidden="true"
              className="file-preview-modal"
              onClick={() => setIsPreviewOpen(false)}
            >
              <div
                aria-label={`Preview ${label}`}
                aria-modal="true"
                className="file-preview-dialog"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
              >
                <div className="file-preview-topbar">
                  <strong>{label}</strong>
                  {file ? <span>{file.name}</span> : null}
                </div>
                <button
                  className="file-preview-close"
                  onClick={() => setIsPreviewOpen(false)}
                  type="button"
                >
                  Tutup
                </button>
                {previewKind === "pdf" ? (
                  <iframe src={previewUrl} title={`Preview ${label}`} />
                ) : (
                  <img alt={`Preview ${label}`} src={previewUrl} />
                )}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

function getPreviewKind(file) {
  if (!file) {
    return "none";
  }

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  return "none";
}

export default FileUploadField;
