import { useState, useEffect } from "react";
import { LoadedFile } from "../../store/useAppStore";
import { usePanelCommand } from "../usePanelCommand";
import { PanelOutput } from "../PanelOutput";
import { setMetadata, getMetadata, PdfMetadata } from "../../lib/tauri";

const FIELDS: { key: keyof PdfMetadata; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "subject", label: "Subject" },
  { key: "keywords", label: "Keywords" },
  { key: "creator", label: "Creator" },
];

interface MetadataPanelProps {
  file: LoadedFile;
  onApplied: (path: string) => void;
}

export function MetadataPanel({ file, onApplied }: MetadataPanelProps) {
  const { isProcessing, result, error, run, clearError } = usePanelCommand(onApplied);
  const [meta, setMeta] = useState<PdfMetadata>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setMeta({});
    getMetadata(file.path)
      .then((m) => { setMeta(m); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [file.path]);

  async function handle() {
    await run(() => setMetadata(file.path, meta));
  }

  return (
    <div className="space-y-3">
      {!loaded && (
        <p className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>Loading metadata...</p>
      )}

      {loaded && FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className="text-xs mb-1 block" style={{ color: "var(--viewer-text-muted)" }}>{label}</label>
          <input
            value={meta[key] ?? ""}
            onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value || undefined }))}
            className="v-input"
            placeholder={label}
          />
        </div>
      ))}

      <button
        disabled={!loaded || isProcessing}
        onClick={handle}
        className="v-btn-primary"
      >
        Save Metadata
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
