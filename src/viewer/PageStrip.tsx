import { Fragment } from "react";

interface PageStripProps {
  pageCount: number;
  thumbnails: Record<number, string>;
  currentPage: number;
  onPageSelect: (page: number) => void;
  selectionMode?: boolean;
  selectedPages?: Set<number>;
  onPageToggle?: (page: number) => void;
  splitAfter?: number;
  onSplitAfterChange?: (page: number) => void;
}

export function PageStrip({
  pageCount,
  thumbnails,
  currentPage,
  onPageSelect,
  selectionMode = false,
  selectedPages,
  onPageToggle,
  splitAfter,
  onSplitAfterChange,
}: PageStripProps) {
  if (pageCount === 0) return null;

  const isSplitMode = onSplitAfterChange !== undefined;

  return (
    <div
      className="w-32.5 shrink-0 overflow-y-auto"
      style={{
        background: "var(--viewer-bg)",
        borderRight: "1px solid var(--viewer-border)",
      }}
    >
      <div className="p-2 space-y-1.5">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => {
          const isSelected = selectionMode && !isSplitMode && (selectedPages?.has(page) ?? false);
          const isActive = !selectionMode && !isSplitMode && page === currentPage;
          const isSplitPoint = isSplitMode && splitAfter === page;

          function handleClick() {
            if (isSplitMode) {
              onSplitAfterChange!(page);
            } else if (selectionMode && onPageToggle) {
              onPageToggle(page);
            } else {
              onPageSelect(page);
            }
          }

          return (
            <Fragment key={page}>
              <button
                onClick={handleClick}
                className="w-full rounded-lg overflow-hidden border-2 transition-colors block relative"
                title={isSplitMode ? `Split after page ${page}` : undefined}
                style={{
                  borderColor: isSelected
                    ? "var(--v-bad-border, #ef4444)"
                    : isActive || isSplitPoint
                    ? "var(--action)"
                    : "transparent",
                  cursor: isSplitMode ? "pointer" : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isActive && !isSplitPoint)
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--viewer-border)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isActive && !isSplitPoint)
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
                }}
              >
                <div
                  className="aspect-3/4 flex items-center justify-center relative"
                  style={{ background: "var(--viewer-elevated)" }}
                >
                  {thumbnails[page] ? (
                    <img
                      src={thumbnails[page]}
                      alt={`Page ${page}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <svg
                      className="w-5 h-5"
                      style={{ color: "var(--viewer-text-muted)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}

                  {/* Remove-pages overlay */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(239, 68, 68, 0.35)" }}
                    >
                      <svg className="w-6 h-6 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
                <div
                  className="text-center py-0.5 text-xs"
                  style={{
                    color: isSelected
                      ? "var(--v-bad-text, #ef4444)"
                      : isActive || isSplitPoint
                      ? "var(--action)"
                      : "var(--viewer-text-muted)",
                  }}
                >
                  {page}
                </div>
              </button>

              {/* Split divider — rendered after page N when splitAfter === N */}
              {isSplitMode && splitAfter === page && page < pageCount && (
                <div
                  className="relative flex items-center gap-1.5 py-0.5 mx-0.5"
                  style={{ color: "var(--action)" }}
                >
                  <div className="flex-1 h-px" style={{ background: "var(--action)" }} />
                  <svg
                    className="w-3 h-3 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* scissors icon */}
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <line x1="20" y1="4" x2="8.12" y2="15.88" />
                    <line x1="14.47" y1="14.48" x2="20" y2="20" />
                    <line x1="8.12" y1="8.12" x2="12" y2="12" />
                  </svg>
                  <div className="flex-1 h-px" style={{ background: "var(--action)" }} />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
