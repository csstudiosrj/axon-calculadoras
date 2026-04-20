"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EventData } from "@/types/monetization";
import { useMonetization } from "@/components/providers/MonetizationProvider";

const CALCULADORAS = [
  { id: "sanitarios",    nome: "Sanitários",     descricao: "NBR 13969, NR-24 e NBR 9050",           icone: "🚻", cor: "#2979FF" },
  { id: "publico",       nome: "Público",         descricao: "Lotação e densidade por área",           icone: "👥", cor: "#138946" },
  { id: "seguranca",     nome: "Segurança",        descricao: "Portaria DPF 18.045/2023",               icone: "🛡️", cor: "#D4AF37" },
  { id: "brigada",       nome: "Brigada",          descricao: "IT-17 CBPMESP / NT 5-04 CBMERJ",        icone: "🔥", cor: "#FF5722" },
  { id: "equipeMedica",  nome: "Equipe Médica",    descricao: "Portaria MS 2.048/2002",                 icone: "🏥", cor: "#E91E63" },
  { id: "residuos",      nome: "Resíduos",         descricao: "NBR 16366 e PNRS",                       icone: "♻️", cor: "#4CAF50" },
  { id: "gerador",       nome: "Gerador",          descricao: "NBR 5410 e AES Standards",               icone: "⚡", cor: "#FFC107" },
  { id: "sonorizacao",   nome: "Sonorização",      descricao: "AES Standards / NR-15",                  icone: "🔊", cor: "#9C27B0" },
  { id: "recepcao",      nome: "Recepção",         descricao: "Controle de acesso e catracas",          icone: "🎫", cor: "#00BCD4" },
  { id: "gelo",          nome: "Gelo",             descricao: "Senac Eventos / ABRAPE",                 icone: "🧊", cor: "#03A9F4" },
  { id: "insumos",       nome: "Insumos",          descricao: "ABRAPE e NR-24",                         icone: "📦", cor: "#795548" },
  { id: "alimentacao",   nome: "Alimentação",      descricao: "NR-24 24.3.1",                           icone: "🍽️", cor: "#FF9800" },
  { id: "bebidas",       nome: "Bebidas",          descricao: "Abrasel / ABRAPE",                       icone: "🍺", cor: "#FFEB3B" },
  { id: "ingressos",     nome: "Ingressos",        descricao: "Bilheteria e receita por setor",         icone: "🎟️", cor: "#F44336" },
  { id: "financeiro",    nome: "Financeiro",       descricao: "DRE simplificado e break-even",          icone: "💰", cor: "#4CAF50" },
  { id: "credenciamento",nome: "Credenciamento",   descricao: "Zonas de acesso e crachás",              icone: "📋", cor: "#607D8B" },
];

export default function EventoHubPage() {
  const params = useParams();
  const router = useRouter();
  const { canCalculate, playAd } = useMonetization();

  const [evento, setEvento] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navegando, setNavegando] = useState(false);

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

  const handleAbrirCalculadora = async (calcId: string) => {
    if (!evento || navegando) return;

    // Verifica se pode calcular antes de mostrar o anúncio
    const check = canCalculate(evento);
    if (!check.allowed) {
      alert(check.reason);
      return;
    }

    setNavegando(true);

    // Pré-anúncio de 5s — só aqui, nunca na página da calculadora
    await playAd("pre");

    // Navega para a calculadora após o anúncio fechar
    router.push(`/eventos/${params.id}/calculadoras/${calcId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#138946] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!evento) return null;

  return (
    <div className="max-w-6xl mx-auto mt-6 pb-12 px-4">
      <button
        onClick={() => router.push("/dashboard")}
        className="text-zinc-400 hover:text-white mb-6 text-sm flex items-center gap-2 transition-colors"
      >
        ← Voltar ao Dashboard
      </button>

      {/* Cabeçalho do evento */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
              {evento.name}
            </h1>
            <p className="text-zinc-400 text-sm">
              {evento.pax.toLocaleString("pt-BR")} pessoas · {evento.uses_count} cálculo(s) realizado(s)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full font-medium">
              {evento.pax.toLocaleString("pt-BR")} PAX
            </span>
          </div>
        </div>
      </div>

      {/* Grid de calculadoras */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">Módulos de Dimensionamento</h2>
        <p className="text-zinc-500 text-sm mb-6">
          Clique em uma calculadora para iniciar o dimensionamento. Um breve anúncio será exibido antes de cada módulo.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CALCULADORAS.map((calc) => (
            <button
              key={calc.id}
              onClick={() => handleAbrirCalculadora(calc.id)}
              disabled={navegando}
              className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 text-left transition-all hover:bg-zinc-800/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${calc.cor}15`, border: `1px solid ${calc.cor}30` }}
              >
                {calc.icone}
              </div>
              <div className="text-white font-semibold text-sm mb-1">{calc.nome}</div>
              <div className="text-zinc-500 text-xs leading-snug">{calc.descricao}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
