"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EventData } from "@/types/monetization";

// @ts-ignore
import { calcEquipeMedica } from "@/lib/calculators/calculations";

function CalculadoraContent() {
  const params = useParams();
  const router = useRouter();

  const [evento, setEvento] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!params?.id) return;
    const fetchEvento = async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", params.id).single();
      if (!error && data) setEvento(data as EventData);
      setIsLoading(false);
    };
    fetchEvento();
  }, [params]);

  const handleCalcular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evento) return;
    setIsCalculating(true);
    setSalvo(false);

    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);

    const calcParams: Record<string, any> = { pax: evento.pax, area: parseFloat(fd.get("area") as string) || 0 };
    fd.forEach((v, k) => { if (k !== "area") calcParams[k] = isNaN(Number(v)) ? v : Number(v); });

    try {
      const res = calcEquipeMedica(calcParams);
      setResultado(res);
      setSalvando(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("calculations").insert({
          event_id: params.id,
          user_id: session.user.id,
          calculator_type: "equipeMedica",
          params: calcParams,
          results: res.results,
          alerts: res.alerts,
        });
        await supabase.from("events").update({ uses_count: evento.uses_count + 1 }).eq("id", params.id);
        setEvento(prev => prev ? { ...prev, uses_count: prev.uses_count + 1 } : prev);
        setSalvo(true);
      }
    } catch (err) {
      console.error("Erro:", err);
      alert("Ocorreu um erro ao processar o dimensionamento.");
    }
    setSalvando(false);
    setIsCalculating(false);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#E91E63", borderTopColor: "transparent" }} /></div>;
  if (!evento) return null;

  return (
    <div className="max-w-6xl mx-auto mt-6 pb-12 px-4">
      <button onClick={() => router.push(`/eventos/${evento.id}`)} className="text-zinc-400 hover:text-white mb-6 text-sm flex items-center gap-2 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Voltar ao Hub do Evento
      </button>

      <div className="flex items-center gap-5 mb-8 bg-zinc-900/50 border border-zinc-800/80 p-6 rounded-3xl">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Equipe Médica</h1>
          <p className="text-sm mt-1" style={{ color: "#E91E63" }}>Portaria MS 2.048/2002 · CFM Res. 2.228/2018</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: "#E91E63" }} />
            Parâmetros do Evento
          </h2>
          <form onSubmit={handleCalcular} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">PAX (público base)</label>
                <input type="text" value={evento.pax.toLocaleString("pt-BR")} disabled className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 cursor-not-allowed font-medium" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Área do evento (m²)</label>
                <input name="area" type="number" placeholder="ex: 5000" min={1} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none transition-colors" style={{ outlineColor: "#E91E63" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Tipo de evento</label>
                <select name="tipoEvento" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="show">Show / Festival</option>
                  <option value="esporte">Esportivo</option>
                  <option value="congresso">Congresso / Corporativo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Perfil do público</label>
                <select name="perfilPublico" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="jovem">Jovem (18-35)</option>
                  <option value="geral">Geral</option>
                  <option value="idoso">Idoso (60+)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Local</label>
                <select name="indoorOutdoor" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="outdoor">Externo (outdoor)</option>
                  <option value="indoor">Interno (indoor)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Época do ano</label>
                <select name="epocaAno" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="outro">Outono / Inverno</option>
                  <option value="verao">Verão</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Duração (horas)</label>
              <select name="duracaoHoras" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                <option value="4">Até 4 horas</option>
                <option value="8">De 4 a 8 horas</option>
                <option value="12">Mais de 8 horas</option>
              </select>
            </div>
            <button type="submit" disabled={isCalculating} className="w-full text-white font-bold text-base py-4 rounded-xl transition-all disabled:opacity-50 mt-2" style={{ background: `linear-gradient(135deg, #E91E63, #E91E6399)` }}>
              {isCalculating ? "Processando normas técnicas..." : "Processar dimensionamento"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-[#D4AF37]" />
            Memorial de Dimensionamento
          </h2>
          {!resultado ? (
            <div className="flex-grow flex flex-col items-center justify-center text-zinc-600 text-center">
              <svg className="w-12 h-12 opacity-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-sm">Preencha os parâmetros e processe para ver o memorial técnico.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-grow">
              {Object.entries(resultado.results).map(([k, v]: [string, any]) => {
                if (!v?.label) return null;
                const val = typeof v.value === "object" ? JSON.stringify(v.value) : typeof v.value === "number" ? v.value.toLocaleString("pt-BR") : String(v.value);
                return (
                  <div key={k} className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                    <div>
                      <div className="text-zinc-300 font-medium text-sm">{v.label}</div>
                      {v.norma && <div className="text-zinc-600 text-xs mt-0.5">{v.norma}</div>}
                    </div>
                    <div className="text-xl font-black text-white ml-4">{val}</div>
                  </div>
                );
              })}
              {salvo && <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-900/40 rounded-xl"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span className="text-green-400 text-sm font-medium">Cálculo salvo no histórico do evento</span></div>}
              {salvando && <div className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-xl"><div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /><span className="text-zinc-400 text-sm">Salvando...</span></div>}
            </div>
          )}
          {resultado?.alerts?.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Alertas normativos</h3>
              {resultado.alerts.map((a: any, i: number) => (
                <div key={i} className={`flex items-start gap-2 p-3 rounded-lg border ${a.level === "critical" ? "bg-red-950/30 border-red-900/40 text-red-300" : a.level === "warning" ? "bg-amber-950/30 border-amber-900/40 text-amber-300" : "bg-blue-950/30 border-blue-900/40 text-blue-300"}`}>
                  <span className="text-sm">{a.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#E91E63", borderTopColor: "transparent" }} /></div>}>
      <CalculadoraContent />
    </Suspense>
  );
}
