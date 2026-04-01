import type { CatalogItem } from "../types";

/**
 * Catálogo Melman - PDFs individuales por producto
 * Archivos en /public/catalogo/separado/
 */

export interface ProductoCatalogo {
  id: string;
  codigo: string;
  nombre: string;
  archivo: string;
  url: string;
  categoria: string;
  tipo: "producto" | "certificado" | "indice";
}

export const productosPortada: ProductoCatalogo[] = [
  {
    id: "portada",
    codigo: "00",
    nombre: "Portada",
    archivo: "00_Portada.pdf",
    url: "/catalogo/separado/00_Portada.pdf",
    categoria: "Índice",
    tipo: "indice"
  },
  {
    id: "indice",
    codigo: "00",
    nombre: "Índice",
    archivo: "00_Indice.pdf",
    url: "/catalogo/separado/00_Indice.pdf",
    categoria: "Índice",
    tipo: "indice"
  }
];

export const productosCatalogo: ProductoCatalogo[] = [
  // 201 - Mesas y escritorios
  { id: "201.001A", codigo: "201.001A", nombre: "Estación de Trabajo A", archivo: "201.001A_Estacion_de_Trabajo_A.pdf", url: "/catalogo/separado/201.001A_Estacion_de_Trabajo_A.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.001B", codigo: "201.001B", nombre: "Estación de Trabajo B", archivo: "201.001B_Estacion_de_Trabajo_B.pdf", url: "/catalogo/separado/201.001B_Estacion_de_Trabajo_B.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.001C", codigo: "201.001C", nombre: "Estación de Trabajo C", archivo: "201.001C_Estacion_de_Trabajo_C.pdf", url: "/catalogo/separado/201.001C_Estacion_de_Trabajo_C.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.001D", codigo: "201.001D", nombre: "Estación de Trabajo D", archivo: "201.001D_Estacion_de_Trabajo_D.pdf", url: "/catalogo/separado/201.001D_Estacion_de_Trabajo_D.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.001E", codigo: "201.001E", nombre: "Estación de Trabajo E", archivo: "201.001E_Estacion_de_Trabajo_E.pdf", url: "/catalogo/separado/201.001E_Estacion_de_Trabajo_E.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.002", codigo: "201.002", nombre: "Mesa Lateral", archivo: "201.002_Mesa_Lateral.pdf", url: "/catalogo/separado/201.002_Mesa_Lateral.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.003", codigo: "201.003", nombre: "Mesa Párvulo Inclusión", archivo: "201.003_Mesa_Parvulo_Inclusion.pdf", url: "/catalogo/separado/201.003_Mesa_Parvulo_Inclusion.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.004", codigo: "201.004", nombre: "Mesa Párvulo Tipo I", archivo: "201.004_Mesa_Parvulo_Tipo_I.pdf", url: "/catalogo/separado/201.004_Mesa_Parvulo_Tipo_I.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.005", codigo: "201.005", nombre: "Mesa Párvulo Tipo II", archivo: "201.005_Mesa_Parvulo_Tipo_II.pdf", url: "/catalogo/separado/201.005_Mesa_Parvulo_Tipo_II.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.008", codigo: "201.008", nombre: "Mesa Reunión Tipo I", archivo: "201.008_Mesa_Reunion_Tipo_I.pdf", url: "/catalogo/separado/201.008_Mesa_Reunion_Tipo_I.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.009", codigo: "201.009", nombre: "Mesa Reunión Tipo II", archivo: "201.009_Mesa_Reunion_Tipo_II.pdf", url: "/catalogo/separado/201.009_Mesa_Reunion_Tipo_II.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.010", codigo: "201.010", nombre: "Mesa Reuniones Tipo III", archivo: "201.010_Mesa_Reuniones_Tipo_III.pdf", url: "/catalogo/separado/201.010_Mesa_Reuniones_Tipo_III.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.011m", codigo: "201.011", nombre: "Mesa Tipo Casino", archivo: "201.011_Mesa_Tipo_Casino.pdf", url: "/catalogo/separado/201.011_Mesa_Tipo_Casino.pdf", categoria: "Mesas y Escritorios", tipo: "producto" },
  { id: "201.011s", codigo: "201.011", nombre: "Silla Tipo Universitaria", archivo: "201.011_Silla_Tipo_Universitaria.pdf", url: "/catalogo/separado/201.011_Silla_Tipo_Universitaria.pdf", categoria: "Sillas", tipo: "producto" },

  // 202 - Mobiliario general
  { id: "202.001", codigo: "202.001", nombre: "Atril Graduable", archivo: "202.001_Atril_Graduable.pdf", url: "/catalogo/separado/202.001_Atril_Graduable.pdf", categoria: "Mobiliario General", tipo: "producto" },
  { id: "202.006", codigo: "202.006", nombre: "Cama Apilable", archivo: "202.006_Cama_Apilable.pdf", url: "/catalogo/separado/202.006_Cama_Apilable.pdf", categoria: "Mobiliario General", tipo: "producto" },
  { id: "202.008", codigo: "202.008", nombre: "Cuna Alta", archivo: "202.008_Cuna_Alta.pdf", url: "/catalogo/separado/202.008_Cuna_Alta.pdf", categoria: "Mobiliario General", tipo: "producto" },
  { id: "202.009", codigo: "202.009", nombre: "Cuna Baja", archivo: "202.009_Cuna_Baja.pdf", url: "/catalogo/separado/202.009_Cuna_Baja.pdf", categoria: "Mobiliario General", tipo: "producto" },
  { id: "202.012", codigo: "202.012", nombre: "Mueble Locker", archivo: "202.012_Mueble_Locker.pdf", url: "/catalogo/separado/202.012_Mueble_Locker.pdf", categoria: "Mobiliario General", tipo: "producto" },

  // 203 - Muebles de almacenamiento
  { id: "203.014", codigo: "203.014", nombre: "Librero", archivo: "203.014_Librero.pdf", url: "/catalogo/separado/203.014_Librero.pdf", categoria: "Almacenamiento", tipo: "producto" },
  { id: "203.015", codigo: "203.015", nombre: "Mueble Arrimo", archivo: "203.015_Mueble_Arrimo.pdf", url: "/catalogo/separado/203.015_Mueble_Arrimo.pdf", categoria: "Almacenamiento", tipo: "producto" },
  { id: "203.016B", codigo: "203.016B", nombre: "Mueble Tipo Biblioteca B", archivo: "203.016B_Mueble_Tipo_Biblioteca_B.pdf", url: "/catalogo/separado/203.016B_Mueble_Tipo_Biblioteca_B.pdf", categoria: "Almacenamiento", tipo: "producto" },
  { id: "203.016", codigo: "203.016", nombre: "Mueble Tipo Biblioteca", archivo: "203.016_Mueble_Tipo_Biblioteca.pdf", url: "/catalogo/separado/203.016_Mueble_Tipo_Biblioteca.pdf", categoria: "Almacenamiento", tipo: "producto" },
  { id: "203.018", codigo: "203.018", nombre: "Perchero", archivo: "203.018_Perchero.pdf", url: "/catalogo/separado/203.018_Perchero.pdf", categoria: "Almacenamiento", tipo: "producto" },
  { id: "203.022", codigo: "203.022", nombre: "Contenedor", archivo: "203.022_Contenedor.pdf", url: "/catalogo/separado/203.022_Contenedor.pdf", categoria: "Almacenamiento", tipo: "producto" },

  // 204 - Sillas y asientos
  { id: "0204.019", codigo: "0204.019", nombre: "Silla Apoyo Hora Ingesta", archivo: "0204.019_Silla_Apoyo_Hora_Ingesta.pdf", url: "/catalogo/separado/0204.019_Silla_Apoyo_Hora_Ingesta.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.001", codigo: "204.001", nombre: "Banca Sala Cuna", archivo: "204.001_Banca_Sala_Cuna.pdf", url: "/catalogo/separado/204.001_Banca_Sala_Cuna.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.002A", codigo: "204.002A", nombre: "Banca Madera A", archivo: "204.002A_Banca_Madera_A.pdf", url: "/catalogo/separado/204.002A_Banca_Madera_A.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.002B", codigo: "204.002B", nombre: "Banca Madera B", archivo: "204.002B_Banca_Madera_B.pdf", url: "/catalogo/separado/204.002B_Banca_Madera_B.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.002C", codigo: "204.002C", nombre: "Banca Madera C", archivo: "204.002C_Banca_Madera_C.pdf", url: "/catalogo/separado/204.002C_Banca_Madera_C.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.002D", codigo: "204.002D", nombre: "Banca Madera D", archivo: "204.002D_Banca_Madera_D.pdf", url: "/catalogo/separado/204.002D_Banca_Madera_D.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.003", codigo: "204.003", nombre: "Silla Adulto", archivo: "204.003_Silla_Adulto.pdf", url: "/catalogo/separado/204.003_Silla_Adulto.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.005", codigo: "204.005", nombre: "Silla Bacinica", archivo: "204.005_Silla_Bacinica.pdf", url: "/catalogo/separado/204.005_Silla_Bacinica.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.006", codigo: "204.006", nombre: "Silla Ergonómica", archivo: "204.006_Silla_Ergonomica.pdf", url: "/catalogo/separado/204.006_Silla_Ergonomica.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.007", codigo: "204.007", nombre: "Silla Lactante", archivo: "204.007_Silla_Lactante.pdf", url: "/catalogo/separado/204.007_Silla_Lactante.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.009", codigo: "204.009", nombre: "Silla Párvulo", archivo: "204.009_Silla_Parvulo.pdf", url: "/catalogo/separado/204.009_Silla_Parvulo.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.010", codigo: "204.010", nombre: "Silla Tipo Casino", archivo: "204.010_Silla_Tipo_Casino.pdf", url: "/catalogo/separado/204.010_Silla_Tipo_Casino.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.012", codigo: "204.012", nombre: "Silla Visita", archivo: "204.012_Silla_Visita.pdf", url: "/catalogo/separado/204.012_Silla_Visita.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.013", codigo: "204.013", nombre: "Sillón 1 Cuerpo", archivo: "204.013_Sillon_1_Cuerpo.pdf", url: "/catalogo/separado/204.013_Sillon_1_Cuerpo.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.014", codigo: "204.014", nombre: "Sillón 2 Cuerpos", archivo: "204.014_Sillon_2_Cuerpos.pdf", url: "/catalogo/separado/204.014_Sillon_2_Cuerpos.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.015", codigo: "204.015", nombre: "Sillón Bergere", archivo: "204.015_Sillon_Bergere.pdf", url: "/catalogo/separado/204.015_Sillon_Bergere.pdf", categoria: "Sillas", tipo: "producto" },
  { id: "204.020", codigo: "204.020", nombre: "Silla Butaca Espera 3 Cuerpos", archivo: "204.020_Silla_Butaca_Espera_3_Cuerpos.pdf", url: "/catalogo/separado/204.020_Silla_Butaca_Espera_3_Cuerpos.pdf", categoria: "Sillas", tipo: "producto" },

  // Páginas adicionales
  { id: "pag72", codigo: "72", nombre: "Página 72", archivo: "Pagina_72.pdf", url: "/catalogo/separado/Pagina_72.pdf", categoria: "Contenido Adicional", tipo: "indice" },
  { id: "pag73", codigo: "73", nombre: "Página 73", archivo: "Pagina_73.pdf", url: "/catalogo/separado/Pagina_73.pdf", categoria: "Contenido Adicional", tipo: "indice" },
  { id: "pag74", codigo: "74", nombre: "Página 74", archivo: "Pagina_74.pdf", url: "/catalogo/separado/Pagina_74.pdf", categoria: "Contenido Adicional", tipo: "indice" },
];

