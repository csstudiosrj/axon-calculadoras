"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Profile, EventData, TIER_CONFIG } from "@/types/monetization";

interface MonetizationContextType {
  profile: Profile | null;
  isLoading: boolean;
  canCreateEvent: (activeEventsCount: number) => boolean;
  canCalculate: (event: EventData) => { allowed: boolean; reason?: string };
  playAd: (type: "pre" | "post" | "pdf") => Promise<void>;
  decrementUse: (eventId: string, currentUsesCount: number) => Promise<void>;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adVisible, setAdVisible] = useState(false);
  const [adTimeLeft, setAdTimeLeft] = useState(0);
  const [adMessage, setAdMessage] = useState("");

  // Ref para guardar o resolve da Promise ativa — evita closure stale
  const resolveRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (!error && data) setProfile(data as Profile);
      }
      setIsLoading(false);
    };

    fetchProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Limpa o interval ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const canCreateEvent = (activeEventsCount: number): boolean => {
    if (!profile) return false;
    return activeEventsCount < TIER_CONFIG[profile.tier].maxEvents;
  };

  const canCalculate = (event: EventData): { allowed: boolean; reason?: string } => {
    if (!profile) return { allowed: false, reason: "Usuário não autenticado." };

    const rules = TIER_CONFIG[profile.tier];

    if (event.pax > rules.maxPax) {
      return {
        allowed: false,
        reason: `Seu plano permite até ${rules.maxPax.toLocaleString("pt-BR")} pessoas. Faça upgrade.`,
      };
    }

    const totalAllowedUses = rules.baseUses + profile.extra_credits;
    if (event.uses_count >= totalAllowedUses) {
      return {
        allowed: false,
        reason: "Limite de cálculos atingido. Adquira créditos ou faça upgrade.",
      };
    }

    return { allowed: true };
  };

  // Decrementa uso no banco: incrementa uses_count no evento
  // e, se estava usando crédito extra, decrementa extra_credits no perfil
  const decrementUse = useCallback(async (eventId: string, currentUsesCount: number) => {
    if (!profile) return;

    const rules = TIER_CONFIG[profile.tier];

    // Incrementa uses_count do evento
    await supabase
      .from("events")
      .update({ uses_count: currentUsesCount + 1 })
      .eq("id", eventId);

    // Se o uso atual ultrapassou os usos base, estava consumindo crédito extra
    if (currentUsesCount >= rules.baseUses && profile.extra_credits > 0) {
      const newCredits = profile.extra_credits - 1;
      await supabase
        .from("profiles")
        .update({ extra_credits: newCredits })
        .eq("id", profile.id);

      // Atualiza o perfil local para refletir o novo saldo
      setProfile((prev) => prev ? { ...prev, extra_credits: newCredits } : prev);
    }
  }, [profile, supabase]);

  const playAd = useCallback((type: "pre" | "post" | "pdf"): Promise<void> => {
    return new Promise((resolve) => {
      if (!profile) { resolve(); return; }

      const rules = TIER_CONFIG[profile.tier];
      if (!rules.hasAds) { resolve(); return; }

      const durationMap = {
        pre: rules.adPreSeconds,
        post: rules.adPostSeconds,
        pdf: rules.adPdfSeconds,
      };
      const messageMap = {
        pre: "Carregando módulo e normas técnicas...",
        post: "Processando resultados técnicos e dimensionamento...",
        pdf: "Gerando PDF com memorial descritivo completo...",
      };

      const duration = durationMap[type];
      if (duration <= 0) { resolve(); return; }

      // Garante que não há interval anterior rodando
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      resolveRef.current = resolve;
      setAdMessage(messageMap[type]);
      setAdTimeLeft(duration);
      setAdVisible(true);

      // Usa uma variável local para o contador — sem depender do state
      let timeRemaining = duration;

      intervalRef.current = setInterval(() => {
        timeRemaining -= 1;
        setAdTimeLeft(timeRemaining);

        if (timeRemaining <= 0) {
          // Para o interval primeiro
          clearInterval(intervalRef.current!);
          intervalRef.current = null;

          // Fecha o modal
          setAdVisible(false);
          setAdTimeLeft(0);
          setAdMessage("");

          // Resolve a Promise
          if (resolveRef.current) {
            resolveRef.current();
            resolveRef.current = null;
          }
        }
      }, 1000);
    });
  }, [profile]);

  return (
    <MonetizationContext.Provider value={{ profile, isLoading, canCreateEvent, canCalculate, playAd, decrementUse }}>
      {children}

      {adVisible && (
        <div className="fixed inset-0 z-[9999] bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center text-zinc-50 font-sans">
          <div className="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-center flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#138946] border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-semibold mb-2 text-white">{adMessage}</h2>
            <p className="text-zinc-400 mb-8">
              Aguarde{" "}
              <span className="text-[#52ad92] font-bold text-2xl mx-1">{adTimeLeft}</span>{" "}
              segundos.
            </p>
            <div className="w-full h-48 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center">
              <span className="text-sm text-zinc-500 font-medium tracking-widest uppercase">
                Espaço Publicitário
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-4">AXON Calculadoras - CS Com Eventos</p>
          </div>
        </div>
      )}
    </MonetizationContext.Provider>
  );
}

export const useMonetization = () => {
  const context = useContext(MonetizationContext);
  if (!context) throw new Error("useMonetization deve ser usado dentro de MonetizationProvider");
  return context;
};
