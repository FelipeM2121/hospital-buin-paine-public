import { useState, useEffect, useMemo } from "react";
import { COLORS } from "../../constants/theme";
import { Icons } from "../../constants/icons";
import { SectionTitle } from "../Shared/SectionTitle";
import { Breadcrumbs, type BreadcrumbItem } from "../Shared/Breadcrumbs";
import { FAMILIAS, familiaPorCodigoEETT } from "../../data/familias";
import type { EETTFile } from "../../types";

interface EspecificacionesTecnicasTabProps {
  eettFiles: EETTFile[];
  pdfViewer: React.ComponentType<{ url: string; key: string }>;
}

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Normaliza un código consultado: "201001" → "201.001", "204006b" → "204.006b"
function normalizeCode(q: string): string {
  return q.replace(/^(\d{3})\.?(\d{3}[a-z]?)$/i, "$1.$2").toLowerCase();
}

export function EspecificacionesTecnicasTab({ eettFiles: EETT_FILES, pdfViewer: PdfViewer }: EspecificacionesTecnicasTabProps) {
  const [search, setSearch] = useState("");
  const [familia, setFamilia] = useState<string | null>(null);
  const [selected, setSelected] = useState<EETTFile | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Las 4 familias oficiales del inventario (Silla, Mobiliario, Otro, Mesa), solo las que tienen fichas.
  const familias = useMemo(
    () => FAMILIAS.filter((fam) => EETT_FILES.some((f) => familiaPorCodigoEETT(f.code) === fam)),
    [EETT_FILES]
  );

  const searching = search.trim().length > 0;
  const q = normalizeCode(search.trim());
  const resultados = useMemo(
    () =>
      searching
        ? EETT_FILES.filter((f) => normalize(f.name).includes(normalize(search)) || normalize(f.code).includes(q))
        : [],
    [EETT_FILES, search, searching, q]
  );

  const fichasDeFamilia = useMemo(
    () => (familia ? EETT_FILES.filter((f) => familiaPorCodigoEETT(f.code) === familia) : []),
    [EETT_FILES, familia]
  );

  const goToRoot = () => {
    setFamilia(null);
    setSelected(null);
    setSearch("");
  };
  const goToFamilia = (fam: string) => {
    setFamilia(fam);
    setSelected(null);
    setSearch("");
  };

  const crumbs: BreadcrumbItem[] = [{ label: "Esp. Técnicas", onClick: goToRoot }];
  if (familia) crumbs.push({ label: familia, onClick: () => goToFamilia(familia) });
  if (selected) crumbs.push({ label: `${selected.code} — ${selected.name}` });

  return (
    <>
      <SectionTitle count={EETT_FILES.length} icon={Icons.document}>
        Especificaciones Técnicas de Mobiliario
      </SectionTitle>

      <div
        style={{
          background: COLORS.white,
          borderRadius: 18,
          border: `1px solid ${COLORS.borderLight}`,
          boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
          padding: 16,
        }}
      >
        <Breadcrumbs items={crumbs} />

        <div style={{ position: "relative", marginBottom: 16 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: COLORS.textMuted,
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar en todas las fichas por nombre o código..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null);
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px 10px 34px",
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              outline: "none",
              fontSize: 13,
              color: COLORS.text,
            }}
          />
        </div>

        {selected ? (
          <FichaViewer ficha={selected} PdfViewer={PdfViewer} isMobile={isMobile} onVolver={() => setSelected(null)} />
        ) : searching ? (
          <FichaGrid
            title={`Resultados para "${search}"`}
            fichas={resultados}
            onSelect={(f) => {
              setFamilia(familiaPorCodigoEETT(f.code));
              setSelected(f);
            }}
          />
        ) : familia ? (
          <FichaGrid title={familia} fichas={fichasDeFamilia} onSelect={setSelected} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {familias.map((fam) => {
              const count = EETT_FILES.filter((f) => familiaPorCodigoEETT(f.code) === fam).length;
              return (
                <button
                  key={fam}
                  onClick={() => goToFamilia(fam)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "16px",
                    borderRadius: 14,
                    border: `1px solid ${COLORS.borderLight}`,
                    background: COLORS.bg,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = COLORS.primary)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.borderLight)}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ width: 18, height: 18 }}>{Icons.folder}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{fam}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                      {count} {count === 1 ? "ficha" : "fichas"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function FichaGrid({ title, fichas, onSelect }: { title: string; fichas: EETTFile[]; onSelect: (f: EETTFile) => void }) {
  if (fichas.length === 0) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
        Sin resultados en "{title}".
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: COLORS.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 10,
        }}
      >
        {title} ({fichas.length})
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {fichas.map((f) => (
          <button
            key={f.code}
            onClick={() => onSelect(f)}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${COLORS.borderLight}`,
              background: COLORS.white,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = COLORS.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.borderLight)}
          >
            <span style={{ fontFamily: "monospace", fontSize: 10, color: COLORS.primary, opacity: 0.8 }}>{f.code}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, lineHeight: 1.3 }}>{f.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FichaViewer({
  ficha,
  PdfViewer,
  isMobile,
  onVolver,
}: {
  ficha: EETTFile;
  PdfViewer: React.ComponentType<{ url: string; key: string }>;
  isMobile: boolean;
  onVolver: () => void;
}) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: isMobile ? 480 : 700,
      }}
    >
      <div
        style={{
          padding: "11px 16px",
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.bg,
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.primary, marginRight: 8 }}>{ficha.code}</span>
          {ficha.name}
        </span>
        <button
          onClick={onVolver}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: COLORS.primary }}
        >
          ← Volver
        </button>
      </div>
      <PdfViewer key={ficha.file} url={`${import.meta.env.BASE_URL}eett/${encodeURIComponent(ficha.file)}`} />
    </div>
  );
}
