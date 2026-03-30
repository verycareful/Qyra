import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { ProgressBar, Spinner } from "./ProgressBar";
import { FileResult } from "./FileResult";
import { ErrorBanner } from "./ErrorBanner";

interface ToolLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ToolLayout({ title, description, children }: ToolLayoutProps) {
  const navigate = useNavigate();
  const { isProcessing, progress, result, resultFiles, error, setError } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)", paddingBottom: "0.75rem" }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 sm:p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
            {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {children}

        {/* Processing state */}
        {isProcessing && (
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            {progress ? (
              <ProgressBar current={progress.current} total={progress.total} message={progress.message} />
            ) : (
              <Spinner />
            )}
          </div>
        )}

        {/* Error */}
        {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

        {/* Result */}
        {(result || resultFiles.length > 0) && !isProcessing && (
          <FileResult result={result} resultFiles={resultFiles} />
        )}
      </main>
    </div>
  );
}
