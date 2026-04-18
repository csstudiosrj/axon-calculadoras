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

// Separamos o conteúdo em um sub-componente para o Next.js não reclamar
function EventoHubContent() {
  const params = useParams();
  const router = useRouter();
  const[evento, setEvento] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Garante que o ID existe antes de buscar no banco
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
    <div className="max-w-6xl mx-auto mt-6">
      {/* Cabeçalho do Evento */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            onClick={() => router.push("/dashboard")}
            className="text-zinc-500 hover:text-zinc-300 mb-2 text-sm flex items-center gap-2 transition-colors"
          >
            ← Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">{evento.name}</h1>
          <p className="text-[#52ad92] font-medium mt-1">Público Base: {evento.pax.toLocaleString('pt-BR')} pessoas</p>
        </div>
        
        <div className="flex gap-4 text-center">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2">
            <span className="block text-xs text-zinc-500 uppercase tracking-wider">Usos Realizados</span>
            <span className="block text-xl font-bold text-white">{evento.uses_count}</span>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2">
            <span className="block text-xs text-zinc-500 uppercase tracking-wider">Status</span>
            <span className="block text-xl font-bold text-[#138946]">
              {evento.is_active ? "Ativo" : "Expirado"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Calculadoras */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Módulos de Dimensionamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CALCULADORAS_LISTA.map((calc) => (
            <button
              key={calc.id}
              onClick={() => router.push(`/eventos/${evento.id}/calculadoras/${calc.id}`)}
              className="bg-zinc-900 border border-zinc-800 hover:border-[#52ad92] p-5 rounded-xl text-left transition-all hover:shadow-lg hover:-translate-y-1 group"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4 group-hover:bg-[#138946] transition-colors">
                <span className="text-zinc-400 group-hover:text-white font-bold text-lg">
                  {calc.nome.charAt(0)}
                </span>
              </div>
              <h3 className="text-white font-semibold mb-1">{calc.nome}</h3>
              <p className="text-zinc-500 text-sm leading-snug">{calc.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Botão de Ação Global */}
      <div className="bg-gradient-to-r from-[#14373E] to-zinc-900 border border-[#138946]/30 rounded-2xl p-8 text-center mt-12">
        <h3 className="text-2xl font-bold text-white mb-2">Dimensionamento Completo</h3>
        <p className="text-zinc-400 mb-6 max-w-2xl mx-auto">
          Execute todas as 16 calculadoras simultaneamente e gere um memorial descritivo completo em PDF com embasamento normativo.
        </p>
        <button className="bg-[#D4AF37] hover:bg-[#B8860B] text-zinc-950 font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-[#D4AF37]/20">
          Calcular Tudo e Gerar PDF
        </button>
      </div>
    </div>
  );
}

// O Componente Principal agora embrulha o conteúdo no Suspense
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