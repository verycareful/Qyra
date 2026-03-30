import { useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { DropZone } from "../components/DropZone";
import { PageGrid } from "../components/PageGrid";
import { useAppStore } from "../store/useAppStore";
import { usePdfCommand } from "../hooks/usePdfCommand";
import { mergePdfs, showSaveDialog } from "../lib/tauri";

export default function Merge() {
  const { files, removeFile, reorderFiles, clearFiles, isProcessing, reset } = useAppStore();

  useEffect(() => {
    clearFiles();
    reset();
  }, []);
  const { run } = usePdfCommand();

  async function handleMerge() {
    if (files.length < 2) return;
    const savePath = await showSaveDialog("merged.pdf");
    if (!savePath) return; // user cancelled
    await run(() => mergePdfs(files.map((f) => f.path), savePath));
  }

  return (
    <ToolLayout title="Merge PDFs" description="Combine multiple PDF files into one">
      <DropZone multiple label="Drop PDF files here or click to browse" />

      {files.length > 0 && (
        <>
          <PageGrid
            files={files}
            onRemove={removeFile}
            onReorder={reorderFiles}
          />
          <button
            onClick={clearFiles}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear all
          </button>
        </>
      )}

      {files.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <button
            disabled={files.length < 2 || isProcessing}
            onClick={handleMerge}
            className="btn-primary w-full"
          >
            Merge {files.length} PDF{files.length !== 1 ? "s" : ""}
          </button>
          {files.length < 2 && (
            <p className="text-xs text-gray-400 text-center">Add at least 2 files to merge</p>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
