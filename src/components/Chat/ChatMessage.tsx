import React from "react";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { Message } from "./ChatService";

interface ChatMessageProps {
  message: Message;
}

/* ── Markdown renderer ── */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;
  let tableRows: string[][] = [];
  let inTable = false;

  const BASE = import.meta.env.BASE_URL || "/";

  const parseInline = (line: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
      if (match[1]) {
        parts.push(<strong key={key++} style={{ fontWeight: 600 }}>{match[1]}</strong>);
      } else if (match[2] && match[3]) {
        let href = match[3];
        if (!href.startsWith("http") && !href.startsWith("/")) {
          // Only encode if not already encoded
          const alreadyEncoded = href.includes("%20") || href.includes("%28");
          const encoded = alreadyEncoded ? href : href.split("/").map(encodeURIComponent).join("/");
          href = `${BASE}${encoded}`;
        }
        parts.push(
          <a key={key++} href={href} target="_blank" rel="noopener noreferrer" style={{
            color: "#CF6E4A", textDecoration: "underline", textUnderlineOffset: "3px",
          }}>
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
      <div key={`tbl-${i}`} style={{ overflowX: "auto", margin: "12px 0", borderRadius: "10px", border: "1px solid #E8E5DF" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#F5F3EE" }}>
              {headers.map((h, hi) => (
                <th key={hi} style={{
                  padding: "9px 14px", textAlign: "left",
                  borderBottom: "1px solid #E8E5DF", color: "#6B6560",
                  fontWeight: 600, fontSize: "12px", textTransform: "uppercase",
                  letterSpacing: "0.04em", whiteSpace: "nowrap",
                }}>{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid #F0EDE8", background: ri % 2 === 0 ? "#fff" : "#FAFAF8" }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "8px 14px", color: "#1C1B1A", whiteSpace: "nowrap" }}>
                    {parseInline(cell.trim())}
                  </td>
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
      i++; continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.trim() === "") {
      result.push(<div key={i} style={{ height: "8px" }} />);
      i++; continue;
    }

    if (/^#{1,3}\s/.test(line.trim())) {
      result.push(
        <div key={i} style={{ fontSize: "15px", fontWeight: 600, color: "#1C1B1A", margin: "16px 0 6px" }}>
          {parseInline(line.trim().replace(/^#{1,3}\s/, ""))}
        </div>
      );
      i++; continue;
    }

    if (/^[•\-]\s/.test(line.trim())) {
      result.push(
        <div key={i} style={{ paddingLeft: "16px", margin: "3px 0", color: "#1C1B1A", lineHeight: 1.7 }}>
          <span style={{ color: "#9B958E", marginRight: "8px" }}>•</span>
          {parseInline(line.trim().replace(/^[•\-]\s/, ""))}
        </div>
      );
      i++; continue;
    }

    if (/^\d+\.\s/.test(line.trim())) {
      const num = line.trim().match(/^(\d+)\./)?.[1];
      result.push(
        <div key={i} style={{ paddingLeft: "16px", margin: "3px 0", color: "#1C1B1A", lineHeight: 1.7 }}>
          <span style={{ color: "#9B958E", marginRight: "8px" }}>{num}.</span>
          {parseInline(line.trim().replace(/^\d+\.\s/, ""))}
        </div>
      );
      i++; continue;
    }

    result.push(
      <div key={i} style={{ margin: "2px 0", color: "#1C1B1A", lineHeight: 1.7 }}>
        {parseInline(line)}
      </div>
    );
    i++;
  }

  if (inTable) flushTable();
  return result;
}

/* ── Claude "C" avatar ── */
const ClaudeAvatar = () => (
  <div style={{
    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(135deg, #C9623F 0%, #E8956D 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: "13px",
    fontFamily: "Georgia, 'Times New Roman', serif",
    letterSpacing: "-0.5px",
    boxShadow: "0 1px 3px rgba(201,98,63,0.3)",
  }}>
    C
  </div>
);

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div style={{
        display: "flex", justifyContent: "flex-end",
        padding: "6px 24px",
        maxWidth: "820px", margin: "0 auto", width: "100%",
      }}>
        <div style={{
          background: "#1C1B1A",
          color: "#F5F3EE",
          borderRadius: "18px 18px 4px 18px",
          padding: "10px 16px",
          maxWidth: "75%",
          fontSize: "14px", lineHeight: 1.65,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ padding: "6px 24px", maxWidth: "820px", margin: "0 auto", width: "100%" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div style={{ paddingTop: "2px" }}>
          <ClaudeAvatar />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px" }}>
            {renderMarkdown(message.content)}
          </div>

          {/* Action buttons */}
          <div style={{
            display: "flex", gap: "2px", marginTop: "8px",
            opacity: hovered ? 1 : 0, transition: "opacity 0.15s",
          }}>
            {[
              { icon: copied ? <Check size={14}/> : <Copy size={14}/>, title: copied ? "Copiado" : "Copiar", onClick: handleCopy, active: copied },
              { icon: <ThumbsUp size={14}/>, title: "Útil", onClick: () => {}, active: false },
              { icon: <ThumbsDown size={14}/>, title: "No útil", onClick: () => {}, active: false },
            ].map((btn, idx) => (
              <button key={idx} onClick={btn.onClick} title={btn.title} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "5px 7px", borderRadius: "6px",
                color: btn.active ? "#CF6E4A" : "#9B958E",
                transition: "all 0.15s", display: "flex", alignItems: "center",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F0EDE8"; e.currentTarget.style.color = "#1C1B1A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = btn.active ? "#CF6E4A" : "#9B958E"; }}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
