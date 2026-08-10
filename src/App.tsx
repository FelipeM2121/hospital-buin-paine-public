import { useState } from "react";
import {
  ResumenTab,
  PorFechaTab,
  DespachoTab,
  EspecificacionesTecnicasTab,
} from "./components/Dashboard";
import { ChatTab } from "./components/Chat/ChatTab";
import { RAW, SUMMARY, EETT_FILES, DESPACHO_PROGRESS, DESPACHO_BATCHES, DESPACHO_DETALLE } from "./data";
import { PdfViewer } from "./components/PdfViewer";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import "./styles/charts-mobile.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("Resumen");
  const S = SUMMARY;

  return (
    <div style={{ minHeight: "100vh", display: "flex" }} className="app-shell">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "Chat IA" ? (
        <div className="chat-content-wrap">
          <ChatTab data={RAW} summary={S} eettFiles={EETT_FILES} />
        </div>
      ) : (
        <div className="main-content">
          <div className="content-container">
            <Header activeTab={activeTab} />

            {activeTab === "Resumen" && <ResumenTab summary={S} data={RAW} />}
            {activeTab === "Por Fecha" && <PorFechaTab summary={S} />}
            {activeTab === "Despacho" && <DespachoTab progress={DESPACHO_PROGRESS} batches={DESPACHO_BATCHES} detalle={DESPACHO_DETALLE} />}
            {activeTab === "Esp. Técnicas" && (
              <EspecificacionesTecnicasTab eettFiles={EETT_FILES} pdfViewer={PdfViewer} />
            )}
            <div className="dashboard-footer">
              <span>Hospital Buin Paine • Mobiliario No Clínico</span>
              <span>Fuente: Cronograma MNC_20260327 • {S.totalQty.toLocaleString("es-CL")} unidades</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
