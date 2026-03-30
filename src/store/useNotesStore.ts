import { create } from "zustand";

export type Point = [x: number, y: number, pressure: number];

export interface Stroke {
  id: string;
  pageIndex: number;
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  baseThickness: number;
  points: Point[];
}

interface NotesState {
  strokes: Record<string, Stroke[]>; // mapped by document path
  addStroke: (docPath: string, stroke: Stroke) => void;
  removeStroke: (docPath: string, strokeId: string) => void;
  clearStrokes: (docPath: string) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  strokes: {},
  addStroke: (docPath, stroke) => 
    set((state) => ({
      strokes: {
        ...state.strokes,
        [docPath]: [...(state.strokes[docPath] || []), stroke],
      }
    })),
  removeStroke: (docPath, strokeId) =>
    set((state) => ({
      strokes: {
        ...state.strokes,
        [docPath]: (state.strokes[docPath] || []).filter(s => s.id !== strokeId),
      }
    })),
  clearStrokes: (docPath) =>
    set((state) => {
      const newStrokes = { ...state.strokes };
      delete newStrokes[docPath];
      return { strokes: newStrokes };
    }),
}));
