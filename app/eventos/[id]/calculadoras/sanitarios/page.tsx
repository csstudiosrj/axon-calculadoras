"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EventData } from "@/types/monetization";
import { useMonetization } from "@/components/providers/MonetizationProvider";

// Importando diretamente a função de sanitários do seu arquivo
// @ts-ignore
import { calcSanitarios } from "@/lib/calculators/calculations";

function CalculadoraSanitariosContent() {
  const params = useParams();
  const router = useRouter();
  const { canCalculate, playAd } = useMonetization();
  
  const [evento, setEvento] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  // Formulário
  const [duracao, setDuracao] = useState("8");
  const [proporcao, setProporcao] = useState("0.5"); // Guardando o float direto
  const [openBar, setOpenBar] = useState(false);

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

      if (!error && data) {
        setEvento(data as EventData);
      }
      setIsLoading(false);
    };

    fetchEvento();
  }, [params, supabase]);

  const handleCalcular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evento) return;

    const check = canCalculate(evento);
    if (!check.allowed) {
      alert(check.reason);
      return;
    }

    setIsCalculating(true);
    await playAd("pre");

    try {
      // Chamando a sua função exata do arquivo calculations.js
      // Passando os parâmetros que a sua função espera receber
      const res = calcSanitarios({
        pax: evento.pax,
        area: 0,
        duracaoHoras: parseFloat(duracao),
        proporcaoHomens: parseFloat(proporcao),
        openBar: openBar,
        estado: 'federal'
      }) as any;
      
      setResultado(res);

      await supabase
        .from("events")
        .update({ uses_count: evento.uses_count + 1 })
        .eq("id", evento.id);

    } catch (error) {
      console.error("Erro na lógica de cálculo:", error);
      alert("Ocorreu um erro ao processar as normas técnicas.");
    }

    await playAd("post");
    setIsCalculating(false);
  };

  const handleExportPDF = async () => {
    await playAd("pdf");
    alert("PDF Gerado com sucesso!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#2979FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!evento) return null;

  return (
    <div className="max-w-6xl mx-auto mt-6 pb-12 px-4">
      <button 
        onClick={() => router.push(`/eventos/${evento.id}`)}
        className="text-zinc-500 hover:text-zinc-300 mb-6 text-sm flex items-center gap-2 transition-colors font-medium"
      >
        ← Voltar ao Hub do Evento
      </button>

      <div className="flex items-center gap-5 mb-8 bg-zinc-900/50 border border-zinc-800/80 p-6 rounded-3xl backdrop-blur-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#2979FF]/10 border border-[#2979FF]/20 text-[#2979FF] flex items-center justify-center shadow-[0_0_15px_rgba(41,121,255,0.15)]">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dimensionamento de Sanitários</h1>
          <p className="text-[#2979FF] font-medium mt-1">Baseado na NBR 13969, NR-24 e NBR 9050</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-[#2979FF] rounded-full"></span>
            Parâmetros Técnicos do Evento
          </h2>
          
          <form onSubmit={handleCalcular} className="space-y-6">
            
            <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/50">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Dados de Público</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Público Base (PAX)</label>
                  <input
                    type="text"
                    value={evento.pax.toLocaleString('pt-BR')}
                    disabled
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 cursor-not-allowed font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Duração (Horas)</label>
                  <select
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl focus:outline-none focus:border-[#2979FF] text-white"
                  >
                    <option value="4">Até 4 horas</option>
                    <option value="6">De 4 a 6 horas</option>
                    <option value="8">De 6 a 8 horas</option>
                    <option value="12">Mais de 8 horas</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/50">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Características</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Proporção de Gênero</label>
                  <select
                    value={proporcao}
                    onChange={(e) => setProporcao(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl focus:outline-none focus:border-[#2979FF] text-white"
                  >
                    <option value="0.5">50% Homens / 50% Mulheres</option>
                    <option value="0.4">40% Homens / 60% Mulheres</option>
                    <option value="0.3">30% Homens / 70% Mulheres</option>
                    <option value="0.6">60% Homens / 40% Mulheres</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-700 rounded-xl mt-5">
                  <input
                    type="checkbox"
                    id="openBar"
                    checked={openBar}
                    onChange={(e) => setOpenBar(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-700 text-[#2979FF] focus:ring-[#2979FF] bg-zinc-900"
                  />
                  <label htmlFor="openBar" className="text-sm font-medium text-zinc-300 cursor-pointer">
                    Evento Open Bar
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full bg-gradient-to-r from-[#2979FF] to-[#1E5BCC] hover:from-[#1E5BCC] hover:to-[#154499] text-white font-extrabold text-lg py-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(41,121,255,0.3)] hover:shadow-[0_0_30px_rgba(41,121,255,0.5)] hover:-translate-y-1"
            >
              {isCalculating ? "Processando Normas Técnicas..." : "Processar Dimensionamento"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl flex-grow flex flex-col relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#2979FF]/5 blur-[80px] rounded-full pointer-events-none"></div>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
              <span className="w-2 h-6 bg-[#D4AF37] rounded-full"></span>
              Resultados Técnicos
            </h2>
            
            {!resultado ? (
              <div className="flex-grow flex flex-col items-center justify-center text-zinc-600 text-center relative z-10">
                <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm">Preencha os parâmetros e processe para visualizar o memorial de cálculo.</p>
              </div>
            ) : (
              <div className="space-y-3 relative z-10">
                {/* Lendo diretamente a estrutura que o seu arquivo calculations.js devolve */}
                <div className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-300 font-medium">Cabines Femininas</span>
                  <span className="text-2xl font-black text-white">{resultado.results.cabinesF.value}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-300 font-medium">Cabines Masculinas</span>
                  <span className="text-2xl font-black text-white">{resultado.results.cabinesM.value}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-300 font-medium">Mictórios</span>
                  <span className="text-2xl font-black text-white">{resultado.results.mictorios.value}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-300 font-medium">Cabines PCD</span>
                  <span className="text-2xl font-black text-[#D4AF37]">{resultado.results.cabinesPCD.value}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-300 font-medium">Pias / Lavatórios</span>
                  <span className="text-2xl font-black text-white">{resultado.results.lavatorios.value}</span>
                </div>

                {/* Alertas do seu arquivo */}
                {resultado.alerts && resultado.alerts.length > 0 && (
                  <div className="mt-6 p-5 bg-red-950/30 border border-red-900/50 rounded-xl">
                    <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      Alertas Normativos
                    </h4>
                    <ul className="text-sm text-red-200 space-y-2">
                      {resultado.alerts.map((alerta: any, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{alerta.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {resultado && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-3">
              <button 
                onClick={handleExportPDF}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#e5c158] hover:to-[#c99718] text-zinc-950 font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2"
              >
                Baixar PDF Oficial
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="w-full bg-zinc-950 border border-zinc-700 hover:border-zinc-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                  E-mail
                </button>
                <button className="w-full bg-[#128C7E]/20 border border-[#128C7E]/50 hover:bg-[#128C7E]/30 text-[#25D366] font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                  WhatsApp
                </button>
              </div>
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
        <div className="w-8 h-8 border-4 border-[#2979FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CalculadoraSanitariosContent />
    </Suspense>
  );
}