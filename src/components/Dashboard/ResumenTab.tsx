import { useState, useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, CHART_COLORS, PIE_FAMILIA_COLORS } from "../../constants/theme";
import { Icons } from "../../constants/icons";
import { KPICard } from "../Shared/KPICard";
import { SectionTitle } from "../Shared/SectionTitle";
import { StatusBadge } from "../Shared/StatusBadge";
import { DataTable } from "../Shared/DataTable";
import { ProgressBar } from "../Shared/ProgressBar";
import { CustomTooltip } from "../Shared/CustomTooltip";
import { InventoryDataTable } from "../Shared/InventoryDataTable";
import type { InventoryItem, SummaryData } from "../../types";

interface ResumenTabProps {
  summary: SummaryData;
  data: InventoryItem[];
}

export function ResumenTab({ summary: S, data: RAW }: ResumenTabProps) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <>
      {/* KPIs principales */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        <KPICard
          label="Total Items"
          value={S.totalItems}
          sub="ítems"
          icon={Icons.list}
          color={COLORS.primary}
        />
        <KPICard
          label="Total Unidades"
          value={S.totalQty}
          sub="unidades"
          icon={Icons.stack}
          color={COLORS.green}
        />
        <KPICard
          label="Recintos"
          value={S.uniqueRecintos}
          sub="espacios"
          icon={Icons.location}
          color={COLORS.orange}
        />
        <KPICard
          label="Productos"
          value={S.uniqueNombres}
          sub="tipos"
          icon={Icons.tag}
          color={COLORS.purple}
        />
      </div>

      {/* Status badges */}
      <SectionTitle action="Ver más">Estado del Inventario</SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        <StatusBadge
          label="Familias"
          value={S.familias}
          color={COLORS.green}
          icon={Icons.folder}
        />
        <StatusBadge
          label="Proveedores"
          value={S.proveedores}
          color={COLORS.orange}
          icon={Icons.building}
        />
        <StatusBadge
          label="Servicios"
          value={S.uniqueServicios}
          color={COLORS.primary}
          icon={Icons.hospital}
        />
        <StatusBadge
          label="Zonas"
          value={S.uniqueZonas}
          color={COLORS.purple}
          icon={Icons.layers}
        />
      </div>

      {/* Charts: 2 columnas desktop, 1 columna mobile */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 14 : 20,
        marginBottom: 32,
      }}>
        <div className="chart-card" style={{
          background: COLORS.white,
          borderRadius: 18,
          padding: 24,
          border: `1px solid ${COLORS.borderLight}`,
          boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 20, marginTop: 0 }}>
            Distribución por Familia
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={S.byFamilia}
              layout="vertical"
              margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: COLORS.textMuted }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 12, fill: COLORS.text }}
                width={isMobile ? 80 : 95}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="qty" radius={[0, 8, 8, 0]}>
                {S.byFamilia.map((entry, i) => (
                  <Cell key={i} fill={PIE_FAMILIA_COLORS[entry.name] || CHART_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={{
          background: COLORS.white,
          borderRadius: 18,
          padding: 24,
          border: `1px solid ${COLORS.borderLight}`,
          boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 20, marginTop: 0 }}>
            Top Proveedores
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={S.byProveedor}>
              <XAxis
                dataKey="name"
                tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                axisLine={{ stroke: COLORS.border }}
              />
              <YAxis
                tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                axisLine={{ stroke: COLORS.border }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="qty" name="Cantidad" radius={[6, 6, 0, 0]}>
                {S.byProveedor.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Análisis Completo de Proveedores */}
      <SectionTitle count={S.proveedores}>Análisis de Proveedores</SectionTitle>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        {S.byProveedor.map((p, i) => (
          <KPICard
            key={i}
            label={p.name}
            value={p.qty}
            sub={`${((p.qty / S.totalQty) * 100).toFixed(1)}%`}
            icon={[Icons.building, Icons.building, Icons.building][i] || Icons.building}
            color={CHART_COLORS[i]}
          />
        ))}
      </div>

      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 32,
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: COLORS.text,
          marginBottom: 20,
          marginTop: 0,
        }}>
          Distribución por Proveedor
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={S.byProveedor}>
            <XAxis
              dataKey="name"
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <YAxis
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="qty" name="Cantidad" radius={[6, 6, 0, 0]}>
              {S.byProveedor.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,941,0.05)",
        marginBottom: 32,
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: COLORS.text,
          marginBottom: 20,
          marginTop: 0,
        }}>
          Detalle de Proveedores
        </h3>
        <DataTable
          data={S.byProveedor.map((p, i) => ({
            ...p,
            rank: i + 1,
            pctQty: ((p.qty / S.totalQty) * 100).toFixed(1) + "%",
          }))}
          columns={[
            { key: "rank", label: "#", align: "center", mono: true, width: "60px" },
            { key: "name", label: "Proveedor", highlight: true },
            { key: "qty", label: "Cantidad", align: "right", mono: true, width: "120px" },
            { key: "pctQty", label: "% del Total", align: "right", mono: true, width: "120px" },
            {
              key: "qty",
              label: "Distribución",
              render: (v) => <ProgressBar value={v} max={4256} color={COLORS.green} />
            },
          ]}
          maxRows={10}
        />
      </div>

      {/* Top 5 */}
      <SectionTitle action="Ver todos">Top 5 Productos</SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
        marginBottom: 40,
      }}>
        {S.byNombre.slice(0, 5).map((p, i) => (
          <KPICard
            key={i}
            label={p.name}
            value={p.qty}
            sub="uds"
            icon={[Icons.tag, Icons.box, Icons.folder, Icons.stack, Icons.list][i]}
            color={CHART_COLORS[i]}
            compact
          />
        ))}
      </div>

      {/* Tabla de Datos Completa con Filtros */}
      <InventoryDataTable data={RAW} />
    </>
  );
}
