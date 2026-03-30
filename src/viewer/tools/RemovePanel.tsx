import { useEffect, useRef, useState } from "react";
import { LoadedFile } from "../../store/useAppStore";
import { usePanelCommand } from "../usePanelCommand";
import { PanelOutput } from "../PanelOutput";
import { removePages } from "../../lib/tauri";

function parsePages(text: string, pageCount: number): number[] {
  const pages: number[] = [];
  for (const part of text.split(",").map((s) => s.trim())) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      if (!isNaN(a) && !isNaN(b) && a >= 1 && b >= a && b <= pageCount) {
        for (let i = a; i <= b; i++) pages.push(i);
      }
    } else {
      const n = Number(part);
      if (!isNaN(n) && n >= 1 && n <= pageCount) pages.push(n);
    }
  }
  return [...new Set(pages)].sort((a, b) => a - b);
}

function formatPages(pages: number[]): string {
  if (pages.length === 0) return "";
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(", ");
}

interface RemovePanelProps {
  file: LoadedFile;
  onApplied: (path: string) => void;
  selectedPages: Set<number>;
  onSelectedPagesChange: (pages: Set<number>) => void;
}

export function RemovePanel({ file, onApplied, selectedPages, onSelectedPagesChange }: RemovePanelProps) {
  const { isProcessing, result, error, run, clearError } = usePanelCommand(onApplied);
  const pageCount = file.info?.page_count ?? 0;
  const [inputText, setInputText] = useState(() => formatPages([...selectedPages]));
  // Track whether the last change came from the text input so we don't overwrite mid-typing
  const fromInput = useRef(false);

  // Viewer click → update text input
  useEffect(() => {
    if (fromInput.current) {
      fromInput.current = false;
      return;
    }
    setInputText(formatPages([...selectedPages].sort((a, b) => a - b)));
  }, [selectedPages]);

  function handleInputChange(text: string) {
    setInputText(text);
    fromInput.current = true;
    const parsed = parsePages(text, pageCount);
    onSelectedPagesChange(new Set(parsed));
  }

  const pagesToRemove = [...selectedPages].sort((a, b) => a - b);

  async function handle() {
    if (pagesToRemove.length === 0) return;
    await run(() => removePages(file.path, pagesToRemove));
    onSelectedPagesChange(new Set());
    setInputText("");
  }

  return (
    <div className="space-y-4">
      {pageCount > 0 && (
        <p className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>{pageCount} pages total</p>
      )}

      <div>
        <label className="text-xs mb-1 block" style={{ color: "var(--viewer-text-muted)" }}>
          Pages to remove
        </label>
        <input
          className="v-input"
          placeholder="e.g. 2, 4-6, 9"
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
        />
        <p className="text-xs mt-1" style={{ color: "var(--viewer-text-muted)" }}>
          Type page numbers, or click any page in the left strip or center view to select it.
        </p>
      </div>

      <button
        disabled={isProcessing || pagesToRemove.length === 0}
        onClick={handle}
        className="v-btn-danger"
      >
        Remove {pagesToRemove.length > 0
          ? `${pagesToRemove.length} Page${pagesToRemove.length !== 1 ? "s" : ""}`
          : "Pages"}
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
