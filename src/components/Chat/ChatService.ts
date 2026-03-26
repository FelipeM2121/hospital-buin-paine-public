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
   Chat Service — Claude AI con Smart Context Selection
   Solo inyecta datos RELEVANTES a la pregunta → rápido y preciso
   ═══════════════════════════════════════════════════════════════ */

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
const MODEL = "claude-haiku-4-5-20251001";

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
}

function buildIndex(data: RawItem[]): DataIndex {
  const idx: DataIndex = {
    byFamilia: {}, byProveedor: {}, byPiso: {}, byServicio: {},
    byNombre: {}, byZona: {}, servProd: {}, prodPiso: {}, prodServ: {},
    provFam: {}, provProd: {}, pisoServ: {}, famProd: {},
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
  });

  return idx;
}

const sortDesc = (obj: Record<string, number>) =>
  Object.entries(obj).sort(([, a], [, b]) => b - a);

// ── Detect what the user is asking about ──
type Topic = "resumen" | "piso" | "servicio" | "producto" | "proveedor" | "eett" | "fecha" | "zona" | "familia";

function detectTopics(msg: string): { topics: Topic[]; matches: { pisos: number[]; servicios: string[]; productos: string[]; proveedores: string[]; eettCodes: string[] } } {
  const q = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const topics: Topic[] = [];
  const matches = { pisos: [] as number[], servicios: [] as string[], productos: [] as string[], proveedores: [] as string[], eettCodes: [] as string[] };

  // Detect piso
  const pisoMatch = q.match(/piso\s*(\d)/g);
  if (pisoMatch) {
    topics.push("piso");
    pisoMatch.forEach((m) => { const n = parseInt(m.replace(/\D/g, "")); if (n >= 1 && n <= 7) matches.pisos.push(n); });
  }
  if (/pisos|distribuc.*piso|por piso/i.test(q)) topics.push("piso");

  // Detect servicio
  const servicioKeywords: Record<string, string> = {
    "urgencia": "Urgencia", "administracion": "Administración y apoyo general", "admin": "Administración y apoyo general",
    "consulta": "Consultas medicas generales", "comedor": "Comedor funcionarios/público",
    "sala cuna": "Sala Cuna", "hospitalizacion": "Hospitalización", "hospital de dia": "Hospital de día",
    "psiquiatria": "Psiquiatría", "uhcip": "UHCIP", "laboratorio": "Laboratorio",
    "rehabilitacion": "Med física y rehabilitación", "imagenologia": "Imagenología",
    "pabellones": "Pabellones", "pabellon": "Pabellones", "contabilidad": "Contabilidad",
    "dialisis": "Diálisis", "farmacia": "Farmacia", "uti": "UTI",
    "alimentacion": "Central de Alimentación", "odontologia": "Odontología",
    "cafeteria": "Cafetería", "mantenimiento": "Mantenimiento", "biblioteca": "Biblioteca",
    "parto": "Parto Integral", "paliativos": "Cuidados Paliativos", "cuidados paliativos": "Cuidados Paliativos",
    "vestuario": "Vestuario", "auditorio": "Auditorio", "abastecimiento": "Abastecimiento",
    "esterilizacion": "Esterilización", "neonatologia": "Neonatología", "sedile": "SEDILE",
    "lavanderia": "Lavandería", "morgue": "Morgue", "telemedicina": "Telemedicina",
    "cirugia": "Cirugía menor", "chile crece": "Chile Crece Contigo",
  };
  for (const [kw, svc] of Object.entries(servicioKeywords)) {
    if (q.includes(kw)) { topics.push("servicio"); matches.servicios.push(svc); }
  }
  if (/servicios|por servicio/i.test(q) && matches.servicios.length === 0) topics.push("servicio");

  // Detect producto
  const productoKeywords: Record<string, string> = {
    "silla visita": "Silla Visita", "silla ergonomica": "Silla Ergonómica", "ergonomica": "Silla Ergonómica",
    "silla casino": "Silla tipo Casino", "silla tipo casino": "Silla tipo Casino",
    "butaca": "Silla Butaca Espera 3 Cuerpos", "sillon bergere": "Sillón Bergere", "bergere": "Sillón Bergere",
    "escritorio en l": "Escritorio en L Administrativo", "escritorio simple": "Escritorio simple 120x70 cm",
    "escritorio administrativo": "Escritorio en L Administrativo",
    "sillon 2 cuerpo": "Sillón 2 Cuerpo", "sillon 1 cuerpo": "Sillón 1 Cuerpo",
    "mesa casino": "Mesa Tipo Casino", "mesa reunion": "Mesa Reuniones Tipo I",
    "biblioteca": "Mueble Tipo Biblioteca A", "mueble biblioteca": "Mueble Tipo Biblioteca A",
    "banca madera": "Banca Madera B", "banca": "Banca Madera B",
    "escritorio consulta": "Escritorio de Consultas", "punto de registro": "Punto de Registro",
    "colchoneta": "Colchoneta Reposo A", "silla parvulo": "Silla Párvulo", "parvulo": "Silla Párvulo",
    "silla universitaria": "Silla Tipo Universitaria", "universitaria": "Silla Tipo Universitaria",
    "mesa lateral": "Mesa Lateral", "perchero": "Perchero", "velador": "Velador",
    "cama apilable": "Cama Apilable", "locker": "Mueble Locker", "cuna": "Cuna Alta",
    "silla lactante": "Silla Lactante", "silla bacinica": "Silla Bacínica", "bacinica": "Silla Bacínica",
    "taburete": "Taburete con Ruedas", "atril": "Atril Graduable",
    "silla ingesta": "Silla de Apoyo Hora Ingesta", "ingesta": "Silla de Apoyo Hora Ingesta",
    "mesa parvulo": "Mesa Párvulo Tipo I", "contenedor": "Contenedor",
    "librero": "Librero", "arrimo": "Mueble Arrimo", "silla adulto": "Silla Adulto",
    "estacion de trabajo": "Estación de Trabajo",
  };
  for (const [kw, prod] of Object.entries(productoKeywords)) {
    if (q.includes(kw)) { topics.push("producto"); matches.productos.push(prod); }
  }
  // Generic product queries
  if (/productos|muebles|mobiliario|por producto|cuantos tipos/i.test(q) && matches.productos.length === 0) topics.push("producto");
  if (/sillas|mesas|sillones|escritorios|bancas/i.test(q) && matches.productos.length === 0) topics.push("familia");

  // Detect proveedor
  if (/melman/i.test(q)) { topics.push("proveedor"); matches.proveedores.push("MELMAN SPA"); }
  if (/allmedica/i.test(q)) { topics.push("proveedor"); matches.proveedores.push("ALLMEDICA"); }
  if (/hagelin/i.test(q)) { topics.push("proveedor"); matches.proveedores.push("COMERCIAL HAGELIN"); }
  if (/proveedor/i.test(q) && matches.proveedores.length === 0) topics.push("proveedor");

  // Detect EETT / ficha técnica
  if (/eett|ficha tecnica|especificacion|material|dimension|medida/i.test(q)) topics.push("eett");
  const eettMatch = q.match(/\d{3}\.\d{3}[b]?/gi);
  if (eettMatch) { topics.push("eett"); matches.eettCodes.push(...eettMatch.map((c) => c.toUpperCase())); }

  // Detect fecha/calendario
  if (/fecha|calendario|instalacion|cuando|mes|semana|mayo|junio|julio|agosto|cronograma/i.test(q)) topics.push("fecha");

  // Detect zona
  if (/zona|zonificacion/i.test(q)) topics.push("zona");

  // Detect familia
  if (/familia|categoria|tipo de mueble/i.test(q)) topics.push("familia");

  // Default: resumen
  if (topics.length === 0 || /resumen|general|total|cuantos|inventario completo|todo/i.test(q)) topics.push("resumen");

  return { topics: [...new Set(topics)], matches };
}

