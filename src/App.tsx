import { useState } from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { LoginPage } from "./components/LoginPage";
import { ControlDocumentos } from "./components/ControlDocumentos";
import {
  ResumenTab,
  PorPisoTab,
  PorServicioTab,
  PorProductoTab,
  PorFechaTab,
  EspecificacionesTecnicasTab,
} from "./components/Dashboard";
import { ChatTab } from "./components/Chat/ChatTab";
import { RAW, SUMMARY, EETT_FILES } from "./data";
import { PdfViewer } from "./components/PdfViewer";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import "./styles/charts-mobile.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("Resumen");
  const S = SUMMARY;

  return (
    <>
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>
      <AuthenticatedTemplate>
        <div style={{ minHeight: "100vh", display: "flex" }} className="app-shell">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "Chat IA" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#FAFAF8", height: "100vh" }}>
              <ChatTab data={RAW} summary={S} eettFiles={EETT_FILES} />
            </div>
          ) : (
            <div className="main-content">
              <div className="content-container">
                <Header activeTab={activeTab} />

                {activeTab === "Resumen" && <ResumenTab summary={S} data={RAW} />}
                {activeTab === "Por Piso" && <PorPisoTab summary={S} />}
                {activeTab === "Por Servicio" && <PorServicioTab summary={S} />}
                {activeTab === "Por Producto" && <PorProductoTab summary={S} />}
                {activeTab === "Por Fecha" && <PorFechaTab summary={S} />}
                {activeTab === "Esp. Técnicas" && (
                  <EspecificacionesTecnicasTab eettFiles={EETT_FILES} pdfViewer={PdfViewer} />
                )}
                {activeTab === "Control Documento" && <ControlDocumentos />}

                <div className="dashboard-footer">
                  <span>Hospital Buin Paine • Mobiliario No Clínico</span>
                  <span>Fuente: MNC_Claude_20260209.xlsx • {S.totalQty.toLocaleString("es-CL")} unidades</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </AuthenticatedTemplate>
    </>
  );
}
