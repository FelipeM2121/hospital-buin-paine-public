import { useState, useMemo, useCallback } from "react";
import controlDocData from "../data/controlDocumentos.json";
import "./ControlDocumentos.css";

interface FolderNode {
  name: string;
  level: number;
  path: string;
  children: FolderNode[];
  childCount: number;
}

const BASE_URL = controlDocData.base;
const SUFFIX = controlDocData.suffix;
const CATEGORIES = controlDocData.categories as string[];
const TOTAL_FOLDERS = controlDocData.totalFolders;
const MAX_LEVEL = controlDocData.maxLevel;
const GENERATED_DATE = controlDocData.generatedDate;

function buildTree(flat: [string, number, string][]): FolderNode[] {
  const root: FolderNode[] = [];
  const stack: { children: FolderNode[]; level: number }[] = [{ children: root, level: 0 }];

  for (const [name, level, path] of flat) {
    const node: FolderNode = { name, level, path, children: [], childCount: 0 };
    while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  function countChildren(node: FolderNode): number {
    let c = node.children.length;
    for (const child of node.children) c += countChildren(child);
    node.childCount = c;
    return c;
  }
  root.forEach(countChildren);
  return root;
}

const TREE = buildTree(controlDocData.folders as [string, number, string][]);

const CATEGORY_COLORS: Record<string, string> = {
  MNC: "#8b5cf6",
};

function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function matchesSearch(node: FolderNode, term: string): boolean {
  if (normalize(node.name).includes(term)) return true;
  return node.children.some((c) => matchesSearch(c, term));
}

function TreeNode({
  node,
  expanded,
  toggleExpand,
  searchTerm,
  depth = 0,
}: {
  node: FolderNode;
  expanded: Set<string>;
  toggleExpand: (path: string) => void;
  searchTerm: string;
  depth?: number;
}) {
  const isOpen = expanded.has(node.path);
  const hasChildren = node.children.length > 0;
  const isRoot = node.level === 1;
  const color = isRoot ? CATEGORY_COLORS[node.name] || "#00b4d8" : undefined;
  const encodedPath = node.path.split("/").map(encodeURIComponent).join("/");
  const link = `${BASE_URL}/${encodedPath}${SUFFIX}`;

  return (
    <div className={`tree-item ${isRoot ? "tree-root" : ""}`}>
      <div
        className={`tree-row ${isOpen ? "open" : ""} ${isRoot ? "root-row" : ""}`}
        style={{ paddingLeft: isRoot ? 12 : 12 + depth * 20 }}
        onClick={() => hasChildren && toggleExpand(node.path)}
      >
        <span className="tree-toggle">
          {hasChildren ? (isOpen ? "\u25BC" : "\u25B6") : "\u00A0\u00A0"}
        </span>
        {isRoot && color && <span className="cat-dot" style={{ background: color }} />}
        <span className="tree-icon">{isRoot ? "\uD83D\uDCC2" : hasChildren ? "\uD83D\uDCC1" : "\uD83D\uDCC1"}</span>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="tree-name-link"
          title={`Abrir "${node.name}" en SharePoint`}
          onClick={(e) => e.stopPropagation()}
        >
          {node.name}
        </a>
        {hasChildren && <span className="tree-count">{node.childCount}</span>}
      </div>
      {isOpen && hasChildren && (
        <div className="tree-children">
          {node.children
            .filter((c) => !searchTerm || matchesSearch(c, searchTerm))
            .map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                expanded={expanded}
                toggleExpand={toggleExpand}
                searchTerm={searchTerm}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function ControlDocumentos() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(TREE.map((t) => t.path)));
  const searchTerm = useMemo(() => normalize(search.trim()), [search]);

  const toggleExpand = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const all = new Set<string>();
    function walk(nodes: FolderNode[]) {
      for (const n of nodes) {
        if (n.children.length > 0) {
          all.add(n.path);
          walk(n.children);
        }
      }
    }
    walk(TREE);
    setExpanded(all);
  }, []);

  const collapseAll = useCallback(() => {
    setExpanded(new Set(TREE.map((t) => t.path)));
  }, []);

  const filteredTree = useMemo(() => {
    if (searchTerm) return TREE.filter((n) => matchesSearch(n, searchTerm));
    return TREE;
  }, [searchTerm]);

  return (
    <div className="control-documentos">
      {/* KPI Cards */}
      <div className="cd-kpis">
        <div className="cd-kpi-card cd-kpi-total">
          <div className="cd-kpi-value">{TOTAL_FOLDERS.toLocaleString("es-CL")}</div>
          <div className="cd-kpi-label">Total Carpetas</div>
        </div>
        <div className="cd-kpi-card" style={{ borderTop: "4px solid #8b5cf6" }}>
          <div className="cd-kpi-value" style={{ color: "#8b5cf6" }}>
            {TREE[0]?.children?.length || 0}
          </div>
          <div className="cd-kpi-label">Subcarpetas Nivel 2</div>
        </div>
        <div className="cd-kpi-card" style={{ borderTop: "4px solid #00b4d8" }}>
          <div className="cd-kpi-value" style={{ color: "#00b4d8" }}>{MAX_LEVEL}</div>
          <div className="cd-kpi-label">Niveles de Profundidad</div>
        </div>
      </div>

      {/* Controls */}
      <div className="cd-controls">
        <div className="cd-search-wrap">
          <svg className="cd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="cd-search"
            type="text"
            placeholder="Buscar carpeta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="cd-search-clear" onClick={() => setSearch("")}>
              x
            </button>
          )}
        </div>
        <div className="cd-btn-group">
          <button className="cd-btn" onClick={expandAll} title="Expandir todo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Expandir
          </button>
          <button className="cd-btn" onClick={collapseAll} title="Colapsar todo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            Colapsar
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="cd-breadcrumb">
        Documentos &gt; Operaciones &gt; CHI HBP &gt; 03 ADQ-REP &gt; 3.- 360 - SGD SC &gt; MNC
      </div>

      {/* Tree */}
      <div className="cd-tree">
        {filteredTree.length === 0 ? (
          <div className="cd-empty">No se encontraron carpetas</div>
        ) : (
          filteredTree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              expanded={expanded}
              toggleExpand={toggleExpand}
              searchTerm={searchTerm}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="cd-footer">
        <span>{TOTAL_FOLDERS.toLocaleString("es-CL")} carpetas | {MAX_LEVEL} niveles | MNC</span>
        <span>Generado: {GENERATED_DATE}</span>
      </div>
    </div>
  );
}
