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
import type { SummaryData } from "../../types";

interface ResumenTabProps {
  summary: SummaryData;
}

export function ResumenTab({ summary: S }: ResumenTabProps) {
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
            <BarChart data={S.byProveedor} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
              <XAxis
                dataKey="name"
                tick={{ fill: COLORS.textMuted, fontSize: isMobile ? 8 : 11 }}
                axisLine={{ stroke: COLORS.border }}
                interval={0}
                height={36}
                tickFormatter={(v: string) => isMobile && v.length > 9 ? v.slice(0, 9) + "…" : v}
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

      {/* Distribución por Piso */}
      <SectionTitle count={S.pisos}>Distribución por Piso</SectionTitle>
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={S.byPiso} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: COLORS.textMuted, fontSize: isMobile ? 9 : 12 }}
              axisLine={{ stroke: COLORS.border }}
              interval={0}
              height={36}
            />
            <YAxis
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="qty" name="Cantidad" radius={[6, 6, 0, 0]}>
              {S.byPiso.map((_, i) => (
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
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 32,
      }}>
        <DataTable
          data={S.byPiso.map(p => ({
            ...p,
            pctQty: ((p.qty / S.totalQty) * 100).toFixed(1) + "%",
          }))}
          columns={[
            { key: "name", label: "Piso", highlight: true, width: "150px" },
            { key: "qty", label: "Cantidad", align: "right", mono: true, width: "120px" },
            { key: "pctQty", label: "% del Total", align: "right", mono: true, width: "120px" },
            {
              key: "qty",
              label: "Distribución", hideMobile: true,
              render: (v) => <ProgressBar value={v} max={Math.max(...S.byPiso.map(p => p.qty))} color={COLORS.orange} />
            },
          ]}
        />
      </div>

      {/* Cantidad por Servicio */}
      <SectionTitle count={S.uniqueServicios}>Cantidad por Servicio</SectionTitle>
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}>
        <ResponsiveContainer width="100%" height={560}>
          <BarChart data={S.byServicio.slice(0, 20)} layout="vertical" margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
            <XAxis
              type="number"
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fill: COLORS.text, fontSize: 10 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="qty" name="Cantidad" radius={[0, 6, 6, 0]}>
              {S.byServicio.slice(0, 20).map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 32,
      }}>
        <DataTable
          data={S.byServicio.map((s, i) => ({
            ...s,
            rank: i + 1,
            pctQty: ((s.qty / S.totalQty) * 100).toFixed(1) + "%",
          }))}
          columns={[
            { key: "rank", label: "#", align: "center", mono: true, width: "60px" },
            { key: "name", label: "Servicio", highlight: true },
            { key: "qty", label: "Cantidad", align: "right", mono: true, width: "120px" },
            { key: "pctQty", label: "% del Total", align: "right", mono: true, width: "120px" },
            {
              key: "qty",
              label: "Distribución", hideMobile: true,
              render: (v) => <ProgressBar value={v} max={Math.max(...S.byServicio.map(s => s.qty))} color={COLORS.primary} />
            },
          ]}
          maxRows={15}
        />
      </div>

      {/* Top Productos */}
      <SectionTitle count={S.uniqueNombres}>Top 20 Productos</SectionTitle>
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}>
        <ResponsiveContainer width="100%" height={isMobile ? 560 : 600}>
          <BarChart data={S.byNombre.slice(0, 20)} layout="vertical" margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
            <XAxis
              type="number"
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={{ fill: COLORS.text, fontSize: 10 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="qty" name="Cantidad" radius={[0, 6, 6, 0]}>
              {S.byNombre.slice(0, 20).map((e, i) => {
                const c = e.name.includes("Silla") || e.name.includes("Sillón") ? PIE_FAMILIA_COLORS.Silla
                  : e.name.includes("Escritorio") || e.name.includes("Mesa") ? PIE_FAMILIA_COLORS.Mesa
                  : e.name.includes("Mueble") || e.name.includes("Banca") ? PIE_FAMILIA_COLORS.Otro
                  : CHART_COLORS[i % CHART_COLORS.length];
                return <Cell key={i} fill={c} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 32,
      }}>
        <DataTable
          data={S.byNombre.map((n, i) => ({
            ...n,
            rank: i + 1,
            pctQty: ((n.qty / S.totalQty) * 100).toFixed(1) + "%",
          }))}
          columns={[
            { key: "rank", label: "#", align: "center", mono: true, width: "60px" },
            { key: "name", label: "Producto", highlight: true },
            { key: "qty", label: "Cantidad", align: "right", mono: true, width: "120px" },
            { key: "pctQty", label: "% del Total", align: "right", mono: true, width: "120px" },
            {
              key: "qty",
              label: "Distribución", hideMobile: true,
              render: (v) => <ProgressBar value={v} max={Math.max(...S.byNombre.map(n => n.qty))} color={COLORS.orange} />
            },
          ]}
          maxRows={15}
        />
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
            { key: "qty", label: "Cantidad", align: "right", mono: true, width: "100px", render: (v) => v.toLocaleString("es-CL") },
            { key: "pctQty", label: "% del Total", align: "right", mono: true, width: "110px" },
            {
              key: "qty",
              label: "Distribución",
              hideMobile: true,
              render: (v) => <ProgressBar value={v} max={4256} color={COLORS.green} />
            },
          ]}
          maxRows={10}
        />
      </div>
    </>
  );
}