export const certificadosCatalogo: ProductoCatalogo[] = [
  // Bureau Veritas - Climático
  { id: "cert-bv-clima-1", codigo: "BV-CLIMA", nombre: "Bureau Veritas Climático p.1", archivo: "CERT_BureauVeritas_Climatico_p1.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Climatico_p1.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  { id: "cert-bv-clima-2", codigo: "BV-CLIMA", nombre: "Bureau Veritas Climático p.2", archivo: "CERT_BureauVeritas_Climatico_p2.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Climatico_p2.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  { id: "cert-bv-clima-3", codigo: "BV-CLIMA", nombre: "Bureau Veritas Climático p.3", archivo: "CERT_BureauVeritas_Climatico_p3.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Climatico_p3.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  { id: "cert-bv-clima-4", codigo: "BV-CLIMA", nombre: "Bureau Veritas Climático p.4", archivo: "CERT_BureauVeritas_Climatico_p4.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Climatico_p4.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  // Bureau Veritas - Ignífugo
  { id: "cert-bv-igni-1", codigo: "BV-IGNI", nombre: "Bureau Veritas Ignífugo p.1", archivo: "CERT_BureauVeritas_Ignifugo_p1.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Ignifugo_p1.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  { id: "cert-bv-igni-2", codigo: "BV-IGNI", nombre: "Bureau Veritas Ignífugo p.2", archivo: "CERT_BureauVeritas_Ignifugo_p2.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Ignifugo_p2.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  { id: "cert-bv-igni-3", codigo: "BV-IGNI", nombre: "Bureau Veritas Ignífugo p.3", archivo: "CERT_BureauVeritas_Ignifugo_p3.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Ignifugo_p3.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  { id: "cert-bv-igni-4", codigo: "BV-IGNI", nombre: "Bureau Veritas Ignífugo p.4", archivo: "CERT_BureauVeritas_Ignifugo_p4.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Ignifugo_p4.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  // Bureau Veritas - Plomo/Ftalatos
  { id: "cert-bv-plomo-1", codigo: "BV-PLOMO", nombre: "Bureau Veritas Plomo/Ftalatos p.1", archivo: "CERT_BureauVeritas_Plomo_Ftalatos_p1.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Plomo_Ftalatos_p1.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  { id: "cert-bv-plomo-2", codigo: "BV-PLOMO", nombre: "Bureau Veritas Plomo/Ftalatos p.2", archivo: "CERT_BureauVeritas_Plomo_Ftalatos_p2.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Plomo_Ftalatos_p2.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  { id: "cert-bv-plomo-3", codigo: "BV-PLOMO", nombre: "Bureau Veritas Plomo/Ftalatos p.3", archivo: "CERT_BureauVeritas_Plomo_Ftalatos_p3.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Plomo_Ftalatos_p3.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  { id: "cert-bv-plomo-4", codigo: "BV-PLOMO", nombre: "Bureau Veritas Plomo/Ftalatos p.4", archivo: "CERT_BureauVeritas_Plomo_Ftalatos_p4.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Plomo_Ftalatos_p4.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  { id: "cert-bv-plomo-5", codigo: "BV-PLOMO", nombre: "Bureau Veritas Plomo/Ftalatos p.5", archivo: "CERT_BureauVeritas_Plomo_Ftalatos_p5.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Plomo_Ftalatos_p5.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  { id: "cert-bv-plomo-6", codigo: "BV-PLOMO", nombre: "Bureau Veritas Plomo/Ftalatos p.6", archivo: "CERT_BureauVeritas_Plomo_Ftalatos_p6.pdf", url: "/catalogo/separado/CERT_BureauVeritas_Plomo_Ftalatos_p6.pdf", categoria: "Certificados Bureau Veritas", tipo: "certificado" },
  // CTC
  { id: "cert-ctc-556", codigo: "CTC-556", nombre: "CTC N°556 Contenedor", archivo: "CERT_CTC_N556_Contenedor.pdf", url: "/catalogo/separado/CERT_CTC_N556_Contenedor.pdf", categoria: "Certificados CTC", tipo: "certificado" },
  { id: "cert-ctc-607", codigo: "CTC-607", nombre: "CTC N°607 Atril Graduable", archivo: "CERT_CTC_N607_Atril_Graduable.pdf", url: "/catalogo/separado/CERT_CTC_N607_Atril_Graduable.pdf", categoria: "Certificados CTC", tipo: "certificado" },
  { id: "cert-ctc-612", codigo: "CTC-612", nombre: "CTC N°612 Arrimo Bajo", archivo: "CERT_CTC_N612_Arrimo_Bajo.pdf", url: "/catalogo/separado/CERT_CTC_N612_Arrimo_Bajo.pdf", categoria: "Certificados CTC", tipo: "certificado" },
  { id: "cert-ctc-615", codigo: "CTC-615", nombre: "CTC N°615 Mesa Párvulo Inclusión", archivo: "CERT_CTC_N615_Mesa_Parvulo_Inclusion.pdf", url: "/catalogo/separado/CERT_CTC_N615_Mesa_Parvulo_Inclusion.pdf", categoria: "Certificados CTC", tipo: "certificado" },
  { id: "cert-ctc-624", codigo: "CTC-624", nombre: "CTC N°624 Cama Dormilona", archivo: "CERT_CTC_N624_Cama_Dormilona.pdf", url: "/catalogo/separado/CERT_CTC_N624_Cama_Dormilona.pdf", categoria: "Certificados CTC", tipo: "certificado" },
  { id: "cert-ctc-909", codigo: "CTC-909", nombre: "CTC N°909 Silla Ergonómica", archivo: "CERT_CTC_N909_Silla_Ergonomica.pdf", url: "/catalogo/separado/CERT_CTC_N909_Silla_Ergonomica.pdf", categoria: "Certificados CTC", tipo: "certificado" },
  { id: "cert-ctc-977", codigo: "CTC-977", nombre: "CTC N°977 Librero", archivo: "CERT_CTC_N977_Librero.pdf", url: "/catalogo/separado/CERT_CTC_N977_Librero.pdf", categoria: "Certificados CTC", tipo: "certificado" },
  { id: "cert-ctc-979", codigo: "CTC-979", nombre: "CTC N°979 Perchero", archivo: "CERT_CTC_N979_Perchero.pdf", url: "/catalogo/separado/CERT_CTC_N979_Perchero.pdf", categoria: "Certificados CTC", tipo: "certificado" },
  { id: "cert-ctc-980", codigo: "CTC-980", nombre: "CTC N°980 Cuna Alta", archivo: "CERT_CTC_N980_Cuna_Alta.pdf", url: "/catalogo/separado/CERT_CTC_N980_Cuna_Alta.pdf", categoria: "Certificados CTC", tipo: "certificado" },
  { id: "cert-ctc-981", codigo: "CTC-981", nombre: "CTC N°981 Cuna Baja", archivo: "CERT_CTC_N981_Cuna_Baja.pdf", url: "/catalogo/separado/CERT_CTC_N981_Cuna_Baja.pdf", categoria: "Certificados CTC", tipo: "certificado" },
  { id: "cert-ctc-p63", codigo: "CTC-P63", nombre: "CTC p.63", archivo: "CERT_CTC_p63.pdf", url: "/catalogo/separado/CERT_CTC_p63.pdf", categoria: "Certificados CTC", tipo: "certificado" },
  // Ergotron
  { id: "cert-ergotron-1", codigo: "ERGOTRON", nombre: "Ergotron StyleView p.1", archivo: "CERT_Ergotron_StyleView_p1.pdf", url: "/catalogo/separado/CERT_Ergotron_StyleView_p1.pdf", categoria: "Certificados Ergotron", tipo: "certificado" },
  { id: "cert-ergotron-2", codigo: "ERGOTRON", nombre: "Ergotron StyleView p.2", archivo: "CERT_Ergotron_StyleView_p2.pdf", url: "/catalogo/separado/CERT_Ergotron_StyleView_p2.pdf", categoria: "Certificados Ergotron", tipo: "certificado" },
];

export const todosLosProductos: ProductoCatalogo[] = [
  ...productosPortada,
  ...productosCatalogo,
  ...certificadosCatalogo,
];

/**
 * Buscar producto por nombre o código
 */
export function buscarProducto(query: string): ProductoCatalogo[] {
  const q = query.toLowerCase();
  return todosLosProductos.filter(
    p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q)
  );
}

/**
 * Obtener productos por categoría
 */
export function productosPorCategoria(categoria: string): ProductoCatalogo[] {
  return productosCatalogo.filter(p => p.categoria === categoria);
}

export const categorias = [
  "Mesas y Escritorios",
  "Sillas",
  "Mobiliario General",
  "Almacenamiento",
];

/**
 * @deprecated Mantenido para compatibilidad - usar ProductoCatalogo
 */
export const catalogoItems: CatalogItem[] = productosCatalogo.map((p, i) => ({
  id: p.id,
  nombre: p.nombre,
  descripcion: `${p.codigo} - ${p.nombre}`,
  pagina: i + 1,
  categoria: p.categoria,
  precio: 0,
  especificaciones: {}
}));

export const catalogoConfig = {
  baseUrl: "/catalogo/separado/",
  totalProductos: productosCatalogo.length,
  totalCertificados: certificadosCatalogo.length,
  searchable: true,
  downloadable: true,
  description: "Catálogo oficial Melman para licitación Hospital Buin Paine - PDFs individuales por producto",
};
