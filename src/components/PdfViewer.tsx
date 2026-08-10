import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { COLORS } from "../constants/theme";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const btnStyle: React.CSSProperties = {
  width: 32, height: 32, border: `1px solid ${COLORS.border}`, borderRadius: 6,
  background: COLORS.white, cursor: "pointer", fontSize: 16, fontWeight: 700,
  display: "flex", alignItems: "center", justifyContent: "center",
};

export function PdfViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [basePageWidth, setBasePageWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTasksRef = useRef<Map<number, pdfjsLib.RenderTask>>(new Map());

  const renderAllPages = useCallback(async (pdf: pdfjsLib.PDFDocumentProxy, sc: number) => {
    renderTasksRef.current.forEach(t => t.cancel());
    renderTasksRef.current.clear();
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: sc });
      const canvas = canvasRefs.current[i - 1];
      if (!canvas) continue;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      const task = page.render({ canvasContext: ctx, viewport });
      renderTasksRef.current.set(i, task);
      try { await task.promise; } catch { /* cancelado */ }
    }
  }, []);

  const calcFitScale = useCallback((pageWidth: number) => {
    const w = containerRef.current?.clientWidth ?? 900;
    return Math.max(0.3, (w - 24) / pageWidth);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNumPages(0);
    canvasRefs.current = [];
    pdfRef.current = null;
    renderTasksRef.current.forEach(t => t.cancel());
    renderTasksRef.current.clear();

    pdfjsLib.getDocument(url).promise
      .then(async (pdf) => {
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        const firstPage = await pdf.getPage(1);
        const baseVp = firstPage.getViewport({ scale: 1 });
        setBasePageWidth(baseVp.width);
        const autoScale = calcFitScale(baseVp.width);
        setScale(autoScale);
        setLoading(false);
        setTimeout(() => renderAllPages(pdf, autoScale), 60);
      })
      .catch(() => {
        setError("No se pudo cargar el PDF.");
        setLoading(false);
      });
  }, [url, renderAllPages, calcFitScale]);

  useEffect(() => {
    if (!containerRef.current || basePageWidth === 0) return;
    const ro = new ResizeObserver(() => {
      if (!pdfRef.current) return;
      const newScale = calcFitScale(basePageWidth);
      setScale(newScale);
      renderAllPages(pdfRef.current, newScale);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [basePageWidth, calcFitScale, renderAllPages]);

  const fitToWidth = useCallback(() => {
    if (!pdfRef.current || basePageWidth === 0) return;
    const ns = calcFitScale(basePageWidth);
    setScale(ns);
    renderAllPages(pdfRef.current, ns);
  }, [basePageWidth, calcFitScale, renderAllPages]);

  const zoom = useCallback((delta: number) => {
    setScale((prev) => {
      const next = Math.min(4, Math.max(0.3, parseFloat((prev + delta).toFixed(2))));
      if (pdfRef.current) renderAllPages(pdfRef.current, next);
      return next;
    });
  }, [renderAllPages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const cRect = container.getBoundingClientRect();
      canvasRefs.current.forEach((c, i) => {
        if (!c) return;
        const rect = c.getBoundingClientRect();
        if (rect.top <= cRect.top + cRect.height * 0.6 && rect.bottom >= cRect.top) {
          setCurrentPage(i + 1);
        }
      });
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [numPages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
        borderBottom: `1px solid ${COLORS.borderLight}`, background: COLORS.bg, flexShrink: 0,
      }}>
        <button onClick={() => zoom(-0.15)} style={btnStyle} title="Alejar">&minus;</button>
        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, minWidth: 48, textAlign: "center" }}>
          {Math.round(scale * 100)}%
        </span>
        <button onClick={() => zoom(0.15)} style={btnStyle} title="Acercar">+</button>
        <button onClick={fitToWidth} style={{ ...btnStyle, width: "auto", padding: "0 10px", fontSize: 12 }} title="Ajustar al ancho">&#x292E; Ajustar</button>
        <span style={{ flex: 1 }} />
        {numPages > 0 && (
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>Pág. {currentPage} / {numPages}</span>
        )}
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: COLORS.primary, fontWeight: 600, textDecoration: "none", padding: "4px 10px", border: `1px solid ${COLORS.primary}`, borderRadius: 6 }}>
          ↗ Nueva pestaña
        </a>
      </div>

      {/* Área de scroll */}
      <div ref={containerRef} style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        background: COLORS.sidebar, padding: "16px 12px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12, minHeight: 600,
      }}>
        {loading && <div style={{ color: COLORS.white, marginTop: 60, fontSize: 15 }}>Cargando PDF…</div>}
        {error && <div style={{ color: COLORS.redLight, marginTop: 60, fontSize: 15 }}>{error}</div>}
        {!loading && !error && Array.from({ length: numPages }).map((_, i) => (
          <canvas
            key={i}
            ref={(el) => { if (el) canvasRefs.current[i] = el; }}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.4)", background: COLORS.white, display: "block", maxWidth: "100%" }}
          />
        ))}
      </div>
    </div>
  );
}
