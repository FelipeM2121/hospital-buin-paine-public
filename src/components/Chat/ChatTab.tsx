import React, { useEffect, useRef } from "react";
import { SquarePen, AlertCircle } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { ChatImageAttachment } from "./ChatInput";
import { ChatService } from "./ChatService";
import type { Message, ChatError } from "./ChatService";
import type { RawItem, SummaryData, EETTFile } from "../../types";

interface ChatTabProps {
  data: RawItem[];
  summary: SummaryData;
  eettFiles?: EETTFile[];
}

export const ChatTab: React.FC<ChatTabProps> = ({ data, summary, eettFiles }) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = React.useState(false);
  const [error, setError] = React.useState<ChatError | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstName = "";

  useEffect(() => {
    ChatService.setData(data, summary, eettFiles || []);
  }, [data, summary, eettFiles]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (userMessage: string, image?: ChatImageAttachment) => {
    setIsLoading(true);
    setAnalyzingPhoto(!!image);
    setError(null);

    const userMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
      image: image?.dataUrl,
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
          setAnalyzingPhoto(false);
          setMessages((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((m) => m.id === assistantId);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], content: updated[idx].content + token };
            }
            return updated;
          });
        },
        image,
      );

      if (result.error) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError(result.error);
      } else if (result.response?.detectedRecinto) {
        setMessages((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((m) => m.id === assistantId);
          if (idx !== -1) updated[idx] = { ...updated[idx], detectedRecinto: result.response!.detectedRecinto };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      setError({ error: true, message: "Error al procesar la solicitud", code: "UNKNOWN_ERROR" });
    } finally {
      setIsLoading(false);
      setAnalyzingPhoto(false);
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
      background: COLORS.bg,
      position: "relative",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: `1px solid ${COLORS.borderLight}`,
        background: COLORS.bg,
      }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text }}>
          Asistente IA — Mobiliario No Clínico
        </div>
        <button onClick={handleClearChat} title="Nuevo chat" style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "6px", borderRadius: "8px", color: COLORS.textMuted,
          display: "flex", alignItems: "center",
          transition: "background 0.15s, color 0.15s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.borderLight; e.currentTarget.style.color = COLORS.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = COLORS.textMuted; }}
        >
          <SquarePen size={18} />
        </button>
      </div>

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
              color: COLORS.text, textAlign: "center",
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
              background: `${COLORS.red}10`, border: `1px solid ${COLORS.redLight}`,
              borderRadius: "12px", padding: "12px 16px",
              display: "flex", gap: "10px", alignItems: "start",
            }}>
              <AlertCircle size={18} style={{ color: COLORS.red, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, color: COLORS.red, fontSize: "14px" }}>{error.message}</div>
                {error.suggestion && (
                  <div style={{ color: COLORS.red, fontSize: "13px", marginTop: 4, opacity: 0.85 }}>{error.suggestion}</div>
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
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{ display: "flex", gap: "5px", alignItems: "center", paddingTop: "4px" }}>
              {[0, 1, 2].map((dot) => (
                <div key={dot} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: COLORS.primary,
                  opacity: 0.5,
                  animation: `chatBounce 1.2s ease-in-out ${dot * 0.18}s infinite`,
                }} />
              ))}
            </div>
            {analyzingPhoto && (
              <span style={{ fontSize: "12.5px", color: COLORS.textMuted }}>Identificando recinto en la foto…</span>
            )}
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
          scrollbar-color: ${COLORS.border} transparent;
        }
        .chat-scroll:hover::-webkit-scrollbar-thumb {
          background: ${COLORS.border};
        }
        .chat-scroll:hover::-webkit-scrollbar-thumb:hover {
          background: ${COLORS.textLight};
        }
      `}</style>
    </div>
  );
};
