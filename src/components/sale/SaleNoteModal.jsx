import { Printer, Download, X, Receipt } from 'lucide-react';
import SaleNote from './SaleNote.jsx';
import { downloadSalePdf, printSalePdf, printTicket80, downloadTicket80 } from '../../utils/pdf.js';

// Modal con la vista previa de la nota + acciones:
//  - A4: imprimir / descargar PDF (nota completa)
//  - Ticket 80mm: imprimir / descargar (impresora térmica)
export default function SaleNoteModal({ open, onClose, sale, store }) {
  if (!open || !sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="absolute inset-0 no-print" onClick={onClose} />
      <div className="relative z-10 my-4 w-full max-w-3xl">
        {/* Barra de acciones (no se imprime) */}
        <div className="no-print mb-3 rounded-xl bg-white px-4 py-3 shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Vista previa de la nota de venta</h3>
            <button className="btn-ghost p-2" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="flex items-center text-xs font-semibold uppercase text-slate-400">A4:</span>
            <button className="btn-secondary" onClick={() => printSalePdf(sale, store)}>
              <Printer className="h-4 w-4" /> Imprimir
            </button>
            <button className="btn-primary" onClick={() => downloadSalePdf(sale, store)}>
              <Download className="h-4 w-4" /> Descargar PDF
            </button>
            <span className="mx-1 border-l border-slate-200" />
            <span className="flex items-center text-xs font-semibold uppercase text-slate-400">Ticket 80mm:</span>
            <button className="btn-secondary" onClick={() => printTicket80(sale, store)}>
              <Receipt className="h-4 w-4" /> Imprimir
            </button>
            <button className="btn-secondary" onClick={() => downloadTicket80(sale, store)}>
              <Download className="h-4 w-4" /> Descargar
            </button>
          </div>
        </div>

        {/* Nota (vista previa A4) */}
        <div className="card overflow-hidden">
          <SaleNote sale={sale} store={store} />
        </div>
      </div>
    </div>
  );
}
