import { useState } from "react";
import { COLORS } from "../../constants/theme";
import { PdfViewer } from "../PdfViewer";
import { productosCatalogo, certificadosCatalogo } from "../../data/catalogo";

const BASE = import.meta.env.BASE_URL;

const ALL_FILES = [
  ...productosCatalogo.map(p => ({ code: p.codigo, name: p.nombre, file: p.archivo })),
  ...certificadosCatalogo.map(c => ({ code: c.codigo, name: c.nombre, file: c.archivo })),
];

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function ChatCatalogo() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = ALL_FILES.filter(f =>
    normalize(f.name).includes(normalize(search)) ||
    normalize(f.code).includes(normalize(search))
  );

  const selectedFile = ALL_FILES.find(f => f.file === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Barra búsqueda + chips */}
      <div style={{
        display: "flex", alignItems: "center",
        background: COLORS.white, borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        height: 44, overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "0 12px", borderRight: `1px solid ${COLORS.border}`,
          flexShrink: 0, height: "100%",
        }}>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: 130, padding: 0, border: "none", outline: "none",
              fontSize: 13, color: COLORS.text, background: "transparent",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.textMuted, fontSize: 14, padding: 0 }}>✕</button>
          )}
        </div>
        <div style={{
          display: "flex", gap: 5, alignItems: "center",
          overflowX: "auto", padding: "0 10px", flex: 1, height: "100%",
          scrollbarWidth: "none",
        }}>
          {filtered.length === 0
            ? <span style={{ fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap" }}>Sin resultados</span>
            : filtered.map(f => (
              <button
                key={f.file}
                onClick={() => { setSelected(f.file); setSearch(""); }}
                style={{
                  padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                  border: `1px solid ${selected === f.file ? COLORS.primary : COLORS.border}`,
                  background: selected === f.file ? COLORS.primary : COLORS.bg,
                  color: selected === f.file ? "#fff" : COLORS.text,
                  fontSize: 12, fontWeight: selected === f.file ? 600 : 400,
                  cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                }}
              >
                <span style={{ fontFamily: "monospace", fontSize: 10, opacity: 0.7, marginRight: 3 }}>{f.code}</span>
                {f.name}
              </button>
            ))
          }
        </div>
      </div>

      {/* Visor PDF */}
      <div style={{
        background: COLORS.white, borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        overflow: "hidden", minHeight: 400,
        display: "flex", flexDirection: "column",
      }}>
        {selected ? (
          <>
            <div style={{
              padding: "8px 14px", borderBottom: `1px solid ${COLORS.border}`,
              background: COLORS.bg, fontSize: 13, fontWeight: 600,
              color: COLORS.text, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.primary }}>{selectedFile?.code}</span>
              <span style={{ color: COLORS.textMuted }}>—</span>
              {selectedFile?.name}
            </div>
            <PdfViewer key={selected} url={`${BASE}catalogo/separado/${encodeURIComponent(selected)}`} />
          </>
        ) : (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: COLORS.textMuted, gap: 8, minHeight: 300,
          }}>
            <div style={{ fontSize: 36 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Selecciona un producto</div>
            <div style={{ fontSize: 12 }}>Busca por nombre o código y haz clic en el chip</div>
          </div>
        )}
      </div>
    </div>
  );
}
