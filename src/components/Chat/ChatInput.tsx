import React, { useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

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
      const newHeight = Math.min(textareaRef.current.scrollHeight, 160);
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
    <div style={{ padding: "12px 24px 20px", display: "flex", justifyContent: "center" }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: "720px",
        background: "#F4F2EC",
        borderRadius: "20px",
        border: focused ? "1px solid #D4C9BC" : "1px solid transparent",
        padding: "12px 14px 10px",
        display: "flex", flexDirection: "column",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: focused ? "0 0 0 3px rgba(207,110,74,0.08)" : "none",
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
            fontSize: "15px", lineHeight: "1.55",
            color: "#1C1B1A",
            padding: "0 2px",
            fontFamily: "inherit",
            maxHeight: "160px",
          }}
        />

        {/* Bottom bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "10px",
        }}>
          {/* Model badge */}
          <span style={{
            fontSize: "12px", color: "#9B958E",
            background: "#EAE7DF",
            borderRadius: "10px",
            padding: "3px 10px",
            fontWeight: 500,
            display: "flex", alignItems: "center", gap: "5px",
            userSelect: "none",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "linear-gradient(135deg, #C9623F, #E8956D)",
              flexShrink: 0,
            }} />
            claude haiku
          </span>

          {/* Send */}
          <button type="submit" disabled={!canSend} style={{
            width: 34, height: 34,
            borderRadius: "50%",
            border: "none",
            background: canSend ? "#1C1B1A" : "#D8D4CC",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: canSend ? "pointer" : "not-allowed",
            transition: "background 0.15s, transform 0.1s",
            flexShrink: 0,
          }}
            onMouseEnter={(e) => { if (canSend) { e.currentTarget.style.background = "#3D3B38"; e.currentTarget.style.transform = "scale(1.05)"; }}}
            onMouseLeave={(e) => { if (canSend) { e.currentTarget.style.background = "#1C1B1A"; e.currentTarget.style.transform = "scale(1)"; }}}
          >
            {isLoading ? (
              <div style={{
                width: 14, height: 14,
                border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }} />
            ) : (
              <ArrowUp size={17} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
