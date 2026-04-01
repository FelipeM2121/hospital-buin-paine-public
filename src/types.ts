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
  // Nuevos campos MNC
  tipoEquipo?: string;
  nCNO?: string;
  ordenCompra?: string;
  fechaRecintoTerminado?: string;
  duracion?: number;
  fechaTermino?: string;
  planEntrenamiento?: string;
  fechaRecepcionConforme?: string;
}

export interface InventoryItem extends RawItem {}

export interface NameQty {
  name: string;
  qty: number;
}

export interface PisoEntry {
  name: string;
  piso: number;
  qty: number;
}

export interface FechaStats {
  totalConFecha: number;
  fechaMin: string;
  fechaMax: string;
  totalMeses: number;
  totalSemanas: number;
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
  byFamilia: NameQty[];
  byProveedor: NameQty[];
  byPiso: PisoEntry[];
  byServicio: NameQty[];
  byNombre: NameQty[];
  byZona: NameQty[];
  byMes: NameQty[];
  bySemana: NameQty[];
  byDia: NameQty[];
  fechaStats: FechaStats;
}

export interface EETTFile {
  code: string;
  name: string;
  file: string;
}

export interface CatalogoPage {
  number: number;
  title: string;
  pdfUrl: string;
  content: string;
  section?: string;
}

export interface CatalogItem {
  id: string;
  nombre: string;
  descripcion: string;
  pagina: number;
  categoria?: string;
  precio?: number;
  especificaciones?: Record<string, string>;
}
