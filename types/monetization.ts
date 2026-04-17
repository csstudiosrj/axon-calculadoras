export type UserTier = 'FREE' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4' | 'TIER_5' | 'PRO';

export interface Profile {
  id: string;
  email: string;
  tier: UserTier;
  extra_credits: number;
}

export interface EventData {
  id: string;
  user_id: string;
  name: string;
  pax: number;
  uses_count: number;
  is_active: boolean;
  expires_at: string;
}

export interface TierRules {
  maxEvents: number;
  maxPax: number;
  baseUses: number;
  adPreSeconds: number;
  adPostSeconds: number;
  adPdfSeconds: number;
  hasAds: boolean;
}

export const TIER_CONFIG: Record<UserTier, TierRules> = {
  FREE: { maxEvents: 1, maxPax: 200, baseUses: 3, adPreSeconds: 5, adPostSeconds: 15, adPdfSeconds: 30, hasAds: true },
  TIER_1: { maxEvents: 1, maxPax: 300, baseUses: 5, adPreSeconds: 5, adPostSeconds: 5, adPdfSeconds: 5, hasAds: true },
  TIER_2: { maxEvents: 1, maxPax: 500, baseUses: 10, adPreSeconds: 5, adPostSeconds: 5, adPdfSeconds: 5, hasAds: true },
  TIER_3: { maxEvents: 1, maxPax: 700, baseUses: 15, adPreSeconds: 5, adPostSeconds: 5, adPdfSeconds: 5, hasAds: true },
  TIER_4: { maxEvents: 1, maxPax: 1000, baseUses: 20, adPreSeconds: 3, adPostSeconds: 3, adPdfSeconds: 3, hasAds: true },
  TIER_5: { maxEvents: 1, maxPax: 5000, baseUses: 30, adPreSeconds: 0, adPostSeconds: 0, adPdfSeconds: 0, hasAds: false },
  PRO: { maxEvents: 5, maxPax: 99999, baseUses: 9999, adPreSeconds: 0, adPostSeconds: 0, adPdfSeconds: 0, hasAds: false },
};