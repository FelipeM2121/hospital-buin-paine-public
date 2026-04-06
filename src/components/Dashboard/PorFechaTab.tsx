import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { COLORS, CHART_COLORS } from "../../constants/theme";
import { Icons } from "../../constants/icons";
import { KPICard } from "../Shared/KPICard";
import { SectionTitle } from "../Shared/SectionTitle";
import { StatusBadge } from "../Shared/StatusBadge";
import { DataTable } from "../Shared/DataTable";
import { ProgressBar } from "../Shared/ProgressBar";
import { CustomTooltip } from "../Shared/CustomTooltip";
import type { SummaryData } from "../../types";

interface PorFechaTabProps {
  summary: SummaryData;
}

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${parseInt(day, 10)} ${MESES[parseInt(m, 10) - 1]} ${y}`;
}
function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MESES_FULL[parseInt(m, 10) - 1]} ${y}`;
}

export function PorFechaTab({ summary: S }: PorFechaTabProps) {
  return (
    <>
      <SectionTitle icon={Icons.calendar}>Cronograma de Instalación</SectionTitle>

      {/* KPIs de fechas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        <KPICard
          label="Fecha Inicio"
          value={formatDate(S.fechaStats.fechaMin)}
          sub="primera instalación"
          icon={Icons.calendar}
          color={COLORS.green}
          compact
        />
        <KPICard
          label="Fecha Término"
          value={formatDate(S.fechaStats.fechaMax)}
          sub="última instalación"
          icon={Icons.calendar}
          color={COLORS.orange}
          compact
        />
        <KPICard
          label="Meses"
          value={S.fechaStats.totalMeses}
          sub="de instalación"
          icon={Icons.chart}
          color={COLORS.primary}
          compact
        />
        <KPICard
          label="Semanas"
          value={S.fechaStats.totalSemanas}
          sub="programadas"
          icon={Icons.layers}
          color={COLORS.purple}
          compact
        />
      </div>

      {/* Gráfico por mes */}
      <SectionTitle>Distribución Mensual</SectionTitle>
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={S.byMes.map(m => ({ ...m, name: formatMonth(m.name) }))}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: COLORS.textMuted, fontSize: 12 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <YAxis 
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="qty" name="Cantidad" radius={[6, 6, 0, 0]}>
              {S.byMes.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla mensual */}
      <DataTable
        data={S.byMes.map((m, i) => ({
          ...m,
          name: formatMonth(m.name),
          rank: i + 1,
          pctQty: ((m.qty / S.totalQty) * 100).toFixed(1) + "%",
        }))}
        columns={[
          { key: "rank", label: "#", align: "center", mono: true, width: "60px" },
          { key: "name", label: "Mes", highlight: true, width: "200px" },
          { key: "qty", label: "Cantidad", align: "right", mono: true, width: "120px" },
          { key: "pctQty", label: "% del Total", align: "right", mono: true, width: "120px" },
          { 
            key: "qty", 
            label: "Distribución", hideMobile: true,
            render: (v) => <ProgressBar value={v} max={4069} color={COLORS.primary} /> 
          },
        ]}
        maxRows={4}
      />

      {/* Top semanas */}
      <SectionTitle>Top 5 Semanas con Más Instalaciones</SectionTitle>
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={S.bySemana}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              axisLine={{ stroke: COLORS.border }}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="qty" name="Cantidad" radius={[6, 6, 0, 0]}>
              {S.bySemana.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top días */}
      <SectionTitle>Top 5 Días con Más Instalaciones</SectionTitle>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: 16,
        marginBottom: 24,
      }}>
        {S.byDia.map((d, i) => (
          <StatusBadge
            key={i}
            label={d.name}
            value={d.qty}
            color={CHART_COLORS[i]}
            icon={Icons.calendar}
          />
        ))}
      </div>

      {/* Alerta de pico */}
      <div style={{
        background: `${COLORS.orange}10`,
        border: `1px solid ${COLORS.orange}40`,
        borderRadius: 18,
        padding: 20,
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
      }}>
        <div style={{
          width: 40,
          height: 40,
          background: COLORS.orange,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}>
          ⚠️
        </div>
        <div>
          <div style={{ 
            fontSize: 16, 
            fontWeight: 700, 
            color: COLORS.text,
            marginBottom: 6,
          }}>
            Pico de Instalación Detectado
          </div>
          <div style={{ 
            fontSize: 14, 
            color: COLORS.textMuted,
            lineHeight: 1.5,
          }}>
            El 1 Jul 2026 concentra <strong style={{color: COLORS.text}}>2,924 unidades</strong> ({((2924/S.totalQty)*100).toFixed(1)}% del total). 
            Se recomienda coordinar recursos adicionales de instalación para esta fecha.
          </div>
        </div>
      </div>
    </>
  );
}
