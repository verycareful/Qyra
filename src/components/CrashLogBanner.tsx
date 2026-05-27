import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { UI, MONO } from "../lib/tokens";

interface CrashLog {
  path: string;
  filename: string;
  bytes: number;
  modifiedSecs: number;
  preview: string;
}

const REPO_ISSUES = "https://github.com/zParik/Qyra/issues/new";

export function CrashLogBanner() {
  const [logs, setLogs] = useState<CrashLog[]>([]);
  const [open, setOpen] = useState(false);

  async function reload() {
    try {
      const data = await invoke<CrashLog[]>("list_crash_logs");
      setLogs(data);
    } catch {
      setLogs([]);
    }
  }

  useEffect(() => { reload(); }, []);

  if (logs.length === 0) return null;
  const newest = logs[0]!;

  async function dismissAll() {
    await invoke("dismiss_all_crash_logs").catch(() => null);
    setLogs([]);
    setOpen(false);
  }

  async function dismissOne(path: string) {
    await invoke("dismiss_crash_log", { path }).catch(() => null);
    setLogs((arr) => arr.filter((l) => l.path !== path));
  }

  function report() {
    const body = encodeURIComponent(`Auto-generated from crash log.\n\nFile: ${newest.filename}\n\n\`\`\`\n${newest.preview}\n\`\`\``);
    const title = encodeURIComponent(`Crash: ${newest.filename}`);
    openUrl(`${REPO_ISSUES}?title=${title}&body=${body}`).catch(console.error);
  }

  return (
    <div
      style={{
        position: "fixed", bottom: 16, left: 16, zIndex: 9999,
        maxWidth: 380, borderRadius: 8,
        background: "var(--bg1)", border: "1px solid var(--v-bad-border, var(--line))",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        fontFamily: UI,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "var(--v-bad-text, #e07070)",
        }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg0)", flex: 1 }}>
          {logs.length} unread crash log{logs.length === 1 ? "" : "s"}
        </span>
        <button onClick={() => setOpen((o) => !o)}
          style={chipBtn}>{open ? "Hide" : "View"}</button>
        <button onClick={dismissAll} style={chipBtn}>Dismiss all</button>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid var(--line2)", maxHeight: 260, overflowY: "auto" }}>
          {logs.map((log) => (
            <div key={log.path} style={{ padding: "8px 12px", borderBottom: "1px solid var(--line2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--fg2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.filename}
                </span>
                <button onClick={report} style={chipBtn}>Report on GitHub</button>
                <button onClick={() => dismissOne(log.path)} style={chipBtn}>×</button>
              </div>
              <pre
                style={{
                  margin: "6px 0 0",
                  padding: 8,
                  background: "var(--bg2)", border: "1px solid var(--line)",
                  borderRadius: 4,
                  fontFamily: MONO, fontSize: 10.5,
                  whiteSpace: "pre-wrap",
                  maxHeight: 160, overflow: "auto",
                  color: "var(--fg1)",
                }}
              >{log.preview}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const chipBtn: React.CSSProperties = {
  padding: "2px 8px",
  background: "transparent",
  color: "var(--fg1)",
  border: "1px solid var(--line)",
  borderRadius: 4,
  fontSize: 10.5,
  cursor: "pointer",
};
