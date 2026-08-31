import type { RawItem, SummaryData, EETTFile } from "../../types";
import { RECINTO_NOMBRES } from "../../data/recintoNombres";
import { FAMILIAS, familiaPorCodigoEETT } from "../../data/familias";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  image?: string;
  detectedRecinto?: string;
}

export interface ChatImageAttachment {
  dataUrl: string;
  mediaType: string;
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

type ApiMessage = { role: string; content: string | ContentBlock[] };

export interface ChatError {
  error: boolean;
  message: string;
  code?: string;
  suggestion?: string;
}

/* ═══════════════════════════════════════════════════════════════
   Chat Service — Groq LLaMA AI con Smart Context Selection
   Solo inyecta datos RELEVANTES a la pregunta → rápido y preciso
   ═══════════════════════════════════════════════════════════════ */

// La llamada real a Anthropic ocurre en netlify/functions/chat.mts (server-side),
// para no exponer la API key en el bundle del navegador.
const CHAT_PROXY_URL = "/api/chat";
const MODEL = "claude-sonnet-4-6";

const fmt = (n: number) => n.toLocaleString("es-CL");

// ── EETT knowledge base ──
const EETT_KNOWLEDGE: Record<string, { desc: string; material: string; dimensiones: string; color: string }> = {
  "201.001": { desc: "Estación de trabajo para oficinas administrativas", material: "Estructura metálica, cubierta melamina 25mm", dimensiones: "1600x700x750mm", color: "Cubierta haya/roble, estructura gris/negro" },
  "201.002": { desc: "Mesa lateral auxiliar hospitalaria", material: "Cubierta melamina, estructura metálica tubular", dimensiones: "450x450x550mm", color: "Cubierta haya, estructura gris" },
  "201.003": { desc: "Mesa párvulo inclusión, adaptada para silla de ruedas", material: "Cubierta melamina, estructura metálica", dimensiones: "800x600x560mm regulable", color: "Colores infantiles" },
  "201.004": { desc: "Mesa párvulo tipo I para sala cuna", material: "Cubierta melamina, patas madera/metal", dimensiones: "600x600x460mm", color: "Colores infantiles" },
  "201.005": { desc: "Mesa párvulo tipo II para actividades grupales", material: "Cubierta melamina, estructura metálica", dimensiones: "1200x600x460mm", color: "Colores infantiles" },
  "201.008": { desc: "Mesa reuniones tipo I, 6-8 personas", material: "Cubierta melamina 25mm, base metálica", dimensiones: "2000x1000x750mm", color: "Haya/roble, base cromada" },
  "201.009": { desc: "Mesa reuniones tipo II, 8-10 personas", material: "Cubierta melamina 25mm, base metálica", dimensiones: "2400x1200x750mm", color: "Haya/roble" },
  "201.010": { desc: "Mesa reuniones tipo III directiva, 10-14 personas", material: "Cubierta melamina 25mm o enchapada", dimensiones: "3000x1200x750mm", color: "Roble/nogal" },
  "201.011": { desc: "Mesa tipo casino rectangular para comedor", material: "Cubierta melamina HPL, estructura metálica", dimensiones: "1200x800x750mm", color: "Blanca, estructura gris" },
  "201.011B": { desc: "Mesa tipo casino circular Ø90cm", material: "Cubierta melamina HPL, base central metálica", dimensiones: "Ø900x750mm", color: "Blanca, base cromada" },
  "202.001": { desc: "Atril graduable para lectura/presentaciones", material: "Estructura metálica tubular", dimensiones: "Regulable 800-1200mm", color: "Negro/gris" },
  "202.006": { desc: "Cama apilable para sala cuna", material: "Estructura metálica, colchoneta espuma", dimensiones: "1300x550x250mm", color: "Colores variados" },
  "202.008": { desc: "Cuna alta hospitalaria para neonatología", material: "Estructura metálica, barandas transparentes", dimensiones: "900x500x900mm", color: "Blanco" },
  "202.009": { desc: "Cuna baja para sala cuna", material: "Madera MDF y metal", dimensiones: "1200x600x400mm", color: "Natural/blanco" },
  "202.012": { desc: "Mueble locker metálico para vestuario", material: "Acero laminado, pintura electrostática", dimensiones: "380x450x1800mm", color: "Gris/beige" },
  "203.014": { desc: "Librero estantería para oficinas", material: "Melamina 18mm", dimensiones: "800x350x1800mm", color: "Haya/roble/blanco" },
  "203.015": { desc: "Mueble arrimo bajo para apoyo", material: "Melamina 18mm", dimensiones: "1200x400x750mm", color: "Haya/roble" },
  "203.016": { desc: "Mueble tipo biblioteca grande", material: "Melamina 25mm reforzada", dimensiones: "900x400x2000mm", color: "Haya/roble" },
  "203.018": { desc: "Perchero de pie", material: "Base metálica, poste cromado", dimensiones: "Ø400x1700mm", color: "Cromado/negro" },
  "203.022": { desc: "Contenedor de almacenamiento", material: "Polietileno alta densidad / metálico", dimensiones: "Variable", color: "Gris/azul" },
  "204.001": { desc: "Banca de espera metálica 3 cuerpos", material: "Asiento madera contrachapada, estructura metálica", dimensiones: "1500x500x430mm", color: "Haya, estructura gris" },
  "204.002": { desc: "Banca de madera para exteriores", material: "Madera sólida tratada, estructura metálica", dimensiones: "1800x600x450mm", color: "Madera natural" },
  "204.003": { desc: "Silla adulto multiuso apilable", material: "Polipropileno, estructura metálica tubular", dimensiones: "450x450x800mm", color: "Colores variados, cromada" },
  "204.005": { desc: "Silla bacínica con apertura higiénica", material: "Aluminio, asiento polietileno", dimensiones: "500x500x850mm", color: "Gris/blanco" },
  "204.006": { desc: "Silla ergonómica respaldo alto administrativa", material: "Malla respaldo, espuma inyectada, base nylon", dimensiones: "Regulable, asiento 450x450mm", color: "Negro" },
  "204.006B": { desc: "Taburete con ruedas sin respaldo clínico", material: "Espuma asiento, base cromada", dimensiones: "Ø350, altura 450-600mm", color: "Negro/gris" },
  "204.007": { desc: "Silla lactante baja para sala cuna", material: "Madera y espuma tapizada", dimensiones: "400x400x300mm", color: "Colores infantiles" },
  "204.009": { desc: "Silla párvulo para niños", material: "Polipropileno resistente", dimensiones: "340x340x560mm", color: "Colores variados" },
  "204.010": { desc: "Silla tipo casino para comedor", material: "Polipropileno, estructura metálica", dimensiones: "440x440x800mm", color: "Blanco/gris, cromada" },
  "204.011": { desc: "Silla tipo universitaria con paleta", material: "Polipropileno, paleta melamina, metálica", dimensiones: "450x500x800mm", color: "Azul/gris, paleta haya" },
  "204.012": { desc: "Silla visita con brazos apilable", material: "Espuma tapizada, estructura cromada", dimensiones: "450x550x800mm", color: "Tapiz azul/gris/negro" },
  "204.013": { desc: "Sillón 1 cuerpo para salas de espera", material: "Espuma alta densidad, tapiz antibacteriano", dimensiones: "700x750x800mm", color: "Azul/gris institucional" },
  "204.014": { desc: "Sillón 2 cuerpos", material: "Espuma alta densidad, tapiz antibacteriano", dimensiones: "1300x750x800mm", color: "Azul/gris institucional" },
  "204.015": { desc: "Sillón bergere reclinable hospitalización", material: "Espuma HR, tapiz antibacteriano lavable", dimensiones: "700x800x1050mm", color: "Azul/gris" },
  "204.019": { desc: "Silla apoyo hora ingesta con bandeja", material: "Metálica, polipropileno con bandeja", dimensiones: "500x500x850mm", color: "Blanco/gris" },
  "204.020": { desc: "Butaca espera 3 cuerpos", material: "Polipropileno, estructura metálica", dimensiones: "1700x550x800mm", color: "Azul/gris, cromada" },
};

// ── Pre-computed data indexes (built once on setData) ──
interface RecintoInfo {
  piso: number;
  servicio: string;
  zona: string;
  qty: number;
  prods: Record<string, number>;
}

interface DataIndex {
  byFamilia: Record<string, number>;
  byProveedor: Record<string, number>;
  byPiso: Record<string, number>;
  byServicio: Record<string, number>;
  byNombre: Record<string, number>;
  byZona: Record<string, number>;
  servProd: Record<string, Record<string, number>>;
  prodPiso: Record<string, Record<string, number>>;
  prodServ: Record<string, Record<string, number>>;
  provFam: Record<string, Record<string, number>>;
  provProd: Record<string, Record<string, number>>;
  pisoServ: Record<number, Record<string, number>>;
  famProd: Record<string, Record<string, number>>;
  recintoDetail: Record<string, RecintoInfo>;
  servRecintos: Record<string, string[]>;
}

function buildIndex(data: RawItem[]): DataIndex {
  const idx: DataIndex = {
    byFamilia: {}, byProveedor: {}, byPiso: {}, byServicio: {},
    byNombre: {}, byZona: {}, servProd: {}, prodPiso: {}, prodServ: {},
    provFam: {}, provProd: {}, pisoServ: {}, famProd: {},
    recintoDetail: {}, servRecintos: {},
  };

  data.forEach((i) => {
    idx.byFamilia[i.familia] = (idx.byFamilia[i.familia] || 0) + i.cantidad;
    idx.byProveedor[i.proveedor] = (idx.byProveedor[i.proveedor] || 0) + i.cantidad;
    idx.byPiso[`Piso ${i.piso}`] = (idx.byPiso[`Piso ${i.piso}`] || 0) + i.cantidad;
    idx.byServicio[i.servicio] = (idx.byServicio[i.servicio] || 0) + i.cantidad;
    idx.byNombre[i.nombre] = (idx.byNombre[i.nombre] || 0) + i.cantidad;
    idx.byZona[i.zona] = (idx.byZona[i.zona] || 0) + i.cantidad;

    if (!idx.prodPiso[i.nombre]) idx.prodPiso[i.nombre] = {};
    idx.prodPiso[i.nombre][`P${i.piso}`] = (idx.prodPiso[i.nombre][`P${i.piso}`] || 0) + i.cantidad;

    if (!idx.servProd[i.servicio]) idx.servProd[i.servicio] = {};
    idx.servProd[i.servicio][i.nombre] = (idx.servProd[i.servicio][i.nombre] || 0) + i.cantidad;

    if (!idx.prodServ[i.nombre]) idx.prodServ[i.nombre] = {};
    idx.prodServ[i.nombre][i.servicio] = (idx.prodServ[i.nombre][i.servicio] || 0) + i.cantidad;

    if (!idx.provFam[i.proveedor]) idx.provFam[i.proveedor] = {};
    idx.provFam[i.proveedor][i.familia] = (idx.provFam[i.proveedor][i.familia] || 0) + i.cantidad;

    // Proveedor → Productos
    if (!idx.provProd[i.proveedor]) idx.provProd[i.proveedor] = {};
    idx.provProd[i.proveedor][i.nombre] = (idx.provProd[i.proveedor][i.nombre] || 0) + i.cantidad;

    // Piso → Servicios
    if (!idx.pisoServ[i.piso]) idx.pisoServ[i.piso] = {};
    idx.pisoServ[i.piso][i.servicio] = (idx.pisoServ[i.piso][i.servicio] || 0) + i.cantidad;

    // Familia → Productos
    if (!idx.famProd[i.familia]) idx.famProd[i.familia] = {};
    idx.famProd[i.familia][i.nombre] = (idx.famProd[i.familia][i.nombre] || 0) + i.cantidad;

    // Recinto → detalle completo
    if (!idx.recintoDetail[i.recinto]) {
      idx.recintoDetail[i.recinto] = { piso: i.piso, servicio: i.servicio, zona: i.zona, qty: 0, prods: {} };
    }
    idx.recintoDetail[i.recinto].qty += i.cantidad;
    idx.recintoDetail[i.recinto].prods[i.nombre] = (idx.recintoDetail[i.recinto].prods[i.nombre] || 0) + i.cantidad;

    // Servicio → lista de recintos
    if (!idx.servRecintos[i.servicio]) idx.servRecintos[i.servicio] = [];
    if (!idx.servRecintos[i.servicio].includes(i.recinto)) idx.servRecintos[i.servicio].push(i.recinto);
  });

  return idx;
}

const sortDesc = (obj: Record<string, number>) =>
  Object.entries(obj).sort(([, a], [, b]) => b - a);

// ── Recinto code matching (tolerant to OCR errors) ──
function normalizeRecintoCode(s: string): string {
  return s
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[–—−]/g, "-")
    .replace(/[-_]/g, "_") // guion y guion bajo son equivalentes (sufijos tipo _A se pueden leer como "-A")
    .replace(/O(?=\d)|(?<=\d)O/g, "0"); // letra O confundida con cero junto a dígitos
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function matchThreshold(normalizedLength: number): number {
  return normalizedLength <= 6 ? 1 : 2;
}

function matchRecintoCode(rawCode: string, knownCodes: string[]): { code: string; exact: boolean } | null {
  if (!rawCode || rawCode === "NO_DETECTADO") return null;
  const normalized = normalizeRecintoCode(rawCode);
  const byNormalized = new Map(knownCodes.map((k) => [normalizeRecintoCode(k), k]));

  const exact = byNormalized.get(normalized);
  if (exact) return { code: exact, exact: true };

  let best: { code: string; dist: number } | null = null;
  for (const known of knownCodes) {
    const dist = levenshtein(normalized, normalizeRecintoCode(known));
    if (!best || dist < best.dist) best = { code: known, dist };
  }
  if (best && best.dist <= matchThreshold(normalized.length)) return { code: best.code, exact: false };
  return null;
}

// Cuando la lectura de la foto no matchea con suficiente confianza, ofrece las
// 3 opciones más parecidas del inventario para que el usuario elija en vez de
// simplemente decirle "no encontrado" sin alternativas.
function suggestSimilarRecintoCodes(rawCode: string, knownCodes: string[], limit = 3): string[] {
  const normalized = normalizeRecintoCode(rawCode);
  const suggestionMax = matchThreshold(normalized.length) + 2;
  return knownCodes
    .map((code) => ({ code, dist: levenshtein(normalized, normalizeRecintoCode(code)) }))
    .filter((c) => c.dist <= suggestionMax)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map((c) => c.code);
}

function normalizeForSearch(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const RECINTO_CODE_CHAR_RE = /[a-z0-9._]/i;

// Encuentra códigos de recinto mencionados como TOKEN completo en un texto — no como
// substring de un código más largo. Ej: "C.5.7.19" NO debe matchear el recinto "C.5.7.1"
// aunque "c.5.7.1" sea substring literal de "c.5.7.19" (hay 333 colisiones así entre los 815 códigos).
function findMentionedRecintoCodes(text: string, knownCodes: string[]): string[] {
  const norm = normalizeForSearch(text);
  const found: string[] = [];
  const isBoundary = (ch: string) => !ch || !RECINTO_CODE_CHAR_RE.test(ch);
  for (const code of knownCodes) {
    const codeNorm = normalizeForSearch(code);
    let searchFrom = 0;
    while (searchFrom <= norm.length) {
      const idx = norm.indexOf(codeNorm, searchFrom);
      if (idx === -1) break;
      const before = idx > 0 ? norm[idx - 1] : "";
      const after = idx + codeNorm.length < norm.length ? norm[idx + codeNorm.length] : "";
      if (isBoundary(before) && isBoundary(after)) {
        found.push(code);
        break;
      }
      searchFrom = idx + 1;
    }
  }
  return found;
}

// ── Detect what the user is asking about ──
type Topic = "resumen" | "piso" | "servicio" | "producto" | "proveedor" | "eett" | "fecha" | "zona" | "familia" | "recinto";

function detectTopics(msg: string): { topics: Topic[]; matches: { pisos: number[]; servicios: string[]; productos: string[]; proveedores: string[]; eettCodes: string[]; recintos: string[] } } {
  const q = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const topics: Topic[] = [];
  const matches = { pisos: [] as number[], servicios: [] as string[], productos: [] as string[], proveedores: [] as string[], eettCodes: [] as string[], recintos: [] as string[] };

  // Detect piso — también números escritos como palabras
  const pisoMatch = q.match(/piso\s*(\d)/g);
  if (pisoMatch) {
    topics.push("piso");
    pisoMatch.forEach((m) => { const n = parseInt(m.replace(/\D/g, "")); if (n >= 1 && n <= 7) matches.pisos.push(n); });
  }
  if (/pisos|distribuc.*piso|por piso|cada piso|nivel/i.test(q)) topics.push("piso");

  // Detect servicio — lista ampliada
  const servicioKeywords: Record<string, string> = {
    "urgencia": "Urgencia",
    "administracion": "Administración y apoyo general", "admin": "Administración y apoyo general", "apoyo general": "Administración y apoyo general",
    "consulta": "Consultas medicas generales", "consultas medicas": "Consultas medicas generales", "medicas generales": "Consultas medicas generales",
    "comedor": "Comedor para funcionarios y público", "casino": "Comedor para funcionarios y público", "comedor funcionarios": "Comedor para funcionarios y público",
    "sala cuna": "Sala Cuna", "sala-cuna": "Sala Cuna",
    "hospitalizacion": "Hospitalización", "hospitalizados": "Hospitalización",
    "hospital de dia": "Hospital de día", "hosp dia": "Hospital de día",
    "psiquiatria": "Psiquiatría", "psiqui": "Psiquiatría",
    "uhcip": "UHCIP",
    "laboratorio": "Laboratorio", "lab": "Laboratorio",
    "rehabilitacion": "Med física y rehabilitación", "fisioterapia": "Med física y rehabilitación", "kinesiologia": "Med física y rehabilitación", "med fisica": "Med física y rehabilitación",
    "imagenologia": "Imagenología", "radiologia": "Imagenología", "rayos": "Imagenología",
    "pabellones": "Pabellones", "pabellon": "Pabellones", "quirofano": "Pabellones",
    "contabilidad": "Contabilidad", "finanzas": "Contabilidad",
    "dialisis": "Diálisis",
    "farmacia": "Farmacia",
    "uti": "UTI", "unidad de cuidados intensivos": "UTI", "uci": "UTI",
    "alimentacion": "Central de Alimentación", "cocina": "Central de Alimentación", "central alimentacion": "Central de Alimentación",
    "odontologia": "Odontología", "dental": "Odontología",
    "cafeteria": "Cafetería",
    "mantenimiento": "Mantenimiento",
    "biblioteca": "Biblioteca",
    "parto": "Parto Integral", "maternidad": "Parto Integral",
    "paliativos": "Cuidados Paliativos", "cuidados paliativos": "Cuidados Paliativos",
    "vestuario": "Vestuario",
    "auditorio": "Auditorio",
    "abastecimiento": "Abastecimiento", "bodega": "Abastecimiento",
    "esterilizacion": "Esterilización", "esteriliz": "Esterilización",
    "neonatologia": "Neonatología", "neonato": "Neonatología",
    "sedile": "SEDILE",
    "lavanderia": "Lavandería",
    "morgue": "Morgue",
    "telemedicina": "Telemedicina",
    "cirugia menor": "Cirugía menor", "cirugia": "Cirugía menor",
    "chile crece": "Chile Crece Contigo",
    "consultas ambulatorias": "Consultas Ambulatorias", "ambulatorio": "Consultas Ambulatorias",
    "laboratorio umt": "Laboratorio UMT", "umt": "Laboratorio UMT",
    "circulacion rehabilitacion": "Circulación Rehabilitación", "circulacion rehab": "Circulación Rehabilitación",
    "exterior porteria": "Exterior portería", "porteria": "Exterior portería",
    "administracion apoyo": "Administración y Apoyo General",
  };
  for (const [kw, svc] of Object.entries(servicioKeywords)) {
    if (q.includes(kw)) { topics.push("servicio"); if (!matches.servicios.includes(svc)) matches.servicios.push(svc); }
  }
  if (/servicios|por servicio|cada servicio|todos los servicios/i.test(q) && matches.servicios.length === 0) topics.push("servicio");

  // Detect producto — lista ampliada con más variantes
  const productoKeywords: Record<string, string> = {
    "silla visita": "Silla Visita", "silla de visita": "Silla Visita", "sillas de visita": "Silla Visita",
    "silla ergonomica": "Silla Ergonómica", "ergonomica": "Silla Ergonómica", "silla de oficina": "Silla Ergonómica",
    "silla casino": "Silla tipo Casino", "silla tipo casino": "Silla tipo Casino", "sillas de comedor": "Silla tipo Casino",
    "butaca": "Silla Butaca Espera 3 Cuerpos", "butacas": "Silla Butaca Espera 3 Cuerpos",
    "sillon bergere": "Sillón Bergere", "bergere": "Sillón Bergere", "sillon reclinable": "Sillón Bergere",
    "escritorio en l": "Escritorio en L Administrativo", "escritorio l": "Escritorio en L Administrativo",
    "escritorio simple": "Escritorio simple 120x70 cm", "escritorio 120": "Escritorio simple 120x70 cm",
    "escritorio administrativo": "Escritorio en L Administrativo", "escritorio": "Escritorio en L Administrativo",
    "sillon 2 cuerpo": "Sillón 2 Cuerpo", "sofa 2": "Sillón 2 Cuerpo",
    "sillon 1 cuerpo": "Sillón 1 Cuerpo", "sofa 1": "Sillón 1 Cuerpo",
    "mesa casino": "Mesa Tipo Casino", "mesa comedor": "Mesa Tipo Casino",
    "mesa reunion": "Mesa Reuniones Tipo I", "mesa de reuniones": "Mesa Reuniones Tipo I", "mesa conferencia": "Mesa Reuniones Tipo I",
    "mueble biblioteca": "Mueble Tipo Biblioteca M45_A", "estanteria": "Mueble Tipo Biblioteca M45_A", "biblioteca m45": "Mueble Tipo Biblioteca M45_A",
    "banca madera": "Banca Madera B", "banca de madera": "Banca Madera B", "banca": "Banca Madera B",
    "escritorio consulta": "Escritorio de Consultas", "escritorio clinico": "Escritorio de Consultas",
    "punto de registro": "Punto de Registro",
    "colchoneta": "Colchoneta Reposo A", "colchon": "Colchoneta Reposo A",
    "silla parvulo": "Silla Párvulo", "silla infantil": "Silla Párvulo", "silla niño": "Silla Párvulo",
    "silla universitaria": "Silla Tipo Universitaria", "universitaria": "Silla Tipo Universitaria", "silla con paleta": "Silla Tipo Universitaria",
    "mesa lateral": "Mesa Lateral", "mesita lateral": "Mesa Lateral",
    "perchero": "Perchero", "colgador": "Perchero",
    "velador": "Velador", "mesa de noche": "Velador",
    "cama apilable": "Cama Apilable", "cama para niños": "Cama Apilable",
    "locker": "Mueble Locker", "casillero": "Mueble Locker",
    "cuna": "Cuna Alta", "cuna hospitalaria": "Cuna Alta",
    "silla lactante": "Silla Lactante", "silla amamantar": "Silla Lactante",
    "silla bacinica": "Silla Bacínica", "bacinica": "Silla Bacínica", "silla higienica": "Silla Bacínica",
    "taburete": "Taburete con Ruedas", "taburete ruedas": "Taburete con Ruedas",
    "atril": "Atril Graduable",
    "silla ingesta": "Silla de Apoyo Hora Ingesta", "ingesta": "Silla de Apoyo Hora Ingesta", "silla alimentacion": "Silla de Apoyo Hora Ingesta",
    "mesa parvulo": "Mesa Párvulo Tipo I", "mesa infantil": "Mesa Párvulo Tipo I", "mesa niños": "Mesa Párvulo Tipo I",
    "contenedor": "Contenedor", "contenedor almacenamiento": "Contenedor",
    "librero": "Librero", "estante libros": "Librero",
    "mueble arrimo": "Mueble Arrimo", "arrimo": "Mueble Arrimo", "credenza": "Mueble Arrimo",
    "silla adulto": "Silla Adulto", "silla multiuso": "Silla Adulto", "silla apilable": "Silla Adulto",
    "estacion de trabajo": "Estación de Trabajo", "puesto de trabajo": "Estación de Trabajo", "workstation": "Estación de Trabajo",
  };
  for (const [kw, prod] of Object.entries(productoKeywords)) {
    if (q.includes(kw)) { topics.push("producto"); if (!matches.productos.includes(prod)) matches.productos.push(prod); }
  }
  // Detectar familias genéricas
  if (/sillas\b|cuantas sillas/i.test(q) && matches.productos.length === 0) topics.push("familia");
  if (/mesas\b|cuantas mesas/i.test(q) && matches.productos.length === 0) topics.push("familia");
  if (/sillones\b|cuantos sillones/i.test(q) && matches.productos.length === 0) topics.push("familia");
  if (/escritorios\b|cuantos escritorios/i.test(q) && matches.productos.length === 0) topics.push("familia");
  if (/bancas\b|cuantas bancas/i.test(q) && matches.productos.length === 0) topics.push("familia");
  if (/productos|muebles|mobiliario|por producto|cuantos tipos|tipos de mueble/i.test(q) && matches.productos.length === 0) topics.push("producto");

  // Detect proveedor — lista ampliada
  if (/melman/i.test(q)) { topics.push("proveedor"); matches.proveedores.push("MELMAN SPA"); }
  if (/allmedica/i.test(q)) { topics.push("proveedor"); matches.proveedores.push("ALLMEDICA"); }
  if (/hagelin/i.test(q)) { topics.push("proveedor"); matches.proveedores.push("COMERCIAL HAGELIN"); }
  if (/proveedor|empresa|fabricante|marca/i.test(q) && matches.proveedores.length === 0) topics.push("proveedor");

  // Detect EETT / ficha técnica
  if (/eett|ficha tecnica|especificacion|especificaciones|material|dimension|medida|caracteristica/i.test(q)) topics.push("eett");
  const eettMatch = q.match(/\d{3}\.\d{3}[b]?/gi);
  if (eettMatch) { topics.push("eett"); matches.eettCodes.push(...eettMatch.map((c) => c.toUpperCase())); }

  // Detect fecha/calendario
  if (/fecha|calendario|instalacion|cuando|mes\b|semana|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|enero|febrero|marzo|abril|cronograma|periodo/i.test(q)) topics.push("fecha");

  // Detect zona
  if (/zona|zonificacion|sector/i.test(q)) topics.push("zona");

  // Detect recinto count questions
  if (/cuantos recintos|cuantas salas|numero de recintos|recintos por|recintos tiene|recintos hay|recintos en|distribuc.*recinto/i.test(q)) topics.push("recinto");

  // Detect familia
  if (/familia|categoria|tipo de mueble|grupos de mueble/i.test(q)) topics.push("familia");

  // Comparaciones, rankings, preguntas de cantidad genéricas → resumen completo
  if (/mas muebles|menos muebles|mayor cantidad|menor cantidad|ranking|top \d|cuanto tiene|cuantos tienen|comparar|diferencia|porcentaje|proporcion|cuantos hay|cuantas hay|hay en total|en total/i.test(q)) {
    topics.push("resumen");
  }

  // Default: resumen siempre incluido para contexto base
  if (topics.length === 0 || /resumen|general|total|cuantos|inventario completo|todo|lista|listado|dame|dime|muestra|explica|detalle/i.test(q)) topics.push("resumen");

  // Si hay resumen, siempre incluir desglose de familias con productos
  if (topics.includes("resumen")) topics.push("familia");

  // Detect recinto keywords
  if (/recinto|sala|box|oficina|bodega|pasillo|hall|bano|baño|comedor|vestuario|biblioteca|auditorio|laboratorio|farmacia|pabellon|pabellón|habitacion|habitación/i.test(q)) topics.push("recinto");

  return { topics: [...new Set(topics)], matches };
}

// ── Build FULL context — always injects ALL inventory data ──
function buildContext(
  _topics: Topic[],
  matches: ReturnType<typeof detectTopics>["matches"],
  idx: DataIndex,
  summary: SummaryData,
  eettFiles: EETTFile[],
  originalMsg: string = "",
): string {
  const sections: string[] = [];

  // ═══ 1. RESUMEN GENERAL ═══
  sections.push(`══════════════════════════════════════════
HOSPITAL BUIN PAINE — INVENTARIO MOBILIARIO NO CLÍNICO (COMPLETO)
══════════════════════════════════════════
Total: ${fmt(summary.totalQty)} unidades | ${fmt(summary.totalItems)} registros | ${summary.uniqueNombres} tipos de mueble
Pisos: ${summary.pisos} | Servicios: ${summary.uniqueServicios} | Recintos: ${fmt(summary.uniqueRecintos)} | Zonas: ${summary.uniqueZonas}
Proveedores: ${summary.proveedores} | Familias de muebles: ${summary.familias}`);

  // ═══ 2. FAMILIAS CON TODOS SUS PRODUCTOS ═══
  sections.push(`══ FAMILIAS DE MUEBLES (${summary.byFamilia.length} familias, ${fmt(summary.totalQty)} uds total) ══
${summary.byFamilia.slice().sort((a, b) => b.qty - a.qty).map(({ name: fam, qty: total }) => {
  const pct = ((total / summary.totalQty) * 100).toFixed(1);
  return `  ${fam}: ${fmt(total)} uds (${pct}% del total)`;
}).join("\n")}`);

  // ═══ 2b. PRODUCTOS AGRUPADOS POR FAMILIA ═══
  {
    const famProdEntries = Object.entries(idx.famProd)
      .sort(([, a], [, b]) => {
        const ta = Object.values(a).reduce((x, y) => x + y, 0);
        const tb = Object.values(b).reduce((x, y) => x + y, 0);
        return tb - ta;
      });
    sections.push(`══ DESGLOSE DE PRODUCTOS POR FAMILIA ══
${famProdEntries.map(([fam, prods]) => {
  const total = Object.values(prods).reduce((a, b) => a + b, 0);
  const prodList = Object.entries(prods).sort(([, a], [, b]) => b - a).map(([n, q]) => `    • ${n}: ${fmt(q)} uds`).join("\n");
  return `  FAMILIA ${fam.toUpperCase()} — ${fmt(total)} uds:\n${prodList}`;
}).join("\n\n")}`);
  }

  // ═══ 3. TODOS LOS PRODUCTOS ORDENADOS ═══
  sections.push(`══ TODOS LOS PRODUCTOS (${summary.uniqueNombres} tipos) ══
${summary.byNombre.slice().sort((a, b) => b.qty - a.qty).map(({ name: k, qty: v }) => `  ${k}: ${fmt(v)} uds`).join("\n")}`);

  // ═══ 4. TODOS LOS SERVICIOS ═══
  sections.push(`══ SERVICIOS (${summary.uniqueServicios} servicios) ══
${summary.byServicio.slice().sort((a, b) => b.qty - a.qty).map(({ name: svc, qty: total }) => `  ${svc}: ${fmt(total)} uds`).join("\n")}`);

  // ═══ 5. DISTRIBUCIÓN POR PISO ═══
  sections.push(`══ DISTRIBUCIÓN POR PISO ══
${summary.byPiso.slice().sort((a, b) => a.piso - b.piso).map(({ name: piso, qty: total }) => `  ${piso}: ${fmt(total)} uds`).join("\n")}`);

  // ═══ 6. PROVEEDORES ═══
  sections.push(`══ PROVEEDORES ══
${summary.byProveedor.slice().sort((a, b) => b.qty - a.qty).map(({ name: prov, qty: total }) => {
  const pct = ((total / summary.totalQty) * 100).toFixed(1);
  return `  ${prov}: ${fmt(total)} uds (${pct}%)`;
}).join("\n")}`);

  // ═══ 7. ZONAS ═══
  sections.push(`══ ZONAS (${summary.uniqueZonas} zonas) ══
${summary.byZona.slice().sort((a, b) => b.qty - a.qty).map(({ name: k, qty: v }) => `  ${k}: ${fmt(v)} uds`).join("\n")}`);

  // ═══ 8. CALENDARIO INSTALACIÓN ═══
  sections.push(`══ CALENDARIO DE INSTALACIÓN ══
Período: ${summary.fechaStats?.fechaMin} a ${summary.fechaStats?.fechaMax} (${summary.fechaStats?.totalMeses} meses, ${summary.fechaStats?.totalSemanas} semanas)
Por mes:
${summary.byMes?.map((m) => `  ${m.name}: ${fmt(m.qty)} uds`).join("\n")}
Por semana:
${summary.bySemana?.map((s) => `  Semana ${s.name}: ${fmt(s.qty)} uds`).join("\n")}
Por día de instalación:
${summary.byDia?.map((d) => `  ${d.name}: ${fmt(d.qty)} uds`).join("\n")}`);

  // ═══ 9. FICHAS TÉCNICAS EETT (todas con PDF) — agrupadas por familia, igual que en la pestaña Esp. Técnicas ═══
  {
    const eettPorFamilia = FAMILIAS.map((fam) => ({
      fam,
      fichas: eettFiles.filter((e) => familiaPorCodigoEETT(e.code) === fam),
    })).filter((g) => g.fichas.length > 0);

    sections.push(`══ FICHAS TÉCNICAS EETT (${eettFiles.length} especificaciones, agrupadas por familia: ${eettPorFamilia.map((g) => `${g.fam} ${g.fichas.length}`).join(", ")}) ══
${eettPorFamilia.map(({ fam, fichas }) => `─ FAMILIA ${fam.toUpperCase()} (${fichas.length} fichas) ─\n${fichas.map((e) => {
  const spec = EETT_KNOWLEDGE[e.code];
  const link = `eett/${encodeURIComponent(e.file)}`;
  return spec
    ? `  ${e.code} — ${e.name}\n    Descripción: ${spec.desc}\n    Material: ${spec.material}\n    Dimensiones: ${spec.dimensiones}\n    Color: ${spec.color}\n    PDF: [${e.name}](${link})`
    : `  ${e.code} — ${e.name}\n    PDF: [${e.name}](${link})`;
}).join("\n\n")}`).join("\n\n")}`);
  }

  // ═══ 10. RECINTOS COMPLETOS POR SERVICIO ═══
  const totalRecintos = summary.uniqueRecintos;
  sections.push(`══ RECINTOS (${totalRecintos} recintos únicos en el inventario completo; muestra de recintos cargada localmente) ══
${summary.byServicio.slice().sort((a, b) => b.qty - a.qty).map(({ name: svc }) => {
  const recintos = idx.servRecintos[svc] || [];
  if (recintos.length === 0) return `  ${svc}: (recintos en inventario completo)`;
  const recintoLines = recintos.map((r) => {
    const info = idx.recintoDetail[r];
    if (!info) return `    ${r}`;
    const prodStr = Object.entries(info.prods).sort(([,a],[,b]) => b-a).map(([n, q]) => `${n}: ${fmt(q)}`).join(", ");
    return `    ${r} (Piso ${info.piso}, ${fmt(info.qty)} uds): ${prodStr}`;
  }).join("\n");
  return `  ${svc} (${recintos.length} recintos en muestra):\n${recintoLines}`;
}).join("\n\n")}`);

  // ═══ 11. DETALLE EXTRA por SERVICIO mencionado explícitamente ═══
  if (matches.servicios.length > 0) {
    const svcExtras: string[] = [];
    for (const svc of matches.servicios) {
      const exactSvc = Object.keys(idx.byServicio).find((k) => k.toLowerCase().includes(svc.toLowerCase()) || svc.toLowerCase().includes(k.toLowerCase())) || svc;
      const total = idx.byServicio[exactSvc] || 0;
      const prods = idx.servProd[exactSvc] || {};
      const prodStr = sortDesc(prods).map(([n, q]) => `    • ${n}: ${fmt(q)} uds`).join("\n");
      const recintos = idx.servRecintos[exactSvc] || [];
      svcExtras.push(`  SERVICIO "${exactSvc}": ${fmt(total)} unidades\n  Productos:\n${prodStr || "    (sin datos)"}\n  Recintos (${recintos.length}): ${recintos.slice(0, 10).join(", ")}${recintos.length > 10 ? "..." : ""}`);
    }
    if (svcExtras.length > 0) sections.unshift(`══ DETALLE DE SERVICIOS CONSULTADOS ══\n${svcExtras.join("\n\n")}`);
  }

  // ═══ 12. DETALLE EXTRA para productos/servicios/pisos mencionados explícitamente ═══
  if (matches.productos.length > 0) {
    const extras: string[] = [];
    for (const prod of matches.productos) {
      const exactKey = Object.keys(idx.byNombre).find((k) => k.toLowerCase().includes(prod.toLowerCase())) || prod;
      const total = idx.byNombre[exactKey] || 0;
      const servStr = sortDesc(idx.prodServ[exactKey] || {}).map(([s, q]) => `    ${s}: ${fmt(q)}`).join("\n");
      const eettMatch = eettFiles.find((e) =>
        e.name.toLowerCase().includes(prod.toLowerCase().split(" ").slice(0, 2).join(" ")) ||
        prod.toLowerCase().includes(e.name.toLowerCase().split(" ").slice(0, 2).join(" "))
      );
      let eettInfo = "";
      if (eettMatch) {
        const spec = EETT_KNOWLEDGE[eettMatch.code];
        if (spec) {
          eettInfo = `\n    Ficha EETT ${eettMatch.code}: ${spec.desc}\n    Material: ${spec.material} | Dim: ${spec.dimensiones}\n    PDF: [${eettMatch.name}](eett/${encodeURIComponent(eettMatch.file)})`;
        }
      }
      extras.push(`  CONSULTA SOBRE "${exactKey}": ${fmt(total)} unidades en total\n  Por servicio:\n${servStr}${eettInfo}`);
    }
    if (extras.length > 0) sections.unshift(`══ DATOS ESPECÍFICOS CONSULTADOS ══\n${extras.join("\n\n")}`);
  }

  // Detección de recintos específicos mencionados en la consulta
  if (originalMsg) {
    const matchedRecintos = findMentionedRecintoCodes(originalMsg, Object.keys(idx.recintoDetail));
    if (matchedRecintos.length > 0) {
      const recintoExtras = matchedRecintos.map((r) => {
        const info = idx.recintoDetail[r];
        const entries = Object.entries(info.prods).sort(([,a],[,b]) => b-a);
        const prodStr = entries.map(([n, q]) => `    ${n}: ${fmt(q)} uds`).join("\n");
        const nombreRecinto = RECINTO_NOMBRES[r];
        return `  RECINTO "${r}"${nombreRecinto ? ` — ${nombreRecinto}` : ""}:\n    Piso ${info.piso} · Servicio ${info.servicio} · Zona ${info.zona}\n    Total: ${fmt(info.qty)} unidades\n    Contenido (${entries.length} de ${entries.length} tipos de producto — LISTA COMPLETA, no omitir ninguno):\n${prodStr}\n    Verificación obligatoria: la tabla que entregues debe tener EXACTAMENTE ${entries.length} filas de producto y la suma de sus cantidades debe dar ${fmt(info.qty)}`;
      });
      sections.unshift(`══ RECINTOS ESPECÍFICOS CONSULTADOS ══\n${recintoExtras.join("\n\n")}`);
    }
  }

  return sections.join("\n\n");
}

// ── Extrae el código de recinto visible en una foto (placa/letrero) ──
// Lanza un error si la llamada falla por motivos técnicos (red, API caída, etc.) —
// eso es distinto de que la foto simplemente no tenga un código legible (NO_DETECTADO),
// y el caller debe poder distinguir ambos casos para no decirle al usuario "recinto no
// encontrado" cuando en realidad fue un fallo técnico transitorio.
async function extractRecintoCodeFromImage(image: ChatImageAttachment): Promise<string> {
  const base64 = image.dataUrl.split(",")[1] || "";
  if (!base64) throw new Error("Imagen sin datos");

  const res = await fetch(CHAT_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 40,
      system: `Observas fotos de recintos/salas de un hospital en construcción. Cada recinto tiene una placa, letrero o etiqueta pegada en la puerta o pared con un código de identificación.

FORMATO DE LOS CÓDIGOS (ejemplos reales del inventario, para que reconozcas el patrón):
"A.1.7.1", "B.3.2.4", "C.5.6.2.2", "C.5.6.2.2_A", "D.2.1", "H.2.25", "K.1.1_AG", "ESTAC.3.2", "OF.12", "COORD.4.1", "MOD.5", "PREP.2.1", "ACT.1.3"
Patrón: una o varias letras (a veces una abreviatura como ACT, COORD, ESTAC, MOD, OF, PREP) seguidas de números separados por puntos, y a veces terminan en un sufijo tras un guion o guion bajo (ej. "_A", "_B", "_AG", "_U") para marcar una subdivisión del recinto.

INSTRUCCIONES:
- Si hay varias placas o números visibles en la foto (ej. un pasillo con varias puertas), prioriza el código en una placa de identificación de recinto junto a una puerta — ignora otros números como aforo, extintores o señalética eléctrica.
- Da tu mejor lectura aunque no estés 100% seguro de algún carácter: el sistema hace una búsqueda tolerante a errores de lectura, así que es mejor arriesgar una lectura razonable que rendirte. Si dudas entre dos caracteres parecidos (O/0, I/1, S/5, B/8), elige el que tenga más sentido en el patrón de arriba.
- Responde ÚNICAMENTE con el código tal como lo lees, sin explicaciones ni texto adicional.
- Responde exactamente NO_DETECTADO solo si en la imagen no hay ninguna placa ni texto que parezca un código de recinto (ej. foto de solo mobiliario, sin ninguna señalética visible).`,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: image.mediaType, data: base64 } },
          { type: "text", text: "¿Qué código de recinto aparece en la placa o letrero de esta foto?" },
        ],
      }],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`Fallo al leer la foto (HTTP ${res.status})`);
  const body = await res.json().catch(() => null) as { content?: { type: string; text?: string }[] } | null;
  const text = body?.content?.find((b) => b.type === "text")?.text?.trim();
  if (!text) throw new Error("Respuesta vacía al leer la foto");
  return text;
}

