import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import Home from "./tools/Home";
import Merge from "./tools/Merge";
import ImagesToPdf from "./tools/ImagesToPdf";
import Viewer from "./viewer/Viewer";

export default function App() {
  const clearFiles = useAppStore((s) => s.clearFiles);
  const reset = useAppStore((s) => s.reset);

  useEffect(() => {
    return () => {
      clearFiles();
      reset();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/view" element={<Viewer />} />
        <Route path="/merge" element={<Merge />} />
        <Route path="/images-to-pdf" element={<ImagesToPdf />} />
      </Routes>
    </BrowserRouter>
  );
}
