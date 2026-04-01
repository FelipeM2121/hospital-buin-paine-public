import type { RawItem, SummaryData, EETTFile } from "../../types";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

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

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string;
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

  // ═══ 9. FICHAS TÉCNICAS EETT (todas con PDF) ═══
  sections.push(`══ FICHAS TÉCNICAS EETT (${eettFiles.length} especificaciones) ══
${eettFiles.map((e) => {
  const spec = EETT_KNOWLEDGE[e.code];
  const link = `eett/${encodeURIComponent(e.file)}`;
  return spec
    ? `  ${e.code} — ${e.name}\n    Descripción: ${spec.desc}\n    Material: ${spec.material}\n    Dimensiones: ${spec.dimensiones}\n    Color: ${spec.color}\n    PDF: [${e.name}](${link})`
    : `  ${e.code} — ${e.name}\n    PDF: [${e.name}](${link})`;
}).join("\n\n")}`);

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
    const msgNorm = originalMsg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matchedRecintos = Object.keys(idx.recintoDetail).filter((r) =>
      msgNorm.includes(r.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    );
    if (matchedRecintos.length > 0) {
      const recintoExtras = matchedRecintos.map((r) => {
        const info = idx.recintoDetail[r];
        const prodStr = Object.entries(info.prods).sort(([,a],[,b]) => b-a).map(([n, q]) => `    ${n}: ${fmt(q)} uds`).join("\n");
        return `  RECINTO "${r}":\n    Piso: ${info.piso} | Servicio: ${info.servicio} | Zona: ${info.zona}\n    Total: ${fmt(info.qty)} unidades\n    Contenido:\n${prodStr}`;
      });
      sections.unshift(`══ RECINTOS ESPECÍFICOS CONSULTADOS ══\n${recintoExtras.join("\n\n")}`);
    }
  }

  return sections.join("\n\n");
}

// ── Claude API call (sin streaming — más confiable a través de proxy) ──
async function callClaudeStream(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  onToken: (token: string) => void,
): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Claude error ${res.status}: ${(errBody as { error?: { message?: string } }).error?.message || res.statusText}`);
  }

  const data = await res.json() as { content?: { type: string; text: string }[]; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);

  const text = data.content?.[0]?.text || "Sin respuesta del modelo.";
  onToken(text);
  return text;
}

// ── Base system instruction ──
const BASE_SYSTEM = `Eres el asistente IA oficial del Hospital Buin Paine, especializado en el inventario de mobiliario no clínico (MNC) del hospital (Sistema SGD).

REGLAS ABSOLUTAS:
1. Responde SIEMPRE en español, de forma clara y estructurada
2. Para TOTALES y CANTIDADES: usa los datos de "CIFRAS OFICIALES" de este prompt — son la fuente de verdad
3. El bloque "DATOS DEL INVENTARIO" complementa con detalles adicionales
4. Para listas largas (4+ elementos), usa tabla markdown
5. Para PDFs de EETT: usa EXACTAMENTE el link del formato [Nombre](eett/EETT%20...) — nunca lo simplifiques
6. Cita cifras exactas siempre: "1.265 unidades", no "aproximadamente 1.300"
7. Cuando alguien pida "detalle", "resumen" o "total": entrega desglose completo sin omitir ninguna categoría

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
Servicios: 40 | Pisos: 8 (-1, 1, 2, 3, 4, 5, 6, 7) | Recintos: 815 | Proveedores: 4 | Familias: 4

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
| Silla Lactante | 21 |
| Mesa Reuniones Tipo II | 20 |
| Sillón Bergere Reforzado | 18 |
| Perchero de Pie | 17 |
| Locker Metálico | 16 |
| Mesa Párvulo Tipo I | 15 |
| Silla Apoyo Hora Ingesta | 14 |
| Banca Espera Metálica | 13 |
| Mesa Párvulo Tipo II | 12 |
| Atril Graduable | 11 |
| Cuna Alta | 10 |
| Mesa Reuniones Tipo III | 9 |
| Silla Bacínica | 9 |
| Cuna Baja | 8 |
| Silla Párvulo Inclusión | 7 |
| Mesa Párvulo Inclusión | 7 |
| Contenedor de Almacenamiento | 6 |
| Mueble Arrimo Bajo | 6 |
| Librero Estantería | 5 |
| Cama Apilable Sala Cuna | 5 |
| Mueble Tipo Biblioteca Grande | 4 |
| Mesa Casino Rectangular | 4 |
| Silla Tipo Universitaria Reforzada | 3 |
| Escritorio Esquinero | 3 |
| Mesa Lateral Auxiliar | 3 |

── SERVICIOS MÉDICOS (40 servicios) ──
| Servicio | Unidades | Recintos |
|----------|----------|----------|
| Administración y apoyo general | 819 | 114 |
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
| Piso | Recintos | Unidades |
|------|----------|----------|
| Piso -1 | 1  | 1     |
| Piso 1  | 17 | 1.470 |
| Piso 2  | 16 | 1.547 |
| Piso 3  | 10 | 855   |
| Piso 4  | 4  | 184   |
| Piso 5  | 3  | 137   |
| Piso 6  | 4  | 150   |
| Piso 7  | 3  | 127   |

── PROVEEDORES ──
| Proveedor | Unidades | % Total |
|-----------|----------|---------|
| MELMAN SPA | 4.205 | 94,1% |
| ALLMEDICA | 106 | 2,4% |
| COMERCIAL HAGELIN | 94 | 2,1% |
| SIN ADJUDICAR | 66 | 1,5% |

── CRONOGRAMA DE INSTALACIÓN ──
Período: Mayo 2026 – Agosto 2026
| Mes | Unidades |
|-----|----------|
| Mayo 2026 | 66 |
| Junio 2026 | 44 |
| Julio 2026 | 4.084 |
| Agosto 2026 | 277 |

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
  private conversationHistory: { role: string; content: string }[] = [];

  setData(data: RawItem[], summary: SummaryData, eettFiles: EETTFile[]) {
    this.data = data;
    this.summary = summary;
    this.eettFiles = eettFiles;
    this.idx = buildIndex(data);
  }

  async checkHealth(): Promise<boolean> {
    if (this.ollamaAvailable !== null) return this.ollamaAvailable;
    this.ollamaAvailable = !!ANTHROPIC_API_KEY;
    return this.ollamaAvailable;
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  async sendMessage(
    message: string,
    _sessionId?: string,
    _history?: Message[],
    onToken?: (token: string) => void,
  ): Promise<
    | { response: { id: string; response: string; sessionId: string; tokensUsed: number; model: string; timestamp: string }; error: null }
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
      // Detect what the user is asking about
      const { topics, matches } = detectTopics(message);

      // Build full context with all inventory data
      const context = buildContext(topics, matches, this.idx, this.summary, this.eettFiles, message);

      // Add user message to conversation
      this.conversationHistory.push({ role: "user", content: message });
      if (this.conversationHistory.length > 4) {
        this.conversationHistory = this.conversationHistory.slice(-4);
      }

      // System = base instructions + inventory context (truncated to fit Groq TPM limits)
      const MAX_CONTEXT_CHARS = 40000;
      const truncatedContext = context.length > MAX_CONTEXT_CHARS
        ? context.slice(0, MAX_CONTEXT_CHARS) + "\n\n[...contexto truncado por límite de tokens...]"
        : context;
      const systemPrompt = `${BASE_SYSTEM}\nDATOS DEL INVENTARIO:\n${truncatedContext}`;

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
