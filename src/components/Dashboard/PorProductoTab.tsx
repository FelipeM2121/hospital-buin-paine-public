import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { COLORS, CHART_COLORS, PIE_FAMILIA_COLORS } from "../../constants/theme";
import { SectionTitle } from "../Shared/SectionTitle";
import { DataTable } from "../Shared/DataTable";
import { ProgressBar } from "../Shared/ProgressBar";
import { CustomTooltip } from "../Shared/CustomTooltip";
import type { SummaryData } from "../../types";

interface PorProductoTabProps {
  summary: SummaryData;
}

export function PorProductoTab({ summary: S }: PorProductoTabProps) {
  return (
    <>
      <SectionTitle count={S.uniqueNombres}>Top 25 Productos</SectionTitle>
      
      <div style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: 24,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}>
        <ResponsiveContainer width="100%" height={600}>
          <BarChart data={S.byNombre} layout="vertical" margin={{ left: 10 }}>
            <XAxis 
              type="number" 
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={220} 
              tick={{ fill: COLORS.text, fontSize: 11 }}
              axisLine={{ stroke: COLORS.border }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="qty" name="Cantidad" radius={[0, 6, 6, 0]}>
              {S.byNombre.map((e, i) => {
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
            render: (v) => <ProgressBar value={v} max={1285} color={COLORS.orange} /> 
          },
        ]}
        maxRows={15}
      />
    </>
  );
}
