export function DrawPanel() {
  return (
    <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--viewer-text)" }}>
      <p>
        <strong>Freeform View Mode</strong> is active. 
      </p>
      <p style={{ color: "var(--viewer-text-sec)", fontSize: "0.8rem" }}>
        Use your stylus, pen, or mouse to draw directly onto any page. Your notes are stored locally and bound to this document. Palm rejection is automatically handled.
      </p>
      <div 
        className="flex items-center gap-3 p-3 mt-2 rounded-lg"
        style={{ background: "color-mix(in oklch, var(--brand) 15%, transparent)", border: "1px solid color-mix(in oklch, var(--brand) 30%, transparent)" }}
      >
        <div className="w-4 h-4 rounded-full" style={{ background: "#ef4444" }} />
        <span>Red Pen (Pressure Sensitive)</span>
      </div>
      <p style={{ color: "var(--viewer-text-muted)", fontSize: "0.75rem", marginTop: "1rem" }}>
        Note: Exporting annotations to the original PDF will be supported in Phase 5.
      </p>
    </div>
  );
}
