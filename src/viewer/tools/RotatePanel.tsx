import { useState } from "react";
import { LoadedFile } from "../../store/useAppStore";
import { usePanelCommand } from "../usePanelCommand";
import { PanelOutput } from "../PanelOutput";
import { rotatePages } from "../../lib/tauri";

const DEGREES = [90, 180, 270] as const;

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
  return [...new Set(pages)];
}

interface RotatePanelProps {
  file: LoadedFile;
  onApplied: (path: string) => void;
}

export function RotatePanel({ file, onApplied }: RotatePanelProps) {
  const { isProcessing, result, error, run, clearError } = usePanelCommand(onApplied);
  const [degrees, setDegrees] = useState<90 | 180 | 270>(90);
  const [applyTo, setApplyTo] = useState<"all" | "specific">("all");
  const [pageList, setPageList] = useState("1");
  const pageCount = file.info?.page_count ?? 0;

  async function handle() {
    const pages = applyTo === "all" ? [] : parsePages(pageList, pageCount);
    await run(() => rotatePages(file.path, pages, degrees));
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs mb-2 block" style={{ color: "var(--viewer-text-muted)" }}>Rotation</label>
        <div className="flex gap-1.5">
          {DEGREES.map((d) => (
            <button
              key={d}
              onClick={() => setDegrees(d)}
              className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                degrees === d ? "v-toggle-on" : "v-toggle-off"
              }`}
            >
              {d}°
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs mb-2 block" style={{ color: "var(--viewer-text-muted)" }}>Apply to</label>
        <div className="flex gap-1.5">
          {(["all", "specific"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setApplyTo(opt)}
              className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                applyTo === opt ? "v-toggle-on" : "v-toggle-off"
              }`}
            >
              {opt === "all" ? "All pages" : "Specific"}
            </button>
          ))}
        </div>
        {applyTo === "specific" && (
          <input
            className="v-input mt-2"
            placeholder="e.g. 1, 3-5, 7"
            value={pageList}
            onChange={(e) => setPageList(e.target.value)}
          />
        )}
      </div>

      <button
        disabled={isProcessing}
        onClick={handle}
        className="v-btn-primary"
      >
        Rotate Pages
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
