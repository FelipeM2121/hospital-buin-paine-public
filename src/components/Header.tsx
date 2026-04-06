import { COLORS } from "../constants/theme";
import { TABS } from "./Sidebar";

const TAB_TITLES: Record<string, string> = {
  "Resumen":           "Resumen General",
  "Por Piso":          "Distribución por Piso",
  "Por Servicio":      "Análisis por Servicio",
  "Por Producto":      "Top Productos",
  "Por Fecha":         "Cronograma de Instalación",
  "Esp. Técnicas":     "Especificaciones Técnicas",
  "Control Documento": "Control Documentos",
};

interface HeaderProps {
  activeTab: string;
}

export function Header({ activeTab }: HeaderProps) {
  const activeTabData = TABS.find(t => t.name === activeTab);

  return (
    <div className="dashboard-header">
      <div className="dashboard-header-left">
        <img
          src={`${import.meta.env.BASE_URL}logo-buin-paine.png`}
          alt="Hospital Buin Paine"
          className="dashboard-logo"
        />
        <div>
          <h1 className="dashboard-title">
            {TAB_TITLES[activeTab] ?? activeTab}
          </h1>
          <p className="dashboard-subtitle">
            Dashboard Mobiliario No Clínico — Hospital Buin Paine
          </p>
        </div>
      </div>

      <div
        className="dashboard-tab-badge"
        style={{
          background: `${activeTabData?.color || COLORS.primary}18`,
          color: activeTabData?.color || COLORS.primary,
          border: `1px solid ${activeTabData?.color || COLORS.primary}30`,
        }}
      >
        <div
          className="dashboard-tab-badge-icon"
          style={{
            filter: `brightness(0) saturate(100%) invert(30%) sepia(80%) saturate(500%) hue-rotate(${activeTab === "Por Servicio" ? "0" : "230"}deg)`,
          }}
        >
          {activeTabData?.icon}
        </div>
        <span>{activeTab}</span>
      </div>
    </div>
  );
}
