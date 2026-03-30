import { useState } from "react";
import { useNotesStore, PageTemplate, VirtualPage } from "../../store/useNotesStore";
import { useAppStore } from "../../store/useAppStore";

const EMPTY_VIRTUAL_PAGES: VirtualPage[] = [];

const COLORS = [
  { label: "Black",  value: "#111111" },
  { label: "Blue",   value: "#1d4ed8" },
  { label: "Red",    value: "#ef4444" },
  { label: "Green",  value: "#16a34a" },
  { label: "Orange", value: "#f97316" },
  { label: "Purple", value: "#9333ea" },
  { label: "Pink",   value: "#ec4899" },
  { label: "Yellow", value: "#eab308" },
];

const THICKNESSES = [
  { label: "Fine",   value: 2  },
  { label: "Medium", value: 4  },
  { label: "Thick",  value: 8  },
  { label: "Brush",  value: 14 },
];

const TOOLS: { id: 'pen' | 'highlighter' | 'calligraphy' | 'bezier' | 'eraser'; label: string; emoji: string }[] = [
  { id: 'pen',         label: 'Pen',         emoji: '✏️'  },
  { id: 'highlighter', label: 'Highlighter', emoji: '🖍'  },
  { id: 'calligraphy', label: 'Calligraphy', emoji: '🖋'  },
  { id: 'bezier',      label: 'Curve',       emoji: '〜'  },
  { id: 'eraser',      label: 'Eraser',      emoji: '⌫'  },
];

const TEMPLATES: { id: PageTemplate; label: string; preview: string }[] = [
  { id: 'blank',  label: 'Blank',  preview: '□' },
  { id: 'ruled',  label: 'Ruled',  preview: '≡' },
  { id: 'grid',   label: 'Grid',   preview: '⊞' },
  { id: 'dotted', label: 'Dotted', preview: '⠿' },
];

