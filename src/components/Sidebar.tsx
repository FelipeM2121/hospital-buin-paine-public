import { COLORS } from "../constants/theme";
import { Icons } from "../constants/icons";
import { UserAvatarButton } from "./UserAvatarButton";

export interface TabConfig {
  name: string;
  icon: JSX.Element;
  color: string;
}

export const TABS: TabConfig[] = [
  { name: "Resumen",      icon: Icons.chart,    color: COLORS.primary },
  { name: "Por Piso",     icon: Icons.layers,   color: COLORS.cyan },
  { name: "Por Servicio", icon: Icons.hospital, color: COLORS.red },
  { name: "Por Producto", icon: Icons.box,      color: COLORS.purple },
  { name: "Por Fecha",    icon: Icons.calendar, color: "#f59e0b" },
  { name: "Esp. Técnicas",      icon: Icons.document, color: "#14b8a6" },
  { name: "Control Documento",  icon: Icons.tree,     color: "#7c3aed" },
  { name: "Chat IA",           icon: Icons.chat,    color: "#10b981" },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div style={{
      width: 72,
      minWidth: 72,
      background: COLORS.sidebar,
      padding: "20px 0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
      boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
      zIndex: 10,
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: "100%", paddingTop: 4 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => onTabChange(tab.name)}
              title={tab.name}
              style={{
                width: 52, height: 52,
                background: isActive
                  ? `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}cc 100%)`
                  : "transparent",
                border: "none",
                borderRadius: 15,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.18s ease",
                boxShadow: isActive ? `0 4px 16px ${tab.color}55` : "none",
                padding: 0,
                marginBottom: 0,
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
              <div style={{
                width: 26, height: 26,
                opacity: isActive ? 1 : 0.5,
                filter: isActive ? "none" : `drop-shadow(0 0 0 transparent)`,
                transition: "opacity 0.18s ease",
              }}>
                {tab.icon}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ padding: "16px 0 4px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 32, height: 2, borderRadius: 2,
          background: "rgba(255,255,255,0.12)",
        }} />
      </div>

      <UserAvatarButton />
    </div>
  );
}
