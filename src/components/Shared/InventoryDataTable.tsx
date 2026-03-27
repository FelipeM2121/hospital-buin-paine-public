import { useState, useEffect, useMemo } from "react";
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
  inicioInstalacion: string | null;
  terminoInstalacion: string | null;
}

interface InventoryDataTableProps {
  data: InventoryItem[];
}

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
    search: "",
    fechaDesde: "",
    fechaHasta: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Obtener valores únicos para filtros
  const uniqueZonas = useMemo(() => [...new Set(data.map(d => d.zona))].filter(Boolean).sort(), [data]);
  const uniqueFamilias = useMemo(() => [...new Set(data.map(d => d.familia))].filter(Boolean).sort(), [data]);
  const uniqueProveedores = useMemo(() => [...new Set(data.map(d => d.proveedor))].filter(Boolean).sort(), [data]);
  const uniquePisos = useMemo(() => [...new Set(data.map(d => d.piso))].filter(Boolean).sort((a,b) => (a as unknown as number)-(b as unknown as number)), [data]);
  const uniqueServicios = useMemo(() => [...new Set(data.map(d => d.servicio))].filter(Boolean).sort(), [data]);

  // Filtrar datos
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchZona = !filters.zona || item.zona === filters.zona;
      const matchFamilia = !filters.familia || item.familia === filters.familia;
      const matchProveedor = !filters.proveedor || item.proveedor === filters.proveedor;
      const matchPiso = !filters.piso || item.piso.toString() === filters.piso;
      const matchServicio = !filters.servicio || item.servicio === filters.servicio;
      const matchSearch = !filters.search ||
        item.nombre?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.recinto?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.item?.toLowerCase().includes(filters.search.toLowerCase());
      const matchDesde = !filters.fechaDesde || !item.inicioInstalacion || item.inicioInstalacion >= filters.fechaDesde;
      const matchHasta = !filters.fechaHasta || !item.inicioInstalacion || item.inicioInstalacion <= filters.fechaHasta;
      return matchZona && matchFamilia && matchProveedor && matchPiso && matchServicio && matchSearch && matchDesde && matchHasta;
    });
  }, [data, filters]);

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset página cuando cambian filtros
  useEffect(() => { setCurrentPage(1); }, [filters]);

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
        {/* Barra de búsqueda */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, recinto o código..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.borderLight}`,
              fontSize: 14,
              color: COLORS.text,
              transition: "border-color 0.2s ease",
              background: COLORS.bg,
              boxSizing: "border-box",
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = COLORS.primary}
            onBlur={(e) => e.currentTarget.style.borderColor = COLORS.borderLight}
          />
        </div>

        {/* Filtros */}
        <div style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}>
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

          {/* Filtro fecha desde */}
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
              Fecha Desde
            </label>
            <input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
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
              onBlur={(e) => e.currentTarget.style.borderColor = COLORS.border}
            />
          </div>

          {/* Filtro fecha hasta */}
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
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
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
              onBlur={(e) => e.currentTarget.style.borderColor = COLORS.border}
            />
          </div>

          {/* Botón limpiar filtros */}
          {Object.values(filters).some(v => v) && (
            <div style={{ flex: 1, minWidth: 150, display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={() => setFilters({ zona: "", familia: "", proveedor: "", piso: "", servicio: "", search: "", fechaDesde: "", fechaHasta: "" })}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.white,
                  color: COLORS.textMuted,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = COLORS.red;
                  e.currentTarget.style.color = COLORS.white;
                  e.currentTarget.style.borderColor = COLORS.red;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = COLORS.white;
                  e.currentTarget.style.color = COLORS.textMuted;
                  e.currentTarget.style.borderColor = COLORS.border;
                }}>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Contador de resultados */}
        <div style={{
          marginBottom: 16,
          fontSize: 13,
          color: COLORS.textMuted,
          fontWeight: 500,
        }}>
          Mostrando <span style={{ color: COLORS.primary, fontWeight: 700 }}>{filteredData.length}</span> de {data.length} registros
          {filteredData.length !== data.length && (
            <span style={{ marginLeft: 8 }}>
              ({((filteredData.length / data.length) * 100).toFixed(1)}% del total)
            </span>
          )}
        </div>

        {/* Tabla */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg, borderBottom: `2px solid ${COLORS.border}` }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Nombre</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Familia</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Cant.</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Piso</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Recinto</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Proveedor</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Zona</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Inicio Inst.</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Término Inst.</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? paginatedData.map((row, i) => (
                <tr key={i} style={{
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = COLORS.bg}
                onMouseLeave={(e) => e.currentTarget.style.background = COLORS.white}>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.text, fontWeight: 600 }}>{row.nombre}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.text }}>
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
                  <td style={{ padding: "12px 16px", fontSize: 14, color: COLORS.text, textAlign: "center", fontWeight: 700 }}>{row.cantidad}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.text, textAlign: "center", fontWeight: 600 }}>{row.piso}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textMuted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.recinto}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.text }}>{row.proveedor}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: COLORS.textMuted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.zona}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.primary, textAlign: "center", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtDate(row.inicioInstalacion)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.primary, textAlign: "center", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtDate(row.terminoInstalacion)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>
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
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: currentPage === 1 ? COLORS.borderLight : COLORS.white,
                  color: currentPage === 1 ? COLORS.textMuted : COLORS.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.background = COLORS.primary;
                    e.currentTarget.style.color = COLORS.white;
                    e.currentTarget.style.borderColor = COLORS.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.background = COLORS.white;
                    e.currentTarget.style.color = COLORS.text;
                    e.currentTarget.style.borderColor = COLORS.border;
                  }
                }}>
                ← Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: currentPage === totalPages ? COLORS.borderLight : COLORS.white,
                  color: currentPage === totalPages ? COLORS.textMuted : COLORS.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.background = COLORS.primary;
                    e.currentTarget.style.color = COLORS.white;
                    e.currentTarget.style.borderColor = COLORS.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.background = COLORS.white;
                    e.currentTarget.style.color = COLORS.text;
                    e.currentTarget.style.borderColor = COLORS.border;
                  }
                }}>
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
