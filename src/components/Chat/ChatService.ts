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
   Motor de consultas local — 100% cliente
   Acceso completo: RAW + SUMMARY + EETT PDFs + Control Documentos
   ═══════════════════════════════════════════════════════════════ */

// Helpers
const fmt = (n: number) => n.toLocaleString("es-CL");
const pct = (n: number, total: number) => ((n / total) * 100).toFixed(1);
const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const table = (headers: string[], rows: (string | number)[][]) => {
  const h = headers.join(" | ");
  const sep = headers.map(() => "---").join(" | ");
  const body = rows.map((r) => r.join(" | ")).join("\n");
  return `${h}\n${sep}\n${body}`;
};

const BASE_PDF_PATH = "eett/";

// ── EETT knowledge base (spec data embedded for each product) ──
const EETT_SPECS: Record<string, { desc: string; material: string; dimensiones: string; color: string; extras: string }> = {
  "201.001": { desc: "Estación de trabajo con cubierta en L o recta para oficinas administrativas", material: "Estructura metálica, cubierta melamina 25mm", dimensiones: "1600x700x750mm (variante L: 1600x1400x750mm)", color: "Cubierta haya/roble, estructura gris/negro", extras: "Pasacables, niveladores, bandeja portacables opcional" },
  "201.002": { desc: "Mesa lateral auxiliar para uso hospitalario junto a camas o sillones", material: "Cubierta melamina, estructura metálica tubular", dimensiones: "450x450x550mm", color: "Cubierta haya, estructura gris", extras: "Niveladores, bordes redondeados" },
  "201.003": { desc: "Mesa párvulo de inclusión, altura adaptada para silla de ruedas", material: "Cubierta melamina, estructura metálica", dimensiones: "800x600x560mm (altura regulable)", color: "Cubierta colores infantiles", extras: "Recorte semicircular para acercamiento silla de ruedas" },
  "201.004": { desc: "Mesa párvulo tipo I para sala cuna y jardín", material: "Cubierta melamina, patas madera o metal", dimensiones: "600x600x460mm", color: "Colores infantiles variados", extras: "Bordes redondeados protección, niveladores" },
  "201.005": { desc: "Mesa párvulo tipo II más grande para actividades grupales", material: "Cubierta melamina, estructura metálica", dimensiones: "1200x600x460mm", color: "Colores infantiles", extras: "Bordes redondeados, superficies lavables" },
  "201.008": { desc: "Mesa reuniones tipo I para salas de reunión pequeñas", material: "Cubierta melamina 25mm, base metálica", dimensiones: "2000x1000x750mm", color: "Cubierta haya/roble, base cromada o gris", extras: "Pasacables central, capacidad 6-8 personas" },
  "201.009": { desc: "Mesa reuniones tipo II para salas medianas", material: "Cubierta melamina 25mm, base metálica", dimensiones: "2400x1200x750mm", color: "Cubierta haya/roble", extras: "Pasacables, capacidad 8-10 personas" },
  "201.010": { desc: "Mesa reuniones tipo III para salas amplias/directivas", material: "Cubierta melamina 25mm o enchapada", dimensiones: "3000x1200x750mm", color: "Cubierta roble/nogal", extras: "Doble pasacables, capacidad 10-14 personas" },
  "201.011": { desc: "Mesa tipo casino rectangular para comedor de funcionarios", material: "Cubierta melamina HPL, estructura metálica", dimensiones: "1200x800x750mm", color: "Cubierta blanca, estructura gris", extras: "Resistente líquidos, fácil limpieza, uso intensivo" },
  "201.011B": { desc: "Mesa tipo casino circular diámetro 90cm", material: "Cubierta melamina HPL, base central metálica", dimensiones: "Ø900x750mm", color: "Cubierta blanca, base cromada/gris", extras: "Base pedestal central, 4 personas" },
  "202.001": { desc: "Atril graduable de altura para lectura/presentaciones", material: "Estructura metálica tubular con bandeja", dimensiones: "Regulable 800-1200mm altura", color: "Negro/gris", extras: "Inclinación ajustable, con ruedas con freno" },
  "202.006": { desc: "Cama apilable para sala cuna y jardín infantil", material: "Estructura metálica, colchoneta espuma", dimensiones: "1300x550x250mm", color: "Estructura colores variados", extras: "Apilable hasta 10 unidades, colchoneta lavable" },
  "202.008": { desc: "Cuna alta hospitalaria para neonatología", material: "Estructura metálica, barandas transparentes", dimensiones: "900x500x900mm", color: "Blanco", extras: "Ruedas con freno, altura regulable, barandas abatibles" },
  "202.009": { desc: "Cuna baja para sala cuna", material: "Madera MDF y metal", dimensiones: "1200x600x400mm", color: "Natural/blanco", extras: "Barandas fijas, colchón incluido" },
  "202.012": { desc: "Mueble locker metálico para vestuario de funcionarios", material: "Acero laminado al frío, pintura electrostática", dimensiones: "380x450x1800mm por módulo", color: "Gris/beige", extras: "Cerradura con llave, ventilación, portacandado" },
  "203.014": { desc: "Librero estantería para oficinas y biblioteca", material: "Melamina 18mm", dimensiones: "800x350x1800mm", color: "Haya/roble/blanco", extras: "5 repisas regulables, anclaje a muro" },
  "203.015": { desc: "Mueble arrimo bajo para apoyo en oficinas", material: "Melamina 18mm", dimensiones: "1200x400x750mm", color: "Haya/roble", extras: "Puertas con cerradura, repisas interiores" },
  "203.016": { desc: "Mueble tipo biblioteca grande para almacenamiento y exhibición", material: "Melamina 25mm, estructura reforzada", dimensiones: "900x400x2000mm", color: "Haya/roble", extras: "Puertas inferiores, repisas superiores abiertas" },
  "203.018": { desc: "Perchero de pie para áreas de atención", material: "Base metálica, poste cromado", dimensiones: "Ø400x1700mm", color: "Cromado/negro", extras: "8 ganchos, base contrapeso anti-volcamiento" },
  "203.022": { desc: "Contenedor de almacenamiento para servicios", material: "Polietileno de alta densidad / metálico", dimensiones: "Variable según modelo", color: "Gris/azul", extras: "Con tapa, apilable, uso industrial" },
  "204.001": { desc: "Banca de espera con estructura metálica para pasillos", material: "Asiento madera contrachapada, estructura metálica", dimensiones: "1500x500x430mm (3 cuerpos)", color: "Asiento haya, estructura gris/negro", extras: "Fijación a piso, reposabrazos laterales" },
  "204.002": { desc: "Banca de madera para exteriores y jardín", material: "Madera sólida tratada, estructura metálica", dimensiones: "1800x600x450mm", color: "Madera natural", extras: "Tratamiento UV e intemperie, anclaje a piso" },
  "204.003": { desc: "Silla adulto multiuso para salas de espera y actividades", material: "Asiento polipropileno, estructura metálica tubular", dimensiones: "450x450x800mm", color: "Asiento colores variados, estructura cromada", extras: "Apilable, resistente uso intensivo" },
  "204.005": { desc: "Silla bacínica con apertura para uso de pacientes", material: "Estructura aluminio, asiento polietileno", dimensiones: "500x500x850mm", color: "Gris/blanco", extras: "Reposabrazos, apertura higiénica, antideslizante" },
  "204.006": { desc: "Silla ergonómica con respaldo alto para puestos administrativos", material: "Malla respaldo, asiento espuma inyectada, base nylon", dimensiones: "Regulable, asiento 450x450mm", color: "Negro", extras: "Apoyabrazos regulable, pistón gas, mecanismo syncro, ruedas" },
  "204.006B": { desc: "Silla taburete con ruedas sin respaldo para procedimientos clínicos", material: "Asiento espuma, base cromada", dimensiones: "Ø350, altura 450-600mm regulable", color: "Negro/gris", extras: "Ruedas con freno, pistón gas, giro 360°" },
  "204.007": { desc: "Silla lactante baja para sala cuna", material: "Madera y espuma tapizada", dimensiones: "400x400x300mm", color: "Colores infantiles", extras: "Altura baja para adultos en sala cuna, tapiz lavable" },
  "204.009": { desc: "Silla párvulo para niños en jardín y sala cuna", material: "Polipropileno resistente", dimensiones: "340x340x560mm", color: "Colores variados", extras: "Apilable, liviana, bordes redondeados" },
  "204.010": { desc: "Silla tipo casino para comedor de funcionarios", material: "Asiento polipropileno, estructura metálica", dimensiones: "440x440x800mm", color: "Asiento blanco/gris, estructura cromada", extras: "Apilable, resistente, uso intensivo diario" },
  "204.011": { desc: "Silla tipo universitaria con paleta escritorio", material: "Asiento polipropileno, paleta melamina, estructura metálica", dimensiones: "450x500x800mm", color: "Asiento azul/gris, paleta haya", extras: "Paleta abatible, apilable, diestros y zurdos" },
  "204.012": { desc: "Silla visita con brazos para consultas médicas y oficinas", material: "Asiento espuma tapizada, estructura metálica cromada", dimensiones: "450x550x800mm", color: "Tapiz azul/gris/negro", extras: "Apoyabrazos fijos, apilable hasta 4 unidades" },
  "204.013": { desc: "Sillón 1 cuerpo para salas de espera y estar", material: "Espuma alta densidad, tapiz antibacteriano", dimensiones: "700x750x800mm", color: "Tapiz azul/gris institucional", extras: "Patas madera o metal, tapiz lavable, uso hospitalario" },
  "204.014": { desc: "Sillón 2 cuerpos para salas de espera amplias", material: "Espuma alta densidad, tapiz antibacteriano", dimensiones: "1300x750x800mm", color: "Tapiz azul/gris institucional", extras: "Patas madera o metal, tapiz lavable" },
  "204.015": { desc: "Sillón bergere reclinable para hospitalización y descanso", material: "Espuma HR, tapiz antibacteriano lavable", dimensiones: "700x800x1050mm", color: "Tapiz azul/gris", extras: "Reclinable, apoyabrazos, uso hospitalización 24/7" },
  "204.019": { desc: "Silla de apoyo hora ingesta para alimentación de pacientes", material: "Estructura metálica, asiento polipropileno con bandeja", dimensiones: "500x500x850mm", color: "Blanco/gris", extras: "Bandeja frontal abatible, apoyabrazos, uso clínico" },
  "204.020": { desc: "Silla butaca espera 3 cuerpos para pasillos y salas de espera", material: "Asiento polipropileno, estructura metálica", dimensiones: "1700x550x800mm", color: "Asiento azul/gris, estructura cromada", extras: "3 asientos unidos, fijación a piso, reposabrazos intermedios" },
};

