import { useState, useEffect } from "react";
import { COLORS } from "../../constants/theme";
import { Icons } from "../../constants/icons";
import { SectionTitle } from "../Shared/SectionTitle";
import type { EETTFile } from "../../types";

interface EETTFile {
  code: string;
  name: string;
  file: string;
}

interface EspecificacionesTecnicasTabProps {
  eettFiles: EETTFile[];
  pdfViewer: React.ComponentType<{ url: string; key: string }>;
}

// Utility function to normalize strings for search
function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Normalize a code query: "201001" → "201.001", "204006b" → "204.006b"
function normalizeCode(q: string): string {
  return q.replace(/^(\d{3})\.?(\d{3}[a-z]?)$/i, "$1.$2").toLowerCase();
}

export function EspecificacionesTecnicasTab({ eettFiles: EETT_FILES, pdfViewer: PdfViewer }: EspecificacionesTecnicasTabProps) {
  const [eettSearch, setEettSearch] = useState("");
  const [selectedEETT, setSelectedEETT] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const q = normalizeCode(eettSearch.trim());
  const filtered = EETT_FILES.filter(f =>
    normalize(f.name).includes(normalize(eettSearch)) ||
    normalize(f.code).includes(q)
  );

  return (
    <>
      <SectionTitle count={`${EETT_FILES.length}`} icon={Icons.document}>Especificaciones Técnicas de Mobiliario</SectionTitle>

      {/* Barra de búsqueda */}
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 12,
        overflow: "hidden",
      }}>
        {/* Input */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "0 14px", borderBottom: `1px solid ${COLORS.border}`,
          height: 48,
        }}>
          <span style={{ fontSize: 14, color: COLORS.textMuted, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={eettSearch}
            onChange={(e) => setEettSearch(e.target.value)}
            style={{
              flex: 1, padding: "0", border: "none", outline: "none",
              fontSize: 13, color: COLORS.text, background: "transparent",
              minWidth: 0,
            }}
          />
          {eettSearch && (
            <button
              onClick={() => setEettSearch("")}
              style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.textMuted, fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}
            >✕</button>
          )}
        </div>

        {/* Chips desplazables horizontalmente */}
        <div style={{
          display: "flex", gap: 6, alignItems: "center",
          overflowX: "auto", padding: "8px 12px",
          scrollbarWidth: "none",
        }}>
          {filtered.length === 0
            ? <span style={{ fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap" }}>Sin resultados para "{eettSearch}"</span>
            : filtered.map((f) => (
              <button
                key={f.code}
                onClick={() => { setSelectedEETT(f.file); setEettSearch(""); }}
                style={{
                  padding: "4px 11px", borderRadius: 20, flexShrink: 0,
                  border: `1px solid ${selectedEETT === f.file ? COLORS.primary : COLORS.border}`,
                  background: selectedEETT === f.file ? COLORS.primary : COLORS.bg,
                  color: selectedEETT === f.file ? COLORS.white : COLORS.text,
                  fontSize: 12, fontWeight: selectedEETT === f.file ? 600 : 400,
                  cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontFamily: "monospace", fontSize: 10, opacity: 0.7, marginRight: 4 }}>{f.code}</span>
                {f.name}
              </button>
            ))
          }
        </div>
      </div>

      {/* Nombre del equipo seleccionado */}
      {selectedEETT && (
        <div style={{
          background: COLORS.white,
          borderRadius: 14,
          border: `1px solid ${COLORS.borderLight}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          padding: "12px 16px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}>
          <span style={{ fontFamily: "monospace", fontSize: 12, color: COLORS.primary, fontWeight: 700, flexShrink: 0 }}>
            {EETT_FILES.find(f => f.file === selectedEETT)?.code}
          </span>
          <span style={{ color: COLORS.textMuted, flexShrink: 0 }}>—</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, wordBreak: "break-word" }}>
            {EETT_FILES.find(f => f.file === selectedEETT)?.name}
          </span>
        </div>
      )}

      {/* Visor PDF */}
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: isMobile ? 480 : 700,
      }}>
        {selectedEETT ? (
          <PdfViewer key={selectedEETT} url={`${import.meta.env.BASE_URL}eett/${encodeURIComponent(selectedEETT)}`} />
        ) : (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: COLORS.textMuted, gap: 12, minHeight: 500,
          }}>
            <div style={{ fontSize: 48 }}>📄</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>Selecciona una especificación</div>
            <div style={{ fontSize: 13 }}>Busca por nombre o código y haz clic en el chip para ver la ficha técnica</div>
          </div>
        )}
      </div>
    </>
  );
}
