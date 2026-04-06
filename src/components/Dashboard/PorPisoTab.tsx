import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { COLORS, CHART_COLORS } from "../../constants/theme";
import { Icons } from "../../constants/icons";
import { KPICard } from "../Shared/KPICard";
import { SectionTitle } from "../Shared/SectionTitle";
import { DataTable } from "../Shared/DataTable";
import { ProgressBar } from "../Shared/ProgressBar";
import { CustomTooltip } from "../Shared/CustomTooltip";
import type { SummaryData } from "../../types";

interface PorPisoTabProps {
  summary: SummaryData;
}

export function PorPisoTab({ summary: S }: PorPisoTabProps) {
  return (
    <>
      <SectionTitle>Distribución por Piso</SectionTitle>
      
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={S.byPiso}>
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
              {S.byPiso.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

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
            render: (v) => <ProgressBar value={v} max={1547} color={COLORS.orange} /> 
          },
        ]}
      />

      <SectionTitle>Resumen por Piso</SectionTitle>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
        gap: 16,
      }}>
        {S.byPiso.map(p => (
          <KPICard 
            key={p.piso} 
            label={p.name} 
            value={p.qty} 
            sub="unidades" 
            icon={Icons.layers}
            color={CHART_COLORS[p.piso - 1]} 
            compact
          />
        ))}
      </div>
    </>
  );
}
