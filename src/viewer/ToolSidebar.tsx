import { useEffect } from "react";
import { LoadedFile } from "../store/useAppStore";
import { RotatePanel } from "./tools/RotatePanel";
import { RemovePanel } from "./tools/RemovePanel";
import { ReorderPanel } from "./tools/ReorderPanel";
import { SplitPanel } from "./tools/SplitPanel";
import { CompressPanel } from "./tools/CompressPanel";
import { PageNumbersPanel } from "./tools/PageNumbersPanel";
import { ProtectPanel } from "./tools/ProtectPanel";
import { UnlockPanel } from "./tools/UnlockPanel";
import { MetadataPanel } from "./tools/MetadataPanel";
import { ExportImagesPanel } from "./tools/ExportImagesPanel";
import { triggerPrint } from "./tools/PrintPanel";
import { DrawPanel } from "./tools/DrawPanel";

export type ViewerTool =
  | "rotate" | "remove" | "reorder" | "split"
  | "compress" | "page-numbers" | "protect" | "unlock"
  | "metadata" | "export-images" | "draw";

interface ToolSidebarProps {
  file: LoadedFile;
  onApplied: (path: string) => void;
  activeTool: ViewerTool | null;
  onToolChange: (tool: ViewerTool | null) => void;
  selectedPages: Set<number>;
  onSelectedPagesChange: (pages: Set<number>) => void;
  splitAfter: number;
  onSplitAfterChange: (n: number) => void;
}

interface ToolDef { id: ViewerTool; label: string; icon: React.ReactNode }

const PAGE_TOOLS: ToolDef[] = [
  {
    id: "draw",
    label: "Draw & Annotate",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    id: "rotate",
    label: "Rotate Pages",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    id: "remove",
    label: "Remove Pages",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  {
    id: "reorder",
    label: "Reorder Pages",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    id: "split",
    label: "Split PDF",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    id: "page-numbers",
    label: "Page Numbers",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ),
  },
];

const FILE_TOOLS: ToolDef[] = [
  {
    id: "compress",
    label: "Compress",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
      </svg>
    ),
  },
  {
    id: "protect",
    label: "Password Protect",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    id: "unlock",
    label: "Unlock PDF",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "metadata",
    label: "Edit Metadata",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: "export-images",
    label: "Export to Images",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const ALL_TOOLS = [...PAGE_TOOLS, ...FILE_TOOLS];

export function ToolSidebar({ file, onApplied, activeTool, onToolChange, selectedPages, onSelectedPagesChange, splitAfter, onSplitAfterChange }: ToolSidebarProps) {
  const setActiveTool = onToolChange;

  // Close panel on Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && activeTool) setActiveTool(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTool]);

  const panels: Record<ViewerTool, React.ReactNode> = {
    rotate: <RotatePanel file={file} onApplied={onApplied} />,
    remove: <RemovePanel file={file} onApplied={onApplied} selectedPages={selectedPages} onSelectedPagesChange={onSelectedPagesChange} />,
    reorder: <ReorderPanel file={file} onApplied={onApplied} />,
    split: <SplitPanel file={file} splitAfter={splitAfter} onSplitAfterChange={onSplitAfterChange} />,
    compress: <CompressPanel file={file} onApplied={onApplied} />,
    "page-numbers": <PageNumbersPanel file={file} onApplied={onApplied} />,
    protect: <ProtectPanel file={file} onApplied={onApplied} />,
    unlock: <UnlockPanel file={file} onApplied={onApplied} />,
    metadata: <MetadataPanel file={file} onApplied={onApplied} />,
    "export-images": <ExportImagesPanel file={file} />,
    draw: <DrawPanel />,
  };

  return (
    <div
      className="w-72 h-full shrink-0 flex flex-col overflow-hidden"
      style={{
        background: "var(--viewer-surface)",
        borderLeft: "1px solid var(--viewer-border)",
      }}
    >
      {activeTool ? (
        <>
          {/* Panel header */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 shrink-0"
            style={{ borderBottom: "1px solid var(--viewer-border)" }}
          >
            <button
              onClick={() => setActiveTool(null)}
              className="v-icon-btn p-1 rounded shrink-0"
              title="Back to tools (Esc)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
              {ALL_TOOLS.find((t) => t.id === activeTool)?.label}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {panels[activeTool]}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ToolGroup label="Pages" tools={PAGE_TOOLS} onSelect={setActiveTool} />
          <ToolGroup label="File" tools={FILE_TOOLS} onSelect={setActiveTool} />
          {/* Print — direct action, no panel */}
          <div style={{ borderTop: "1px solid var(--viewer-border-sub)" }}>
            <p
              className="px-4 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--viewer-text-muted)" }}
            >
              Actions
            </p>
            <button
              onClick={() => triggerPrint(file.path)}
              className="v-row-btn w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm"
            >
              <span className="v-row-icon shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </span>
              <span className="flex-1">Print</span>
              <span className="text-xs" style={{ color: "var(--viewer-text-muted)" }}>Ctrl+P</span>
            </button>
            <div className="pb-1" />
          </div>
        </div>
      )}
    </div>
  );
}

function ToolGroup({
  label,
  tools,
  onSelect,
  isLast = false,
}: {
  label: string;
  tools: ToolDef[];
  onSelect: (id: ViewerTool) => void;
  isLast?: boolean;
}) {
  return (
    <div style={!isLast ? { borderBottom: "1px solid var(--viewer-border-sub)" } : {}}>
      <p
        className="px-4 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--viewer-text-muted)" }}
      >
        {label}
      </p>
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onSelect(tool.id)}
          className="v-row-btn w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm"
        >
          <span className="v-row-icon shrink-0">
            {tool.icon}
          </span>
          <span className="flex-1">{tool.label}</span>
          <svg
            className="v-row-chevron w-3.5 h-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
      <div className="pb-1" />
    </div>
  );
}
