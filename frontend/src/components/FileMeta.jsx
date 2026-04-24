import { formatFileSize } from "../utils/formatters";

function FileMeta({ file }) {
  if (!file) {
    return null;
  }

  return (
    <span className="file-meta">
      <span className="file-meta-name">{file.name}</span>
      <span className="file-meta-size">{formatFileSize(file.size)}</span>
    </span>
  );
}

export default FileMeta;
