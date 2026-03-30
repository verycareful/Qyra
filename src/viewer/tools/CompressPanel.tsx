import { LoadedFile } from "../../store/useAppStore";
import { usePanelCommand } from "../usePanelCommand";
import { PanelOutput } from "../PanelOutput";
import { compressPdf } from "../../lib/tauri";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

interface CompressPanelProps {
  file: LoadedFile;
  onApplied: (path: string) => void;
}

export function CompressPanel({ file, onApplied }: CompressPanelProps) {
  const { isProcessing, result, error, run, clearError } = usePanelCommand(onApplied);

  return (
    <div className="space-y-4">
      {file.info && (
        <div className="v-stat-box">
          <p className="text-xs" style={{ color: "var(--viewer-text-sec)" }}>
            Current size: <span style={{ color: "var(--viewer-text)" }}>{formatSize(file.info.file_size)}</span>
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--viewer-text-sec)" }}>
            Pages: <span style={{ color: "var(--viewer-text)" }}>{file.info.page_count}</span>
          </p>
        </div>
      )}

      <p className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>
        Uses lossless object stream compression. Typically reduces size by 11–61% depending on the PDF.
      </p>

      <button
        disabled={isProcessing}
        onClick={() => run(() => compressPdf(file.path))}
        className="v-btn-primary"
      >
        Compress PDF
      </button>

      <PanelOutput
        isProcessing={isProcessing}
        result={result}
        error={error}
        onClearError={clearError}
      />
    </div>
  );
}
