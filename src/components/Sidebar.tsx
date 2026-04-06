import "./Sidebar.css";
import { COLORS } from "../constants/theme";
import { Icons } from "../constants/icons";
import { UserAvatarButton } from "./UserAvatarButton";

export interface TabConfig {
  name: string;
  icon: JSX.Element;
  color: string;
}

export const TABS: TabConfig[] = [
  { name: "Resumen",           icon: Icons.chart,    color: COLORS.primary },
  { name: "Por Piso",          icon: Icons.layers,   color: COLORS.cyan },
  { name: "Por Servicio",      icon: Icons.hospital, color: COLORS.red },
  { name: "Por Producto",      icon: Icons.box,      color: COLORS.purple },
  { name: "Por Fecha",         icon: Icons.calendar, color: "#f59e0b" },
  { name: "Esp. Técnicas",     icon: Icons.document, color: "#14b8a6" },
  { name: "Control Documento", icon: Icons.tree,     color: "#7c3aed" },
  { name: "Chat IA",           icon: Icons.chat,     color: "#10b981" },
];

const SHORT_LABELS: Record<string, string> = {
  "Resumen":           "Resumen",
  "Por Piso":          "Piso",
  "Por Servicio":      "Servicio",
  "Por Producto":      "Producto",
  "Por Fecha":         "Fecha",
  "Esp. Técnicas":     "EETT",
  "Control Documento": "Docs",
  "Chat IA":           "Chat IA",
};

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-nav">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => onTabChange(tab.name)}
              title={tab.name}
              className={`sidebar-tab-btn${isActive ? " active" : ""}`}
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}cc 100%)`
                  : "transparent",
                boxShadow: isActive ? `0 4px 16px ${tab.color}55` : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = `${tab.color}22`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                className="sidebar-tab-icon"
                style={{ opacity: isActive ? 1 : 0.5 }}
              >
                {tab.icon}
              </div>
              <span className="sidebar-tab-label">{SHORT_LABELS[tab.name]}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-avatar-wrap">
        <UserAvatarButton />
      </div>
    </div>
  );
}
