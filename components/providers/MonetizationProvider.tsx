"use client";

import React, { createContext, useContext } from "react";
import { Profile, EventData } from "@/types/monetization";

// MVP — monetização desativada. Reativar após o sistema estar estável.

interface MonetizationContextType {
  profile: Profile | null;
  isLoading: boolean;
  canCreateEvent: (n: number) => boolean;
  canCalculate: (event: EventData) => { allowed: boolean; reason?: string };
  playAd: (type: "pre" | "post" | "pdf") => Promise<void>;
  decrementUse: (eventId: string, currentCount: number) => Promise<void>;
}

const MonetizationContext = createContext<MonetizationContextType>({
  profile: null,
  isLoading: false,
  canCreateEvent: () => true,
  canCalculate: () => ({ allowed: true }),
  playAd: () => Promise.resolve(),
  decrementUse: () => Promise.resolve(),
});

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
  return (
    <MonetizationContext.Provider value={{
      profile: null,
      isLoading: false,
      canCreateEvent: () => true,
      canCalculate: () => ({ allowed: true }),
      playAd: () => Promise.resolve(),
      decrementUse: () => Promise.resolve(),
    }}>
      {children}
    </MonetizationContext.Provider>
  );
}

export const useMonetization = () => useContext(MonetizationContext);
