import os

os.makedirs('./app/eventos/[id]/calculadoras/sanitarios', exist_ok=True)

content = '''"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EventData } from "@/types/monetization";

// @ts-ignore
import { calcSanitarios } from "@/lib/calculators/calculations";

interface ResultValue {
  value: number | string;
  label: string;
  norma?: string;
}

interface SanitariosResult {
  results: {
    cabinesM: ResultValue;
    cabinesF: ResultValue;
    cabinesPCD: ResultValue;
    mictorios: ResultValue;
    lavatorios: ResultValue;
    totalUnitarios: ResultValue;
    tempoFilaEstimadoMin: ResultValue;
  };
  alerts: Array<{ level: "critical" | "warning" | "info"; message: string }>;
}

function CalculadoraContent() {
  const params = useParams();
  const router = useRouter();

  const [evento, setEvento] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [resultado, setResultado] = useState<SanitariosResult | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  // Parâmetros do formulário
  const [area, setArea] = useState("");
  const [duracao, setDuracao] = useState("8");
  const [proporcao, setProporcao] = useState("0.5");
  const [openBar, setOpenBar] = useState(false);
  const [estado, setEstado] = useState("federal");
  const [pcdPercentual, setPcdPercentual] = useState("5");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!params?.id) return;
    const fetchEvento = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.id)
        .single();
      if (!error && data) setEvento(data as EventData);
      setIsLoading(false);
    };
    fetchEvento();
  }, [params]);

  const handleCalcular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evento) return;
    if (!area || parseFloat(area) <= 0) {
      alert("Informe a área do evento em m².");
      return;
    }

    setIsCalculating(true);
    setSalvo(false);

    const calcParams = {
      pax: evento.pax,
      area: parseFloat(area),
      duracaoHoras: parseFloat(duracao),
      proporcaoHomens: parseFloat(proporcao),
      openBar,
      estado,
      pcdPercentual: parseFloat(pcdPercentual) / 100,
    };

    try {
      const res = calcSanitarios(calcParams) as SanitariosResult;
      setResultado(res);

      // Salva no banco
      setSalvando(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("calculations").insert({
          event_id: params.id,
          user_id: session.user.id,
          calculator_type: "sanitarios",
          params: calcParams,
          results: res.results,
          alerts: res.alerts,
        });

        // Incrementa uses_count
        await supabase
          .from("events")
          .update({ uses_count: evento.uses_count + 1 })
          .eq("id", params.id);

        setEvento(prev => prev ? { ...prev, uses_count: prev.uses_count + 1 } : prev);
        setSalvo(true);
      }
    } catch (err) {
      console.error("Erro no cálculo:", err);
      alert("Ocorreu um erro ao processar o dimensionamento.");
    }

    setSalvando(false);
    setIsCalculating(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#2979FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!evento) return null;

  const cor = "#2979FF";

  return (
    <div className="max-w-6xl mx-auto mt-6 pb-12 px-4">
      <button onClick={() => router.push(`/eventos/${evento.id}`)} className="text-zinc-400 hover:text-white mb-6 text-sm flex items-center gap-2 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Voltar ao Hub do Evento
      </button>

      {/* Header */}
      <div className="flex items-center gap-5 mb-8 bg-zinc-900/50 border border-zinc-800/80 p-6 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${cor}15`, border: `1px solid ${cor}30`, color: cor }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>
            <polyline points="8 10 12 14 16 10"/>
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Sanitários</h1>
          <p className="text-sm mt-1" style={{ color: cor }}>NBR 13969 · NR-24 · NBR 9050</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Formulário */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: cor }} />
            Parâmetros do Evento
          </h2>

          <form onSubmit={handleCalcular} className="space-y-5">

            {/* PAX (readonly) + Área */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">PAX (público base)</label>
                <input
                  type="text"
                  value={evento.pax.toLocaleString("pt-BR")}
                  disabled
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Área do evento (m²)</label>
                <input
                  type="number"
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  placeholder="ex: 5000"
                  min={1}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#2979FF] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Duração + Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Duração do evento</label>
                <select value={duracao} onChange={e => setDuracao(e.target.value)} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#2979FF]">
                  <option value="4">Até 4 horas</option>
                  <option value="6">De 4 a 6 horas</option>
                  <option value="8">De 6 a 8 horas</option>
                  <option value="12">Mais de 8 horas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Norma aplicável</label>
                <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#2979FF]">
                  <option value="federal">Federal (NR-24)</option>
                  <option value="RJ">Rio de Janeiro (CBMERJ)</option>
                  <option value="SP">São Paulo (CBPMESP)</option>
                </select>
              </div>
            </div>

            {/* Proporção + PCD */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Proporção de gênero</label>
                <select value={proporcao} onChange={e => setProporcao(e.target.value)} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#2979FF]">
                  <option value="0.3">30% masc / 70% fem</option>
                  <option value="0.4">40% masc / 60% fem</option>
                  <option value="0.5">50% masc / 50% fem</option>
                  <option value="0.6">60% masc / 40% fem</option>
                  <option value="0.7">70% masc / 30% fem</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">% Público PCD</label>
                <select value={pcdPercentual} onChange={e => setPcdPercentual(e.target.value)} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#2979FF]">
                  <option value="2">2% (mínimo legal)</option>
                  <option value="5">5% (recomendado)</option>
                  <option value="10">10% (evento inclusivo)</option>
                </select>
              </div>
            </div>

            {/* Open Bar */}
            <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <input
                type="checkbox"
                id="openBar"
                checked={openBar}
                onChange={e => setOpenBar(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-700 bg-zinc-900"
                style={{ accentColor: cor }}
              />
              <div>
                <label htmlFor="openBar" className="text-sm font-medium text-zinc-200 cursor-pointer">Evento Open Bar</label>
                <p className="text-xs text-zinc-500 mt-0.5">Aumenta a demanda de sanitários em 40% conforme NBR 13969</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full text-white font-bold text-base py-4 rounded-xl transition-all disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${cor}, #1E5BCC)` }}
            >
              {isCalculating ? "Processando normas técnicas..." : "Processar dimensionamento"}
            </button>
          </form>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex-grow flex flex-col">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[#D4AF37]" />
              Memorial de Dimensionamento
            </h2>

            {!resultado ? (
              <div className="flex-grow flex flex-col items-center justify-center text-zinc-600 text-center">
                <svg className="w-12 h-12 opacity-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Preencha os parâmetros e processe para ver o memorial técnico.</p>
              </div>
            ) : (
              <div className="space-y-3 flex-grow">
                {Object.entries(resultado.results).map(([key, rv]) => (
                  <div key={key} className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                    <div>
                      <div className="text-zinc-300 font-medium text-sm">{rv.label}</div>
                      {rv.norma && <div className="text-zinc-600 text-xs mt-0.5">{rv.norma}</div>}
                    </div>
                    <div className="text-2xl font-black text-white ml-4">{typeof rv.value === "number" ? rv.value.toLocaleString("pt-BR") : rv.value}</div>
                  </div>
                ))}

                {salvo && (
                  <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-900/40 rounded-xl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="text-green-400 text-sm font-medium">Cálculo salvo no histórico do evento</span>
                  </div>
                )}
                {salvando && (
                  <div className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-xl">
                    <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-400 text-sm">Salvando...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alertas */}
          {resultado && resultado.alerts.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Alertas normativos</h3>
              {resultado.alerts.map((a, i) => {
                const alertCor = a.level === "critical" ? "#ef4444" : a.level === "warning" ? "#f59e0b" : "#38bdf8";
                const alertBg = a.level === "critical" ? "bg-red-950/30 border-red-900/40" : a.level === "warning" ? "bg-amber-950/30 border-amber-900/40" : "bg-blue-950/30 border-blue-900/40";
                const alertText = a.level === "critical" ? "text-red-300" : a.level === "warning" ? "text-amber-300" : "text-blue-300";
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border mb-2 ${alertBg}`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={alertCor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                      {a.level === "critical"
                        ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                        : a.level === "warning"
                        ? <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
                        : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>}
                    </svg>
                    <span className={`text-sm ${alertText}`}>{a.message}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalculadoraSanitariosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#2979FF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CalculadoraContent />
    </Suspense>
  );
}
'''

with open('./app/eventos/[id]/calculadoras/sanitarios/page.tsx', 'w') as f:
    f.write(content)

print("ok")