// ── Claude API call con streaming SSE real ──
async function callClaudeStream(
  messages: ApiMessage[],
  systemPrompt: string,
  onToken: (token: string) => void,
): Promise<string> {
  const res = await fetch(CHAT_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Claude error ${res.status}: ${(errBody as { error?: { message?: string } }).error?.message || res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No se pudo leer el stream de respuesta");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const parsed = JSON.parse(raw) as {
          type: string;
          delta?: { type: string; text: string };
          error?: { message: string };
        };
        if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
          const chunk = parsed.delta.text;
          fullText += chunk;
          onToken(chunk);
        } else if (parsed.type === "error") {
          throw new Error(parsed.error?.message || "Error en stream");
        }
      } catch {
        // línea malformada — ignorar
      }
    }
  }

  return fullText || "Sin respuesta del modelo.";
}

// ── Base system instruction ──
const BASE_SYSTEM = `Eres el asistente IA oficial del Hospital Buin Paine, especializado en el inventario de mobiliario no clínico (MNC) del hospital (Sistema SGD).

REGLAS ABSOLUTAS:
1. Responde SIEMPRE en español, de forma clara, directa y concisa — sin preámbulos, sin repetir la pregunta del usuario, sin relleno antes de la respuesta
2. Para TOTALES y CANTIDADES: usa primero los datos de "DATOS DEL INVENTARIO" — se generan en cada consulta a partir de la información cargada actualmente en el dashboard, así que reflejan el estado más reciente. El bloque "CIFRAS OFICIALES" de este prompt es una referencia de respaldo únicamente para cuando "DATOS DEL INVENTARIO" no cubra el dato pedido. Si ambos bloques dan cifras distintas para el mismo dato, confía en "DATOS DEL INVENTARIO" sin mencionar la discrepancia al usuario (a menos que te pregunte explícitamente por inconsistencias)
3. Para listas largas (4+ elementos), usa tabla markdown
4. Para PDFs de EETT: usa EXACTAMENTE el link del formato [Nombre](eett/EETT%20...) — nunca lo simplifiques
5. Cita cifras exactas siempre: "1.265 unidades", no "aproximadamente 1.300"
6. Cuando alguien pida "detalle", "resumen" o "total": entrega desglose completo sin omitir ninguna categoría
7. Si el usuario envía una foto de un recinto: el código de recinto ya fue detectado y buscado en el inventario ANTES de esta conversación. Si aparece la sección "RECINTO DETECTADO EN FOTO", úsala como fuente de verdad para responder qué mobiliario corresponde a ese recinto (piso, servicio, cantidad y detalle de productos). Si esa sección indica que hubo un problema técnico al leer la foto, dilo así explícitamente y pide reintentar con otra foto — no digas que el recinto "no existe". Si esa sección indica que no hubo coincidencia pero trae códigos parecidos como sugerencia, ofrécelos como posibles alternativas antes de pedir el código manual. Si no hay coincidencia ni sugerencias, dilo con claridad y pide al usuario que confirme el código manualmente — nunca inventes datos de un recinto que no está en el inventario
8. Al responder sobre un recinto específico (secciones "RECINTOS ESPECÍFICOS CONSULTADOS" o "RECINTO DETECTADO EN FOTO"): incluye SIEMPRE una fila por CADA producto listado en "Contenido"/"Detalle", sin omitir, resumir ni fusionar ninguno — aunque sean solo 2 o 3 productos, muéstralos todos. Antes de enviar tu respuesta, suma mentalmente las cantidades de las filas que escribiste y confirma que coinciden exactamente con el total indicado; si no coinciden, revisa qué fila falta y agrégala antes de responder
9. Si el usuario pregunta "cuál falta" o algo similar sobre un recinto ya mencionado en la conversación, vuelve a mirar el detalle completo del recinto en el contexto (no lo inventes ni pidas más información si los datos ya están disponibles)
10. Si te preguntan por una ficha EETT cuyo código no tiene descripción/material/dimensiones/color en este prompt: NO inventes esos datos. Entrega solo el link al PDF correspondiente e indica que ahí está la especificación técnica completa
11. Si la pregunta no tiene relación con el inventario de mobiliario no clínico del Hospital Buin Paine (precios/presupuesto — no manejas esa información —, temas clínicos, administrativos ajenos al mobiliario, opiniones personales, etc.): dilo brevemente en vez de inventar una respuesta, y sugiere qué sí puedes responder

══════════════════════════════════════════
CATÁLOGO MELMAN — LINKS DE PRODUCTOS
══════════════════════════════════════════
Cuando el usuario pida ver un producto del catálogo, entrega el link directo al PDF usando el formato:
[Nombre del producto](catalogo/separado/ARCHIVO.pdf)

PRODUCTOS DEL CATÁLOGO (usar EXACTAMENTE estos links):
- [Índice del Catálogo](catalogo/separado/00_Indice.pdf)
- [Portada](catalogo/separado/00_Portada.pdf)
- [Estación de Trabajo A](catalogo/separado/201.001A_Estacion_de_Trabajo_A.pdf)
- [Estación de Trabajo B](catalogo/separado/201.001B_Estacion_de_Trabajo_B.pdf)
- [Estación de Trabajo C](catalogo/separado/201.001C_Estacion_de_Trabajo_C.pdf)
- [Estación de Trabajo D](catalogo/separado/201.001D_Estacion_de_Trabajo_D.pdf)
- [Estación de Trabajo E](catalogo/separado/201.001E_Estacion_de_Trabajo_E.pdf)
- [Mesa Lateral](catalogo/separado/201.002_Mesa_Lateral.pdf)
- [Mesa Párvulo Inclusión](catalogo/separado/201.003_Mesa_Parvulo_Inclusion.pdf)
- [Mesa Párvulo Tipo I](catalogo/separado/201.004_Mesa_Parvulo_Tipo_I.pdf)
- [Mesa Párvulo Tipo II](catalogo/separado/201.005_Mesa_Parvulo_Tipo_II.pdf)
- [Mesa Reunión Tipo I](catalogo/separado/201.008_Mesa_Reunion_Tipo_I.pdf)
- [Mesa Reunión Tipo II](catalogo/separado/201.009_Mesa_Reunion_Tipo_II.pdf)
- [Mesa Reuniones Tipo III](catalogo/separado/201.010_Mesa_Reuniones_Tipo_III.pdf)
- [Mesa Tipo Casino](catalogo/separado/201.011_Mesa_Tipo_Casino.pdf)
- [Silla Tipo Universitaria](catalogo/separado/201.011_Silla_Tipo_Universitaria.pdf)
- [Atril Graduable](catalogo/separado/202.001_Atril_Graduable.pdf)
- [Cama Apilable](catalogo/separado/202.006_Cama_Apilable.pdf)
- [Cuna Alta](catalogo/separado/202.008_Cuna_Alta.pdf)
- [Cuna Baja](catalogo/separado/202.009_Cuna_Baja.pdf)
- [Mueble Locker](catalogo/separado/202.012_Mueble_Locker.pdf)
- [Librero](catalogo/separado/203.014_Librero.pdf)
- [Mueble Arrimo](catalogo/separado/203.015_Mueble_Arrimo.pdf)
- [Mueble Tipo Biblioteca B](catalogo/separado/203.016B_Mueble_Tipo_Biblioteca_B.pdf)
- [Mueble Tipo Biblioteca](catalogo/separado/203.016_Mueble_Tipo_Biblioteca.pdf)
- [Perchero](catalogo/separado/203.018_Perchero.pdf)
- [Contenedor](catalogo/separado/203.022_Contenedor.pdf)
- [Banca Sala Cuna](catalogo/separado/204.001_Banca_Sala_Cuna.pdf)
- [Banca Madera A](catalogo/separado/204.002A_Banca_Madera_A.pdf)
- [Banca Madera B](catalogo/separado/204.002B_Banca_Madera_B.pdf)
- [Banca Madera C](catalogo/separado/204.002C_Banca_Madera_C.pdf)
- [Banca Madera D](catalogo/separado/204.002D_Banca_Madera_D.pdf)
- [Silla Adulto](catalogo/separado/204.003_Silla_Adulto.pdf)
- [Silla Bacínica](catalogo/separado/204.005_Silla_Bacinica.pdf)
- [Silla Ergonómica](catalogo/separado/204.006_Silla_Ergonomica.pdf)
- [Silla Lactante](catalogo/separado/204.007_Silla_Lactante.pdf)
- [Silla Párvulo](catalogo/separado/204.009_Silla_Parvulo.pdf)
- [Silla Tipo Casino](catalogo/separado/204.010_Silla_Tipo_Casino.pdf)
- [Silla Visita](catalogo/separado/204.012_Silla_Visita.pdf)
- [Sillón 1 Cuerpo](catalogo/separado/204.013_Sillon_1_Cuerpo.pdf)
- [Sillón 2 Cuerpos](catalogo/separado/204.014_Sillon_2_Cuerpos.pdf)
- [Sillón Bergere](catalogo/separado/204.015_Sillon_Bergere.pdf)
- [Silla Butaca Espera 3 Cuerpos](catalogo/separado/204.020_Silla_Butaca_Espera_3_Cuerpos.pdf)
- [Silla Apoyo Hora Ingesta](catalogo/separado/0204.019_Silla_Apoyo_Hora_Ingesta.pdf)

CERTIFICADOS:
- [Certificado Bureau Veritas Climático p1](catalogo/separado/CERT_BureauVeritas_Climatico_p1.pdf)
- [Certificado Bureau Veritas Ignífugo p1](catalogo/separado/CERT_BureauVeritas_Ignifugo_p1.pdf)
- [Certificado Bureau Veritas Plomo/Ftalatos p1](catalogo/separado/CERT_BureauVeritas_Plomo_Ftalatos_p1.pdf)
- [Certificado CTC Silla Ergonómica](catalogo/separado/CERT_CTC_N909_Silla_Ergonomica.pdf)
- [Certificado CTC Librero](catalogo/separado/CERT_CTC_N977_Librero.pdf)
- [Certificado CTC Cuna Alta](catalogo/separado/CERT_CTC_N980_Cuna_Alta.pdf)
- [Certificado Ergotron StyleView p1](catalogo/separado/CERT_Ergotron_StyleView_p1.pdf)

══════════════════════════════════════════
CIFRAS OFICIALES — INVENTARIO MNC HOSPITAL BUIN PAINE
(Fuente: Cronograma de Instalacion de MNC_20260327.xlsx — actualizado 27/03/2026)
══════════════════════════════════════════

TOTAL GENERAL: 4.471 unidades | 1.978 registros | 80 tipos de producto
Servicios: 40 | Pisos: 8 (-1, 1, 2, 3, 4, 5, 6, 7) | Recintos: 815 | Proveedores: 3 | Familias: 4

── FAMILIAS DE MUEBLES (4 familias) ──
| Familia    | Unidades | % Total | Descripción |
|------------|----------|---------|-------------|
| Silla      | 3.248    | 72,6%   | Sillas, butacas, bancas, taburetes, sillones |
| Mesa       | 693      | 15,5%   | Mesas casino, reuniones, laterales, escritorios |
| Otro       | 427      | 9,6%    | Bibliotecas, colchonetas, percheros, contenedores, libreros |
| Mobiliario | 103      | 2,3%    | Sillones 2 y 1 cuerpo, muebles arrimo, lockers |

── TODOS LOS PRODUCTOS (80 tipos) ──
| Producto | Unidades |
|----------|----------|
| Silla Visita | 1.265 |
| Silla Ergonómica | 548 |
| Silla tipo Casino | 498 |
| Mueble Tipo Biblioteca M45_A | 273 |
| Silla Butaca Espera 3 Cuerpos | 238 |
| Sillón Bergere | 185 |
| Escritorio en L administrativo | 177 |
| Escritorio simple 120x70 cm | 122 |
| Sillón 2 Cuerpo | 103 |
| Mesa Tipo Casino Circular | 73 |
| Punto de registro clínico | 67 |
| Silla Ergonómica Reforzada | 60 |
| Banca Madera_B | 59 |
| Escritorio de Consultas | 58 |
| Colchoneta Reposo A | 56 |
| Mesa Reuniones Tipo I | 53 |
| Silla Párvulo | 52 |
| Mesa Tipo Casino Redonda 90 cm | 42 |
| Silla Tipo Universitaria | 33 |
| Mesa Lateral | 31 |
| Sillón 1 Cuerpo | 31 |
| Banca Madera_A | 30 |
| Cama Apilable | 28 |
| Taburete con Ruedas sin Respaldo | 24 |
| Banca Madera_C | 22 |
| Perchero | 20 |
| Velador | 20 |
| Silla Adulto | 18 |
| Silla Lactante | 18 |
| Mesa Reuniones Tipo II | 17 |
| Mueble Tipo Biblioteca M45_B | 16 |
| Cuna Alta | 14 |
| Cuna Baja | 14 |
| Silla Nido | 13 |
| Mesa Párvulo Tipo II | 12 |
| Mesa Reuniones Tipo III | 12 |
| Cama 1 1/2 Plaza | 11 |
| Silla Apilable de Base Ancha | 10 |
| Carro de Transporte | 9 |
| Mesa Párvulo Tipo I | 8 |
| Mesa Reuniones Plegable | 8 |
| Atril graduable | 8 |
| Caja Fuerte Tipo I | 8 |
| Mueble Locker | 8 |
| Sillón Tipo Poltrona | 8 |
| Banca Madera_D | 6 |
| Silla Alta Cafetería | 6 |
| Escalera Tijera | 5 |
| Silla de Apoyo Hora de Ingesta | 5 |
| Colchoneta Reposo B | 4 |
| Librero | 4 |
| Escritorio simple 130x70 cm | 4 |
| Pizarra Acrílica | 4 |
| Banca | 4 |
| Silla Bacinica | 4 |
| Contenedor | 4 |
| Banca Ecuménica | 4 |
| Mesa Trabajo Individual | 3 |
| Pallet | 3 |
| Carro Bandejero | 3 |
| Tarima | 3 |
| Mesa Párvulo Inclusión | 2 |
| Carro de Transporte cajas plásticas | 2 |
| Carro metálico | 2 |
| Juego Taca-Taca | 2 |
| Juego Tenis de Mesa | 2 |
| Soporte de rollo doble | 2 |
| Mesa Plegable | 1 |
| Caja Fuerte Tipo II | 1 |
| Cama 1 Plaza | 1 |
| Carro de Carga | 1 |
| Pódium | 1 |
| Adaptador de llaves | 1 |
| Carro de transporte alto | 1 |
| Carro de transporte pallet | 1 |
| Carro dual dos ruedas | 1 |
| Carro plataforma de carga | 1 |
| Estación de órtesis metálica | 1 |
| Mueble Arrimo | 1 |
| Podio Ecuménico | 1 |

── SERVICIOS MÉDICOS (40 servicios) ──
| Servicio | Unidades | Recintos |
|----------|----------|----------|
| Administración y apoyo general | 821 | 115 |
| Consultas medicas generales | 376 | 78 |
| Urgencia | 313 | 79 |
| Comedor para funcionarios y público | 307 | 8 |
| Sala Cuna | 298 | 13 |
| Hospitalización | 230 | 79 |
| Hospital de día | 212 | 28 |
| Psiquiatría | 179 | 25 |
| UHCIP | 170 | 26 |
| Laboratorio | 161 | 37 |
| Med física y rehabilitación | 144 | 26 |
| Imagenología | 90 | 17 |
| Pabellones | 85 | 30 |
| Contabilidad | 83 | 11 |
| Diálisis | 76 | 21 |
| Farmacia | 75 | 20 |
| UTI | 73 | 28 |
| Central de Alimentación | 69 | 19 |
| Odontología | 69 | 19 |
| Cafetería | 66 | 5 |
| Consultas Ambulatorias | 59 | 10 |
| Mantenimiento | 52 | 10 |
| Biblioteca | 52 | 6 |
| Parto Integral | 48 | 16 |
| Auditorio | 46 | 7 |
| Laboratorio UMT | 46 | 6 |
| Cuidados Paliativos | 45 | 10 |
| Abastecimiento | 44 | 13 |
| Vestuario | 41 | 6 |
| Esterilización | 29 | 12 |
| Chile Crece Contigo | 26 | 1 |
| Neonatología | 25 | 7 |
| SEDILE | 14 | 6 |
| Lavandería | 12 | 7 |
| Morgue | 11 | 3 |
| Telemedicina | 8 | 2 |
| Circulación Rehabilitación | 8 | 1 |
| Exterior portería | 6 | 6 |
| Cirugía menor | 2 | 2 |

── DISTRIBUCIÓN POR PISO ──
| Piso    | Ítems | Unidades | Recintos |
|---------|-------|----------|---------|
| Piso -1 | 1     | 1        | 1       |
| Piso 1  | 687   | 1.470    | 264     |
| Piso 2  | 612   | 1.547    | 237     |
| Piso 3  | 432   | 855      | 173     |
| Piso 4  | 78    | 184      | 40      |
| Piso 5  | 66    | 137      | 40      |
| Piso 6  | 60    | 150      | 33      |
| Piso 7  | 42    | 127      | 27      |

── PROVEEDORES ──
| Proveedor | Unidades | % Total |
|-----------|----------|---------|
| MELMAN SPA | 4.271 | 95,5% |
| ALLMEDICA | 106 | 2,4% |
| COMERCIAL HAGELIN | 94 | 2,1% |

── CRONOGRAMA DE INSTALACIÓN ──
Período: Mayo 2026 – Agosto 2026
| Mes          | Unidades |
|--------------|----------|
| Mayo 2026    | 66       |
| Junio 2026   | 44       |
| Julio 2026   | 4.084    |
| Agosto 2026  | 277      |

══════════════════════════════════════════
FIN CIFRAS OFICIALES
══════════════════════════════════════════
`;

