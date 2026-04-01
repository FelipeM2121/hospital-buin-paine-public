// Types matching the dashboard
export interface RawItem {
  item: string;
  zona: string;
  servicio: string;
  familia: string;
  nombre: string;
  proveedor: string;
  cantidad: number;
  piso: number;
  recinto: string;
  fechaInstalacion: string;
  tipoEquipo?: string;
  nCNO?: string;
  ordenCompra?: string;
  fechaRecintoTerminado?: string;
  duracion?: number;
  fechaTermino?: string;
  planEntrenamiento?: string;
  fechaRecepcionConforme?: string;
}

export interface SummaryData {
  totalItems: number;
  totalQty: number;
  uniqueRecintos: number;
  uniqueNombres: number;
  uniqueServicios: number;
  uniqueZonas: number;
  pisos: number;
  proveedores: number;
  familias: number;
  byFamilia?: { name: string; qty: number }[];
  byProveedor?: { name: string; qty: number }[];
  byPiso?: { name: string; piso: number; qty: number }[];
  byServicio?: { name: string; qty: number }[];
  byNombre?: { name: string; qty: number }[];
  byMes?: { name: string; qty: number }[];
  fechaStats?: { totalConFecha: number; fechaMin: string; fechaMax: string; totalMeses: number };
  // MNC extended
  hospital?: string;
  proyecto?: string;
  psp?: string;
  cronograma?: { fechaInicioMin: string; fechaInicioMax: string; fechaTerminoMax: string };
  ordenesCompra?: string[];
  totalCNOs?: number;
  cnos?: string[];
  byServiceFull?: Record<string, { items: number; units: number; recintos: number; inicio: string; termino: string }>;
  byFloorFull?: Record<string, { items: number; units: number; recintos: number }>;
  topTipos?: { codigo: string; nombre: string; units: number; items: number }[];
  topServicios?: { name: string; qty: number }[];
}

/**
 * Construye el contexto completo para el asistente IA
 * Usa SUMMARY (totales reales) para estadísticas precisas
 */
