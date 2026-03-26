import { useState } from "react";
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

  return (
    <>
      <SectionTitle count={`${EETT_FILES.length}`} icon={Icons.document}>Especificaciones Técnicas de Mobiliario</SectionTitle>

      {/* Barra de búsqueda + chips en una sola fila */}
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        height: 52,
      }}>
        {/* Input fijo a la izquierda */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "0 14px", borderRight: `1px solid ${COLORS.border}`,
          flexShrink: 0, height: "100%",
        }}>
          <span style={{ fontSize: 14, color: COLORS.textMuted }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar..."
            value={eettSearch}
            onChange={(e) => setEettSearch(e.target.value)}
            style={{
              width: 140, padding: "0", border: "none", outline: "none",
              fontSize: 13, color: COLORS.text, background: "transparent",
            }}
          />
          {eettSearch && (
            <button
              onClick={() => setEettSearch("")}
              style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.textMuted, fontSize: 16, lineHeight: 1, padding: 0 }}
            >✕</button>
          )}
        </div>

        {/* Chips desplazables horizontalmente */}
        <div style={{
          display: "flex", gap: 6, alignItems: "center",
          overflowX: "auto", padding: "0 12px", flex: 1, height: "100%",
          scrollbarWidth: "none",
        }}>
          {(() => {
            const q = normalizeCode(eettSearch.trim());
            const filtered = EETT_FILES.filter(f =>
              normalize(f.name).includes(normalize(eettSearch)) ||
              normalize(f.code).includes(q)
            );
            if (filtered.length === 0)
              return <span style={{ fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap" }}>Sin resultados para "{eettSearch}"</span>;
            return filtered.map((f) => (
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
            ));
          })()}
        </div>
      </div>

      {/* Visor PDF - ancho completo */}
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 700,
      }}>
        {selectedEETT ? (
          <>
            <div style={{
              padding: "11px 16px",
              borderBottom: `1px solid ${COLORS.border}`,
              background: COLORS.bg,
              fontSize: 13, fontWeight: 600, color: COLORS.text,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.primary }}>
                {EETT_FILES.find(f => f.file === selectedEETT)?.code}
              </span>
              <span style={{ color: COLORS.textMuted }}>-</span>
              {EETT_FILES.find(f => f.file === selectedEETT)?.name}
            </div>
            <PdfViewer key={selectedEETT} url={`${import.meta.env.BASE_URL}eett/${encodeURIComponent(selectedEETT)}`} />
          </>
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
