import React, { useRef, useEffect } from "react";
import { ArrowUp, Paperclip } from "lucide-react";

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150);
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
      handleSubmit(e as any);
    }
  };

  const canSend = message.trim().length > 0 && !isLoading && !disabled;

  return (
    <div style={{
      padding: "16px 24px 20px",
      display: "flex", justifyContent: "center",
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: "820px",
        background: "#f4f4f4",
        borderRadius: "24px",
        padding: "10px 16px",
        display: "flex", flexDirection: "column",
        transition: "box-shadow 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Envía un mensaje"
          disabled={isLoading || disabled}
          rows={1}
          style={{
            width: "100%", resize: "none",
            background: "transparent", border: "none", outline: "none",
            fontSize: "15px", lineHeight: "1.5",
            color: "#1a1a1a",
            padding: "4px 2px",
            fontFamily: "inherit",
            maxHeight: "150px",
          }}
        />

        {/* Bottom bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "6px",
        }}>
          {/* Left: attach button */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button type="button" style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "6px", borderRadius: "50%", color: "#888",
              display: "flex", alignItems: "center",
              transition: "background 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e8e8e8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              title="Adjuntar"
            >
              <Paperclip size={18} />
            </button>
          </div>

          {/* Right: model badge + send */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontSize: "12px", color: "#888",
              background: "#e8e8e8", borderRadius: "12px",
              padding: "3px 10px", fontWeight: 500,
              userSelect: "none",
            }}>
              mistral
            </span>

            {/* Send button — Ollama style circle */}
            <button type="submit" disabled={!canSend} style={{
              width: 32, height: 32,
              borderRadius: "50%",
              border: "none",
              background: canSend ? "#1a1a1a" : "#d4d4d4",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: canSend ? "pointer" : "not-allowed",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
              onMouseEnter={(e) => { if (canSend) e.currentTarget.style.background = "#333"; }}
              onMouseLeave={(e) => { if (canSend) e.currentTarget.style.background = "#1a1a1a"; }}
            >
              {isLoading ? (
                <div style={{
                  width: 14, height: 14,
                  border: "2px solid #fff",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }} />
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