// ── Build targeted context based on detected topics ──
function buildContext(
  topics: Topic[],
  matches: ReturnType<typeof detectTopics>["matches"],
  idx: DataIndex,
  summary: SummaryData,
  eettFiles: EETTFile[],
): string {
  const sections: string[] = [];

  // Always include base stats (tiny)
  sections.push(`HOSPITAL BUIN PAINE - INVENTARIO MOBILIARIO
Total: ${fmt(summary.totalItems)} artículos, ${fmt(summary.totalQty)} unidades, ${summary.pisos} pisos, ${summary.uniqueServicios} servicios, ${summary.proveedores} proveedores
Familias: ${sortDesc(idx.byFamilia).map(([k, v]) => `${k}:${fmt(v)}`).join(", ")}`);

  for (const topic of topics) {
    switch (topic) {
      case "resumen":
        sections.push(`RESUMEN COMPLETO:
Recintos: ${fmt(summary.uniqueRecintos)} | Tipos mueble: ${summary.uniqueNombres}
Proveedores: ${sortDesc(idx.byProveedor).map(([k, v]) => `${k}:${fmt(v)}`).join(", ")}
Pisos: ${Object.entries(idx.byPiso).sort().map(([k, v]) => `${k}:${fmt(v)}`).join(", ")}
Top 10 productos: ${sortDesc(idx.byNombre).slice(0, 10).map(([k, v]) => `${k}:${fmt(v)}`).join(", ")}
Top 10 servicios: ${sortDesc(idx.byServicio).slice(0, 10).map(([k, v]) => `${k}:${fmt(v)}`).join(", ")}`);
        break;

      case "piso":
        if (matches.pisos.length > 0) {
          for (const p of matches.pisos) {
            const key = `Piso ${p}`;
            const total = idx.byPiso[key] || 0;
            const prodsOnFloor: [string, number][] = [];
            for (const [prod, pisos] of Object.entries(idx.prodPiso)) {
              const qty = pisos[`P${p}`];
              if (qty) prodsOnFloor.push([prod, qty]);
            }
            prodsOnFloor.sort(([, a], [, b]) => b - a);
            const servsOnFloor = sortDesc(idx.pisoServ[p] || {});
            sections.push(`PISO ${p}: ${fmt(total)} unidades total
Productos en Piso ${p}:\n${prodsOnFloor.map(([k, v]) => `  ${k}: ${v} uds`).join("\n")}
Servicios en Piso ${p}:\n${servsOnFloor.map(([k, v]) => `  ${k}: ${v} uds`).join("\n")}`);
          }
        } else {
          sections.push(`DISTRIBUCIÓN POR PISO:
${Object.entries(idx.byPiso).sort().map(([k, v]) => `${k}: ${fmt(v)} uds`).join("\n")}`);
        }
        break;

      case "servicio":
        if (matches.servicios.length > 0) {
          for (const svc of matches.servicios) {
            const total = idx.byServicio[svc] || 0;
            const prods = sortDesc(idx.servProd[svc] || {});
            sections.push(`SERVICIO "${svc}": ${fmt(total)} unidades
Productos: ${prods.map(([k, v]) => `${k}:${v}`).join(", ")}`);
          }
        } else {
          sections.push(`TODOS LOS SERVICIOS (${summary.uniqueServicios}):
${sortDesc(idx.byServicio).map(([k, v]) => `${k}: ${fmt(v)}`).join("\n")}`);
        }
        break;

      case "producto":
        if (matches.productos.length > 0) {
          for (const prod of matches.productos) {
            // Find exact or partial match
            const exactKey = Object.keys(idx.byNombre).find((k) => k.toLowerCase().includes(prod.toLowerCase())) || prod;
            const total = idx.byNombre[exactKey] || 0;
            const pisos = idx.prodPiso[exactKey] || {};
            const servs = idx.prodServ[exactKey] || {};
            const pisoStr = Object.entries(pisos).sort().map(([k, v]) => `${k}:${v}`).join(", ");
            const servStr = sortDesc(servs).slice(0, 5).map(([k, v]) => `${k}:${v}`).join(", ");

            // Find EETT
            const eettMatch = eettFiles.find((e) =>
              e.name.toLowerCase().includes(prod.toLowerCase().split(" ").slice(0, 2).join(" ")) ||
              prod.toLowerCase().includes(e.name.toLowerCase().split(" ").slice(0, 2).join(" "))
            );
            let eettInfo = "";
            if (eettMatch) {
              const spec = EETT_KNOWLEDGE[eettMatch.code];
              if (spec) {
                eettInfo = `\nFicha EETT ${eettMatch.code}:\n  Descripción: ${spec.desc}\n  Material: ${spec.material}\n  Dimensiones: ${spec.dimensiones}\n  Color: ${spec.color}\n  PDF: [${eettMatch.name}](eett/${eettMatch.file})`;
              }
            }

            sections.push(`PRODUCTO "${exactKey}": ${fmt(total)} unidades
Por piso: ${pisoStr}
En servicios: ${servStr}${eettInfo}`);
          }
        } else {
          sections.push(`TODOS LOS PRODUCTOS (top 25):
${sortDesc(idx.byNombre).slice(0, 25).map(([k, v]) => `${k}: ${fmt(v)}`).join("\n")}`);
        }
        break;

      case "familia":
        sections.push(`FAMILIAS CON TODOS SUS PRODUCTOS:
${sortDesc(idx.byFamilia).map(([k, v]) => {
  const prods = sortDesc(idx.famProd[k] || {}).map(([n, q]) => `  ${n}: ${q} uds`).join("\n");
  return `${k}: ${fmt(v)} uds total\n${prods}`;
}).join("\n\n")}`);
        break;

      case "proveedor":
        if (matches.proveedores.length > 0) {
          for (const prov of matches.proveedores) {
            const total = idx.byProveedor[prov] || 0;
            const fams = idx.provFam[prov] || {};
            const prods = sortDesc(idx.provProd[prov] || {});
            sections.push(`PROVEEDOR "${prov}": ${fmt(total)} unidades total
Por familia: ${Object.entries(fams).map(([k, v]) => `${k}:${v}`).join(", ")}
Todos los productos de ${prov}:
${prods.map(([k, v]) => `  ${k}: ${v} uds`).join("\n")}`);
          }
        } else {
          sections.push(`PROVEEDORES:
${sortDesc(idx.byProveedor).map(([k, v]) => {
  const fams = Object.entries(idx.provFam[k] || {}).map(([f, q]) => `${f}:${q}`).join(", ");
  const topProds = sortDesc(idx.provProd[k] || {}).slice(0, 10).map(([p, q]) => `${p}:${q}`).join(", ");
  return `${k}: ${fmt(v)} uds (${fams})\n  Top productos: ${topProds}`;
}).join("\n")}`);
        }
        break;

      case "eett":
        if (matches.eettCodes.length > 0) {
          for (const code of matches.eettCodes) {
            const ef = eettFiles.find((e) => e.code.toUpperCase() === code);
            const spec = EETT_KNOWLEDGE[code] || EETT_KNOWLEDGE[code.toLowerCase()];
            if (ef && spec) {
              sections.push(`FICHA EETT ${ef.code} - ${ef.name}:
Descripción: ${spec.desc}
Material: ${spec.material}
Dimensiones: ${spec.dimensiones}
Color: ${spec.color}
PDF: [${ef.name}](eett/${ef.file})`);
            }
          }
        } else if (matches.productos.length > 0) {
          // EETT for mentioned products — already handled in "producto" topic
        } else {
          sections.push(`FICHAS TÉCNICAS EETT (${eettFiles.length} especificaciones):
${eettFiles.map((e) => {
  const spec = EETT_KNOWLEDGE[e.code];
  return spec
    ? `${e.code} ${e.name}: ${spec.desc}. ${spec.material}. ${spec.dimensiones}. PDF:[${e.name}](eett/${e.file})`
    : `${e.code} ${e.name}. PDF:[${e.name}](eett/${e.file})`;
}).join("\n")}`);
        }
        break;

      case "fecha":
        sections.push(`CALENDARIO INSTALACIÓN:
Período: ${summary.fechaStats?.fechaMin} a ${summary.fechaStats?.fechaMax} (${summary.fechaStats?.totalMeses} meses)
Por mes: ${summary.byMes?.map((m) => `${m.name}:${fmt(m.qty)}`).join(", ")}
Por semana: ${summary.bySemana?.map((s) => `${s.name}:${fmt(s.qty)}`).join(", ")}
Por día: ${summary.byDia?.map((d) => `${d.name}:${fmt(d.qty)}`).join(", ")}`);
        break;

      case "zona":
        sections.push(`ZONAS (${summary.uniqueZonas}):
${sortDesc(idx.byZona).map(([k, v]) => `${k}: ${fmt(v)} uds`).join("\n")}`);
        break;
    }
  }

  return sections.join("\n\n");
}

