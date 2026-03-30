import { useState } from "react";
import { LoadedFile } from "../../store/useAppStore";
import { usePanelCommand } from "../usePanelCommand";
import { PanelOutput } from "../PanelOutput";
import { protectPdf } from "../../lib/tauri";

interface ProtectPanelProps {
  file: LoadedFile;
  onApplied: (path: string) => void;
}

export function ProtectPanel({ file, onApplied }: ProtectPanelProps) {
  const { isProcessing, result, error, run, clearError } = usePanelCommand(onApplied);
  const [userPassword, setUserPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [show, setShow] = useState(false);

  async function handle() {
    if (!userPassword) return;
    await run(() => protectPdf(file.path, userPassword, ownerPassword || undefined));
  }

  const eyeIcon = show ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs mb-1 block" style={{ color: "var(--viewer-text-muted)" }}>
          User password (required to open)
        </label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            className="v-input pr-9"
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="v-icon-btn absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded"
          >
            {eyeIcon}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs mb-1 block" style={{ color: "var(--viewer-text-muted)" }}>
          Owner password (optional)
        </label>
        <input
          type={show ? "text" : "password"}
          value={ownerPassword}
          onChange={(e) => setOwnerPassword(e.target.value)}
          className="v-input"
          placeholder="Leave blank to use user password"
        />
      </div>

      <button
        disabled={!userPassword || isProcessing}
        onClick={handle}
        className="v-btn-primary"
      >
        Protect PDF
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
