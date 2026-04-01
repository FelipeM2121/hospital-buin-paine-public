import { useState } from "react";
import { COLORS } from "../../constants/theme";
import { SectionTitle } from "../Shared/SectionTitle";
import { Icons } from "../../constants/icons";
import { PdfViewer } from "../PdfViewer";
import { productosCatalogo, certificadosCatalogo, type ProductoCatalogo } from "../../data/catalogo";

const BASE = import.meta.env.BASE_URL;

// Todos los archivos del catálogo (productos + certificados)
const ALL_FILES: { code: string; name: string; file: string; categoria: string }[] = [
  ...productosCatalogo.map(p => ({ code: p.codigo, name: p.nombre, file: p.archivo, categoria: p.categoria })),
  ...certificadosCatalogo.map(c => ({ code: c.codigo, name: c.nombre, file: c.archivo, categoria: c.categoria })),
];

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function CatalogoTab() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = ALL_FILES.filter(f =>
    normalize(f.name).includes(normalize(search)) ||
    normalize(f.code).includes(normalize(search)) ||
    normalize(f.categoria).includes(normalize(search))
  );

  const selectedFile = ALL_FILES.find(f => f.file === selected);

  return (
    <>
      <SectionTitle count={`${ALL_FILES.length}`} icon={Icons.document}>
        Catálogo Melman — Mobiliario No Clínico
      </SectionTitle>

      {/* Barra de búsqueda + chips */}
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
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "0 14px", borderRight: `1px solid ${COLORS.border}`,
          flexShrink: 0, height: "100%",
        }}>
          <span style={{ fontSize: 14, color: COLORS.textMuted }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar producto o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: 160, padding: 0, border: "none", outline: "none",
              fontSize: 13, color: COLORS.text, background: "transparent",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.textMuted, fontSize: 16, lineHeight: 1, padding: 0 }}
            >✕</button>
          )}
        </div>

        <div style={{
          display: "flex", gap: 6, alignItems: "center",
          overflowX: "auto", padding: "0 12px", flex: 1, height: "100%",
          scrollbarWidth: "none",
        }}>
          {filtered.length === 0
            ? <span style={{ fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap" }}>Sin resultados para "{search}"</span>
            : filtered.map(f => (
              <button
                key={f.file}
                onClick={() => { setSelected(f.file); setSearch(""); }}
                style={{
                  padding: "4px 11px", borderRadius: 20, flexShrink: 0,
                  border: `1px solid ${selected === f.file ? COLORS.primary : COLORS.border}`,
                  background: selected === f.file ? COLORS.primary : COLORS.bg,
                  color: selected === f.file ? COLORS.white : COLORS.text,
                  fontSize: 12, fontWeight: selected === f.file ? 600 : 400,
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

      {/* Visor PDF */}
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
        {selected ? (
          <>
            <div style={{
              padding: "11px 16px",
              borderBottom: `1px solid ${COLORS.border}`,
              background: COLORS.bg,
              fontSize: 13, fontWeight: 600, color: COLORS.text,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.primary }}>
                {selectedFile?.code}
              </span>
              <span style={{ color: COLORS.textMuted }}>—</span>
              {selectedFile?.name}
            </div>
            <PdfViewer key={selected} url={`${BASE}catalogo/separado/${encodeURIComponent(selected)}`} />
          </>
        ) : (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: COLORS.textMuted, gap: 12, minHeight: 500,
          }}>
            <div style={{ fontSize: 48 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>Selecciona un producto</div>
            <div style={{ fontSize: 13 }}>Busca por nombre o código y haz clic en el chip para ver la ficha</div>
          </div>
        )}
      </div>
    </>
  );
}
