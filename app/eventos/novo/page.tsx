"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useMonetization } from "@/components/providers/MonetizationProvider";

export default function NovoEventoPage() {
  const { profile, isLoading, canCreateEvent } = useMonetization();
  const router = useRouter();
  
  const[name, setName] = useState("");
  const [pax, setPax] = useState("");
  const[isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const[activeEventsCount, setActiveEventsCount] = useState(0);
  const [checkingLimits, setCheckingLimits] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkActiveEvents = async () => {
      if (!profile) return;
      
      const { count, error } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_active", true);

      if (!error && count !== null) {
        setActiveEventsCount(count);
      }
      setCheckingLimits(false);
    };

    if (profile) {
      checkActiveEvents();
    }
  }, [profile, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!canCreateEvent(activeEventsCount)) {
      setErrorMsg("Limite de eventos ativos atingido para o seu plano. Faça upgrade para criar mais eventos simultâneos.");
      return;
    }

    const paxNumber = parseInt(pax, 10);
    if (isNaN(paxNumber) || paxNumber <= 0) {
      setErrorMsg("O número de pessoas (PAX) deve ser maior que zero.");
      return;
    }

    setIsSubmitting(true);

    // Calcula a data de expiração (30 dias para frente)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          user_id: profile?.id,
          name: name,
          pax: paxNumber,
          expires_at: expiresAt.toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      setErrorMsg("Erro ao criar o evento. Tente novamente.");
      setIsSubmitting(false);
    } else if (data) {
      // Redireciona para o Hub do Evento recém-criado
      router.push(`/eventos/${data.id}`);
    }
  };

  if (isLoading || checkingLimits) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#138946] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="mb-8">
        <button 
          onClick={() => router.push("/dashboard")}
          className="text-zinc-400 hover:text-white mb-4 text-sm flex items-center gap-2 transition-colors"
        >
          ← Voltar ao Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Criar Novo Evento</h1>
        <p className="text-zinc-400">Configure os dados base para iniciar o dimensionamento.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Nome do Evento</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-[#138946] text-white transition-colors"
              placeholder="Ex: Festival de Inverno 2026"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Público Estimado (PAX)</label>
            <input
              type="number"
              value={pax}
              onChange={(e) => setPax(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-[#138946] text-white transition-colors"
              placeholder="Ex: 5000"
              required
            />
            <p className="text-xs text-zinc-500 mt-2">
              Você poderá ajustar este número depois, mas ele será a base para todas as 16 calculadoras.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-lg text-sm bg-red-900/30 text-red-400 border border-red-900/50">
              {errorMsg}
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#138946] hover:bg-[#005e30] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-[#138946]/20"
            >
              {isSubmitting ? "Criando ambiente..." : "Criar Evento e Acessar Calculadoras"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}