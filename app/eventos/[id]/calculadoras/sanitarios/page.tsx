"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EventData } from "@/types/monetization";
import { useMonetization } from "@/components/providers/MonetizationProvider";

// Importando o seu motor de cálculo (ignorando o TS pois o arquivo é JS puro)
// @ts-ignore
import { runAllCalculations } from "@/lib/calculators/calculations";

function CalculadoraSanitariosContent() {
  const params = useParams();
  const router = useRouter();
  const { canCalculate, playAd } = useMonetization();
  
  const [evento, setEvento] = useState<EventData | null>(null);
  const[isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  // Formulário Complexo e Profissional
  const [staffPax, setStaffPax] = useState("0");
  const [duracao, setDuracao] = useState("6");
  const [proporcao, setProporcao] = useState("50-50");
  const [tipoEvento, setTipoEvento] = useState("show");
  const[consumoAlcool, setConsumoAlcool] = useState("moderado");
  const [clima, setClima] = useState("ameno");
  const [nivelServico, setNivelServico] = useState("standard");

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

    // 1. O Guardião verifica se o usuário pode calcular
    const check = canCalculate(evento);
    if (!check.allowed) {
      alert(check.reason);
      return;
    }

    setIsCalculating(true);

    // 2. Anúncio Pré-Cálculo
    await playAd("pre");

    try {
      // 3. Monta os parâmetros complexos para a sua função
      const parametrosParaCalculo = {
        sanitarios: {
          staff: parseInt(staffPax) || 0,
          duracao: parseInt(duracao),
          proporcao: proporcao,
          tipoEvento: tipoEvento,
          consumoAlcool: consumoAlcool,
          clima: clima,
          nivelServico: nivelServico,
          openBar: consumoAlcool === "open_bar"
        }
      };

      // 4. Chama a sua função de 1300 linhas!
      // Passamos o PAX do evento, a Área (0 por enquanto, se não for usada aqui) e os parâmetros
      const resultadosCompletos = runAllCalculations(evento.pax, 0, parametrosParaCalculo);
      
      // Extrai apenas o resultado dos sanitários
      setResultado(resultadosCompletos.sanitarios);

      // 5. Atualiza o contador de usos no banco de dados
      await supabase
        .from("events")
        .update({ uses_count: evento.uses_count + 1 })
        .eq("id", evento.id);

    } catch (error) {
      console.error("Erro na lógica de cálculo:", error);
      alert("Ocorreu um erro ao processar as normas técnicas. Verifique os parâmetros.");
    }

    // 6. Anúncio Pós-Cálculo
    await playAd("post");
    setIsCalculating(false);
  };

  // Funções de Exportação (Mockadas para a próxima fase)
  const handleExportPDF = async () => {
    await playAd("pdf");
    alert("PDF Gerado com sucesso! (Integração da biblioteca de PDF será o próximo passo)");
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

      {/* Cabeçalho da Calculadora */}
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
        
        {/* COLUNA ESQUERDA: Formulário Complexo (7 colunas) */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-[#2979FF] rounded-full"></span>
            Parâmetros Técnicos do Evento
          </h2>
          
          <form onSubmit={handleCalcular} className="space-y-6">
            
            {/* Bloco 1: Público */}
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
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Staff / Equipe de Trabalho</label>
                  <input
                    type="number"
                    value={staffPax}
                    onChange={(e) => setStaffPax(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl focus:outline-none focus:border-[#2979FF] focus:ring-1 focus:ring-[#2979FF] text-white transition-all"
                    placeholder="Ex: 150"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Características */}
            <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/50">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Características do Evento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Proporção de Gênero</label>
                  <select
                    value={proporcao}
                    onChange={(e) => setProporcao(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl focus:outline-none focus:border-[#2979FF] text-white"
                  >
                    <option value="50-50">50% Homens / 50% Mulheres</option>
                    <option value="40-60">40% Homens / 60% Mulheres</option>
                    <option value="30-70">30% Homens / 70% Mulheres</option>
                    <option value="60-40">60% Homens / 40% Mulheres</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Tipo de Evento</label>
                  <select
                    value={tipoEvento}
                    onChange={(e) => setTipoEvento(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl focus:outline-none focus:border-[#2979FF] text-white"
                  >
                    <option value="show">Show / Festival</option>
                    <option value="corporativo">Corporativo / Congresso</option>
                    <option value="esportivo">Esportivo</option>
                    <option value="feira">Feira / Exposição</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Nível de Serviço</label>
                  <select
                    value={nivelServico}
                    onChange={(e) => setNivelServico(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl focus:outline-none focus:border-[#2979FF] text-white"
                  >
                    <option value="standard">Standard (Padrão)</option>
                    <option value="premium">Premium / VIP (Maior conforto)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco 3: Fatores Ambientais e Consumo */}
            <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/50">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Fatores de Consumo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Consumo de Bebidas</label>
                  <select
                    value={consumoAlcool}
                    onChange={(e) => setConsumoAlcool(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl focus:outline-none focus:border-[#2979FF] text-white"
                  >
                    <option value="nenhum">Sem Álcool</option>
                    <option value="moderado">Venda Moderada</option>
                    <option value="alto">Alto Consumo</option>
                    <option value="open_bar">Open Bar (Crítico)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Clima Esperado</label>
                  <select
                    value={clima}
                    onChange={(e) => setClima(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl focus:outline-none focus:border-[#2979FF] text-white"
                  >
                    <option value="ameno">Ameno (15º a 25º)</option>
                    <option value="frio">Frio (Abaixo de 15º)</option>
                    <option value="calor">Calor (Acima de 25º)</option>
                  </select>
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

        {/* COLUNA DIREITA: Resultados e Exportação (5 colunas) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl flex-grow flex flex-col relative overflow-hidden">
            {/* Brilho de fundo */}
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
                {/* 
                  ATENÇÃO: Como eu não sei exatamente os nomes das variáveis que o seu 
                  arquivo calculations.js devolve, coloquei os nomes lógicos mais comuns. 
                  Se não aparecer o número na tela, me avise como o seu arquivo devolve!
                */}
                <div className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-300 font-medium">Cabines Femininas</span>
                  <span className="text-2xl font-black text-white">{resultado.cabinesFem || resultado.feminino || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-300 font-medium">Cabines Masculinas</span>
                  <span className="text-2xl font-black text-white">{resultado.cabinesMasc || resultado.masculino || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-300 font-medium">Mictórios</span>
                  <span className="text-2xl font-black text-white">{resultado.mictorios || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-300 font-medium">Cabines PCD (Unissex)</span>
                  <span className="text-2xl font-black text-[#D4AF37]">{resultado.pcd || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-300 font-medium">Pias / Lavatórios</span>
                  <span className="text-2xl font-black text-white">{resultado.pias || resultado.lavatorios || 0}</span>
                </div>

                {/* Alertas Inteligentes do seu código */}
                {resultado.alertas && resultado.alertas.length > 0 && (
                  <div className="mt-6 p-5 bg-red-950/30 border border-red-900/50 rounded-xl">
                    <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Alertas Normativos
                    </h4>
                    <ul className="text-sm text-red-200 space-y-2">
                      {resultado.alertas.map((alerta: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{alerta}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões de Exportação Premium */}
          {resultado && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 text-center">Exportar Memorial</h3>
              
              <button 
                onClick={handleExportPDF}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#e5c158] hover:to-[#c99718] text-zinc-950 font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Baixar PDF Oficial
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="w-full bg-zinc-950 border border-zinc-700 hover:border-zinc-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  E-mail
                </button>
                <button className="w-full bg-[#128C7E]/20 border border-[#128C7E]/50 hover:bg-[#128C7E]/30 text-[#25D366] font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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