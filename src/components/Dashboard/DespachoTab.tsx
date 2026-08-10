import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, ReferenceLine, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { COLORS, CHART_COLORS } from "../../constants/theme";
import { Icons } from "../../constants/icons";
import { KPICard } from "../Shared/KPICard";
import { SectionTitle } from "../Shared/SectionTitle";
import { DataTable } from "../Shared/DataTable";
import { ProgressBar } from "../Shared/ProgressBar";
import { CustomTooltip } from "../Shared/CustomTooltip";
import type { DespachoProgressItem, DespachoBatch, DespachoBatchDetalle } from "../../types";

interface DespachoTabProps {
  progress: DespachoProgressItem[];
  batches: DespachoBatch[];
  detalle: DespachoBatchDetalle[];
}

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function formatDate(d: string): string {
  const [y, m, day] = d.split('-');
  return `${parseInt(day, 10)} ${MESES[parseInt(m, 10) - 1]} ${y}`;
}
function formatDateShort(d: string): string {
  const [, m, day] = d.split('-');
  return `${parseInt(day, 10)} ${MESES[parseInt(m, 10) - 1]}`;
}

// "Despachado" (DESPACHO_DETALLE) siempre es ≥ "Entregado" (DESPACHO_PROGRESS) por tipo de
// equipo — se despacha primero y la confirmación de entrega llega después. Para que la
// tendencia acumulada cuadre exactamente con el KPI "Entregado", se acumula por tipo de
// equipo y se limita cada uno a su total confirmado en progress (nunca a lo simplemente
// despachado), en vez de sumar directo las unidades de cada despacho.
function buildCumulativeChart(
  sortedBatches: DespachoBatch[],
  detalle: DespachoBatchDetalle[],
  progress: DespachoProgressItem[],
): { name: string; fecha: string; acumulado: number }[] {
  const entregadoPorTipo = new Map(progress.map((p) => [p.tipoEquipo, p.entregado]));
  const acumuladoPorTipo = new Map<string, number>();
  return sortedBatches.map((b) => {
    const det = detalle.find((d) => d.numero === b.numero);
    det?.items.forEach((item) => {
      const prev = acumuladoPorTipo.get(item.tipoEquipo) ?? 0;
      const ceiling = entregadoPorTipo.get(item.tipoEquipo) ?? 0;
      acumuladoPorTipo.set(item.tipoEquipo, Math.min(prev + item.cantidad, ceiling));
    });
    let acumulado = 0;
    acumuladoPorTipo.forEach((v) => { acumulado += v; });
    return { name: `Despacho ${b.numero}`, fecha: formatDateShort(b.fecha), acumulado };
  });
}

