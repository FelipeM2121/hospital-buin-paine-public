import React, { useState } from 'react';
import { Download, ChevronLeft, Search, FileText, Award, BookOpen, X } from 'lucide-react';
import { productosCatalogo, certificadosCatalogo, productosPortada, buscarProducto, categorias, type ProductoCatalogo } from '../../data/catalogo';

type Tab = "productos" | "certificados" | "indice";

interface CatalogoPageViewerProps {
  // Props mantenidos por compatibilidad con el chat
  pageNumber?: number;
  showControls?: boolean;
  showDownload?: boolean;
  onPageChange?: (newPage: number) => void;
  totalPages?: number;
  // Nuevo: abrir directamente un producto por nombre/código
  productoId?: string;
}

const BASE = import.meta.env.BASE_URL ?? "/";
const resolveUrl = (url: string) =>
  url.startsWith("/") ? BASE.replace(/\/$/, "") + url : url;

export const CatalogoPageViewer: React.FC<CatalogoPageViewerProps> = ({
  productoId,
}) => {
  const [tab, setTab] = useState<Tab>("productos");
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoCatalogo | null>(
    productoId ? productosCatalogo.find(p => p.id === productoId) ?? null : null
  );

  const resultadosBusqueda = busqueda.trim()
    ? buscarProducto(busqueda)
    : null;

  const productosMostrados = resultadosBusqueda
    ? resultadosBusqueda.filter(p => p.tipo === "producto")
    : productosCatalogo;

  const certsMostrados = resultadosBusqueda
    ? resultadosBusqueda.filter(p => p.tipo === "certificado")
    : certificadosCatalogo;

  const handleDescargar = (p: ProductoCatalogo) => {
    const link = document.createElement('a');
    link.href = resolveUrl(p.url);
    link.download = p.archivo;
    link.click();
  };

  if (productoSeleccionado) {
    return (
      <div className="flex flex-col gap-3 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between bg-white rounded p-3 border border-gray-200">
          <button
            onClick={() => setProductoSeleccionado(null)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft size={16} />
            Volver al catálogo
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{productoSeleccionado.codigo} — {productoSeleccionado.nombre}</span>
            <button
              onClick={() => handleDescargar(productoSeleccionado)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              <Download size={14} />
              Descargar
            </button>
          </div>
        </div>
        <div className="bg-white rounded border border-gray-200 overflow-hidden" style={{ height: "75vh" }}>
          <iframe
            src={resolveUrl(productoSeleccionado.url)}
            title={productoSeleccionado.nombre}
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  const TabButton = ({ id, label, icon }: { id: Tab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
        tab === id
          ? "border-blue-500 text-blue-600 bg-white"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const ProductoCard = ({ p }: { p: ProductoCatalogo }) => (
    <div
      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => setProductoSeleccionado(p)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 font-mono mb-0.5">{p.codigo}</div>
          <div className="text-sm font-medium text-gray-800 group-hover:text-blue-700 leading-snug">{p.nombre}</div>
          <div className="text-xs text-gray-500 mt-1">{p.categoria}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleDescargar(p); }}
          className="text-gray-400 hover:text-blue-500 p-1 rounded shrink-0"
          title="Descargar"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );

  const gruposCategoria = categorias.map(cat => ({
    categoria: cat,
    productos: productosMostrados.filter(p => p.categoria === cat)
  })).filter(g => g.productos.length > 0);

  return (
    <div className="flex flex-col gap-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      {/* Header búsqueda */}
      <div className="bg-white p-3 border-b border-gray-200">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto, código o categoría…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-2 bg-white border-b border-gray-200">
        <TabButton id="productos" label={`Productos (${productosMostrados.length})`} icon={<FileText size={14} />} />
        <TabButton id="certificados" label={`Certificados (${certsMostrados.length})`} icon={<Award size={14} />} />
        <TabButton id="indice" label="Índice" icon={<BookOpen size={14} />} />
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto" style={{ maxHeight: "65vh" }}>
        {tab === "productos" && (
          busqueda.trim() ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {productosMostrados.length === 0
                ? <p className="text-sm text-gray-500 col-span-3">No se encontraron productos para "{busqueda}".</p>
                : productosMostrados.map(p => <ProductoCard key={p.id} p={p} />)
              }
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {gruposCategoria.map(({ categoria, productos }) => (
                <div key={categoria}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{categoria}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {productos.map(p => <ProductoCard key={p.id} p={p} />)}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "certificados" && (
          <div className="flex flex-col gap-3">
            {(() => {
              const grupos: Record<string, ProductoCatalogo[]> = {};
              certsMostrados.forEach(c => {
                if (!grupos[c.categoria]) grupos[c.categoria] = [];
                grupos[c.categoria].push(c);
              });
              return Object.entries(grupos).map(([cat, items]) => (
                <div key={cat}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {items.map(c => <ProductoCard key={c.id} p={c} />)}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {tab === "indice" && (
          <div className="grid grid-cols-2 gap-2">
            {productosPortada.map(p => <ProductoCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogoPageViewer;