export function buildDataContext(rawItems: RawItem[], summary: SummaryData, catalogInfo?: { totalPages: number; totalProductos?: number }): string {
  // Usar campos enriquecidos si están disponibles
  const hospital = summary.hospital || 'Hospital Salvador';
  const proyecto = summary.proyecto || 'Mobiliario No Clínico (MNC)';
  const psp = summary.psp || '';

  // Estadísticas base
  const totalItems = summary.totalItems;
  const totalUnits = summary.totalQty;

  // Por familia
  const familiaStats = (summary.byFamilia || [])
    .map(f => `- ${f.name}: ${f.qty.toLocaleString('es-CL')} unidades`)
    .join('\n');

  // Por proveedor
  const proveedorStats = (summary.byProveedor || [])
    .map(p => `- ${p.name}: ${p.qty.toLocaleString('es-CL')} unidades`)
    .join('\n');

  // Por piso
  const pisoStats = (summary.byPiso || [])
    .map(p => `- ${p.name}: ${p.qty.toLocaleString('es-CL')} unidades`)
    .join('\n');

  // Top servicios
  const topSvc = (summary.topServicios || summary.byServicio || []).slice(0, 12);
  const servicioStats = topSvc
    .map(s => `- ${s.name}: ${s.qty.toLocaleString('es-CL')} unidades`)
    .join('\n');

  // Cronograma
  let cronogramaCtx = '';
  if (summary.cronograma) {
    const c = summary.cronograma;
    cronogramaCtx = `
Período de instalación: ${c.fechaInicioMin} → ${c.fechaTerminoMax}
Inicio más temprano: ${c.fechaInicioMin}
Término más tardío: ${c.fechaTerminoMax}`;
  }

  // Por mes
  const mesFechas = (summary.byMes || [])
    .map(m => `- ${m.name}: ${m.qty.toLocaleString('es-CL')} unidades`)
    .join('\n');

  // Órdenes de compra
  const ordenesCtx = summary.ordenesCompra?.length
    ? `Órdenes de compra: ${summary.ordenesCompra.join(', ')}`
    : '';

  // CNOs
  const cnoCtx = summary.totalCNOs
    ? `Total CNOs: ${summary.totalCNOs}\nCNOs (muestra): ${(summary.cnos || []).slice(0, 10).join(', ')}`
    : '';

  // Detalle por servicio con fechas (para responder cuándo se instala en cada servicio)
  let byServiceDetailCtx = '';
  if (summary.byServiceFull) {
    const entries = Object.entries(summary.byServiceFull)
      .sort(([, a], [, b]) => b.units - a.units);
    byServiceDetailCtx = '\n=== CRONOGRAMA POR SERVICIO ===\n' +
      entries.map(([svc, d]) =>
        `${svc}: ${d.items} ítems, ${d.units} uds, ${d.recintos} recintos | Instalación: ${d.inicio || 'N/D'} → ${d.termino || 'N/D'}`
      ).join('\n');
  }

  // Top tipos de mueble
  let topTiposCtx = '';
  if (summary.topTipos?.length) {
    topTiposCtx = '\n=== TOP PRODUCTOS POR UNIDADES ===\n' +
      summary.topTipos.map(t => `${t.codigo} ${t.nombre}: ${t.units} uds (${t.items} ítems)`).join('\n');
  }

  // Por piso detallado
  let byFloorCtx = '';
  if (summary.byFloorFull) {
    byFloorCtx = '\n=== DISTRIBUCIÓN POR PISO ===\n' +
      Object.entries(summary.byFloorFull)
        .sort(([a], [b]) => {
          const pa = parseInt(a.replace('Piso ', ''));
          const pb = parseInt(b.replace('Piso ', ''));
          return pa - pb;
        })
        .map(([piso, d]) => `${piso}: ${d.items} ítems, ${d.units} uds, ${d.recintos} recintos`)
        .join('\n');
  }

  // Catálogo
  let catalogContext = '';
  if (catalogInfo) {
    catalogContext = `

=== CATÁLOGO MELMAN DISPONIBLE ===
- Formato: PDFs individuales por producto en /catalogo/separado/
- Total de productos: ${catalogInfo.totalProductos ?? 44}
- Categorías: Mesas y Escritorios, Sillas, Mobiliario General, Almacenamiento
- Certificados: Bureau Veritas (Climático, Ignífugo, Plomo/Ftalatos), CTC, Ergotron
- Cuando el usuario mencione "catálogo" o "melman", el visor se mostrará automáticamente.
=== FIN CATÁLOGO ===`;
  }

  return `=== CONTEXTO PROYECTO: ${hospital} ===
Proyecto: ${proyecto}
PSP: ${psp}

RESUMEN GENERAL:
- Total Ítems: ${totalItems.toLocaleString('es-CL')}
- Total Unidades: ${totalUnits.toLocaleString('es-CL')}
- Recintos Únicos: ${summary.uniqueRecintos}
- Tipos de Mueble: ${summary.uniqueNombres}
- Pisos: ${summary.pisos} (${[...Array(9)].map((_,i)=>i-1).filter(p=>p>=-1&&p<=7).join(', ')})
- Servicios: ${summary.uniqueServicios}
- Proveedores: ${summary.proveedores}
${cronogramaCtx}
${ordenesCtx}
${cnoCtx}

POR FAMILIA:
${familiaStats}

POR PROVEEDOR:
${proveedorStats}

POR PISO:
${pisoStats}

TOP SERVICIOS POR UNIDADES:
${servicioStats}

CRONOGRAMA POR MES:
${mesFechas}
${byServiceDetailCtx}
${topTiposCtx}
${byFloorCtx}

=== FIN CONTEXTO ===${catalogContext}`;
}