// ── Public API ──
class ChatServiceClass {
  private data: RawItem[] = [];
  private summary: SummaryData | null = null;
  private eettFiles: EETTFile[] = [];
  private idx: DataIndex | null = null;
  private ollamaAvailable: boolean | null = null;
  private conversationHistory: ApiMessage[] = [];
  private lastRecintoCode: string | null = null;

  setData(data: RawItem[], summary: SummaryData, eettFiles: EETTFile[]) {
    this.data = data;
    this.summary = summary;
    this.eettFiles = eettFiles;
    this.idx = buildIndex(data);
  }

  async checkHealth(): Promise<boolean> {
    // La key ahora vive server-side (netlify/functions/chat.mts) — el cliente
    // ya no puede saber si está configurada sin llamar al proxy, así que se
    // asume disponible y cualquier falla real se reporta al enviar el mensaje.
    return true;
  }

  clearHistory() {
    this.conversationHistory = [];
    this.lastRecintoCode = null;
  }

  async sendMessage(
    message: string,
    _sessionId?: string,
    _history?: Message[],
    onToken?: (token: string) => void,
    image?: ChatImageAttachment,
  ): Promise<
    | { response: { id: string; response: string; sessionId: string; tokensUsed: number; model: string; timestamp: string; detectedRecinto?: string }; error: null }
    | { response: null; error: ChatError }
  > {
    if (!this.summary || !this.idx) {
      return { response: null, error: { error: true, message: "Datos no cargados", code: "NO_DATA" } };
    }

    const isReady = await this.checkHealth();
    if (!isReady) {
      return {
        response: null,
        error: {
          error: true,
          message: "Claude AI no está configurado",
          code: "CLAUDE_UNAVAILABLE",
          suggestion: "El proxy del asistente no está disponible.",
        },
      };
    }

    try {
      // Si viene una foto, primero identificamos el código de recinto en la placa/letrero
      let photoSection = "";
      let matched: { code: string; exact: boolean } | null = null;
      if (image) {
        let rawCode: string | null = null;
        let photoReadFailed = false;
        try {
          rawCode = await extractRecintoCodeFromImage(image);
        } catch {
          photoReadFailed = true;
        }
        if (rawCode && rawCode !== "NO_DETECTADO" && this.idx) {
          matched = matchRecintoCode(rawCode, Object.keys(this.idx.recintoDetail));
        }
        if (matched) {
          const info = this.idx.recintoDetail[matched.code];
          const entries = Object.entries(info.prods).sort(([, a], [, b]) => b - a);
          const prodStr = entries.map(([n, q]) => `  • ${n}: ${fmt(q)} uds`).join("\n");
          const nombreRecinto = RECINTO_NOMBRES[matched.code];
          photoSection = `══ RECINTO DETECTADO EN FOTO ══
Código leído en la placa: "${rawCode}"
${matched.exact ? "Coincidencia exacta" : "Coincidencia aproximada (posible error de lectura)"} en el inventario: "${matched.code}"${nombreRecinto ? ` — ${nombreRecinto}` : ""}
Piso ${info.piso} · Servicio ${info.servicio} · Zona ${info.zona}
Total mobiliario en este recinto: ${fmt(info.qty)} unidades
Detalle (${entries.length} tipos de producto — LISTA COMPLETA, no omitir ninguno):
${prodStr}
Verificación obligatoria: la tabla que entregues debe tener EXACTAMENTE ${entries.length} filas de producto y la suma de sus cantidades debe dar ${fmt(info.qty)}`;
        } else if (photoReadFailed) {
          photoSection = `══ RECINTO DETECTADO EN FOTO ══
Hubo un problema técnico al analizar la foto (no se pudo leer la imagen). Esto NO significa que el recinto no exista en el inventario — informa al usuario que hubo un error técnico y pídele que intente subir la foto de nuevo.`;
        } else {
          const suggestions = rawCode && rawCode !== "NO_DETECTADO" && this.idx
            ? suggestSimilarRecintoCodes(rawCode, Object.keys(this.idx.recintoDetail))
            : [];
          const suggestionsLine = suggestions.length
            ? `\nCódigos parecidos que sí existen en el inventario (podría ser un error de lectura de alguno de estos, pregunta al usuario cuál es): ${suggestions.join(", ")}`
            : "";
          photoSection = `══ RECINTO DETECTADO EN FOTO ══
Código leído en la placa: "${rawCode && rawCode !== "NO_DETECTADO" ? rawCode : "no se distinguió ningún código en la imagen"}"
${rawCode && rawCode !== "NO_DETECTADO" ? "Ese código no se encontró en el inventario de 815 recintos." : "No se detectó ninguna placa o código de recinto legible en la foto."}${suggestionsLine}
Informa esto al usuario con claridad${suggestions.length ? ", ofrécele las alternativas parecidas de arriba" : ""} y pídele que verifique o escriba el código manualmente si ninguna corresponde — nunca inventes datos de un recinto que no está en el inventario.`;
        }
      }

      // El mensaje efectivo para detección de tópicos incluye el código de recinto ya resuelto (si lo hay)
      let effectiveMsg = matched ? `${message} ${matched.code}` : message;

      // Códigos de recinto mencionados DIRECTAMENTE en este turno (texto o foto), antes de aplicar "sticky"
      const knownCodes = Object.keys(this.idx.recintoDetail);
      const effectiveMsgNorm = normalizeForSearch(effectiveMsg);
      const directMatches = findMentionedRecintoCodes(effectiveMsg, knownCodes);

      // "Recinto pegajoso": recordamos el último para preguntas de seguimiento
      // (ej. "¿cuál falta?") que no repiten el código explícitamente
      if (directMatches.length > 0) {
        this.lastRecintoCode = directMatches[0];
      } else if (this.lastRecintoCode) {
        effectiveMsg = `${effectiveMsg} ${this.lastRecintoCode}`;
      }

      // ── Camino determinístico: si se menciona UN solo recinto y la pregunta es
      // una consulta simple de inventario, respondemos con datos exactos del código
      // (sin pasar por el LLM) para eliminar el riesgo de que el modelo omita filas.
      const complexIntentRe = /compar|diferencia|eett|ficha|certificad|proveedor|cuando|fecha|instala|material|dimension|color/;
      if (directMatches.length === 1 && !complexIntentRe.test(effectiveMsgNorm)) {
        const code = directMatches[0];
        const info = this.idx.recintoDetail[code];
        const entries = Object.entries(info.prods).sort(([, a], [, b]) => b - a);
        const tableRows = entries.map(([n, q]) => `| ${n} | ${fmt(q)} |`).join("\n");
        const approxWarning = matched && !matched.exact && matched.code === code
          ? `_Nota: el código leído en la foto no coincidió exacto — se usó la coincidencia más cercana en el inventario ("${code}"). Verifica que sea el recinto correcto._\n\n`
          : "";
        const nombreRecinto = RECINTO_NOMBRES[code];
        const titulo = nombreRecinto ? `${nombreRecinto} — Recinto ${code}` : `Recinto ${code} — ${info.servicio}`;
        const answer = `${approxWarning}**${titulo}**\nPiso ${info.piso} · Servicio ${info.servicio} · Zona ${info.zona}\n\n| Producto | Cantidad |\n|---|---|\n${tableRows}\n| **Total** | **${fmt(info.qty)}** |\n\n¿Deseas ver la ficha técnica (EETT) de alguno de estos productos, o tienes otra consulta?`;

        onToken?.(answer);
        const detHistoryContent: ApiMessage["content"] = image
          ? [{ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.dataUrl.split(",")[1] || "" } }, { type: "text", text: message.trim() || "(foto del recinto)" }]
          : message;
        this.conversationHistory.push({ role: "user", content: detHistoryContent });
        this.conversationHistory.push({ role: "assistant", content: answer });
        if (this.conversationHistory.length > 4) {
          this.conversationHistory = this.conversationHistory.slice(-4);
        }

        return {
          response: {
            id: Math.random().toString(36).substr(2, 9),
            response: answer,
            sessionId: "deterministic",
            tokensUsed: 0,
            model: "deterministic-lookup",
            timestamp: new Date().toISOString(),
            detectedRecinto: code,
          },
          error: null,
        };
      }

      // Detect what the user is asking about
      const { topics, matches } = detectTopics(effectiveMsg);

      // Build full context with all inventory data
      const context = buildContext(topics, matches, this.idx, this.summary, this.eettFiles, effectiveMsg);

      // Contenido del mensaje del usuario (multimodal si hay foto)
      const userText = message.trim() || "Identifica el recinto de la foto y dime qué mobiliario no clínico debería tener según el inventario.";
      const userContent: ApiMessage["content"] = image
        ? [
            { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.dataUrl.split(",")[1] || "" } },
            { type: "text", text: userText },
          ]
        : userText;

