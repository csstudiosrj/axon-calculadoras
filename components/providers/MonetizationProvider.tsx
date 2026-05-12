"use client";

import React, { createContext, useContext } from "react";

// MVP — monetização desativada. Reativar após o sistema estar estável.

interface MonetizationContextType {
  profile: null;
  isLoading: false;
  canCreateEvent: () => true;
  canCalculate: () => { allowed: true };
  playAd: () => Promise<void>;
}

const MonetizationContext = createContext<MonetizationContextType>({
  profile: null,
  isLoading: false,
  canCreateEvent: () => true,
  canCalculate: () => ({ allowed: true }),
  playAd: () => Promise.resolve(),
});

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
  return (
    <MonetizationContext.Provider value={{
      profile: null,
      isLoading: false,
      canCreateEvent: () => true,
      canCalculate: () => ({ allowed: true }),
      playAd: () => Promise.resolve(),
    }}>
      {children}
    </MonetizationContext.Provider>
  );
}

export const useMonetization = () => useContext(MonetizationContext);