export function DespachoTab({ progress, batches, detalle }: DespachoTabProps) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const total = progress.reduce((a, p) => a + p.total, 0);
  const entregado = progress.reduce((a, p) => a + p.entregado, 0);
  const restante = progress.reduce((a, p) => a + p.restante, 0);
  const pctGlobal = total > 0 ? (entregado / total) * 100 : 0;

  const sortedBatches = [...batches].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.numero - b.numero);
  const [selectedBatch, setSelectedBatch] = useState(sortedBatches[sortedBatches.length - 1]?.numero ?? 1);

  const batchChart = batches.map(b => ({ name: `Despacho ${b.numero} (${formatDateShort(b.fecha)})`, qty: b.unidades, recintos: b.recintos }));

  const cumulativeChart = buildCumulativeChart(sortedBatches, detalle, progress);

  const tableData = [...progress]
    .sort((a, b) => b.restante - a.restante || a.pct - b.pct)
    .map((p, i) => ({
      ...p,
      rank: i + 1,
      pctLabel: (p.pct * 100).toFixed(1) + "%",
    }));

  const pendingChart = [...progress]
    .filter(p => p.restante > 0)
    .sort((a, b) => b.restante - a.restante)
    .slice(0, 15)
    .map(p => ({ name: p.nombre, qty: p.restante }));

  const detalleSeleccionado = detalle.find(d => d.numero === selectedBatch);
  const batchSeleccionado = batches.find(b => b.numero === selectedBatch);

  return (
    <>
      <SectionTitle icon={Icons.box} count={progress.length}>Progreso de Despacho</SectionTitle>

      {/* Foco: lo faltante */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.red} 0%, ${COLORS.orange} 100%)`,
        borderRadius: 20,
        padding: "24px 28px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
        boxShadow: `0 8px 24px ${COLORS.red}30`,
        color: COLORS.white,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <div style={{ width: 28, height: 28 }}>{Icons.list}</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, opacity: 0.9, marginBottom: 4 }}>
            Faltante por despachar
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.5px" }}>
            {restante.toLocaleString("es-CL")} <span style={{ fontSize: 15, fontWeight: 500, opacity: 0.9 }}>unidades</span>
          </div>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        <KPICard
          label="Total Requerido"
          value={total}
          sub="unidades"
          icon={Icons.stack}
          color={COLORS.primary}
          compact
        />
        <KPICard
          label="Entregado"
          value={entregado}
          sub="unidades"
          icon={Icons.box}
          color={COLORS.green}
          compact
        />
        <KPICard
          label="Avance"
          value={pctGlobal.toFixed(1) + "%"}
          sub="del total"
          icon={Icons.chart}
          color={COLORS.purple}
          compact
        />
      </div>

      <SectionTitle icon={Icons.chart}>Tendencia de Entregas</SectionTitle>
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 16,
      }}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={cumulativeChart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: COLORS.textMuted, fontSize: isMobile ? 9 : 11 }}
              axisLine={{ stroke: COLORS.border }}
              interval={0}
              height={40}
            />
            <YAxis
              domain={[0, total]}
              tick={{ fill: COLORS.textMuted, fontSize: isMobile ? 9 : 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={total}
              stroke={COLORS.textMuted}
              strokeDasharray="4 4"
              label={{ value: "Total requerido", position: "insideBottomRight", fill: COLORS.textMuted, fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="acumulado"
              name="Entregado acumulado"
              stroke={COLORS.primary}
              strokeWidth={3}
              dot={{ r: 5, fill: COLORS.primary }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>Top 15 Ítems con Mayor Cantidad Faltante</SectionTitle>
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={pendingChart} layout="vertical" margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
            <XAxis
              type="number"
              tick={{ fill: COLORS.textMuted, fontSize: isMobile ? 9 : 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={isMobile ? 96 : 160}
              tick={{ fill: COLORS.text, fontSize: isMobile ? 9 : 10 }}
              axisLine={{ stroke: COLORS.border }}
              tickFormatter={(v: string) => isMobile && v.length > 14 ? v.slice(0, 14) + "…" : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="qty" name="Faltante" radius={[0, 6, 6, 0]} fill={COLORS.red} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>Detalle por Tipo de Equipo</SectionTitle>
      <DataTable
        data={tableData}
        columns={[
          { key: "rank", label: "#", align: "center", mono: true, width: "50px" },
          { key: "nombre", label: "Tipo de Equipo / Mobiliario", highlight: true },
          { key: "total", label: "Total", align: "right", mono: true, width: "90px" },
          { key: "entregado", label: "Entregado", align: "right", mono: true, width: "100px", hideMobile: true },
          {
            key: "restante", label: "Faltante", align: "right", mono: true, width: "100px",
            render: (v) => (
              <span style={{ fontWeight: 700, color: v > 0 ? COLORS.red : COLORS.textMuted }}>
                {v.toLocaleString("es-CL")}
              </span>
            ),
          },
          { key: "pctLabel", label: "% Avance", align: "right", mono: true, width: "100px", hideMobile: true },
          {
            key: "pct",
            label: "Avance", hideMobile: true,
            render: (v) => <ProgressBar value={v * 100} max={100} color={v >= 1 ? COLORS.green : COLORS.orange} />
          },
        ]}
        maxRows={15}
      />

      <SectionTitle>Historial de Despachos</SectionTitle>
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={batchChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: COLORS.textMuted, fontSize: isMobile ? 8 : 11 }}
              axisLine={{ stroke: COLORS.border }}
              interval={0}
              height={40}
              tickFormatter={(v: string) => isMobile ? v.replace("Despacho ", "#") : v}
            />
            <YAxis
              tick={{ fill: COLORS.textMuted, fontSize: isMobile ? 9 : 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="qty" name="Unidades" radius={[6, 6, 0, 0]}>
              {batchChart.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>Detalle por Despacho</SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {sortedBatches.map(b => (
          <button
            key={b.numero}
            onClick={() => setSelectedBatch(b.numero)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: `1px solid ${selectedBatch === b.numero ? COLORS.primary : COLORS.border}`,
              background: selectedBatch === b.numero ? COLORS.primary : COLORS.bg,
              color: selectedBatch === b.numero ? COLORS.white : COLORS.text,
              fontSize: 13,
              fontWeight: selectedBatch === b.numero ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Despacho {b.numero}
          </button>
        ))}
      </div>

      {batchSeleccionado && (
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>
          {formatDate(batchSeleccionado.fecha)} · <strong style={{ color: COLORS.text }}>{batchSeleccionado.unidades.toLocaleString("es-CL")} unidades</strong> en {batchSeleccionado.recintos.toLocaleString("es-CL")} recintos
        </div>
      )}

      <DataTable
        data={detalleSeleccionado?.items ?? []}
        columns={[
          { key: "tipoEquipo", label: "Código", align: "left", mono: true, width: "110px" },
          { key: "nombre", label: "Tipo de Equipo / Mobiliario", highlight: true },
          { key: "cantidad", label: "Cantidad", align: "right", mono: true, width: "100px" },
        ]}
        maxRows={20}
      />
    </>
  );
}
