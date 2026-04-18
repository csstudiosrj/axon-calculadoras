"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EventData } from "@/types/monetization";

const CALCULADORAS_LISTA =[
  { id: "alimentacao", nome: "Alimentação", desc: "Dimensionamento de A&B", color: "#FF5722", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-8-6a8 8 0 0116 0H4z" /> },
  { id: "bebidas", nome: "Bebidas", desc: "Cálculo de consumo e bares", color: "#00E5FF", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /> },
  { id: "brigada", nome: "Brigada", desc: "Bombeiros civis (IT-17)", color: "#FF1744", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /> },
  { id: "credenciamento", nome: "Credenciamento", desc: "Catracas e staff", color: "#D500F9", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /> },
  { id: "equipe-medica", nome: "Equipe Médica", desc: "Postos, UTIs e médicos", color: "#F50057", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /> },
  { id: "financeiro", nome: "Financeiro", desc: "Caixas e tesouraria", color: "#00E676", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { id: "gelo", nome: "Gelo", desc: "Cubos e escamas", color: "#80D8FF", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
  { id: "gerador", nome: "Gerador", desc: "Carga em kVA", color: "#FFEA00", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /> },
  { id: "ingressos", nome: "Ingressos", desc: "Lotes e quebras", color: "#536DFE", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /> },
  { id: "insumos", nome: "Insumos", desc: "Copos e descartáveis", color: "#FFC400", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /> },
  { id: "publico", nome: "Público", desc: "Lotação e evasão", color: "#1DE9B6", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> },
  { id: "recepcao", nome: "Recepção", desc: "Hostess e orientadores", color: "#FF4081", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /> },
  { id: "residuos", nome: "Resíduos", desc: "Lixeiras e caçambas", color: "#C6FF00", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> },
  { id: "sanitarios", nome: "Sanitários", desc: "Cabines, mictórios e PCD", color: "#2979FF", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /> },
  { id: "seguranca", nome: "Segurança", desc: "Vigilantes e orientadores", color: "#FF3D00", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
  { id: "sonorizacao", nome: "Sonorização", desc: "PAs e delays", color: "#E040FB", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /> },
];

function EventoHubContent() {
  const params = useParams();
  const router = useRouter();
  const [evento, setEvento] = useState<EventData | null>(null);
  const[isLoading, setIsLoading] = useState(true);

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
      <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
            <span className="bg-[#138946]/20 text-[#52ad92] border border-[#138946]/30 px-3 py-1 rounded-md text-sm font-bold tracking-wide">
              {evento.pax.toLocaleString('pt-BR')} PAX
            </span>
            <span className="text-zinc-500 text-sm font-medium">Público Base Estimado</span>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-zinc-950 border border-zinc-800 rounded-xl px-6 py-4 text-center">
            <span className="block text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Usos</span>
            <span className="block text-2xl font-bold text-white">{evento.uses_count}</span>
          </div>
          <div className="flex-1 md:flex-none bg-zinc-950 border border-zinc-800 rounded-xl px-6 py-4 text-center">
            <span className="block text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Status</span>
            <span className="block text-2xl font-bold text-[#138946]">
              {evento.is_active ? "Ativo" : "Expirado"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Calculadoras - Colorido e Elegante */}
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
              className="relative overflow-hidden p-6 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 group flex flex-col h-full border"
              style={{ 
                backgroundColor: `${calc.color}10`, // Fundo com 10% de opacidade da cor
                borderColor: `${calc.color}30`,     // Borda com 30% de opacidade
              }}
            >
              {/* Efeito Hover: Borda acende e sombra colorida */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ 
                  boxShadow: `inset 0 0 0 1px ${calc.color}, 0 0 20px ${calc.color}20` 
                }}
              ></div>
              
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ 
                    backgroundColor: `${calc.color}20`, 
                    color: calc.color 
                  }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {calc.icon}
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-white group-hover:text-white transition-colors duration-300">
                  {calc.nome}
                </h3>
              </div>
              
              <p className="text-zinc-400 text-sm leading-relaxed flex-grow relative z-10">{calc.desc}</p>
              
              <div 
                className="mt-5 flex items-center text-xs font-bold uppercase tracking-wider relative z-10 transition-colors duration-300"
                style={{ color: calc.color }}
              >
                Acessar Módulo <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Botão de Ação Global (PDF) */}
      <div className="relative overflow-hidden bg-[#14373E] border border-[#138946]/30 rounded-2xl p-10 text-center">
        <div className="relative z-10">
          <h3 className="text-3xl font-extrabold text-white mb-3">Dimensionamento Completo</h3>
          <p className="text-[#52ad92] mb-8 max-w-2xl mx-auto text-lg font-medium">
            Execute todas as 16 calculadoras simultaneamente e gere um memorial descritivo completo em PDF com embasamento normativo.
          </p>
          <button className="bg-[#D4AF37] hover:bg-[#B8860B] text-zinc-950 font-extrabold text-lg py-4 px-10 rounded-xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)] hover:-translate-y-1">
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