// ── Claude API call with STREAMING ──
async function callClaudeStream(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  onToken: (token: string) => void,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      stream: true,
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Claude error ${res.status}: ${(errBody as { error?: { message?: string } }).error?.message || res.statusText}`);
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
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
          const text: string = json.delta.text;
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

// ── Base system instruction (short and fixed) ──
const BASE_SYSTEM = `Eres el asistente IA del Hospital Buin Paine. Respondes sobre el inventario de mobiliario no clínico.
REGLAS ESTRICTAS:
- Responde SIEMPRE en español
- Usa SOLO los datos proporcionados, NO inventes cifras
- Sé conciso y directo
- Para tablas usa markdown
- Si mencionas un PDF, usa formato: [nombre](eett/archivo.pdf)
- Si no tienes el dato, di "no tengo esa información específica"
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
          suggestion: "Configura VITE_ANTHROPIC_API_KEY en el archivo .env del proyecto.",
        },
      };
    }

    try {
      // Detect what the user is asking about
      const { topics, matches } = detectTopics(message);

      // Build targeted context (only relevant data)
      const context = buildContext(topics, matches, this.idx, this.summary, this.eettFiles);

      // Add user message to conversation
      this.conversationHistory.push({ role: "user", content: message });
      if (this.conversationHistory.length > 6) {
        this.conversationHistory = this.conversationHistory.slice(-6);
      }

      // System = base instructions + targeted context
      const systemPrompt = `${BASE_SYSTEM}\nDATOS RELEVANTES:\n${context}`;

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
      return {
        response: null,
        error: {
          error: true,
          message: isTimeout ? "Claude tardó demasiado en responder" : "Error al comunicarse con Claude",
          code: isTimeout ? "TIMEOUT" : "CLAUDE_ERROR",
          suggestion: "Verifica tu VITE_ANTHROPIC_API_KEY en el archivo .env",
        },
      };
    }
  }
}

export const ChatService = new ChatServiceClass();
