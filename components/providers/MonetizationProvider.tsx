"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Profile, EventData, TIER_CONFIG } from "@/types/monetization";

interface MonetizationContextType {
  profile: Profile | null;
  isLoading: boolean;
  canCreateEvent: (activeEventsCount: number) => boolean;
  canCalculate: (event: EventData) => { allowed: boolean; reason?: string };
  playAd: (type: "pre" | "post" | "pdf") => Promise<void>;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const[isLoading, setIsLoading] = useState(true);
  
  // Estados separados e simplificados para o anúncio
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const[adTimeLeft, setAdTimeLeft] = useState(0);
  const [adMessage, setAdMessage] = useState("");
  
  // Usamos um Ref para guardar a função que "destrava" o sistema quando o anúncio acaba
  const resolvePromiseRef = useRef<(() => void) | null>(null);

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

        if (!error && data) {
          setProfile(data as Profile);
        }
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
  }, [supabase]);

  // O MOTOR DO CRONÔMETRO (Totalmente isolado e seguro)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isAdPlaying && adTimeLeft > 0) {
      // Se está rodando e tem tempo, diminui 1 segundo
      timer = setTimeout(() => {
        setAdTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isAdPlaying && adTimeLeft === 0) {
      // Se o tempo acabou, fecha a tela e avisa o sistema para continuar
      setIsAdPlaying(false);
      if (resolvePromiseRef.current) {
        resolvePromiseRef.current();
        resolvePromiseRef.current = null; // Limpa a referência
      }
    }

    return () => clearTimeout(timer); // Limpa o timer se o componente desmontar
  },[isAdPlaying, adTimeLeft]);


  const canCreateEvent = (activeEventsCount: number): boolean => {
    if (!profile) return false;
    const rules = TIER_CONFIG[profile.tier];
    return activeEventsCount < rules.maxEvents;
  };

  const canCalculate = (event: EventData): { allowed: boolean; reason?: string } => {
    if (!profile) return { allowed: false, reason: "Usuário não autenticado. Faça login para continuar." };

    const rules = TIER_CONFIG[profile.tier];
    
    if (event.pax > rules.maxPax) {
      return { allowed: false, reason: `Seu plano atual permite dimensionar eventos para até ${rules.maxPax} pessoas. Faça upgrade do seu plano.` };
    }

    const totalAllowedUses = rules.baseUses + profile.extra_credits;
    if (event.uses_count >= totalAllowedUses) {
      return { allowed: false, reason: "Limite de cálculos atingido para este evento. Adquira créditos avulsos ou faça upgrade do seu plano." };
    }

    return { allowed: true };
  };

  // A CHAMADA DO ANÚNCIO (Agora ela não mexe com setTimeout, só muda o estado)
  const playAd = (type: "pre" | "post" | "pdf"): Promise<void> => {
    return new Promise((resolve) => {
      if (!profile) {
        resolve();
        return;
      }

      const rules = TIER_CONFIG[profile.tier];
      if (!rules.hasAds) {
        resolve(); // Se for PRO ou Tier 5, passa direto instantaneamente
        return;
      }

      let duration = 0;
      let msg = "";

      if (type === "pre") {
        duration = rules.adPreSeconds;
        msg = "Carregando módulo e normas técnicas...";
      } else if (type === "post") {
        duration = rules.adPostSeconds;
        msg = "Processando resultados técnicos e dimensionamento...";
      } else if (type === "pdf") {
        duration = rules.adPdfSeconds;
        msg = "Gerando PDF com memorial descritivo completo...";
      }

      if (duration <= 0) {
        resolve();
        return;
      }

      // Prepara o anúncio
      setAdMessage(msg);
      setAdTimeLeft(duration);
      
      // Guarda a chave para destravar o sistema quando acabar
      resolvePromiseRef.current = resolve;
      
      // Dá o play
      setIsAdPlaying(true);
    });
  };

  return (
    <MonetizationContext.Provider value={{ profile, isLoading, canCreateEvent, canCalculate, playAd }}>
      {children}
      
      {/* TELA DE ANÚNCIO */}
      {isAdPlaying && (
        <div className="fixed inset-0 z-[9999] bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center text-zinc-50 font-sans">
          <div className="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-center flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#138946] border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-semibold mb-2 text-white">{adMessage}</h2>
            <p className="text-zinc-400 mb-8">
              Aguarde <span className="text-[#52ad92] font-bold text-2xl mx-1">{adTimeLeft}</span> segundos.
            </p>
            
            <div className="w-full h-48 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center relative overflow-hidden">
              <span className="text-sm text-zinc-500 font-medium tracking-widest uppercase">Espaço Publicitário</span>
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
  if (context === undefined) {
    throw new Error("useMonetization deve ser usado dentro de um MonetizationProvider");
  }
  return context;
};