import { useState, useMemo } from "react";
import { COLORS } from "../../constants/theme";
import { SectionTitle } from "../Shared/SectionTitle";
import { Breadcrumbs, type BreadcrumbItem } from "../Shared/Breadcrumbs";
import { Icons } from "../../constants/icons";
import { PdfViewer } from "../PdfViewer";
import {
  productosCatalogo,
  certificadosCatalogo,
  productosPortada,
  todosLosProductos,
  buscarProducto,
  type ProductoCatalogo,
} from "../../data/catalogo";

const BASE = import.meta.env.BASE_URL;

// Categorías en orden estable: primero mobiliario, luego certificados, luego índice —
// derivadas de los datos en vez de mantener una lista aparte que se puede desincronizar.
const CATEGORIAS: string[] = (() => {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const p of [...productosCatalogo, ...certificadosCatalogo, ...productosPortada]) {
    if (!seen.has(p.categoria)) {
      seen.add(p.categoria);
      ordered.push(p.categoria);
    }
  }
  return ordered;
})();

function categoryIcon(categoria: string) {
  if (categoria.startsWith("Certificados")) return Icons.tag;
  if (categoria === "Índice") return Icons.document;
  return Icons.folder;
}

export function CatalogoTab() {
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductoCatalogo | null>(null);

  const searching = search.trim().length > 0;
  const resultados = useMemo(() => (searching ? buscarProducto(search) : []), [search, searching]);

  const productosDeCategoria = useMemo(
    () => (categoria ? todosLosProductos.filter((p) => p.categoria === categoria) : []),
    [categoria]
  );

  const goToRoot = () => {
    setCategoria(null);
    setSelected(null);
    setSearch("");
  };
  const goToCategoria = (cat: string) => {
    setCategoria(cat);
    setSelected(null);
    setSearch("");
  };

  const crumbs: BreadcrumbItem[] = [{ label: "Catálogo", onClick: goToRoot }];
  if (categoria) crumbs.push({ label: categoria, onClick: () => goToCategoria(categoria) });
  if (selected) crumbs.push({ label: `${selected.codigo} — ${selected.nombre}` });

  return (
    <>
      <SectionTitle count={todosLosProductos.length} icon={Icons.catalog}>
        Catálogo Melman — Mobiliario No Clínico
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
            placeholder="Buscar en todo el catálogo por nombre, código o categoría..."
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
          <ProductoViewer producto={selected} onVolver={() => setSelected(null)} />
        ) : searching ? (
          <ProductoGrid
            title={`Resultados para "${search}"`}
            productos={resultados}
            onSelect={(p) => {
              setCategoria(p.categoria);
              setSelected(p);
            }}
          />
        ) : categoria ? (
          <ProductoGrid title={categoria} productos={productosDeCategoria} onSelect={setSelected} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {CATEGORIAS.map((cat) => {
              const count = todosLosProductos.filter((p) => p.categoria === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => goToCategoria(cat)}
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
                    <div style={{ width: 18, height: 18 }}>{categoryIcon(cat)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{cat}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                      {count} {count === 1 ? "elemento" : "elementos"}
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

function ProductoGrid({
  title,
  productos,
  onSelect,
}: {
  title: string;
  productos: ProductoCatalogo[];
  onSelect: (p: ProductoCatalogo) => void;
}) {
  if (productos.length === 0) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
        Sin resultados en "{title}".
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
        {title} ({productos.length})
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {productos.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
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
            <span style={{ fontFamily: "monospace", fontSize: 10, color: COLORS.primary, opacity: 0.8 }}>{p.codigo}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, lineHeight: 1.3 }}>{p.nombre}</span>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>{p.categoria}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductoViewer({ producto, onVolver }: { producto: ProductoCatalogo; onVolver: () => void }) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 700,
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
          <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.primary, marginRight: 8 }}>
            {producto.codigo}
          </span>
          {producto.nombre}
        </span>
        <button
          onClick={onVolver}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.primary,
          }}
        >
          ← Volver
        </button>
      </div>
      <PdfViewer key={producto.id} url={`${BASE}catalogo/separado/${encodeURIComponent(producto.archivo)}`} />
    </div>
  );
}
