import React, { useEffect, useRef } from "react";
import { SquarePen, PanelLeft, AlertCircle } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatService, Message, ChatError } from "./ChatService";
import type { RawItem, SummaryData } from "../../types";

interface ChatTabProps {
  data: RawItem[];
  summary: SummaryData;
}

/* ── Central icon (hospital/inventory bot) ── */
const CenterIcon = () => (
  <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
    {/* Bot head */}
    <rect x="12" y="20" width="40" height="30" rx="8" stroke="#bbb" strokeWidth="2.5" fill="none"/>
    {/* Eyes */}
    <circle cx="26" cy="35" r="3.5" fill="#bbb"/>
    <circle cx="38" cy="35" r="3.5" fill="#bbb"/>
    {/* Antenna */}
    <path d="M32 20V12" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="32" cy="10" r="3" fill="#bbb"/>
    {/* Mouth */}
    <path d="M26 42h12" stroke="#bbb" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ChatTab: React.FC<ChatTabProps> = ({ data, summary }) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<ChatError | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ChatService.setData(data, summary);
  }, [data, summary]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (userMessage: string) => {
    setIsLoading(true);
    setError(null);

    const userMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await ChatService.sendMessage(userMessage);
      if (result.error) {
        setError(result.error);
      } else if (result.response) {
        setMessages((prev) => [...prev, {
          id: result.response.id,
          role: "assistant",
          content: result.response.response,
          timestamp: result.response.timestamp,
        }]);
      }
    } catch {
      setError({ error: true, message: "Error al procesar la solicitud", code: "UNKNOWN_ERROR" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  const suggestions = [
    "Resumen general del inventario",
    "¿Cuántas sillas hay en total?",
    "Distribución por piso",
    "¿Qué servicios tienen más muebles?",
    "Muebles en Urgencia",
    "Productos de MELMAN SPA",
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 100px)",
      background: "#fff",
      position: "relative",
    }}>
      {/* ── Top bar (Ollama style) ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: "1px solid #f0f0f0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => {}} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "6px", borderRadius: "8px", color: "#666",
            display: "flex",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <PanelLeft size={20} />
          </button>
          <button onClick={handleClearChat} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "6px", borderRadius: "8px", color: "#666",
            display: "flex",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            title="Nuevo chat"
          >
            <SquarePen size={20} />
          </button>
        </div>

        <div style={{ fontSize: "14px", fontWeight: 500, color: "#333" }}>
          Chat IA — Inventario
        </div>

        <div style={{ width: 60 }} /> {/* spacer for centering */}
      </div>

      {/* ── Messages area ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {/* Empty state — Ollama style centered icon */}
        {messages.length === 0 && !error && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "20px", padding: "40px 20px",
          }}>
            <CenterIcon />

            {/* Suggestion chips */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: "8px",
              justifyContent: "center", maxWidth: "600px",
              marginTop: "12px",
            }}>
              {suggestions.map((s) => (
                <button key={s} onClick={() => handleSendMessage(s)} style={{
                  background: "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  color: "#444",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  lineHeight: 1.3,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f8f8"; e.currentTarget.style.borderColor = "#ccc"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e0e0e0"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            margin: "16px auto", maxWidth: "820px", width: "100%", padding: "0 24px",
          }}>
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "12px", padding: "12px 16px",
              display: "flex", gap: "10px", alignItems: "start",
            }}>
              <AlertCircle size={18} style={{ color: "#dc2626", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, color: "#991b1b", fontSize: "14px" }}>{error.message}</div>
                {error.suggestion && (
                  <div style={{ color: "#b91c1c", fontSize: "13px", marginTop: 4 }}>{error.suggestion}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div style={{
            display: "flex", gap: "12px", padding: "16px 24px",
            maxWidth: "820px", margin: "0 auto", width: "100%",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: "#f1f1f1", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="8" width="16" height="12" rx="3" stroke="#555" strokeWidth="1.8" fill="none"/>
                <circle cx="9" cy="14" r="1.5" fill="#555"/>
                <circle cx="15" cy="14" r="1.5" fill="#555"/>
                <path d="M8 8V5a4 4 0 0 1 8 0v3" stroke="#555" strokeWidth="1.8" fill="none"/>
              </svg>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", paddingTop: "10px" }}>
              {[0, 1, 2].map((dot) => (
                <div key={dot} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#bbb",
                  animation: `chatBounce 1.2s ease-in-out ${dot * 0.15}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input (Ollama style) ── */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />

      {/* Keyframe animation */}
      <style>{`
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
