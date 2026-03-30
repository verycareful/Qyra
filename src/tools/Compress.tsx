import { ToolLayout } from "../components/ToolLayout";
import { DropZone } from "../components/DropZone";
import { useAppStore } from "../store/useAppStore";
import { usePdfCommand } from "../hooks/usePdfCommand";
import { compressPdf } from "../lib/tauri";

export default function Compress() {
  const { files, clearFiles, isProcessing } = useAppStore();
  const { run } = usePdfCommand();
  const file = files[0];

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  async function handleCompress() {
    if (!file) return;
    await run(() => compressPdf(file.path));
  }

  return (
    <ToolLayout title="Compress PDF" description="Reduce file size using lossless compression">
      {files.length === 0 ? (
        <DropZone multiple={false} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-gray-400">
                {file.info ? formatSize(file.info.file_size) : "Size unknown"} · {file.info?.page_count ?? "?"} pages
              </p>
            </div>
            <button onClick={clearFiles} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
          </div>

          <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            Uses lossless object stream compression. Typically reduces size by 11–61% depending on the PDF.
          </div>

          <button
            disabled={!file || isProcessing}
            onClick={handleCompress}
            className="btn-primary w-full"
          >
            Compress PDF
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
