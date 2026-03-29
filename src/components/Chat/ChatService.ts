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
   Chat Service — Gemini AI con Smart Context Selection
   Solo inyecta datos RELEVANTES a la pregunta → rápido y preciso
   ═══════════════════════════════════════════════════════════════ */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const MODEL = "gemini-2.0-flash";

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

// ── Gemini API call with STREAMING ──
async function callClaudeStream(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  onToken: (token: string) => void,
): Promise<string> {
  // Convert messages: Anthropic uses "assistant", Gemini uses "model"
  const geminiContents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY || ""}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiContents,
        generationConfig: { maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(180000),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Gemini error ${res.status}: ${(errBody as { error?: { message?: string } }).error?.message || res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const data = line.slice(6).trim();
      if (!data) continue;
      try {
        const json = JSON.parse(data);
        const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          fullText += text;
          onToken(text);
        }
      } catch {
        // skip malformed
      }
    }
  }

  return fullText || "Sin respuesta del modelo.";
}

// ── Base system instruction ──
const BASE_SYSTEM = `Eres el asistente IA oficial del Hospital Buin Paine, especializado en el inventario de mobiliario no clínico (MNC) del hospital (Sistema SGD).

REGLAS ABSOLUTAS:
1. Responde SIEMPRE en español, de forma clara y estructurada
2. Para TOTALES y CANTIDADES: usa los datos de "CIFRAS OFICIALES" de este prompt — son la fuente de verdad
3. El bloque "DATOS DEL INVENTARIO" complementa con detalles adicionales
4. Para listas largas (4+ elementos), usa tabla markdown
5. Para PDFs de EETT: usa EXACTAMENTE el link del formato [Nombre](eett/EETT%20...) — nunca lo simplifiques
6. Cita cifras exactas siempre: "1.285 unidades", no "aproximadamente 1.300"
7. Cuando alguien pida "detalle", "resumen" o "total": entrega desglose completo sin omitir ninguna categoría

══════════════════════════════════════════
CIFRAS OFICIALES — INVENTARIO MNC HOSPITAL BUIN PAINE
(Fuente: Cronograma de Instalacion de MNC_20260327.xlsx — actualizado 27/03/2026)
══════════════════════════════════════════

TOTAL GENERAL: 4.471 unidades | 1.978 registros | 80 tipos de producto
Servicios: 40 | Pisos: 7 | Recintos: 815 | Proveedores: 4 | Familias: 4

── FAMILIAS DE MUEBLES (4 familias) ──
1. Silla:      3.248 uds  (72,6%) — incluye sillas, butacas, bancas, taburetes, sillones
2. Mesa:         693 uds  (15,5%) — incluye mesas de casino, reuniones, laterales, escritorios
3. Otro:         427 uds   (9,6%) — incluye bibliotecas, colchonetas, percheros, contenedores, libreros
4. Mobiliario:   103 uds   (2,3%) — incluye sillones 2 y 1 cuerpo, muebles arrimo, lockers

NOTA: La familia "Silla" es la más grande con 3.248 unidades (72,6% del total).
Los productos Silla Visita (1.265 uds), Silla Ergonómica (548 uds) y Silla tipo Casino (498 uds)
pertenecen a la familia Silla y representan los 3 ítems más numerosos del inventario.

── EQUIPOS / PRODUCTOS (top 25 por cantidad) ──
Silla Visita:                    1.265 uds
Silla Ergonómica:                  548 uds
Silla tipo Casino:                 498 uds
Mueble Tipo Biblioteca M45_A:      273 uds
Silla Butaca Espera 3 Cuerpos:     238 uds
Sillón Bergere:                    185 uds
Escritorio en L administrativo:    177 uds
Escritorio simple 120x70 cm:       122 uds
Sillón 2 Cuerpo:                   103 uds
Mesa Tipo Casino Circular:          73 uds
Punto de registro clínico:          67 uds
Silla Ergonómica Reforzada:         60 uds
Banca Madera_B:                     59 uds
Escritorio de Consultas:            58 uds
Colchoneta Reposo A:                56 uds
Mesa Reuniones Tipo I:              53 uds
Silla Párvulo:                      52 uds
Mesa Tipo Casino Redonda 90 cm:     42 uds
Silla Tipo Universitaria:           33 uds
Mesa Lateral:                       31 uds
Sillón 1 Cuerpo:                    31 uds
Banca Madera_A:                     30 uds
Cama Apilable:                      28 uds
Taburete con Ruedas sin Respaldo:   24 uds
Banca Madera_C:                     22 uds
(Total: 80 tipos de producto en el inventario completo)

── SERVICIOS MÉDICOS (40 servicios) ──
Administración y apoyo general:   819 uds
Consultas medicas generales:      376 uds
Urgencia:                         313 uds
Comedor para funcionarios y público: 307 uds
Sala Cuna:                        298 uds
Hospitalización:                  230 uds
Hospital de día:                  212 uds
Psiquiatría:                      179 uds
UHCIP:                            170 uds
Laboratorio:                      161 uds
Med física y rehabilitación:      144 uds
Imagenología:                      90 uds
Pabellones:                        85 uds
Contabilidad:                      83 uds
Diálisis:                          76 uds
Farmacia:                          75 uds
UTI:                               73 uds
Central de Alimentación:           69 uds
Odontología:                       69 uds
Cafetería:                         66 uds
Consultas Ambulatorias:            59 uds
Mantenimiento:                     52 uds
Biblioteca:                        52 uds
Parto Integral:                    48 uds
Auditorio:                         46 uds
Laboratorio UMT:                   46 uds
Cuidados Paliativos:               45 uds
Abastecimiento:                    44 uds
Vestuario:                         41 uds
Esterilización:                    29 uds
Chile Crece Contigo:               26 uds
Neonatología:                      25 uds
SEDILE:                            14 uds
Lavandería:                        12 uds
Morgue:                            11 uds
Telemedicina:                       8 uds
Circulación Rehabilitación:         8 uds
Exterior portería:                  6 uds
Cirugía menor:                      2 uds

── RECINTOS POR SERVICIO (815 recintos únicos en total) ──
Administración y apoyo general:      114 recintos | 819 uds
Urgencia:                             79 recintos | 313 uds
Hospitalización:                      79 recintos | 230 uds
Consultas medicas generales:          78 recintos | 376 uds
Laboratorio:                          37 recintos | 161 uds
Pabellones:                           30 recintos |  85 uds
Hospital de día:                      28 recintos | 212 uds
UTI:                                  28 recintos |  73 uds
Med física y rehabilitación:          26 recintos | 144 uds
UHCIP:                                26 recintos | 170 uds
Psiquiatría:                          25 recintos | 179 uds
Diálisis:                             21 recintos |  76 uds
Farmacia:                             20 recintos |  75 uds
Central de Alimentación:              19 recintos |  69 uds
Odontología:                          19 recintos |  69 uds
Imagenología:                         17 recintos |  90 uds
Parto Integral:                       16 recintos |  48 uds
Sala Cuna:                            13 recintos | 298 uds
Abastecimiento:                       13 recintos |  44 uds
Esterilización:                       12 recintos |  29 uds
Contabilidad:                         11 recintos |  83 uds
Mantenimiento:                        10 recintos |  52 uds
Cuidados Paliativos:                  10 recintos |  45 uds
Consultas Ambulatorias:               10 recintos |  59 uds
Comedor para funcionarios y público:   8 recintos | 307 uds
Neonatología:                          7 recintos |  25 uds
Auditorio:                             7 recintos |  46 uds
Lavandería:                            7 recintos |  12 uds
Vestuario:                             6 recintos |  41 uds
SEDILE:                                6 recintos |  14 uds
Laboratorio UMT:                       6 recintos |  46 uds
Biblioteca:                            6 recintos |  52 uds
Exterior portería:                     6 recintos |   6 uds
Cafetería:                             5 recintos |  66 uds
Morgue:                                3 recintos |  11 uds
Cirugía menor:                         2 recintos |   2 uds
Telemedicina:                          2 recintos |   8 uds
Chile Crece Contigo:                   1 recinto  |  26 uds
Circulación Rehabilitación:            1 recinto  |   8 uds

── DISTRIBUCIÓN POR PISO (recintos y unidades) ──
Piso 1: 264 recintos | 1.470 uds
Piso 2: 237 recintos | 1.547 uds
Piso 3: 173 recintos |   855 uds
Piso 4:  40 recintos |   184 uds
Piso 5:  40 recintos |   137 uds
Piso 6:  33 recintos |   150 uds
Piso 7:  27 recintos |   127 uds


── PROVEEDORES ──
MELMAN SPA:          4.205 uds (94,1%)
ALLMEDICA:             106 uds  (2,4%)
COMERCIAL HAGELIN:      94 uds  (2,1%)
SIN ADJUDICAR:          66 uds  (1,5%)

── CRONOGRAMA DE INSTALACIÓN ──
Período: Mayo 2026 – Agosto 2026
Mayo 2026:   66 uds
Junio 2026:  44 uds
Julio 2026: 4.084 uds  ← mes principal
Agosto 2026: 277 uds

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
    this.ollamaAvailable = !!GEMINI_API_KEY;
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
          message: "Gemini AI no está configurado",
          code: "GEMINI_UNAVAILABLE",
          suggestion: "Configura VITE_GEMINI_API_KEY en el archivo .env del proyecto.",
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
      if (this.conversationHistory.length > 6) {
        this.conversationHistory = this.conversationHistory.slice(-6);
      }

      // System = base instructions + full inventory context
      const systemPrompt = `${BASE_SYSTEM}\nDATOS DEL INVENTARIO (COMPLETOS):\n${context}`;

      const answer = await callClaudeStream(this.conversationHistory, systemPrompt, onToken || (() => {}));
      this.conversationHistory.push({ role: "assistant", content: answer });

      return {
        response: {
          id: Math.random().toString(36).substr(2, 9),
          response: answer,
          sessionId: "gemini-direct",
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
      console.error("[ChatService] Gemini error:", errMsg);
      return {
        response: null,
        error: {
          error: true,
          message: isTimeout ? "Gemini tardó demasiado en responder" : `Error: ${errMsg}`,
          code: isTimeout ? "TIMEOUT" : "GEMINI_ERROR",
          suggestion: "Revisa la consola del navegador (F12) para más detalles.",
        },
      };
    }
  }
}

export const ChatService = new ChatServiceClass();
