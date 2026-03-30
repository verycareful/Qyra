import React, { useEffect, useRef, useState } from "react";
import { useNotesStore, Stroke, Point } from "../store/useNotesStore";
import { getStroke } from "perfect-freehand";

// perfect-freehand generates a polygon. We need to convert it to SVG path data.
export function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
}

interface DrawingCanvasProps {
  pageIndex: number;
  docPath: string;
  isDrawingMode: boolean;
  zoom: number;
}

export function DrawingCanvas({ pageIndex, docPath, isDrawingMode, zoom }: DrawingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
  const addStroke = useNotesStore((s) => s.addStroke);
  const strokes = useNotesStore((s) => s.strokes[docPath] || []).filter(s => s.pageIndex === pageIndex);

  function handlePointerDown(e: React.PointerEvent) {
    if (!isDrawingMode) return;
    // For palm rejection, we only accept pens (or mouse for testing).
    // In production, we might want to be strict `e.pointerType === "pen"`, but we'll accept mouse so developers can test.
    if (e.pointerType === "touch") return; 
    
    e.target.dispatchEvent(new Event('set-pointer-capture'));
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    const rect = containerRef.current!.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;

    // e.pressure is often 0 for mouse or non-pressure tablets. We can fake a minimum 0.5.
    const pressure = e.pointerType === 'pen' ? e.pressure : 0.5;
    setCurrentStroke([[rx, ry, pressure]]);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDrawingMode || !currentStroke) return;
    if (e.pointerType === "touch") return; // Let touch scroll the page
    
    const rect = containerRef.current!.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;

    const pressure = e.pointerType === 'pen' ? e.pressure : 0.5;
    setCurrentStroke((prev) => [...(prev || []), [rx, ry, pressure]]);
  }

  function handlePointerUp(_e: React.PointerEvent) {
    if (!currentStroke) return;
    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      pageIndex,
      tool: 'pen',
      color: '#ef4444', // Red default ink
      baseThickness: 4,
      points: currentStroke
    };
    addStroke(docPath, newStroke);
    setCurrentStroke(null);
  }

  const [size, setSize] = useState({ w: 768, h: 1024 }); // initial fallback
  
  useEffect(() => {
    if (!containerRef.current) return;
    const ob = new ResizeObserver((entries) => {
      setSize({
        w: entries[0].contentRect.width,
        h: entries[0].contentRect.height
      });
    });
    ob.observe(containerRef.current);
    return () => ob.disconnect();
  }, []);

  const renderStroke = (pts: Point[], thickness: number, color: string) => {
    // Re-scale the relative points to the current physical pixel size of the page img
    const scaledPts = pts.map(p => [p[0] * size.w, p[1] * size.h, p[2]] as [number, number, number]);
    const outlineData = getStroke(scaledPts, {
      size: thickness * zoom,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: false, 
    });
    return <path d={getSvgPathFromStroke(outlineData)} fill={color} />;
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-10 ${isDrawingMode ? 'touch-none cursor-crosshair' : 'pointer-events-none'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ overflow: 'hidden' }}
    >
      <svg className="w-full h-full absolute inset-0 pointer-events-none">
        {strokes.map((s) => (
          <g key={s.id}>
             {renderStroke(s.points, s.baseThickness, s.color)}
          </g>
        ))}
        {currentStroke && (
          <g>
            {renderStroke(currentStroke, 4, '#ef4444')}
          </g>
        )}
      </svg>
    </div>
  );
}
