"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EventData } from "@/types/monetization";

const CALCULADORAS_LISTA =[
  { id: "alimentacao", nome: "Alimentação", desc: "Dimensionamento de A&B" },
  { id: "bebidas", nome: "Bebidas", desc: "Cálculo de consumo e bares" },
  { id: "brigada", nome: "Brigada", desc: "Bombeiros civis (IT-17/NT-05)" },
  { id: "credenciamento", nome: "Credenciamento", desc: "Catracas e staff" },
  { id: "equipe-medica", nome: "Equipe Médica", desc: "Postos, UTIs e médicos" },
  { id: "financeiro", nome: "Financeiro", desc: "Caixas e tesouraria" },
  { id: "gelo", nome: "Gelo", desc: "Cubos e escamas" },
  { id: "gerador", nome: "Gerador", desc: "Carga em kVA" },
  { id: "ingressos", nome: "Ingressos", desc: "Lotes e quebras" },
  { id: "insumos", nome: "Insumos", desc: "Copos e descartáveis" },
  { id: "publico", nome: "Público", desc: "Lotação e evasão" },
  { id: "recepcao", nome: "Recepção", desc: "Hostess e orientadores" },
  { id: "residuos", nome: "Resíduos", desc: "Lixeiras e caçambas" },
  { id: "sanitarios", nome: "Sanitários", desc: "Cabines, mictórios e PCD" },
  { id: "seguranca", nome: "Segurança", desc: "Vigilantes e orientadores" },
  { id: "sonorizacao", nome: "Sonorização", desc: "PAs e delays" },
];

function EventoHubContent() {
  const params = useParams();
  const router = useRouter();
  const [evento, setEvento] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } else {
        router.push("/dashboard");
      }
      setIsLoading(false);
    };

    fetchEvento();
  }, [params, supabase, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#138946] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!evento) return null;

  return (
    <div className="max-w-7xl mx-auto mt-4 pb-12">
      
      {/* Cabeçalho Premium do Evento */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 mb-10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Faixa lateral verde */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#138946]"></div>
        
        <div className="pl-4">
          <button 
            onClick={() => router.push("/dashboard")}
            className="text-zinc-500 hover:text-zinc-300 mb-3 text-sm flex items-center gap-2 transition-colors font-medium"
          >
            ← Voltar ao Dashboard
          </button>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">{evento.name}</h1>
          <div className="flex items-center gap-3">
            <span className="bg-[#138946]/10 text-[#52ad92] border border-[#138946]/20 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">
              {evento.pax.toLocaleString('pt-BR')} PAX
            </span>
            <span className="text-zinc-500 text-sm">Público Base Estimado</span>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-zinc-950/50 border border-zinc-800/80 rounded-2xl px-6 py-4 text-center backdrop-blur-sm">
            <span className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Usos</span>
            <span className="block text-2xl font-bold text-white">{evento.uses_count}</span>
          </div>
          <div className="flex-1 md:flex-none bg-zinc-950/50 border border-zinc-800/80 rounded-2xl px-6 py-4 text-center backdrop-blur-sm">
            <span className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Status</span>
            <span className="block text-2xl font-bold text-[#138946]">
              {evento.is_active ? "Ativo" : "Expirado"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Calculadoras - Design SaaS Moderno */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Módulos de Dimensionamento</h2>
          <span className="text-sm font-medium text-zinc-500">Selecione uma área para calcular</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CALCULADORAS_LISTA.map((calc) => (
            <button
              key={calc.id}
              onClick={() => router.push(`/eventos/${evento.id}/calculadoras/${calc.id}`)}
              className="relative overflow-hidden bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 p-6 rounded-2xl text-left transition-all duration-300 hover:bg-zinc-800/80 hover:border-[#52ad92]/50 hover:shadow-[0_0_25px_rgba(19,137,70,0.1)] hover:-translate-y-1 group flex flex-col h-full"
            >
              {/* Linha de destaque no topo ao passar o mouse */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#138946] to-[#52ad92] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:bg-[#138946]/10 group-hover:border-[#138946]/30 transition-colors duration-300 shadow-inner">
                  <span className="text-zinc-400 group-hover:text-[#52ad92] font-bold text-xl transition-colors duration-300">
                    {calc.nome.charAt(0)}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg group-hover:text-[#52ad92] transition-colors duration-300">{calc.nome}</h3>
              </div>
              
              <p className="text-zinc-500 text-sm leading-relaxed flex-grow">{calc.desc}</p>
              
              <div className="mt-5 flex items-center text-xs font-bold text-zinc-600 group-hover:text-[#138946] transition-colors duration-300 uppercase tracking-wider">
                Acessar Módulo <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Botão de Ação Global (PDF) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#14373E] to-zinc-950 border border-[#138946]/20 rounded-3xl p-10 text-center shadow-2xl">
        {/* Efeito de brilho no fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#138946]/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <h3 className="text-3xl font-extrabold text-white mb-3">Dimensionamento Completo</h3>
          <p className="text-zinc-400 mb-8 max-w-2xl mx-auto text-lg">
            Execute todas as 16 calculadoras simultaneamente e gere um memorial descritivo completo em PDF com embasamento normativo.
          </p>
          <button className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#e5c158] hover:to-[#c99718] text-zinc-950 font-extrabold text-lg py-4 px-10 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:-translate-y-1">
            Calcular Tudo e Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventoHubPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#138946] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <EventoHubContent />
    </Suspense>
  );
}