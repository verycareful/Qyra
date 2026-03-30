import { LoadedFile } from "../../store/useAppStore";
import { usePanelCommand } from "../usePanelCommand";
import { PanelOutput } from "../PanelOutput";
import { splitPdf, pickDirectory, PageRange } from "../../lib/tauri";

interface SplitPanelProps {
  file: LoadedFile;
  splitAfter: number;
  onSplitAfterChange: (n: number) => void;
}

export function SplitPanel({ file, splitAfter, onSplitAfterChange }: SplitPanelProps) {
  const { isProcessing, result, error, run, clearError } = usePanelCommand();
  const pageCount = file.info?.page_count ?? 0;

  const clamped = Math.max(1, Math.min(splitAfter, pageCount - 1));
  const part1Count = clamped;
  const part2Count = pageCount - clamped;

  async function handle() {
    if (pageCount < 2) return;
    const dir = await pickDirectory();
    if (!dir) return;
    const ranges: PageRange[] = [
      { start: 1, end: clamped },
      { start: clamped + 1, end: pageCount },
    ];
    await run(() => splitPdf(file.path, ranges, dir));
  }

  if (pageCount < 2) {
    return (
      <p className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>
        Need at least 2 pages to split.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>
        {pageCount} pages total — click a page in the left panel to set the split point.
      </p>

      <div>
        <label className="text-xs mb-1 block" style={{ color: "var(--viewer-text-muted)" }}>
          Split after page
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={pageCount - 1}
            value={clamped}
            onChange={(e) =>
              onSplitAfterChange(Math.max(1, Math.min(pageCount - 1, Number(e.target.value))))
            }
            className="v-input w-20"
          />
          <span className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>of {pageCount}</span>
        </div>
      </div>

      <div
        className="rounded-lg p-3 space-y-2"
        style={{ background: "var(--viewer-elevated)", border: "1px solid var(--viewer-border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold w-12" style={{ color: "var(--action)" }}>Part 1</span>
          <span className="text-xs" style={{ color: "var(--viewer-text)" }}>
            {clamped === 1 ? "Page 1" : `Pages 1–${clamped}`}
          </span>
          <span className="text-xs ml-auto tabular-nums" style={{ color: "var(--viewer-text-muted)" }}>
            {part1Count} {part1Count === 1 ? "page" : "pages"}
          </span>
        </div>
        <div
          className="w-full"
          style={{ height: "1px", background: "var(--viewer-border)" }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold w-12" style={{ color: "var(--brand)" }}>Part 2</span>
          <span className="text-xs" style={{ color: "var(--viewer-text)" }}>
            {clamped + 1 === pageCount ? `Page ${pageCount}` : `Pages ${clamped + 1}–${pageCount}`}
          </span>
          <span className="text-xs ml-auto tabular-nums" style={{ color: "var(--viewer-text-muted)" }}>
            {part2Count} {part2Count === 1 ? "page" : "pages"}
          </span>
        </div>
      </div>

      <button disabled={isProcessing} onClick={handle} className="v-btn-primary">
        Choose folder &amp; Split
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
