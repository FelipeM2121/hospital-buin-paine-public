import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { COLORS, CHART_COLORS } from "../../constants/theme";
import { Icons } from "../../constants/icons";
import { KPICard } from "../Shared/KPICard";
import { SectionTitle } from "../Shared/SectionTitle";
import { DataTable } from "../Shared/DataTable";
import { ProgressBar } from "../Shared/ProgressBar";
import { CustomTooltip } from "../Shared/CustomTooltip";
import type { DespachoProgressItem, DespachoBatch } from "../../types";

interface DespachoTabProps {
  progress: DespachoProgressItem[];
  batches: DespachoBatch[];
}

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function formatDate(d: string): string {
  const [y, m, day] = d.split('-');
  return `${parseInt(day, 10)} ${MESES[parseInt(m, 10) - 1]} ${y}`;
}

export function DespachoTab({ progress, batches }: DespachoTabProps) {
  const total = progress.reduce((a, p) => a + p.total, 0);
  const entregado = progress.reduce((a, p) => a + p.entregado, 0);
  const restante = progress.reduce((a, p) => a + p.restante, 0);
  const pctGlobal = total > 0 ? (entregado / total) * 100 : 0;

  const batchChart = batches.map(b => ({ name: formatDate(b.fecha), qty: b.unidades, recintos: b.recintos }));

  const tableData = [...progress]
    .sort((a, b) => a.pct - b.pct || b.total - a.total)
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

  return (
    <>
      <SectionTitle icon={Icons.box} count={progress.length}>Progreso de Despacho e Instalación</SectionTitle>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
          label="Restante"
          value={restante}
          sub="unidades"
          icon={Icons.list}
          color={COLORS.orange}
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

      <SectionTitle>Despachos por Fecha</SectionTitle>
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={batchChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              axisLine={{ stroke: COLORS.border }}
              interval={0}
              height={40}
            />
            <YAxis
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
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

      <SectionTitle>Top 15 Ítems con Mayor Cantidad Pendiente</SectionTitle>
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
            <Bar dataKey="qty" name="Restante" radius={[0, 6, 6, 0]} fill={COLORS.orange} />
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
          { key: "entregado", label: "Entregado", align: "right", mono: true, width: "100px" },
          { key: "restante", label: "Restante", align: "right", mono: true, width: "100px" },
          { key: "pctLabel", label: "% Avance", align: "right", mono: true, width: "100px" },
          {
            key: "pct",
            label: "Avance", hideMobile: true,
            render: (v) => <ProgressBar value={v * 100} max={100} color={v >= 1 ? COLORS.green : COLORS.orange} />
          },
        ]}
        maxRows={15}
      />
    </>
  );
}
