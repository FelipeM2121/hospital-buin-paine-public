import React, { useEffect, useRef } from "react";
import { SquarePen, AlertCircle, BookOpen, X } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatService, Message, ChatError } from "./ChatService";
import { CatalogoPageViewer } from "../Catalogo/CatalogoPageViewer";
import { mentionsCatalogo } from "../Catalogo/CatalogoHelper";
import type { RawItem, SummaryData, EETTFile } from "../../types";

interface ChatTabProps {
  data: RawItem[];
  summary: SummaryData;
  eettFiles?: EETTFile[];
}

export const ChatTab: React.FC<ChatTabProps> = ({ data, summary, eettFiles }) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<ChatError | null>(null);
  const [showCatalogo, setShowCatalogo] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { accounts } = useMsal();
  const firstName = accounts[0]?.name?.split(" ")[0] ?? "";

  useEffect(() => {
    ChatService.setData(data, summary, eettFiles || []);
  }, [data, summary, eettFiles]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (userMessage: string) => {
    if (mentionsCatalogo(userMessage)) setShowCatalogo(true);
    setIsLoading(true);
    setError(null);

    const userMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    const assistantId = Math.random().toString(36).substr(2, 9);

    setMessages((prev) => [...prev, userMsg, {
      id: assistantId,
      role: "assistant" as const,
      content: "",
      timestamp: new Date().toISOString(),
    }]);

    try {
      const result = await ChatService.sendMessage(
        userMessage,
        undefined,
        undefined,
        (token: string) => {
          setMessages((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((m) => m.id === assistantId);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], content: updated[idx].content + token };
            }
            return updated;
          });
        },
      );

      if (result.error) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError(result.error);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      setError({ error: true, message: "Error al procesar la solicitud", code: "UNKNOWN_ERROR" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    ChatService.clearHistory();
  };

  const isEmpty = messages.length === 0 && !error;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh",
      background: "#f0f6fa",
      position: "relative",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: "1px solid #EDE9E3",
        background: "#f0f6fa",
      }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1C1B1A" }}>
          Asistente IA — Mobiliario No Clínico
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => setShowCatalogo(v => !v)} title="Catálogo Melman" style={{
            background: showCatalogo ? "#E8F4FD" : "none", border: showCatalogo ? "1px solid #3B82F6" : "none",
            cursor: "pointer", padding: "6px", borderRadius: "8px",
            color: showCatalogo ? "#2563EB" : "#9B958E",
            display: "flex", alignItems: "center", gap: "5px",
            transition: "background 0.15s, color 0.15s",
            fontSize: "12px", fontWeight: 500,
          }}
            onMouseEnter={(e) => { if (!showCatalogo) { e.currentTarget.style.background = "#EDE9E3"; e.currentTarget.style.color = "#1C1B1A"; }}}
            onMouseLeave={(e) => { if (!showCatalogo) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9B958E"; }}}
          >
            <BookOpen size={16} />
            Catálogo
          </button>
          <button onClick={handleClearChat} title="Nuevo chat" style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "6px", borderRadius: "8px", color: "#9B958E",
            display: "flex", alignItems: "center",
            transition: "background 0.15s, color 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#EDE9E3"; e.currentTarget.style.color = "#1C1B1A"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9B958E"; }}
          >
            <SquarePen size={18} />
          </button>
        </div>
      </div>

      {/* ── Catalog panel ── */}
      {showCatalogo && (
        <div style={{
          borderBottom: "1px solid #EDE9E3",
          background: "#fff",
          padding: "12px 16px",
          maxHeight: "480px",
          overflowY: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1C1B1A" }}>Catálogo Melman</span>
            <button onClick={() => setShowCatalogo(false)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "4px", borderRadius: "6px", color: "#9B958E",
              display: "flex", alignItems: "center",
            }}>
              <X size={16} />
            </button>
          </div>
          <CatalogoPageViewer />
        </div>
      )}

      {/* ── Messages area ── */}
      <div className="chat-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* Empty state */}
        {isEmpty && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "20px", padding: "60px 24px 40px",
          }}>
            <img
              src={`${import.meta.env.BASE_URL}logo-buin-paine.png`}
              alt="Hospital Buin Paine"
              style={{ height: 90, width: "auto", objectFit: "contain" }}
            />
            <div style={{
              fontSize: "34px", fontWeight: 700,
              color: "#1C1B1A", textAlign: "center",
              letterSpacing: "-0.8px", lineHeight: 1.2,
            }}>
              ¿En qué puedo ayudarte{firstName ? `, ${firstName}` : ""}?
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ margin: "16px auto", maxWidth: "720px", width: "100%", padding: "0 24px" }}>
            <div style={{
              background: "#FEF5F2", border: "1px solid #F5C6B4",
              borderRadius: "12px", padding: "12px 16px",
              display: "flex", gap: "10px", alignItems: "start",
            }}>
              <AlertCircle size={18} style={{ color: "#C9623F", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, color: "#8B3A22", fontSize: "14px" }}>{error.message}</div>
                {error.suggestion && (
                  <div style={{ color: "#A04A2A", fontSize: "13px", marginTop: 4 }}>{error.suggestion}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ paddingTop: isEmpty ? 0 : "20px", paddingBottom: "8px" }}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </div>

        {/* Typing indicator */}
        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div style={{
            padding: "8px 24px 8px 28px",
            maxWidth: "820px", margin: "0 auto", width: "100%",
          }}>
            <div style={{ display: "flex", gap: "5px", alignItems: "center", paddingTop: "4px" }}>
              {[0, 1, 2].map((dot) => (
                <div key={dot} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#C9623F",
                  opacity: 0.5,
                  animation: `chatBounce 1.2s ease-in-out ${dot * 0.18}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />

      <style>{`
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-5px); opacity: 0.9; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .chat-scroll {
          scrollbar-width: none;
        }
        .chat-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 10px;
          transition: background 0.2s;
        }
        .chat-scroll:hover {
          scrollbar-width: thin;
          scrollbar-color: #D4CEC7 transparent;
        }
        .chat-scroll:hover::-webkit-scrollbar-thumb {
          background: #D4CEC7;
        }
        .chat-scroll:hover::-webkit-scrollbar-thumb:hover {
          background: #B8B2AB;
        }
      `}</style>
    </div>
  );
};
