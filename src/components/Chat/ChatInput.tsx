import React, { useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(24, newHeight)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading && !disabled) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const canSend = message.trim().length > 0 && !isLoading && !disabled;

  return (
    <div style={{
      padding: "8px 20px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      background: "#FAFAF8",
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: "760px",
        background: "#fff",
        borderRadius: "16px",
        border: focused ? "1px solid #C9623F" : "1px solid #E0DDD7",
        padding: "14px 16px 10px",
        display: "flex", flexDirection: "column",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: focused
          ? "0 0 0 3px rgba(201,98,63,0.10), 0 2px 8px rgba(0,0,0,0.06)"
          : "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Pregunta sobre el inventario…"
          disabled={isLoading || disabled}
          rows={1}
          style={{
            width: "100%", resize: "none",
            background: "transparent", border: "none", outline: "none",
            fontSize: "15px", lineHeight: "1.6",
            color: "#1C1B1A",
            padding: "0",
            fontFamily: "inherit",
            maxHeight: "180px",
          }}
        />

        {/* Bottom bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "12px",
        }}>
          {/* Model badge */}
          <span style={{
            fontSize: "11.5px", color: "#9B958E",
            display: "flex", alignItems: "center", gap: "5px",
            userSelect: "none",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "linear-gradient(135deg, #C9623F, #E8956D)",
              flexShrink: 0,
            }} />
            Claude Haiku
          </span>

          {/* Send / Stop */}
          <button
            type="submit"
            disabled={!canSend && !isLoading}
            style={{
              width: 34, height: 34,
              borderRadius: "10px",
              border: "none",
              background: canSend || isLoading ? "#C9623F" : "#E0DDD7",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: canSend || isLoading ? "pointer" : "not-allowed",
              transition: "background 0.15s, transform 0.1s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (canSend || isLoading) {
                e.currentTarget.style.background = "#B5522F";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (canSend || isLoading) {
                e.currentTarget.style.background = "#C9623F";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            {isLoading ? (
              <Square size={14} fill="#fff" strokeWidth={0} />
            ) : (
              <ArrowUp size={17} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </form>

      <div style={{ fontSize: "11px", color: "#C4BFB8", marginTop: "8px", textAlign: "center" }}>
        Los datos provienen del inventario SGD — Hospital Buin Paine
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
