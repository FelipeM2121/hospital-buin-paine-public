import { useState, useEffect, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COLORS, PIE_FAMILIA_COLORS } from "../../constants/theme";
import { SectionTitle } from "./SectionTitle";
import { Icons } from "../../constants/icons";

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function fmtDate(d: string | null): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${parseInt(day, 10)} ${MESES[parseInt(m, 10) - 1]} ${y}`;
}

interface InventoryItem {
  item: string;
  zona: string;
  servicio: string;
  familia: string;
  nombre: string;
  proveedor: string;
  cantidad: number;
  piso: number;
  recinto: string;
  tipoEquipo: string;
  nCNO: string;
  ordenCompra: string;
  entregaRecinto: string | null;
  inicioInstalacion: string | null;
  terminoInstalacion: string | null;
}

interface InventoryDataTableProps {
  data: InventoryItem[];
}

// Definición de columnas
const ALL_COLUMNS = [
  { key: "nombre",            label: "Nombre",           defaultVisible: true },
  { key: "familia",           label: "Familia",          defaultVisible: true },
  { key: "tipoEquipo",        label: "Tipo Equipo",      defaultVisible: true },
  { key: "cantidad",          label: "Cant.",            defaultVisible: true },
  { key: "piso",              label: "Piso",             defaultVisible: true },
  { key: "recinto",           label: "Recinto",          defaultVisible: true },
  { key: "proveedor",         label: "Proveedor",        defaultVisible: true },
  { key: "servicio",          label: "Servicio",         defaultVisible: true },
  { key: "zona",              label: "Zona",             defaultVisible: false },
  { key: "nCNO",              label: "N° CNO",           defaultVisible: true },
  { key: "ordenCompra",       label: "Orden de Compra",  defaultVisible: true },
  { key: "entregaRecinto",    label: "Plan Adquisición", defaultVisible: true },
  { key: "inicioInstalacion", label: "Inicio Inst.",     defaultVisible: true },
  { key: "terminoInstalacion",label: "Término Inst.",    defaultVisible: true },
] as const;

type ColKey = typeof ALL_COLUMNS[number]["key"];

export function InventoryDataTable({ data: initialData }: InventoryDataTableProps) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';
    fetch(`${base}cronograma-data.json`)
      .then(r => r.json())
      .then(raw => setData(raw.map((item: any) => ({
        item: item.id,
        zona: item.zonificacion,
        servicio: item.servicioClinico,
        familia: item.familia,
        nombre: item.nombre,
        proveedor: item.proveedor,
        cantidad: item.cantidad,
        piso: item.piso,
        recinto: item.codigoRecinto || item.recinto || '',
        tipoEquipo: item.tipoEquipo || '',
        nCNO: item.nCNO || '',
        ordenCompra: item.ordenCompra || '',
        entregaRecinto: item.entregaRecinto || null,
        inicioInstalacion: item.inicioInstalacion || null,
        terminoInstalacion: item.terminoInstalacion || null,
      }))))
      .catch(() => {/* mantener initialData si falla */});
  }, []);

  const [filters, setFilters] = useState({
    zona: "",
    familia: "",
    proveedor: "",
    piso: "",
    servicio: "",
    nCNO: "",
    ordenCompra: "",
    search: "",
    fechaDesde: "",
    fechaHasta: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Visibilidad de columnas
  const defaultVisible = Object.fromEntries(ALL_COLUMNS.map(c => [c.key, c.defaultVisible])) as Record<ColKey, boolean>;
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>(defaultVisible);
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setShowColMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeCols = ALL_COLUMNS.filter(c => visibleCols[c.key]);

  // Obtener valores únicos para filtros
  const uniqueZonas = useMemo(() => [...new Set(data.map(d => d.zona))].filter(Boolean).sort(), [data]);
  const uniqueFamilias = useMemo(() => [...new Set(data.map(d => d.familia))].filter(Boolean).sort(), [data]);
  const uniqueProveedores = useMemo(() => [...new Set(data.map(d => d.proveedor))].filter(Boolean).sort(), [data]);
  const uniquePisos = useMemo(() => [...new Set(data.map(d => d.piso))].filter(Boolean).sort((a,b) => (a as unknown as number)-(b as unknown as number)), [data]);
  const uniqueServicios = useMemo(() => [...new Set(data.map(d => d.servicio))].filter(Boolean).sort(), [data]);
  const uniqueCNOs = useMemo(() => [...new Set(data.map(d => d.nCNO))].filter(Boolean).sort(), [data]);
  const uniqueOrdenesCompra = useMemo(() => [...new Set(data.map(d => d.ordenCompra))].filter(Boolean).sort(), [data]);

  // Filtrar datos
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchZona = !filters.zona || item.zona === filters.zona;
      const matchFamilia = !filters.familia || item.familia === filters.familia;
      const matchProveedor = !filters.proveedor || item.proveedor === filters.proveedor;
      const matchPiso = !filters.piso || item.piso.toString() === filters.piso;
      const matchServicio = !filters.servicio || item.servicio === filters.servicio;
      const matchCNO = !filters.nCNO || item.nCNO === filters.nCNO;
      const matchOrden = !filters.ordenCompra || item.ordenCompra === filters.ordenCompra;
      const matchSearch = !filters.search ||
        item.nombre?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.recinto?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.item?.toLowerCase().includes(filters.search.toLowerCase());
      const matchDesde = !filters.fechaDesde || !item.inicioInstalacion || item.inicioInstalacion >= filters.fechaDesde;
      const matchHasta = !filters.fechaHasta || !item.inicioInstalacion || item.inicioInstalacion <= filters.fechaHasta;
      return matchZona && matchFamilia && matchProveedor && matchPiso && matchServicio && matchCNO && matchOrden && matchSearch && matchDesde && matchHasta;
    });
  }, [data, filters]);

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => { setCurrentPage(1); }, [filters]);

  // Exportar PDF
  function exportPDF() {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(13);
    doc.text("Inventario Hospital Buin Paine", 14, 14);
    doc.setFontSize(9);
    doc.text(`Exportado el ${new Date().toLocaleDateString("es-CL")} — ${filteredData.length} registros`, 14, 20);

    const head = [activeCols.map(c => c.label)];
    const body = filteredData.map(row =>
      activeCols.map(c => {
        if (c.key === "entregaRecinto") return fmtDate(row.entregaRecinto);
        if (c.key === "inicioInstalacion") return fmtDate(row.inicioInstalacion);
        if (c.key === "terminoInstalacion") return fmtDate(row.terminoInstalacion);
        return String((row as any)[c.key] ?? "");
      })
    );

    autoTable(doc, {
      head,
      body,
      startY: 25,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 255] },
    });

    doc.save("inventario-hospital-buin-paine.pdf");
  }

  const FilterSelect = ({ label, value, onChange, options, placeholder }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
    placeholder: string;
  }) => (
    <div style={{ flex: 1, minWidth: 150 }}>
      <label style={{
        display: "block",
        fontSize: 11,
        fontWeight: 600,
        color: COLORS.textMuted,
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.white,
          fontSize: 13,
          color: COLORS.text,
          cursor: "pointer",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = COLORS.primary}
        onBlur={(e) => e.currentTarget.style.borderColor = COLORS.border}>
        <option value="">{placeholder}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  const btnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.white,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  };

  return (
    <>
      <SectionTitle icon={Icons.search}>Datos Completos del Inventario</SectionTitle>

      <div style={{
        background: COLORS.white,
        borderRadius: 20,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}>

        {/* Barra de búsqueda + acciones */}
        <div className="inv-action-bar">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, recinto o código..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.borderLight}`,
              fontSize: 14,
              color: COLORS.text,
              transition: "border-color 0.2s ease",
              background: COLORS.bg,
              boxSizing: "border-box",
              minWidth: 0,
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = COLORS.primary}
            onBlur={(e) => e.currentTarget.style.borderColor = COLORS.borderLight}
          />

          <div className="inv-btn-group">
          {/* Botón columnas */}
          <div style={{ position: "relative" }} ref={colMenuRef}>
            <button
              onClick={() => setShowColMenu(v => !v)}
              style={{
                ...btnBase,
                width: "100%",
                justifyContent: "center",
                background: showColMenu ? COLORS.primary : COLORS.white,
                color: showColMenu ? COLORS.white : COLORS.text,
                borderColor: showColMenu ? COLORS.primary : COLORS.border,
              }}>
              ⚙ Columnas
            </button>

            {showColMenu && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                background: COLORS.white,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 100,
                minWidth: 200,
                padding: "8px 0",
              }}>
                <div style={{ padding: "8px 16px 6px", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${COLORS.borderLight}`, marginBottom: 4 }}>
                  Mostrar columnas
                </div>
                {ALL_COLUMNS.map(col => (
                  <label key={col.key} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 16px",
                    cursor: "pointer",
                    fontSize: 13,
                    color: COLORS.text,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = COLORS.bg}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <input
                      type="checkbox"
                      checked={visibleCols[col.key]}
                      onChange={(e) => setVisibleCols(prev => ({ ...prev, [col.key]: e.target.checked }))}
                      style={{ accentColor: COLORS.primary, width: 15, height: 15, cursor: "pointer" }}
                    />
                    {col.label}
                  </label>
                ))}
                <div style={{ borderTop: `1px solid ${COLORS.borderLight}`, margin: "4px 0", padding: "6px 16px 2px", display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setVisibleCols(Object.fromEntries(ALL_COLUMNS.map(c => [c.key, true])) as Record<ColKey, boolean>)}
                    style={{ flex: 1, fontSize: 11, padding: "5px 0", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.bg, cursor: "pointer", color: COLORS.text, fontWeight: 600 }}>
                    Todas
                  </button>
                  <button
                    onClick={() => setVisibleCols(Object.fromEntries(ALL_COLUMNS.map(c => [c.key, c.defaultVisible])) as Record<ColKey, boolean>)}
                    style={{ flex: 1, fontSize: 11, padding: "5px 0", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.bg, cursor: "pointer", color: COLORS.text, fontWeight: 600 }}>
                    Restablecer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botón PDF */}
          <button
            onClick={exportPDF}
            style={{ ...btnBase, justifyContent: "center", background: "#dc2626", color: COLORS.white, borderColor: "#dc2626" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#b91c1c"; e.currentTarget.style.borderColor = "#b91c1c"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.borderColor = "#dc2626"; }}>
            ⬇ PDF
          </button>
          </div>{/* end inv-btn-group */}
        </div>{/* end inv-action-bar */}

        {/* Filtros */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <FilterSelect
            label="Familia"
            value={filters.familia}
            onChange={(v) => setFilters({ ...filters, familia: v })}
            options={uniqueFamilias}
            placeholder="Todas las familias"
          />
          <FilterSelect
            label="Piso"
            value={filters.piso}
            onChange={(v) => setFilters({ ...filters, piso: v })}
            options={uniquePisos.map(String)}
            placeholder="Todos los pisos"
          />
          <FilterSelect
            label="Proveedor"
            value={filters.proveedor}
            onChange={(v) => setFilters({ ...filters, proveedor: v })}
            options={uniqueProveedores}
            placeholder="Todos los proveedores"
          />
          <FilterSelect
            label="Zona"
            value={filters.zona}
            onChange={(v) => setFilters({ ...filters, zona: v })}
            options={uniqueZonas}
            placeholder="Todas las zonas"
          />
          <FilterSelect
            label="Servicio"
            value={filters.servicio}
            onChange={(v) => setFilters({ ...filters, servicio: v })}
            options={uniqueServicios}
            placeholder="Todos los servicios"
          />
          <FilterSelect
            label="N° CNO"
            value={filters.nCNO}
            onChange={(v) => setFilters({ ...filters, nCNO: v })}
            options={uniqueCNOs}
            placeholder="Todos los CNO"
          />
          <FilterSelect
            label="Orden de Compra"
            value={filters.ordenCompra}
            onChange={(v) => setFilters({ ...filters, ordenCompra: v })}
            options={uniqueOrdenesCompra}
            placeholder="Todas las órdenes"
          />

          {/* Fecha desde */}
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Fecha Desde
            </label>
            <input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, fontSize: 13, color: COLORS.text, cursor: "pointer" }}
              onFocus={(e) => e.currentTarget.style.borderColor = COLORS.primary}
              onBlur={(e) => e.currentTarget.style.borderColor = COLORS.border}
            />
          </div>

          {/* Fecha hasta */}
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, fontSize: 13, color: COLORS.text, cursor: "pointer" }}
              onFocus={(e) => e.currentTarget.style.borderColor = COLORS.primary}
              onBlur={(e) => e.currentTarget.style.borderColor = COLORS.border}
            />
          </div>

          {/* Limpiar filtros */}
          {Object.values(filters).some(v => v) && (
            <div style={{ flex: 1, minWidth: 150, display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={() => setFilters({ zona: "", familia: "", proveedor: "", piso: "", servicio: "", nCNO: "", ordenCompra: "", search: "", fechaDesde: "", fechaHasta: "" })}
                style={{ ...btnBase, width: "100%", justifyContent: "center", color: COLORS.textMuted }}
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.red; e.currentTarget.style.color = COLORS.white; e.currentTarget.style.borderColor = COLORS.red; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.white; e.currentTarget.style.color = COLORS.textMuted; e.currentTarget.style.borderColor = COLORS.border; }}>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Contador */}
        <div style={{ marginBottom: 16, fontSize: 13, color: COLORS.textMuted, fontWeight: 500 }}>
          Mostrando <span style={{ color: COLORS.primary, fontWeight: 700 }}>{filteredData.length}</span> de {data.length} registros
          {filteredData.length !== data.length && (
            <span style={{ marginLeft: 8 }}>({((filteredData.length / data.length) * 100).toFixed(1)}% del total)</span>
          )}
        </div>

        {/* Tabla */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg, borderBottom: `2px solid ${COLORS.border}` }}>
                {activeCols.map(col => (
                  <th key={col.key} style={{
                    padding: "12px 16px",
                    textAlign: col.key === "cantidad" || col.key === "piso" || col.key === "inicioInstalacion" || col.key === "terminoInstalacion" ? "center" : "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLORS.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    whiteSpace: "nowrap",
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? paginatedData.map((row, i) => (
                <tr key={i}
                  style={{ borderBottom: `1px solid ${COLORS.borderLight}`, transition: "background 0.15s ease" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = COLORS.bg}
                  onMouseLeave={(e) => e.currentTarget.style.background = COLORS.white}>
                  {activeCols.map(col => {
                    if (col.key === "nombre") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 13, color: COLORS.text, fontWeight: 600 }}>{row.nombre}</td>
                    );
                    if (col.key === "familia") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 13, color: COLORS.text }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: PIE_FAMILIA_COLORS[row.familia as keyof typeof PIE_FAMILIA_COLORS] ? `${PIE_FAMILIA_COLORS[row.familia as keyof typeof PIE_FAMILIA_COLORS]}15` : COLORS.borderLight,
                          color: PIE_FAMILIA_COLORS[row.familia as keyof typeof PIE_FAMILIA_COLORS] || COLORS.textMuted,
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          {row.familia}
                        </span>
                      </td>
                    );
                    if (col.key === "tipoEquipo") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textMuted }}>{row.tipoEquipo}</td>
                    );
                    if (col.key === "cantidad") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 14, color: COLORS.text, textAlign: "center", fontWeight: 700 }}>{row.cantidad}</td>
                    );
                    if (col.key === "piso") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 13, color: COLORS.text, textAlign: "center", fontWeight: 600 }}>{row.piso}</td>
                    );
                    if (col.key === "recinto") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textMuted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.recinto}</td>
                    );
                    if (col.key === "proveedor") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, color: COLORS.text }}>{row.proveedor}</td>
                    );
                    if (col.key === "servicio") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 11, color: COLORS.textMuted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.servicio}</td>
                    );
                    if (col.key === "zona") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 11, color: COLORS.textMuted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.zona}</td>
                    );
                    if (col.key === "nCNO") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, color: COLORS.text, whiteSpace: "nowrap" }}>{row.nCNO}</td>
                    );
                    if (col.key === "ordenCompra") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, color: COLORS.text, whiteSpace: "nowrap" }}>{row.ordenCompra}</td>
                    );
                    if (col.key === "entregaRecinto") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, color: COLORS.primary, textAlign: "center", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtDate(row.entregaRecinto)}</td>
                    );
                    if (col.key === "inicioInstalacion") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, color: COLORS.primary, textAlign: "center", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtDate(row.inicioInstalacion)}</td>
                    );
                    if (col.key === "terminoInstalacion") return (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, color: COLORS.primary, textAlign: "center", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtDate(row.terminoInstalacion)}</td>
                    );
                    return null;
                  })}
                </tr>
              )) : (
                <tr>
                  <td colSpan={activeCols.length} style={{ padding: "40px", textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>
                    No se encontraron resultados con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
            paddingTop: 20,
            borderTop: `1px solid ${COLORS.borderLight}`,
          }}>
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>
              Página {currentPage} de {totalPages}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  ...btnBase,
                  background: currentPage === 1 ? COLORS.borderLight : COLORS.white,
                  color: currentPage === 1 ? COLORS.textMuted : COLORS.text,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => { if (currentPage !== 1) { e.currentTarget.style.background = COLORS.primary; e.currentTarget.style.color = COLORS.white; e.currentTarget.style.borderColor = COLORS.primary; } }}
                onMouseLeave={(e) => { if (currentPage !== 1) { e.currentTarget.style.background = COLORS.white; e.currentTarget.style.color = COLORS.text; e.currentTarget.style.borderColor = COLORS.border; } }}>
                ← Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  ...btnBase,
                  background: currentPage === totalPages ? COLORS.borderLight : COLORS.white,
                  color: currentPage === totalPages ? COLORS.textMuted : COLORS.text,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => { if (currentPage !== totalPages) { e.currentTarget.style.background = COLORS.primary; e.currentTarget.style.color = COLORS.white; e.currentTarget.style.borderColor = COLORS.primary; } }}
                onMouseLeave={(e) => { if (currentPage !== totalPages) { e.currentTarget.style.background = COLORS.white; e.currentTarget.style.color = COLORS.text; e.currentTarget.style.borderColor = COLORS.border; } }}>
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
