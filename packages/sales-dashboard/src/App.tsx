import { DEFAULT_SCORER_WEIGHTS } from "@metalnest/core";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">MetalNest — Akıllı Üretim Planlayıcı</h1>
        <p className="text-sm text-slate-500">
          Satış Demo Modu — mimari iskelet (Adım 1). Metrik kartları, plan tablosu,
          ağırlık slider'ları ve CSV import Adım 5'te eklenecek.
        </p>
      </header>

      <section className="grid max-w-3xl grid-cols-3 gap-4">
        {(
          [
            ["Satış Ağırlığı", DEFAULT_SCORER_WEIGHTS.salesWeight],
            ["Atıl Stok Ağırlığı", DEFAULT_SCORER_WEIGHTS.staleStockWeight],
            ["Fire Ağırlığı", DEFAULT_SCORER_WEIGHTS.wasteWeight],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
