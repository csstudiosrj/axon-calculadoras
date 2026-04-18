"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EventData } from "@/types/monetization";
import { useMonetization } from "@/components/providers/MonetizationProvider";

function CalculadoraSanitariosContent() {
  const params = useParams();
  const router = useRouter();
  const { canCalculate, playAd } = useMonetization();
  
  const [evento, setEvento] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const[resultado, setResultado] = useState<any>(null);

  // Campos do Formulário Mínimo Viável
  const[duracao, setDuracao] = useState("6");
  const [proporcao, setProporcao] = useState("50-50");
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
  },[params, supabase]);

  const handleCalcular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evento) return;

    // 1. O Guardião verifica se o usuário pode calcular
    const check = canCalculate(evento);
    if (!check.allowed) {
      alert(check.reason); // Em breve trocaremos por um modal bonito de Upgrade
      return;
    }

    setIsCalculating(true);

    // 2. O Guardião roda o anúncio pré-cálculo (se o plano exigir)
    await playAd("pre");

    // 3. Simulação da chamada para o seu arquivo de 1300 linhas
    // (No próximo passo, importaremos a função real do calculations.js)
    setTimeout(async () => {
      setResultado({
        cabinesMasc: Math.ceil((evento.pax * 0.5) / 100),
        mictorios: Math.ceil((evento.pax * 0.5) / 100),
        cabinesFem: Math.ceil((evento.pax * 0.5) / 50),
        pcd: 2,
        pias: Math.ceil(evento.pax / 200),
        alertas: openBar ?["Atenção: Evento Open Bar exige acréscimo de 20% na estrutura sanitária."] :[]
      });

      // 4. Atualiza o contador de usos no banco de dados
      await supabase
        .from("events")
        .update({ uses_count: evento.uses_count + 1 })
        .eq("id", evento.id);

      // 5. O Guardião roda o anúncio pós-cálculo
      await playAd("post");
      setIsCalculating(false);
    }, 1000);
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
    <div className="max-w-4xl mx-auto mt-6 pb-12">
      <button 
        onClick={() => router.push(`/eventos/${evento.id}`)}
        className="text-zinc-500 hover:text-zinc-300 mb-6 text-sm flex items-center gap-2 transition-colors font-medium"
      >
        ← Voltar ao Hub do Evento
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#2979FF]/20 text-[#2979FF] flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Sanitários</h1>
          <p className="text-zinc-400">Dimensionamento NBR 13969 e NR-24</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulário de Parâmetros */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4">Parâmetros do Cálculo</h2>
          
          <form onSubmit={handleCalcular} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Público Base (PAX)</label>
              <input
                type="text"
                value={evento.pax.toLocaleString('pt-BR')}
                disabled
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Duração do Evento (Horas)</label>
              <select
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-[#2979FF] text-white"
              >
                <option value="4">Até 4 horas</option>
                <option value="6">De 4 a 6 horas</option>
                <option value="8">De 6 a 8 horas</option>
                <option value="12">Mais de 8 horas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Proporção de Gênero</label>
              <select
                value={proporcao}
                onChange={(e) => setProporcao(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-[#2979FF] text-white"
              >
                <option value="50-50">50% Homens / 50% Mulheres</option>
                <option value="40-60">40% Homens / 60% Mulheres</option>
                <option value="30-70">30% Homens / 70% Mulheres</option>
                <option value="60-40">60% Homens / 40% Mulheres</option>
              </select>
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
              <input
                type="checkbox"
                id="openBar"
                checked={openBar}
                onChange={(e) => setOpenBar(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-700 text-[#2979FF] focus:ring-[#2979FF] bg-zinc-900"
              />
              <label htmlFor="openBar" className="text-sm font-medium text-zinc-300 cursor-pointer">
                Evento Open Bar (Alto consumo de líquidos)
              </label>
            </div>

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full bg-[#2979FF] hover:bg-[#2264D1] text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(41,121,255,0.3)]"
            >
              {isCalculating ? "Processando Normas..." : "Calcular Dimensionamento"}
            </button>
          </form>
        </div>

        {/* Área de Resultados */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4">Resultados Técnicos</h2>
          
          {!resultado ? (
            <div className="flex-grow flex flex-col items-center justify-center text-zinc-600 text-center">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Preencha os parâmetros e clique em calcular para gerar o dimensionamento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-zinc-300">Cabines Femininas</span>
                <span className="text-2xl font-bold text-[#2979FF]">{resultado.cabinesFem}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-zinc-300">Cabines Masculinas</span>
                <span className="text-2xl font-bold text-[#2979FF]">{resultado.cabinesMasc}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-zinc-300">Mictórios</span>
                <span className="text-2xl font-bold text-[#2979FF]">{resultado.mictorios}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-zinc-300">Cabines PCD (Unissex)</span>
                <span className="text-2xl font-bold text-[#2979FF]">{resultado.pcd}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-zinc-300">Pias / Lavatórios</span>
                <span className="text-2xl font-bold text-[#2979FF]">{resultado.pias}</span>
              </div>

              {resultado.alertas.length > 0 && (
                <div className="mt-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                  <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                    <span>⚠️</span> Alertas Normativos
                  </h4>
                  <ul className="text-sm text-red-300 space-y-1">
                    {resultado.alertas.map((alerta: string, i: number) => (
                      <li key={i}>{alerta}</li>
                    ))}
                  </ul>
                </div>
              )}
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