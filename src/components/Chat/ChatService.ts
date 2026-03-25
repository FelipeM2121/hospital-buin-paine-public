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
   Chat Service — Ollama LLM (local) con streaming
   Conecta directamente a Ollama en localhost:11434
   ═══════════════════════════════════════════════════════════════ */

const OLLAMA_URL = "http://localhost:11434";
const MODEL = "qwen2:1.5b"; // Rápido en CPU (~5x más veloz que mistral 7B)

const fmt = (n: number) => n.toLocaleString("es-CL");

// ── Build COMPACT system prompt (optimized for CPU speed) ──
function buildSystemPrompt(data: RawItem[], summary: SummaryData, eettFiles: EETTFile[]): string {
  const byFamilia: Record<string, number> = {};
  const byProveedor: Record<string, number> = {};
  const byPiso: Record<string, number> = {};
  const byServicio: Record<string, number> = {};
  const byNombre: Record<string, number> = {};

  data.forEach((i) => {
    byFamilia[i.familia] = (byFamilia[i.familia] || 0) + i.cantidad;
    byProveedor[i.proveedor] = (byProveedor[i.proveedor] || 0) + i.cantidad;
    byPiso[`P${i.piso}`] = (byPiso[`P${i.piso}`] || 0) + i.cantidad;
    byServicio[i.servicio] = (byServicio[i.servicio] || 0) + i.cantidad;
    byNombre[i.nombre] = (byNombre[i.nombre] || 0) + i.cantidad;
  });

  const sortDesc = (obj: Record<string, number>) =>
    Object.entries(obj).sort(([, a], [, b]) => b - a);

  const familiaStr = sortDesc(byFamilia).map(([k, v]) => `${k}:${fmt(v)}`).join(", ");
  const provStr = sortDesc(byProveedor).map(([k, v]) => `${k}:${fmt(v)}`).join(", ");
  const pisoStr = Object.entries(byPiso).sort().map(([k, v]) => `${k}:${fmt(v)}`).join(", ");
  const servStr = sortDesc(byServicio).slice(0, 12).map(([k, v]) => `${k}:${fmt(v)}`).join(", ");
  const prodStr = sortDesc(byNombre).slice(0, 15).map(([k, v]) => `${k}:${fmt(v)}`).join(", ");

  // Compact EETT — only name + code + PDF
  const eettStr = eettFiles.map((e) => {
    const spec = EETT_KNOWLEDGE[e.code];
    return spec
      ? `${e.code} ${e.name}: ${spec.material}, ${spec.dimensiones}. PDF:${e.file}`
      : `${e.code} ${e.name}. PDF:${e.file}`;
  }).join("\n");

  return `Eres el asistente IA del inventario Hospital Buin Paine. Responde SIEMPRE en español, con datos exactos. Usa markdown para tablas. PDFs en ruta "eett/ARCHIVO".

INVENTARIO: ${fmt(summary.totalItems)} items, ${fmt(summary.totalQty)} uds, ${summary.pisos} pisos, ${summary.uniqueServicios} servicios, ${summary.proveedores} proveedores
Familias: ${familiaStr}
Proveedores: ${provStr}
Pisos: ${pisoStr}
Top Servicios: ${servStr}
Top Productos: ${prodStr}
Instalación: ${summary.fechaStats?.fechaMin || "04/05/2026"} a ${summary.fechaStats?.fechaMax || "03/08/2026"}

EETT (${eettFiles.length} fichas):
${eettStr}`;
}

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

// ── Ollama API call with STREAMING ──
async function callOllamaStream(
  messages: { role: string; content: string }[],
  onToken: (token: string) => void,
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      options: { temperature: 0.3, num_ctx: 4096 },
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    // Each line is a JSON object
    const lines = chunk.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          fullText += json.message.content;
          onToken(json.message.content);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return fullText || "Sin respuesta del modelo.";
}

// ── Public API ──
class ChatServiceClass {
  private data: RawItem[] = [];
  private summary: SummaryData | null = null;
  private eettFiles: EETTFile[] = [];
  private systemPrompt = "";
  private ollamaAvailable: boolean | null = null;
  private conversationHistory: { role: string; content: string }[] = [];

  setData(data: RawItem[], summary: SummaryData, eettFiles: EETTFile[]) {
    this.data = data;
    this.summary = summary;
    this.eettFiles = eettFiles;
    this.systemPrompt = buildSystemPrompt(data, summary, eettFiles);
  }

  async checkHealth(): Promise<boolean> {
    if (this.ollamaAvailable !== null) return this.ollamaAvailable;
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
      this.ollamaAvailable = res.ok;
    } catch {
      this.ollamaAvailable = false;
    }
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
    if (!this.summary || this.data.length === 0) {
      return { response: null, error: { error: true, message: "Datos no cargados", code: "NO_DATA" } };
    }

    const isOllamaUp = await this.checkHealth();

    if (!isOllamaUp) {
      return {
        response: null,
        error: {
          error: true,
          message: "Ollama no está disponible",
          code: "OLLAMA_UNAVAILABLE",
          suggestion: "Inicia Ollama en tu computador: ejecuta 'ollama serve' y luego 'ollama pull mistral'. El chat requiere Ollama corriendo en localhost:11434.",
        },
      };
    }

    try {
      // Add user message to conversation
      this.conversationHistory.push({ role: "user", content: message });

      // Keep last 6 messages to reduce context size
      if (this.conversationHistory.length > 6) {
        this.conversationHistory = this.conversationHistory.slice(-6);
      }

      // Build messages array for Ollama
      const ollamaMessages = [
        { role: "system", content: this.systemPrompt },
        ...this.conversationHistory,
      ];

      const answer = await callOllamaStream(ollamaMessages, onToken || (() => {}));

      // Add assistant response to history
      this.conversationHistory.push({ role: "assistant", content: answer });

      return {
        response: {
          id: Math.random().toString(36).substr(2, 9),
          response: answer,
          sessionId: "ollama-local",
          tokensUsed: 0,
          model: MODEL,
          timestamp: new Date().toISOString(),
        },
        error: null,
      };
    } catch (err) {
      // Reset availability on error
      this.ollamaAvailable = null;
      const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
      return {
        response: null,
        error: {
          error: true,
          message: isTimeout ? "Ollama tardó demasiado en responder" : "Error al comunicarse con Ollama",
          code: isTimeout ? "TIMEOUT" : "OLLAMA_ERROR",
          suggestion: "Verifica que Ollama esté corriendo: 'ollama serve'",
        },
      };
    }
  }
}

export const ChatService = new ChatServiceClass();
