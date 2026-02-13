'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type UserTier = 'free' | 'pro' | 'studio';

export interface UserTierState {
  tier: UserTier;
  storyLimit: number;
  isPro: boolean;
  isStudio: boolean;
  loading: boolean;
}

const DEFAULT_STATE: UserTierState = {
  tier: 'free',
  storyLimit: 3,
  isPro: false,
  isStudio: false,
  loading: true,
};

function normalizeTier(tier: unknown): UserTier {
  if (tier === 'pro' || tier === 'studio') return tier;
  return 'free';
}

/**
 * Fetches current user via Supabase auth, loads user_profiles row,
 * and returns tier, storyLimit, isPro, isStudio. Cached in React state.
 * Handles loading state; when signed out or on error, returns free defaults.
 */
export function useUserTier(): UserTierState {
  const [state, setState] = useState<UserTierState>(DEFAULT_STATE);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session?.user) {
        setState({
          tier: 'free',
          storyLimit: 3,
          isPro: false,
          isStudio: false,
          loading: false,
        });
        return;
      }

      setState((prev) => ({ ...prev, loading: true }));

      const { data: row, error } = await supabase
        .from('user_profiles')
        .select('tier, story_limit')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !row) {
        setState({
          tier: 'free',
          storyLimit: 3,
          isPro: false,
          isStudio: false,
          loading: false,
        });
        return;
      }

      const tier = normalizeTier(row.tier);
      const storyLimit =
        typeof row.story_limit === 'number' && row.story_limit >= 0
          ? row.story_limit
          : 3;

      setState({
        tier,
        storyLimit,
        isPro: tier === 'pro',
        isStudio: tier === 'studio',
        loading: false,
      });
    };

    fetchProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