      // Add user message to conversation
      this.conversationHistory.push({ role: "user", content: userContent });
      if (this.conversationHistory.length > 4) {
        this.conversationHistory = this.conversationHistory.slice(-4);
      }

      // System = base instructions + inventory context (truncated a límite de tokens)
      const MAX_CONTEXT_CHARS = 40000;
      const truncatedContext = context.length > MAX_CONTEXT_CHARS
        ? context.slice(0, MAX_CONTEXT_CHARS) + "\n\n[...contexto truncado por límite de tokens...]"
        : context;
      const systemPrompt = `${BASE_SYSTEM}\n${photoSection ? photoSection + "\n\n" : ""}DATOS DEL INVENTARIO:\n${truncatedContext}`;

      const answer = await callClaudeStream(this.conversationHistory, systemPrompt, onToken || (() => {}));
      this.conversationHistory.push({ role: "assistant", content: answer });

      return {
        response: {
          id: Math.random().toString(36).substr(2, 9),
          response: answer,
          sessionId: "claude-direct",
          tokensUsed: 0,
          model: MODEL,
          timestamp: new Date().toISOString(),
          detectedRecinto: matched?.code,
        },
        error: null,
      };
    } catch (err) {
      this.ollamaAvailable = null;
      const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[ChatService] Claude error:", errMsg);
      return {
        response: null,
        error: {
          error: true,
          message: isTimeout ? "Claude tardó demasiado en responder" : `Error: ${errMsg}`,
          code: isTimeout ? "TIMEOUT" : "CLAUDE_ERROR",
          suggestion: "Revisa la consola del navegador (F12) para más detalles.",
        },
      };
    }
  }
}

export const ChatService = new ChatServiceClass();
