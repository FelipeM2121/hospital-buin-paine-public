import { COLORS } from "../../constants/theme";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    payload: {
      name?: string;
      qty?: number;
      value?: number;
    };
  }>;
  total?: number;
}

export function CustomTooltip({ active, payload, total }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  const value = data.value || data.payload.qty || data.payload.value || 0;
  const pct = total ? ((value / total) * 100).toFixed(1) : null;
  return (
    <div style={{
      background: COLORS.sidebar,
      border: "none",
      borderRadius: 14,
      padding: "10px 16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    }}>
      <div style={{ fontSize: 11, color: "#8b8fa8", marginBottom: 4, fontWeight: 500 }}>
        {data.payload.name || data.name}
      </div>
      <div style={{
        fontSize: 20,
        fontWeight: 800,
        color: data.color || COLORS.primary,
        letterSpacing: "-0.5px",
      }}>
        {value.toLocaleString("es-CL")}
        {pct && <span style={{ fontSize: 13, fontWeight: 600, color: "#8b8fa8", marginLeft: 6 }}>({pct}%)</span>}
      </div>
    </div>
  );
}
