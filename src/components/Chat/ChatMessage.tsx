import React from "react";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { Message } from "./ChatService";

interface ChatMessageProps {
  message: Message;
}

/* ── Simple Markdown renderer ── */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;
  let tableRows: string[][] = [];
  let inTable = false;

  const BASE = import.meta.env.BASE_URL || "/";

  const parseInline = (line: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    // Match **bold** and [link text](url) in order of appearance
    const regex = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
      if (match[1]) {
        // Bold
        parts.push(<strong key={key++} style={{ color: "#1a202c", fontWeight: 600 }}>{match[1]}</strong>);
      } else if (match[2] && match[3]) {
        // Link — resolve relative paths through BASE
        let href = match[3];
        if (!href.startsWith("http") && !href.startsWith("/")) {
          href = `${BASE}${href}`;
        }
        parts.push(
          <a key={key++} href={href} target="_blank" rel="noopener noreferrer" style={{
            color: "#3182ce", textDecoration: "none", fontWeight: 500,
            borderBottom: "1px solid #bee3f8",
            transition: "all 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#2b6cb0"; e.currentTarget.style.borderBottomColor = "#3182ce"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#3182ce"; e.currentTarget.style.borderBottomColor = "#bee3f8"; }}
          >
            📄 {match[2]}
          </a>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) parts.push(line.slice(lastIndex));
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const flushTable = () => {
    if (tableRows.length < 2) return;
    const headers = tableRows[0];
    const dataRows = tableRows.slice(2);
    result.push(
      <div key={`tbl-${i}`} style={{ overflowX: "auto", margin: "10px 0", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f7fafc" }}>
              {headers.map((h, hi) => (
                <th key={hi} style={{
                  padding: "8px 14px", textAlign: "left",
                  borderBottom: "2px solid #e2e8f0", color: "#4a5568",
                  fontWeight: 600, fontSize: "12px", textTransform: "uppercase",
                  letterSpacing: "0.05em", whiteSpace: "nowrap",
                }}>{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid #edf2f7", background: ri % 2 === 0 ? "#fff" : "#fafbfc" }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: "7px 14px", color: "#2d3748", whiteSpace: "nowrap",
                  }}>{parseInline(cell.trim())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.includes(" | ")) {
      if (!inTable) { inTable = true; tableRows = []; }
      tableRows.push(line.split("|").map((c) => c.trim()).filter(Boolean));
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.trim() === "") {
      result.push(<div key={i} style={{ height: "6px" }} />);
      i++; continue;
    }

    if (/^[•\-]\s/.test(line.trim())) {
      result.push(
        <div key={i} style={{ paddingLeft: "16px", margin: "3px 0", color: "#2d3748", lineHeight: 1.65 }}>
          <span style={{ color: "#718096", marginRight: "8px" }}>•</span>
          {parseInline(line.trim().replace(/^[•\-]\s/, ""))}
        </div>
      );
      i++; continue;
    }

    if (/^\d+\.\s/.test(line.trim())) {
      const num = line.trim().match(/^(\d+)\./)?.[1];
      result.push(
        <div key={i} style={{ paddingLeft: "16px", margin: "3px 0", color: "#2d3748", lineHeight: 1.65 }}>
          <span style={{ color: "#718096", marginRight: "8px" }}>{num}.</span>
          {parseInline(line.trim().replace(/^\d+\.\s/, ""))}
        </div>
      );
      i++; continue;
    }

    if (/^[📊📍🏥🏭📦📋📅🗺️🏠]/.test(line.trim())) {
      result.push(
        <div key={i} style={{
          fontSize: "15px", fontWeight: 600, color: "#1a202c",
          margin: "14px 0 6px",
        }}>
          {parseInline(line.trim())}
        </div>
      );
      i++; continue;
    }

    result.push(
      <div key={i} style={{ margin: "2px 0", color: "#2d3748", lineHeight: 1.65 }}>
        {parseInline(line)}
      </div>
    );
    i++;
  }

  if (inTable) flushTable();
  return result;
}

/* ── Ollama-style llama bot icon ── */
const BotAvatar = () => (
  <div style={{
    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
    background: "#f1f1f1",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {/* Simple robot/assistant icon */}
      <rect x="4" y="8" width="16" height="12" rx="3" stroke="#555" strokeWidth="1.8" fill="none"/>
      <circle cx="9" cy="14" r="1.5" fill="#555"/>
      <circle cx="15" cy="14" r="1.5" fill="#555"/>
      <path d="M8 8V5a4 4 0 0 1 8 0v3" stroke="#555" strokeWidth="1.8" fill="none"/>
    </svg>
  </div>
);

const UserAvatar = () => (
  <div style={{
    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
    background: "#e8f5e9",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

/* ── Message Component ── */
export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: "flex", gap: "12px", padding: "16px 24px",
      maxWidth: "820px", margin: "0 auto", width: "100%",
    }}>
      {isUser ? <UserAvatar /> : <BotAvatar />}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "13px", fontWeight: 600, marginBottom: "4px",
          color: isUser ? "#2e7d32" : "#555",
        }}>
          {isUser ? "Tú" : "Asistente"}
        </div>

        {isUser ? (
          <div style={{
            color: "#1a202c", fontSize: "14px", lineHeight: 1.65,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {message.content}
          </div>
        ) : (
          <div style={{ fontSize: "14px" }}>
            {renderMarkdown(message.content)}
          </div>
        )}

        {!isUser && (
          <div style={{
            display: "flex", gap: "2px", marginTop: "8px",
          }}>
            {[
              { icon: copied ? <Check size={14}/> : <Copy size={14}/>, title: copied ? "Copiado" : "Copiar", onClick: handleCopy, active: copied },
              { icon: <ThumbsUp size={14}/>, title: "Útil", onClick: () => {}, active: false },
              { icon: <ThumbsDown size={14}/>, title: "No útil", onClick: () => {}, active: false },
            ].map((btn, idx) => (
              <button key={idx} onClick={btn.onClick} title={btn.title} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "5px 7px", borderRadius: "6px",
                color: btn.active ? "#4caf50" : "#a0aec0",
                transition: "all 0.15s", display: "flex", alignItems: "center",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f5"; e.currentTarget.style.color = "#555"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = btn.active ? "#4caf50" : "#a0aec0"; }}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
