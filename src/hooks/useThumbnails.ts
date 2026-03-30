import { useState, useEffect, useRef } from "react";
import { renderPage } from "./usePageThumbnails";

/** Renders page 1 of each PDF path as a thumbnail data URL using PDF.js. */
export function useThumbnails(paths: string[]) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    async function loadAll() {
      for (const path of paths) {
        if (!activeRef.current) break;
        try {
          const dataUrl = await renderPage(path, 1, 0.3);
          if (activeRef.current) {
            setThumbnails((prev) => ({ ...prev, [path]: dataUrl }));
          }
        } catch {
          // show placeholder on error
        }
      }
    }

    loadAll();
    return () => { activeRef.current = false; };
  }, [paths.join(",")]);

  return thumbnails;
}
