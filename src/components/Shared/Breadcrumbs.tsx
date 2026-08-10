import { COLORS } from "../../constants/theme";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Ruta de navegación"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
        fontSize: 13,
        marginBottom: 14,
      }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const clickable = !!item.onClick && !isLast;
        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {clickable ? (
              <button
                onClick={item.onClick}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: COLORS.primary,
                  fontSize: 13,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                {item.label}
              </button>
            ) : (
              <span
                style={{
                  color: isLast ? COLORS.text : COLORS.textMuted,
                  fontWeight: isLast ? 700 : 400,
                }}
              >
                {item.label}
              </span>
            )}
            {!isLast && <span style={{ color: COLORS.textLight }}>›</span>}
          </span>
        );
      })}
    </nav>
  );
}