// ── Control Documentos structure (hardcoded summary) ──
const CONTROL_DOC_INFO = {
  baseUrl: "https://dominionglobal.sharepoint.com/colaborativos/desarrollonegocios/Documentos%20compartidos/Forms/AllItems.aspx",
  description: "Sistema de control documental en SharePoint para el Hospital Buin Paine. Estructura jerárquica por código de item MNC.",
  structure: "Cada item tiene carpetas: ETAPA CONSTRUCCION y ETAPA EXPLOTACION, cada una con subcarpetas: ADQUISICION (Antecedente Ofertas A/B/C) organizadas por proveedor.",
  totalFolders: "~2000+ carpetas",
  categories: ["MNC (Mobiliario No Clínico)"],
};

// ── Intent detection ──
interface Intent {
  type: string;
  entity?: string;
  filters?: { piso?: number; servicio?: string; familia?: string; proveedor?: string; nombre?: string };
}

function detectIntent(q: string, data: RawItem[], summary: SummaryData, eettFiles: EETTFile[]): Intent {
  const n = normalize(q);

  // Detect floor filter
  let piso: number | undefined;
  const pisoMatch = n.match(/piso\s*(\d)/);
  if (pisoMatch) piso = parseInt(pisoMatch[1]);

  // Detect proveedor filter
  let proveedor: string | undefined;
  for (const p of summary.byProveedor) {
    if (n.includes(normalize(p.name))) { proveedor = p.name; break; }
  }

  // Detect familia filter (use word boundaries to avoid "mesas" matching "mes")
  let familia: string | undefined;
  const familiaPatterns: [RegExp, string][] = [
    [/\bsillas?\b/, "Silla"],
    [/\bmesas?\b/, "Mesa"],
    [/\bmobiliario\b/, "Mobiliario"],
    [/\botros?\b/, "Otro"],
  ];
  for (const [rx, fam] of familiaPatterns) {
    if (rx.test(n)) { familia = fam; break; }
  }

  // Detect servicio filter (exact then partial match)
  let servicio: string | undefined;
  for (const s of summary.byServicio) {
    if (n.includes(normalize(s.name))) { servicio = s.name; break; }
  }
  if (!servicio) {
    // Fuzzy: check if any servicio word appears in query
    for (const s of summary.byServicio) {
      const sWords = normalize(s.name).split(/\s+/).filter(w => w.length > 3);
      if (sWords.some(w => n.includes(w))) { servicio = s.name; break; }
    }
  }

  // Detect specific nombre (prefer longest match to avoid "Banca" matching before "Banca Madera")
  let nombre: string | undefined;
  const sortedNombres = [...summary.byNombre].sort((a, b) => b.name.length - a.name.length);
  for (const item of sortedNombres) {
    if (n.includes(normalize(item.name))) { nombre = item.name; break; }
  }

  const filters = { piso, proveedor, familia, servicio, nombre };

  // ── EETT / PDF / spec intents ──
  if (/eett|especificacion|ficha\s*tecnica|pdf|especif|tecnica|plano|detalle\s*tecnico/.test(n))
    return { type: "eett", filters };
  if (/control\s*doc|sharepoint|carpeta|documento|archivo|repositorio|SGD/.test(n))
    return { type: "control_doc", filters };
  if (/material|dimension|medida|color|tamaño|peso|caracteristic/.test(n))
    return { type: "eett_detalle", filters };

  // ── Data intents ──
  if (/resumen|resume|general|todo|inventario completo|overview|estadistica/.test(n))
    return { type: "resumen", filters };
  if (/cuant[oa]s?\s+(hay|tiene|son|existen|unidades)/.test(n) || /total\s+de/.test(n) || /numero\s+de/.test(n))
    return { type: "contar", filters };
  if (/distribu|reparto|repartid|desglos/.test(n) && (piso !== undefined || /piso/.test(n)))
    return { type: "distribucion_pisos", filters };
  if (/distribu|reparto|repartid|desglos/.test(n) && servicio)
    return { type: "distribucion_servicios", filters };
  if (/piso/.test(n) && !piso && /compar|todos|cada|cuantos/.test(n))
    return { type: "distribucion_pisos", filters };
  if (/proveedor/.test(n))
    return { type: "proveedores", filters };
  if (/servicio/.test(n) && /mas|mayor|principal|top/.test(n))
    return { type: "top_servicios", filters };
  if (/servicio/.test(n))
    return { type: "servicios", filters };
  if (/familia/.test(n) || /tipo.*mueble/.test(n) || /categori/.test(n))
    return { type: "familias", filters };
  if (/fecha|instalacion|cuando|calendario|cronograma/.test(n) || (!familia && /\bmes\b|\bsemana\b/.test(n)))
    return { type: "fechas", filters };
  if (/zona/.test(n))
    return { type: "zonas", filters };
  if (/recinto/.test(n))
    return { type: "recintos", filters };
  if (/nombre|producto|articulo|item/.test(n) && !nombre)
    return { type: "productos", filters };
  // Combined filters: if multiple detected, use "contar" for flexible results
  if (nombre && (piso !== undefined || servicio)) return { type: "contar", filters };
  if (familia && (piso !== undefined || servicio)) return { type: "contar", filters };
  if (piso !== undefined) return { type: "piso_detalle", filters };
  if (proveedor) return { type: "proveedor_detalle", filters };
  if (servicio) return { type: "servicio_detalle", filters };
  if (familia) return { type: "contar", filters };
  if (nombre) return { type: "producto_detalle", filters };

  // Greeting / help
  if (/hola|buenos|buenas|hey|saludos/.test(n)) return { type: "saludo" };
  if (/ayuda|help|que puedes|como funciona|que informacion/.test(n)) return { type: "ayuda" };
  if (/plataforma|dashboard|sistema|seccion|pestana|tab/.test(n)) return { type: "plataforma" };

  return { type: "general", filters };
}

