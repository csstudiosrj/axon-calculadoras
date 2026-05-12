"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useMonetization } from "@/components/providers/MonetizationProvider";
import { TIER_CONFIG } from "@/types/monetization";

export default function NovoEventoPage() {
  const { profile, isLoading, canCreateEvent } = useMonetization();
  const router = useRouter();

  const [name, setName] = useState("");
  const [pax, setPax] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeEventsCount, setActiveEventsCount] = useState(0);
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

    if (!profile) return;

    if (!canCreateEvent(activeEventsCount)) {
      setErrorMsg("Limite de eventos ativos atingido para o seu plano. Faça upgrade para criar mais eventos simultâneos.");
      return;
    }

    const paxNumber = parseInt(pax, 10);
    if (isNaN(paxNumber) || paxNumber <= 0) {
      setErrorMsg("O número de pessoas (PAX) deve ser maior que zero.");
      return;
    }

    const rules = TIER_CONFIG[profile.tier as any];
    if (paxNumber > rules.maxPax) {
      setErrorMsg(`Seu plano atual (${profile.tier}) permite criar eventos de até ${rules.maxPax.toLocaleString("pt-BR")} pessoas. Faça upgrade para dimensionar eventos maiores.`);
      return;
    }

    setIsSubmitting(true);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabase
      .from("events")
      .insert([{ user_id: profile.id, name, pax: paxNumber, expires_at: expiresAt.toISOString() }])
      .select()
      .single();

    if (error) {
      setErrorMsg("Erro ao criar o evento. Tente novamente.");
      setIsSubmitting(false);
    } else if (data) {
      router.push(`/eventos/${data.id}`);
    }
  };

  if (isLoading || checkingLimits) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#138946] border-t-transparent rounded-full animate-spin" />
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar ao Dashboard
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
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-[#138946] focus:ring-1 focus:ring-[#138946] text-white transition-all"
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
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-[#138946] focus:ring-1 focus:ring-[#138946] text-white transition-all"
              placeholder="Ex: 5000"
              required
            />
            <p className="text-xs text-zinc-500 mt-2">
              Você poderá ajustar este número depois, mas ele será a base para todas as 16 calculadoras.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-lg text-sm bg-red-900/30 text-red-400 border border-red-900/50 flex items-start gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>{errorMsg}</span>
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