export function DrawPanel() {
  const viewerFile = useAppStore((s) => s.viewerFile);
  const docPath = viewerFile?.path ?? "";

  const drawColor      = useNotesStore((s) => s.drawColor);
  const drawThickness  = useNotesStore((s) => s.drawThickness);
  const drawTool       = useNotesStore((s) => s.drawTool);
  const drawNibAngle   = useNotesStore((s) => s.drawNibAngle);
  const setDrawColor      = useNotesStore((s) => s.setDrawColor);
  const setDrawThickness  = useNotesStore((s) => s.setDrawThickness);
  const setDrawTool       = useNotesStore((s) => s.setDrawTool);
  const setDrawNibAngle   = useNotesStore((s) => s.setDrawNibAngle);
  const eraserSize     = useNotesStore((s) => s.eraserSize);
  const setEraserSize  = useNotesStore((s) => s.setEraserSize);
  const undoStroke     = useNotesStore((s) => s.undoStroke);
  const clearStrokes   = useNotesStore((s) => s.clearStrokes);
  const strokeCount    = useNotesStore((s) => s.strokes[docPath]?.length ?? 0);
  const virtualPages   = useNotesStore((s) => s.virtualPages[docPath] ?? EMPTY_VIRTUAL_PAGES);
  const addVirtualPage = useNotesStore((s) => s.addVirtualPage);
  const removeVirtualPage = useNotesStore((s) => s.removeVirtualPage);

  const [confirmClear, setConfirmClear] = useState(false);

  function handleAddPage(template: PageTemplate) {
    // "Add after last" from the panel — position 999 means "after all real pages"
    // The viewer inserts inline buttons for specific positions; this appends at the end.
    const vp: VirtualPage = {
      id: crypto.randomUUID(),
      template,
      afterRealPage: 9999, // Viewer will clamp to actual pageCount
    };
    addVirtualPage(docPath, vp);
  }

  return (
    <div className="flex flex-col gap-5 text-sm" style={{ color: "var(--viewer-text)" }}>

      {/* Tool selector */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--viewer-text-muted)" }}>Tool</span>
        <div className="grid grid-cols-2 gap-1.5">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setDrawTool(t.id)}
              className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors"
              style={drawTool === t.id ? {
                background: "color-mix(in oklch, var(--brand) 20%, transparent)",
                border: "1px solid color-mix(in oklch, var(--brand) 50%, transparent)",
                color: "var(--brand)",
              } : {
                background: "var(--viewer-elevated)",
                border: "1px solid var(--viewer-border)",
                color: "var(--viewer-text-sec)",
              }}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        {drawTool === 'calligraphy' && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between text-xs" style={{ color: "var(--viewer-text-muted)" }}>
              <span>Nib angle</span>
              <span>{drawNibAngle}°</span>
            </div>
            <input
              type="range" min={0} max={90} step={5}
              value={drawNibAngle}
              onChange={(e) => setDrawNibAngle(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs" style={{ color: "var(--viewer-text-muted)" }}>
              <span>Horizontal</span><span>Vertical</span>
            </div>
          </div>
        )}
        {drawTool === 'bezier' && (
          <p className="text-xs mt-0.5" style={{ color: "var(--viewer-text-muted)" }}>
            Click to place points · Double-click to finish · Esc to cancel
          </p>
        )}
        {drawTool === 'eraser' && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between text-xs" style={{ color: "var(--viewer-text-muted)" }}>
              <span>Eraser size</span>
              <span>{eraserSize}px</span>
            </div>
            <input
              type="range" min={8} max={80} step={4}
              value={eraserSize}
              onChange={(e) => setEraserSize(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>
              Precision erase — removes only what the eraser touches.
            </p>
          </div>
        )}
      </div>

      {/* Color + Thickness + Preview — hidden for eraser */}
      {drawTool !== 'eraser' && <>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--viewer-text-muted)" }}>Color</span>
        <div className="grid grid-cols-4 gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setDrawColor(c.value)}
              title={c.label}
              className="rounded-full w-8 h-8 transition-transform hover:scale-110"
              style={{
                background: c.value,
                outline: drawColor === c.value ? "3px solid var(--brand)" : "2px solid transparent",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
        <label className="flex items-center gap-2 mt-0.5 cursor-pointer">
          <input
            type="color"
            value={drawColor}
            onChange={(e) => setDrawColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
            style={{ border: "1px solid var(--viewer-border)", padding: "1px" }}
          />
          <span className="text-xs font-mono" style={{ color: "var(--viewer-text-sec)" }}>{drawColor}</span>
          <span className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>Custom</span>
        </label>
      </div>

      {/* Thickness (not shown for bezier — baseThickness is stroke width directly) */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--viewer-text-muted)" }}>
          {drawTool === 'bezier' ? 'Stroke width' : 'Thickness'}
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {THICKNESSES.map((th) => (
            <button
              key={th.value}
              onClick={() => setDrawThickness(th.value)}
              title={th.label}
              className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg text-xs transition-colors"
              style={drawThickness === th.value ? {
                background: "color-mix(in oklch, var(--brand) 20%, transparent)",
                border: "1px solid color-mix(in oklch, var(--brand) 50%, transparent)",
                color: "var(--brand)",
              } : {
                background: "var(--viewer-elevated)",
                border: "1px solid var(--viewer-border)",
                color: "var(--viewer-text-sec)",
              }}
            >
              <svg viewBox="0 0 24 4" width="28" height={Math.max(2, th.value / 2)} style={{ display: "block" }}>
                <line x1={2} y1={2} x2={22} y2={2} stroke="currentColor" strokeWidth={th.value / 2} strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: "0.65rem" }}>{th.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-lg"
        style={{ background: "var(--viewer-elevated)", border: "1px solid var(--viewer-border-sub)" }}
      >
        <svg width="80" height="24" viewBox="0 0 80 24" style={{ overflow: "visible" }}>
          {drawTool === 'bezier' ? (
            <path
              d="M4 18 C20 6 40 6 40 12 C40 18 60 18 76 6"
              stroke={drawColor}
              strokeWidth={drawThickness}
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <path
              d="M4 18 Q20 4 40 12 Q60 20 76 6"
              stroke={drawTool === 'highlighter' ? drawColor : "none"}
              strokeWidth={drawTool === 'highlighter' ? drawThickness * 3 : 0}
              strokeOpacity={0.35}
              strokeLinecap="round"
              fill={drawTool !== 'highlighter' ? drawColor : "none"}
            />
          )}
        </svg>
        <span className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>Preview</span>
      </div>
      </>}

      {/* Undo / Clear */}
      <div className="flex flex-col gap-2 pt-1" style={{ borderTop: "1px solid var(--viewer-border-sub)" }}>
        <button
          onClick={() => undoStroke(docPath)}
          disabled={strokeCount === 0}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium"
          style={{
            background: "var(--viewer-elevated)",
            border: "1px solid var(--viewer-border)",
            color: strokeCount === 0 ? "var(--viewer-text-muted)" : "var(--viewer-text)",
            opacity: strokeCount === 0 ? 0.5 : 1,
            cursor: strokeCount === 0 ? "not-allowed" : "pointer",
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Undo Last Stroke
          <span className="opacity-50">⌘Z</span>
        </button>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            disabled={strokeCount === 0}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium"
            style={{
              background: "var(--viewer-elevated)",
              border: "1px solid var(--viewer-border)",
              color: strokeCount === 0 ? "var(--viewer-text-muted)" : "#ef4444",
              opacity: strokeCount === 0 ? 0.5 : 1,
              cursor: strokeCount === 0 ? "not-allowed" : "pointer",
            }}
          >
            Clear All ({strokeCount})
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setConfirmClear(false)} className="flex-1 py-2 rounded-lg text-xs"
              style={{ background: "var(--viewer-elevated)", border: "1px solid var(--viewer-border)", color: "var(--viewer-text-sec)" }}>
              Cancel
            </button>
            <button onClick={() => { clearStrokes(docPath); setConfirmClear(false); }}
              className="flex-1 py-2 rounded-lg text-xs font-semibold"
              style={{ background: "#ef4444", border: "1px solid #dc2626", color: "#fff" }}>
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* ── Add Page ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 pt-1" style={{ borderTop: "1px solid var(--viewer-border-sub)" }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--viewer-text-muted)" }}>
          Add Note Page
        </span>
        <p className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>
          Appends a blank writing page at the end. Use the <strong>+</strong> buttons between pages to insert at a specific position.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleAddPage(tmpl.id)}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-colors"
              style={{
                background: "var(--viewer-elevated)",
                border: "1px solid var(--viewer-border)",
                color: "var(--viewer-text-sec)",
              }}
            >
              <span className="text-base leading-none">{tmpl.preview}</span>
              <span>{tmpl.label}</span>
            </button>
          ))}
        </div>

        {/* List of inserted virtual pages */}
        {virtualPages.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>Inserted pages ({virtualPages.length})</span>
            {virtualPages.map((vp) => (
              <div
                key={vp.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
                style={{ background: "var(--viewer-elevated)", border: "1px solid var(--viewer-border-sub)" }}
              >
                <span className="flex-1 capitalize" style={{ color: "var(--viewer-text-sec)" }}>
                  {vp.template} page
                  {vp.afterRealPage === 0 ? ' (before start)' :
                   vp.afterRealPage >= 9999 ? ' (after end)' :
                   ` (after p.${vp.afterRealPage})`}
                </span>
                <button
                  onClick={() => removeVirtualPage(docPath, vp.id)}
                  className="shrink-0"
                  title="Remove this page"
                  style={{ color: "#ef4444" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>
        Annotations are local only. PDF export planned for a future update.
      </p>
    </div>
  );
}
