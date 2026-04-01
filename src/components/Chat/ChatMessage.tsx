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
    const regex = /\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:[^)(]|\([^)]*\))+)\)/g;
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
      if (match[1]) {
        parts.push(<strong key={key++} style={{ fontWeight: 600 }}>{match[1]}</strong>);
      } else if (match[2] && match[3]) {
        let href = match[3];
        // Block javascript: and data: URLs (XSS prevention)
        const lower = href.toLowerCase().trim();
        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
          parts.push(match[2]);
          lastIndex = regex.lastIndex;
          continue;
        }
        if (!href.startsWith("http") && !href.startsWith("/")) {
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

    // Table rows: must have | and not be a separator-only line
    if (line.includes("|") && !/^[\|\s\-:]+$/.test(line.trim())) {
      if (!inTable) { inTable = true; tableRows = []; }
      tableRows.push(line.split("|").map((c) => c.trim()).filter(Boolean));
      i++; continue;
    } else if (inTable) {
      flushTable();
    }

    // Skip table separator rows (|---|---| or |:--|:--|) and horizontal rules (--- or ***)
    if (/^[\|\s\-:]+$/.test(line.trim()) && /\|/.test(line)) { i++; continue; }
    if (/^[-*_]{3,}$/.test(line.trim())) { i++; continue; }

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
        padding: "4px 24px",
        maxWidth: "820px", margin: "0 auto", width: "100%",
      }}>
        <div style={{
          background: "#1C1B1A",
          color: "#F5F3EE",
          borderRadius: "18px 18px 4px 18px",
          padding: "10px 16px",
          maxWidth: "72%",
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
      style={{ padding: "4px 24px", maxWidth: "820px", margin: "0 auto", width: "100%" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ fontSize: "14px", color: "#1C1B1A" }}>
        {renderMarkdown(message.content)}
      </div>

      {/* Action buttons */}
      {message.content && (
        <div style={{
          display: "flex", gap: "2px", marginTop: "6px",
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
      )}
    </div>
  );
};