// ── Response generators ──
function processQuery(q: string, data: RawItem[], summary: SummaryData, eettFiles: EETTFile[]): string {
  const intent = detectIntent(q, data, summary, eettFiles);
  const f = intent.filters || {};

  const applyFilters = (items: RawItem[]): RawItem[] => {
    let filtered = items;
    if (f.piso !== undefined) filtered = filtered.filter((i) => i.piso === f.piso);
    if (f.proveedor) filtered = filtered.filter((i) => i.proveedor === f.proveedor);
    if (f.familia) filtered = filtered.filter((i) => i.familia === f.familia);
    if (f.servicio) filtered = filtered.filter((i) => i.servicio === f.servicio);
    if (f.nombre) filtered = filtered.filter((i) => i.nombre === f.nombre);
    return filtered;
  };

  // Find matching EETT by product name (prefer longest/most specific match)
  const findEETT = (productName: string): EETTFile | undefined => {
    const np = normalize(productName);
    // Exact match first
    const exact = eettFiles.find((e) => normalize(e.name) === np);
    if (exact) return exact;
    // Then sort by name length desc to prefer "Banca Madera" over "Banca"
    const sorted = [...eettFiles].sort((a, b) => b.name.length - a.name.length);
    return sorted.find((e) => np.includes(normalize(e.name)) || normalize(e.name).includes(np));
  };

  // Find EETT by query text
  const findEETTByQuery = (query: string): EETTFile[] => {
    const nq = normalize(query);
    return eettFiles.filter((e) =>
      nq.includes(normalize(e.name)) ||
      normalize(e.name).includes(nq) ||
      nq.includes(normalize(e.code)) ||
      normalize(e.code).includes(nq)
    );
  };

  switch (intent.type) {
    case "saludo":
      return `¡Hola! 👋 Soy el asistente del inventario del Hospital Buin Paine.\n\nTengo acceso completo a toda la información de la plataforma:\n\n• **${fmt(summary.totalItems)}** artículos de inventario (**${fmt(summary.totalQty)}** unidades)\n• **${eettFiles.length}** fichas técnicas EETT (especificaciones de productos)\n• **${summary.uniqueServicios}** servicios en **${summary.pisos}** pisos\n• **${summary.proveedores}** proveedores\n• Control documental SharePoint\n\n¿En qué te puedo ayudar?`;

    case "ayuda":
      return `Tengo acceso a **toda la información** cargada en la plataforma:\n\n**📊 Inventario completo:**\n• "¿Cuántas sillas hay en total?"\n• "Muebles del piso 3"\n• "¿Qué tiene Urgencia?"\n• "Distribución por proveedor"\n\n**📋 Especificaciones Técnicas (EETT):**\n• "Ficha técnica de la Silla Visita"\n• "¿De qué material es la Silla Ergonómica?"\n• "Dimensiones de la Mesa Reuniones Tipo I"\n• "Lista todos los EETT disponibles"\n\n**📁 Control de Documentos:**\n• "¿Cómo está organizado el control documental?"\n• "¿Dónde están los documentos en SharePoint?"\n\n**📅 Fechas y calendario:**\n• "¿Cuándo se instalan los muebles?"\n• "Cronograma de instalación"\n\nPuedes combinar filtros: piso + servicio + familia + proveedor.`;

    case "plataforma":
      return `📱 **Plataforma SGD — Hospital Buin Paine**\n\nEl sistema tiene las siguientes secciones:\n\n• **Resumen** — KPIs generales: ${fmt(summary.totalItems)} artículos, ${fmt(summary.totalQty)} unidades\n• **Por Piso** — Distribución en ${summary.pisos} pisos del hospital\n• **Por Servicio** — Desglose en ${summary.uniqueServicios} servicios clínicos y administrativos\n• **Por Producto** — ${summary.uniqueNombres} tipos de mueble diferentes\n• **Por Fecha** — Calendario de instalación (${summary.fechaStats.fechaMin} a ${summary.fechaStats.fechaMax})\n• **Esp. Técnicas** — ${eettFiles.length} fichas EETT con PDFs descargables\n• **Control Documento** — Repositorio SharePoint con ~2000+ carpetas\n• **Chat IA** — Este asistente con acceso a toda la información\n\n**Proveedores:** ${summary.byProveedor.map((p) => p.name).join(", ")}\n**Familias:** ${summary.byFamilia.map((f) => f.name).join(", ")}`;

    case "eett": {
      // Check if asking about specific product
      const matches = findEETTByQuery(q);
      if (matches.length === 1) {
        const eett = matches[0];
        const spec = EETT_SPECS[eett.code];
        const pdfLink = `${BASE_PDF_PATH}${eett.file}`;
        // Count inventory
        const invItems = data.filter((i) => normalize(i.nombre).includes(normalize(eett.name)) || normalize(eett.name).includes(normalize(i.nombre)));
        const invQty = invItems.reduce((s, i) => s + i.cantidad, 0);

        let result = `📋 **EETT ${eett.code} — ${eett.name}**\n\n`;
        if (spec) {
          result += `**Descripción:** ${spec.desc}\n**Material:** ${spec.material}\n**Dimensiones:** ${spec.dimensiones}\n**Color:** ${spec.color}\n**Extras:** ${spec.extras}\n\n`;
        }
        if (invQty > 0) {
          result += `**En inventario:** ${fmt(invQty)} unidades en ${invItems.length} artículos\n\n`;
        }
        result += `📄 **PDF:** [${eett.file}](${pdfLink})`;
        return result;
      }

      if (matches.length > 1) {
        const rows = matches.map((e) => [e.code, e.name, `[PDF](${BASE_PDF_PATH}${e.file})`]);
        return `📋 **Fichas EETT encontradas:**\n\n${table(["Código", "Producto", "PDF"], rows)}`;
      }

      // List all EETT
      const rows = eettFiles.map((e) => {
        const spec = EETT_SPECS[e.code];
        return [e.code, e.name, spec ? spec.dimensiones.split(",")[0] : "—"];
      });
      return `📋 **Especificaciones Técnicas EETT** (${eettFiles.length} fichas)\n\nCada ficha contiene material, dimensiones, color y características del producto.\n\n${table(["Código", "Producto", "Dimensiones"], rows)}\n\n*Pregunta por cualquier producto para ver su ficha completa con link al PDF.*`;
    }

    case "eett_detalle": {
      // Find product by name or filters
      let targetName = f.nombre || "";
      if (!targetName) {
        // Try to find in query
        for (const e of eettFiles) {
          if (normalize(q).includes(normalize(e.name))) { targetName = e.name; break; }
        }
      }
      if (!targetName) {
        // Try familia
        if (f.familia) {
          const matching = eettFiles.filter((e) => {
            const spec = EETT_SPECS[e.code];
            return spec && normalize(e.name).includes(normalize(f.familia!));
          });
          if (matching.length > 0) {
            const rows = matching.map((e) => {
              const spec = EETT_SPECS[e.code]!;
              return [e.name, spec.material.slice(0, 40), spec.dimensiones.split(",")[0]];
            });
            return `📋 **Especificaciones de ${f.familia}s:**\n\n${table(["Producto", "Material", "Dimensiones"], rows)}`;
          }
        }
        return `Para ver detalles técnicos, especifica el producto. Ejemplo: "Material de la Silla Visita" o "Dimensiones de la Mesa Reuniones Tipo I".\n\nEscribe "fichas técnicas" para ver la lista completa.`;
      }

      const eett = eettFiles.find((e) => normalize(e.name) === normalize(targetName) || normalize(e.name).includes(normalize(targetName)));
      if (eett) {
        const spec = EETT_SPECS[eett.code];
        if (spec) {
          const invItems = data.filter((i) => normalize(i.nombre).includes(normalize(eett.name)));
          const invQty = invItems.reduce((s, i) => s + i.cantidad, 0);
          return `📋 **${eett.name}** (EETT ${eett.code})\n\n**Descripción:** ${spec.desc}\n**Material:** ${spec.material}\n**Dimensiones:** ${spec.dimensiones}\n**Color:** ${spec.color}\n**Características:** ${spec.extras}\n\n**En inventario:** ${fmt(invQty)} unidades\n📄 **PDF:** [Ver ficha técnica](${BASE_PDF_PATH}${eett.file})`;
        }
      }
      return `No encontré ficha técnica para "${targetName}". Escribe "fichas técnicas" para ver todas las disponibles.`;
    }

    case "control_doc":
      return `📁 **Control de Documentos — SharePoint**\n\n**Descripción:** ${CONTROL_DOC_INFO.description}\n\n**Estructura:**\n${CONTROL_DOC_INFO.structure}\n\n**Organización por item:**\nCada código de item (ej: 201003, 204012) tiene:\n• **ETAPA CONSTRUCCION** → ADQUISICION → Antecedentes Ofertas (A, B, C)\n• **ETAPA EXPLOTACION** → ADQUISICION → Antecedentes Ofertas (A, B, C)\n\nLas carpetas A, B, C corresponden a las ofertas de los 3 proveedores:\n• **A** — ${summary.byProveedor[0]?.name || "Proveedor A"}\n• **B** — ${summary.byProveedor[1]?.name || "Proveedor B"}\n• **C** — ${summary.byProveedor[2]?.name || "Proveedor C"}\n\n**Total:** ${CONTROL_DOC_INFO.totalFolders} en SharePoint\n**Categoría:** ${CONTROL_DOC_INFO.categories.join(", ")}\n\n*Accede a la pestaña "Control Documento" en la sidebar para navegar la estructura completa.*`;

    case "resumen": {
      const rows = summary.byFamilia.map((f) => [f.name, fmt(f.qty), pct(f.qty, summary.totalQty) + "%"]);
      return `📊 **Resumen General del Inventario**\n\n• **Total Artículos:** ${fmt(summary.totalItems)}\n• **Total Unidades:** ${fmt(summary.totalQty)}\n• **Recintos Únicos:** ${fmt(summary.uniqueRecintos)}\n• **Tipos de Mueble:** ${summary.uniqueNombres}\n• **Pisos:** ${summary.pisos} (del 1 al 7)\n• **Servicios:** ${summary.uniqueServicios}\n• **Proveedores:** ${summary.proveedores}\n• **Familias:** ${summary.familias}\n• **Fichas EETT:** ${eettFiles.length} especificaciones técnicas\n• **Período instalación:** ${summary.fechaStats.fechaMin} — ${summary.fechaStats.fechaMax}\n\n**Por Familia:**\n${table(["Familia", "Unidades", "%"], rows)}\n\n**Por Proveedor:**\n${summary.byProveedor.map((p) => `• ${p.name}: ${fmt(p.qty)} (${pct(p.qty, summary.totalQty)}%)`).join("\n")}`;
    }

    case "contar": {
      const filtered = applyFilters(data);
      const totalQty = filtered.reduce((s, i) => s + i.cantidad, 0);
      const totalItems = filtered.length;

      const parts: string[] = [];
      if (f.familia) parts.push(`familia **${f.familia}**`);
      if (f.proveedor) parts.push(`proveedor **${f.proveedor}**`);
      if (f.piso !== undefined) parts.push(`**Piso ${f.piso}**`);
      if (f.servicio) parts.push(`servicio **${f.servicio}**`);
      if (f.nombre) parts.push(`producto **${f.nombre}**`);
      const context = parts.length > 0 ? ` (${parts.join(", ")})` : "";

      if (totalItems === 0) return `No se encontraron resultados para los filtros especificados${context}.`;

      let breakdown = "";
      if (!f.familia && totalItems > 1) {
        const byFam: Record<string, number> = {};
        filtered.forEach((i) => { byFam[i.familia] = (byFam[i.familia] || 0) + i.cantidad; });
        const famRows = Object.entries(byFam).sort(([, a], [, b]) => b - a).map(([k, v]) => [k, fmt(v), pct(v, totalQty) + "%"]);
        breakdown = `\n\n**Desglose por familia:**\n${table(["Familia", "Unidades", "%"], famRows)}`;
      }

      // If a specific product, show EETT info too
      let eettInfo = "";
      if (f.nombre) {
        const eett = findEETT(f.nombre);
        if (eett) {
          const spec = EETT_SPECS[eett.code];
          eettInfo = `\n\n📋 **Ficha Técnica EETT ${eett.code}:**\n${spec ? `${spec.desc}\nMaterial: ${spec.material}\nDimensiones: ${spec.dimensiones}` : "Disponible"}\n📄 [Ver PDF](${BASE_PDF_PATH}${eett.file})`;
        }
      }

      return `${context ? `Para${context}:` : "En total:"}\n\n• **${fmt(totalItems)}** artículos distintos\n• **${fmt(totalQty)}** unidades${breakdown}${eettInfo}`;
    }

    case "comparar_pisos":
    case "distribucion_pisos": {
      const rows = summary.byPiso.map((p) => [p.name, fmt(p.qty), pct(p.qty, summary.totalQty) + "%"]);
      return `📍 **Distribución por Piso:**\n\n${table(["Piso", "Unidades", "%"], rows)}\n\n**Total:** ${fmt(summary.totalQty)} unidades`;
    }

    case "piso_detalle": {
      const pisoData = applyFilters(data);
      const totalQty = pisoData.reduce((s, i) => s + i.cantidad, 0);
      if (pisoData.length === 0) return `No hay datos para el Piso ${f.piso}.`;

      const byServ: Record<string, number> = {};
      pisoData.forEach((i) => { byServ[i.servicio] = (byServ[i.servicio] || 0) + i.cantidad; });
      const servRows = Object.entries(byServ).sort(([, a], [, b]) => b - a).slice(0, 10).map(([k, v]) => [k, fmt(v)]);

      const byFam: Record<string, number> = {};
      pisoData.forEach((i) => { byFam[i.familia] = (byFam[i.familia] || 0) + i.cantidad; });
      const famRows = Object.entries(byFam).sort(([, a], [, b]) => b - a).map(([k, v]) => [k, fmt(v)]);

      return `🏥 **Piso ${f.piso} — Detalle**\n\n• **${fmt(pisoData.length)}** artículos, **${fmt(totalQty)}** unidades\n\n**Por Familia:**\n${table(["Familia", "Unidades"], famRows)}\n\n**Top 10 Servicios:**\n${table(["Servicio", "Unidades"], servRows)}`;
    }

    case "proveedores": {
      const rows = summary.byProveedor.map((p) => [p.name, fmt(p.qty), pct(p.qty, summary.totalQty) + "%"]);
      return `🏭 **Proveedores:**\n\n${table(["Proveedor", "Unidades", "%"], rows)}\n\n**Control Documental:** Cada proveedor tiene sus ofertas en carpetas A, B, C dentro de SharePoint.`;
    }

    case "proveedor_detalle": {
      const filtered = applyFilters(data);
      const totalQty = filtered.reduce((s, i) => s + i.cantidad, 0);
      if (filtered.length === 0) return `No hay datos para el proveedor "${f.proveedor}".`;

      const byFam: Record<string, number> = {};
      filtered.forEach((i) => { byFam[i.familia] = (byFam[i.familia] || 0) + i.cantidad; });
      const famRows = Object.entries(byFam).sort(([, a], [, b]) => b - a).map(([k, v]) => [k, fmt(v)]);

      const byPiso: Record<string, number> = {};
      filtered.forEach((i) => { byPiso[`Piso ${i.piso}`] = (byPiso[`Piso ${i.piso}`] || 0) + i.cantidad; });
      const pisoRows = Object.entries(byPiso).sort().map(([k, v]) => [k, fmt(v)]);

      const topProducts: Record<string, number> = {};
      filtered.forEach((i) => { topProducts[i.nombre] = (topProducts[i.nombre] || 0) + i.cantidad; });
      const prodRows = Object.entries(topProducts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([k, v]) => [k, fmt(v)]);

      return `🏭 **Proveedor: ${f.proveedor}**\n\n• **${fmt(filtered.length)}** artículos, **${fmt(totalQty)}** unidades (${pct(totalQty, summary.totalQty)}% del total)\n\n**Por Familia:**\n${table(["Familia", "Unidades"], famRows)}\n\n**Por Piso:**\n${table(["Piso", "Unidades"], pisoRows)}\n\n**Top 10 Productos:**\n${table(["Producto", "Unidades"], prodRows)}`;
    }

    case "top_servicios":
    case "servicios": {
      const rows = summary.byServicio.slice(0, 15).map((s, i) => [String(i + 1), s.name, fmt(s.qty), pct(s.qty, summary.totalQty) + "%"]);
      return `🏥 **Top 15 Servicios:**\n\n${table(["#", "Servicio", "Unidades", "%"], rows)}\n\n*Total servicios: ${summary.uniqueServicios}*`;
    }

    case "servicio_detalle": {
      const filtered = applyFilters(data);
      const totalQty = filtered.reduce((s, i) => s + i.cantidad, 0);
      if (filtered.length === 0) return `No hay datos para el servicio "${f.servicio}".`;

      const byNombre: Record<string, number> = {};
      filtered.forEach((i) => { byNombre[i.nombre] = (byNombre[i.nombre] || 0) + i.cantidad; });
      const rows = Object.entries(byNombre).sort(([, a], [, b]) => b - a).slice(0, 10).map(([k, v]) => [k, fmt(v)]);

      const byPiso: Record<string, number> = {};
      filtered.forEach((i) => { byPiso[`Piso ${i.piso}`] = (byPiso[`Piso ${i.piso}`] || 0) + i.cantidad; });
      const pisoRows = Object.entries(byPiso).sort().map(([k, v]) => [k, fmt(v)]);

      return `🏥 **Servicio: ${f.servicio}**\n\n• **${fmt(filtered.length)}** artículos, **${fmt(totalQty)}** unidades\n\n**Productos principales:**\n${table(["Producto", "Unidades"], rows)}\n\n**Por Piso:**\n${table(["Piso", "Unidades"], pisoRows)}`;
    }

    case "distribucion_servicios":
    case "familias": {
      const rows = summary.byFamilia.map((f) => [f.name, fmt(f.qty), pct(f.qty, summary.totalQty) + "%"]);
      return `📦 **Familias de Muebles:**\n\n${table(["Familia", "Unidades", "%"], rows)}`;
    }

    case "productos": {
      const filtered = f.piso || f.servicio || f.proveedor || f.familia ? applyFilters(data) : data;
      const byNombre: Record<string, number> = {};
      filtered.forEach((i) => { byNombre[i.nombre] = (byNombre[i.nombre] || 0) + i.cantidad; });
      const rows = Object.entries(byNombre).sort(([, a], [, b]) => b - a).slice(0, 20).map(([k, v], i) => {
        const eett = findEETT(k);
        return [String(i + 1), k, fmt(v), eett ? `EETT ${eett.code}` : "—"];
      });
      return `📋 **Top 20 Productos:**\n\n${table(["#", "Producto", "Unidades", "Ficha EETT"], rows)}\n\n*Pregunta por cualquier producto para ver su ficha técnica completa.*`;
    }

    case "producto_detalle": {
      const filtered = data.filter((i) => i.nombre === f.nombre);
      const totalQty = filtered.reduce((s, i) => s + i.cantidad, 0);

      const byPiso: Record<string, number> = {};
      filtered.forEach((i) => { byPiso[`Piso ${i.piso}`] = (byPiso[`Piso ${i.piso}`] || 0) + i.cantidad; });
      const pisoRows = Object.entries(byPiso).sort().map(([k, v]) => [k, fmt(v)]);

      const byServ: Record<string, number> = {};
      filtered.forEach((i) => { byServ[i.servicio] = (byServ[i.servicio] || 0) + i.cantidad; });
      const servRows = Object.entries(byServ).sort(([, a], [, b]) => b - a).slice(0, 10).map(([k, v]) => [k, fmt(v)]);

      // EETT info
      let eettSection = "";
      const eett = findEETT(f.nombre!);
      if (eett) {
        const spec = EETT_SPECS[eett.code];
        eettSection = `\n\n📋 **Ficha Técnica EETT ${eett.code}:**\n`;
        if (spec) {
          eettSection += `**Descripción:** ${spec.desc}\n**Material:** ${spec.material}\n**Dimensiones:** ${spec.dimensiones}\n**Color:** ${spec.color}\n**Características:** ${spec.extras}\n`;
        }

      // If no inventory data but EETT exists, show EETT only
      if (totalQty === 0 && eett) {
        return `📋 **${f.nombre}**\n\nNo hay unidades en inventario actualmente.${eettSection}\n📄 [Ver PDF](${BASE_PDF_PATH}${eett.file})`;
      }
        eettSection += `\n📄 [Ver PDF](${BASE_PDF_PATH}${eett.file})`;
      }

      // Build sections, skip empty tables
      let result = `📋 **Producto: ${f.nombre}**\n\n• **${fmt(totalQty)}** unidades en **${filtered.length}** artículos\n• **Proveedor:** ${filtered[0]?.proveedor || "—"}\n• **Familia:** ${filtered[0]?.familia || "—"}`;
      if (pisoRows.length > 0) result += `\n\n**Por Piso:**\n${table(["Piso", "Unidades"], pisoRows)}`;
      if (servRows.length > 0) result += `\n\n**Top Servicios:**\n${table(["Servicio", "Unidades"], servRows)}`;
      result += eettSection;
      return result;
    }

    case "fechas": {
      const mesRows = summary.byMes.map((m) => [m.name, fmt(m.qty), pct(m.qty, summary.totalQty) + "%"]);
      const diaRows = summary.byDia.map((d) => [d.name, fmt(d.qty)]);
      return `📅 **Calendario de Instalación**\n\n• **Período:** ${summary.fechaStats.fechaMin} — ${summary.fechaStats.fechaMax}\n• **Artículos con fecha:** ${fmt(summary.fechaStats.totalConFecha)}\n• **Meses:** ${summary.fechaStats.totalMeses}\n• **Semanas:** ${summary.fechaStats.totalSemanas}\n\n**Por Mes:**\n${table(["Mes", "Unidades", "%"], mesRows)}\n\n**Por Día de Instalación:**\n${table(["Fecha", "Unidades"], diaRows)}\n\n*El grueso de la instalación (${pct(4069, summary.totalQty)}%) está planificado para Julio 2026.*`;
    }

    case "zonas": {
      const rows = summary.byZona.slice(0, 15).map((z) => [z.name, fmt(z.qty), pct(z.qty, summary.totalQty) + "%"]);
      return `🗺️ **Top 15 Zonas:**\n\n${table(["Zona", "Unidades", "%"], rows)}\n\n*Total zonas únicas: ${summary.uniqueZonas}*`;
    }

    case "recintos": {
      const filtered = f.piso || f.servicio ? applyFilters(data) : data;
      const byRecinto: Record<string, number> = {};
      filtered.forEach((i) => { byRecinto[i.recinto] = (byRecinto[i.recinto] || 0) + i.cantidad; });
      const rows = Object.entries(byRecinto).sort(([, a], [, b]) => b - a).slice(0, 15).map(([k, v]) => [k, fmt(v)]);
      const ctx = f.piso ? ` del Piso ${f.piso}` : f.servicio ? ` de ${f.servicio}` : "";
      return `🏠 **Top 15 Recintos${ctx}:**\n\n${table(["Recinto", "Unidades"], rows)}\n\n*Total recintos únicos: ${summary.uniqueRecintos}*`;
    }

    case "general":
    default: {
      const nq = normalize(q);

      // Try EETT match first
      const eettMatch = eettFiles.find((e) => nq.includes(normalize(e.name)) || normalize(e.name).includes(nq));
      if (eettMatch) {
        const spec = EETT_SPECS[eettMatch.code];
        const invItems = data.filter((i) => normalize(i.nombre).includes(normalize(eettMatch.name)));
        const invQty = invItems.reduce((s, i) => s + i.cantidad, 0);
        let result = `📋 **${eettMatch.name}** (EETT ${eettMatch.code})\n\n`;
        if (spec) result += `${spec.desc}\n**Material:** ${spec.material}\n**Dimensiones:** ${spec.dimensiones}\n\n`;
        if (invQty > 0) result += `**En inventario:** ${fmt(invQty)} unidades\n`;
        result += `📄 [Ver PDF](${BASE_PDF_PATH}${eettMatch.file})`;
        return result;
      }

      // Try data match
      const filtered = data.filter((i) =>
        normalize(i.nombre).includes(nq) || normalize(i.servicio).includes(nq) ||
        normalize(i.recinto).includes(nq) || normalize(i.zona).includes(nq)
      );

      if (filtered.length > 0) {
        const totalQty = filtered.reduce((s, i) => s + i.cantidad, 0);
        const byNombre: Record<string, number> = {};
        filtered.forEach((i) => { byNombre[i.nombre] = (byNombre[i.nombre] || 0) + i.cantidad; });
        const rows = Object.entries(byNombre).sort(([, a], [, b]) => b - a).slice(0, 10).map(([k, v]) => [k, fmt(v)]);
        return `Encontré **${fmt(filtered.length)}** artículos (**${fmt(totalQty)}** unidades) relacionados con "${q}":\n\n${table(["Producto", "Unidades"], rows)}`;
      }

      return `No encontré resultados específicos para "${q}".\n\nTengo acceso a toda la plataforma:\n• **Inventario:** ${fmt(summary.totalItems)} artículos, ${fmt(summary.totalQty)} unidades\n• **EETT:** ${eettFiles.length} fichas técnicas con PDFs\n• **Control Documental:** Estructura SharePoint completa\n• **Datos:** pisos, servicios, proveedores, fechas, zonas, recintos\n\nEjemplos: "Resumen general", "Ficha técnica Silla Visita", "Muebles piso 3"`;
    }
  }
}

