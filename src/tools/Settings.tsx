import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UI } from "../lib/tokens";
import { isAndroid } from "../lib/androidFileUtils";
import { AppearanceSection } from "./settings/AppearanceSection";
import { FilesSection } from "./settings/FilesSection";
import { SessionSection } from "./settings/SessionSection";
import { UpdatesSection } from "./settings/UpdatesSection";
import { AboutSection } from "./settings/AboutSection";

type SectionId = "appearance" | "files" | "session" | "updates" | "about";

interface SectionDef {
  id: SectionId;
  label: string;
  render: () => React.ReactNode;
}

export default function Settings() {
  const navigate = useNavigate();
  const [active, setActive] = useState<SectionId>("appearance");

  const sections: SectionDef[] = [
    { id: "appearance", label: "Appearance", render: () => <AppearanceSection /> },
    { id: "files", label: "Files", render: () => <FilesSection /> },
    { id: "session", label: "Session", render: () => <SessionSection /> },
    ...(isAndroid()
      ? []
      : [{ id: "updates" as const, label: "Updates", render: () => <UpdatesSection /> }]),
    { id: "about", label: "About", render: () => <AboutSection /> },
  ];

  const current = sections.find((s) => s.id === active) ?? sections[0]!;

  return (
    <div className="flex h-[100dvh]" style={{ fontFamily: UI, background: "var(--bg)" }}>
      <aside className="w-56 shrink-0 flex flex-col" style={{ borderRight: "1px solid var(--line2)" }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--line2)" }}>
          <button
            onClick={() => navigate(-1)}
            className="text-sm px-2 py-1 rounded"
            style={{ color: "var(--fg1)" }}
            aria-label="Back"
          >
            ←
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--fg0)" }}>Settings</span>
        </div>
        <nav className="flex flex-col gap-px p-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              aria-current={active === s.id ? "page" : undefined}
              className="text-left text-sm px-3 py-2 rounded"
              style={{
                color: active === s.id ? "var(--fg0)" : "var(--fg1)",
                background: active === s.id ? "var(--bg2)" : "transparent",
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">{current.render()}</div>
      </main>
    </div>
  );
}
