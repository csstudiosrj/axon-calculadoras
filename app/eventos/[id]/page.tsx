"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EventData } from "@/types/monetization";
import { useMonetization } from "@/components/providers/MonetizationProvider";

const CALCULADORAS = [
  { id: "sanitarios", nome: "Sanitários", descricao: "NBR 13969, NR-24 e NBR 9050", cor: "#2979FF", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><polyline points="8 10 12 14 16 10"/></svg>' },
  { id: "publico", nome: "Público", descricao: "Lotação e densidade por área", cor: "#3ecf8e", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { id: "seguranca", nome: "Segurança", descricao: "Portaria DPF 18.045/2023", cor: "#D4AF37", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
  { id: "brigada", nome: "Brigada", descricao: "IT-17 CBPMESP / NT 5-04 CBMERJ", cor: "#FF5722", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>' },
  { id: "equipeMedica", nome: "Equipe Médica", descricao: "Portaria MS 2.048/2002", cor: "#E91E63", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
  { id: "residuos", nome: "Resíduos", descricao: "NBR 16366 e PNRS", cor: "#4CAF50", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>' },
  { id: "gerador", nome: "Gerador", descricao: "NBR 5410 e AES Standards", cor: "#FFC107", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
  { id: "sonorizacao", nome: "Sonorização", descricao: "AES Standards / NR-15", cor: "#9C27B0", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' },
  { id: "recepcao", nome: "Recepção", descricao: "Controle de acesso e catracas", cor: "#00BCD4", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' },
  { id: "gelo", nome: "Gelo", descricao: "Senac Eventos / ABRAPE", cor: "#03A9F4", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="m17 7-5-5-5 5"/><path d="m17 17-5 5-5-5"/><path d="M2 12h20"/><path d="m7 7-5 5 5 5"/><path d="m17 7 5 5-5 5"/></svg>' },
  { id: "insumos", nome: "Insumos", descricao: "ABRAPE e NR-24", cor: "#795548", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' },
  { id: "alimentacao", nome: "Alimentação", descricao: "NR-24 24.3.1", cor: "#FF9800", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>' },
  { id: "bebidas", nome: "Bebidas", descricao: "Abrasel / ABRAPE", cor: "#8BC34A", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 11H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1Z"/><path d="M15.5 11V6.5a2.5 2.5 0 0 1 5 0v4.9"/><path d="M6 11V4"/><path d="M10 11V4"/></svg>' },
  { id: "ingressos", nome: "Ingressos", descricao: "Bilheteria e receita por setor", cor: "#F44336", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>' },
  { id: "financeiro", nome: "Financeiro", descricao: "DRE simplificado e break-even", cor: "#3ecf8e", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { id: "credenciamento", nome: "Credenciamento", descricao: "Zonas de acesso e crachás", cor: "#607D8B", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>' },
];

const CALC_NOMES: Record<string, string> = Object.fromEntries(CALCULADORAS.map(c => [c.id, c.nome]));
const CALC_CORES: Record<string, string> = Object.fromEntries(CALCULADORAS.map(c => [c.id, c.cor]));

interface CalcRecord {
  id: string;
  calculator_type: string;
  params: Record<string, unknown>;
  results: Record<string, unknown>;
  alerts: Array<{ level: string; message: string }>;
  created_at: string;
}

function EventoHubContent() {
  const params = useParams();
  const router = useRouter();
  const { canCalculate, playAd } = useMonetization();

  const [evento, setEvento] = useState<EventData | null>(null);
  const [calculos, setCalculos] = useState<CalcRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [navegando, setNavegando] = useState(false);
  const [aba, setAba] = useState<"calculadoras" | "historico">("calculadoras");
  const [calculoAberto, setCalculoAberto] = useState<CalcRecord | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!params?.id) return;
    const fetchData = async () => {
      const [{ data: ev }, { data: calcs }] = await Promise.all([
        supabase.from("events").select("*").eq("id", params.id).single(),
        supabase.from("calculations").select("*").eq("event_id", params.id).order("created_at", { ascending: false }),
      ]);
      if (ev) setEvento(ev as EventData);
      if (calcs) setCalculos(calcs as CalcRecord[]);
      setIsLoading(false);
    };
    fetchData();
  }, [params]);

  const handleAbrirCalculadora = async (calcId: string) => {
    if (!evento || navegando) return;
    const check = canCalculate(evento);
    if (!check.allowed) { alert(check.reason); return; }
    setNavegando(true);
    await playAd("pre");
    router.push(`/eventos/${params.id}/calculadoras/${calcId}`);
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#138946] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!evento) return null;

  return (
    <div className="max-w-6xl mx-auto mt-6 pb-12 px-4">
      <button onClick={() => router.push("/dashboard")} className="text-zinc-400 hover:text-white mb-6 text-sm flex items-center gap-2 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Voltar ao Dashboard
      </button>

      {/* Header do evento */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">{evento.name}</h1>
            <p className="text-zinc-400 text-sm">{evento.pax.toLocaleString("pt-BR")} pessoas · {evento.uses_count} cálculo(s) realizado(s)</p>
          </div>
          <span className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full font-medium">{evento.pax.toLocaleString("pt-BR")} PAX</span>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setAba("calculadoras")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${aba === "calculadoras" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
        >
          Calculadoras
        </button>
        <button
          onClick={() => setAba("historico")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${aba === "historico" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
        >
          Histórico
          {calculos.length > 0 && (
            <span className="bg-zinc-600 text-zinc-300 text-xs px-1.5 py-0.5 rounded-full">{calculos.length}</span>
          )}
        </button>
      </div>

      {/* Conteúdo das abas */}
      {aba === "calculadoras" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CALCULADORAS.map((calc) => (
            <button
              key={calc.id}
              onClick={() => handleAbrirCalculadora(calc.id)}
              disabled={navegando}
              className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 text-left transition-all hover:bg-zinc-800/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${calc.cor}15`, border: `1px solid ${calc.cor}30`, color: calc.cor }}
                dangerouslySetInnerHTML={{ __html: calc.icon }}
              />
              <div className="text-white font-semibold text-sm mb-1">{calc.nome}</div>
              <div className="text-zinc-500 text-xs leading-snug">{calc.descricao}</div>
            </button>
          ))}
        </div>
      )}

      {aba === "historico" && (
        <div>
          {calculos.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-12 text-center">
              <p className="text-zinc-500">Nenhum cálculo realizado ainda.</p>
            </div>
          ) : calculoAberto ? (
            <div>
              <button onClick={() => setCalculoAberto(null)} className="text-zinc-400 hover:text-white mb-6 text-sm flex items-center gap-2 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Voltar ao histórico
              </button>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CALC_CORES[calculoAberto.calculator_type] ?? "#3ecf8e" }} />
                  <h2 className="text-xl font-bold text-white">{CALC_NOMES[calculoAberto.calculator_type] ?? calculoAberto.calculator_type}</h2>
                </div>
                <p className="text-zinc-500 text-sm">{formatDate(calculoAberto.created_at)} · PAX {evento.pax.toLocaleString("pt-BR")}</p>
              </div>

              {/* Parâmetros usados */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Parâmetros utilizados</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(calculoAberto.params).filter(([k]) => k !== "pax" && k !== "area").map(([k, v]) => (
                    <div key={k} className="bg-zinc-950 rounded-lg p-3">
                      <div className="text-xs text-zinc-500 mb-1">{k}</div>
                      <div className="text-sm text-zinc-200 font-medium">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resultados */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Resultados</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(calculoAberto.results).map(([k, v]) => {
                    const rv = v as { value: unknown; label: string; norma?: string };
                    if (!rv?.label) return null;
                    return (
                      <div key={k} className="bg-zinc-950 rounded-lg p-4">
                        <div className="text-2xl font-black mb-1" style={{ color: CALC_CORES[calculoAberto.calculator_type] ?? "#3ecf8e" }}>
                          {typeof rv.value === "number" ? rv.value.toLocaleString("pt-BR") : String(rv.value)}
                        </div>
                        <div className="text-sm text-zinc-300">{rv.label}</div>
                        {rv.norma && <div className="text-xs text-zinc-600 mt-1">{rv.norma}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alertas */}
              {calculoAberto.alerts?.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Alertas normativos</h3>
                  {calculoAberto.alerts.map((a, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg mb-2 ${a.level === "critical" ? "bg-red-950/30 border border-red-900/40" : a.level === "warning" ? "bg-amber-950/30 border border-amber-900/40" : "bg-blue-950/30 border border-blue-900/40"}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={a.level === "critical" ? "#ef4444" : a.level === "warning" ? "#f59e0b" : "#38bdf8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        {a.level === "critical" ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> : a.level === "warning" ? <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>}
                      </svg>
                      <span className={`text-sm ${a.level === "critical" ? "text-red-300" : a.level === "warning" ? "text-amber-300" : "text-blue-300"}`}>{a.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {calculos.map((calc) => (
                <div
                  key={calc.id}
                  onClick={() => setCalculoAberto(calc)}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 cursor-pointer transition-all hover:bg-zinc-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-10 rounded-full" style={{ backgroundColor: CALC_CORES[calc.calculator_type] ?? "#3ecf8e" }} />
                    <div>
                      <div className="text-white font-semibold">{CALC_NOMES[calc.calculator_type] ?? calc.calculator_type}</div>
                      <div className="text-zinc-500 text-sm">{formatDate(calc.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {calc.alerts?.filter(a => a.level === "critical").length > 0 && (
                      <span className="text-xs bg-red-900/30 text-red-400 border border-red-900/40 px-2 py-1 rounded-md">
                        {calc.alerts.filter(a => a.level === "critical").length} crítico(s)
                      </span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5e7a94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EventoHubPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#138946] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <EventoHubContent />
    </Suspense>
  );
}