// ── Public API ──
class ChatServiceClass {
  private data: RawItem[] = [];
  private summary: SummaryData | null = null;
  private eettFiles: EETTFile[] = [];

  setData(data: RawItem[], summary: SummaryData, eettFiles: EETTFile[]) {
    this.data = data;
    this.summary = summary;
    this.eettFiles = eettFiles;
  }

  async sendMessage(
    message: string,
    _sessionId?: string,
    _conversationHistory?: Message[]
  ): Promise<{ response: { id: string; response: string; sessionId: string; tokensUsed: number; model: string; timestamp: string }; error: null } | { response: null; error: ChatError }> {
    if (!this.summary || this.data.length === 0) {
      return { response: null, error: { error: true, message: "Datos del inventario no cargados", code: "NO_DATA" } };
    }

    try {
      await new Promise((r) => setTimeout(r, 250));
      const answer = processQuery(message, this.data, this.summary, this.eettFiles);
      return {
        response: {
          id: Math.random().toString(36).substr(2, 9),
          response: answer,
          sessionId: "local",
          tokensUsed: 0,
          model: "local-engine",
          timestamp: new Date().toISOString(),
        },
        error: null,
      };
    } catch {
      return { response: null, error: { error: true, message: "Error al procesar la consulta", code: "PROCESSING_ERROR" } };
    }
  }

  async checkHealth(): Promise<boolean> { return true; }
}

export const ChatService = new ChatServiceClass();
