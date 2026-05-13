import { create } from "zustand";
import { Internship, PlanTier, PLAN_RADIUS } from "@/types";

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapStore {
  // ── Location ──────────────────────────────────────────────────────────────
  userCoords:    Coordinates | null;
  setUserCoords: (coords: Coordinates) => void;

  // ── Radius ────────────────────────────────────────────────────────────────
  radius:    number;
  setRadius: (km: number) => void;

  // ── Filters ───────────────────────────────────────────────────────────────
  fieldFilter:    string | null;
  typeFilter:     string | null;
  searchQuery:    string;
  setFieldFilter: (field: string | null) => void;
  setTypeFilter:  (type: string | null) => void;
  setSearchQuery: (q: string) => void;

  // ── Selected internship ───────────────────────────────────────────────────
  selected:    Internship | null;
  setSelected: (internship: Internship | null) => void;

  // ── Plan / paywall ────────────────────────────────────────────────────────
  plan:             PlanTier;
  showPricing:      boolean;
  setPlan:          (tier: PlanTier) => void;
  setShowPricing:   (show: boolean) => void;

  // ── Internship results ────────────────────────────────────────────────────
  internships:    Internship[];
  isLoading:      boolean;
  setInternships: (list: Internship[]) => void;
  setIsLoading:   (loading: boolean) => void;
}

export const useMapStore = create<MapStore>((set, get) => ({
  // ── Location ──────────────────────────────────────────────────────────────
  userCoords:    null,
  setUserCoords: (coords) => set({ userCoords: coords }),

  // ── Radius ────────────────────────────────────────────────────────────────
  radius:    10, // free tier default
  setRadius: (km) => {
    const { plan, setShowPricing } = get();
    const maxRadius = PLAN_RADIUS[plan];
    if (km > maxRadius) {
      setShowPricing(true); // trigger paywall
      return;
    }
    set({ radius: km });
  },

  // ── Filters ───────────────────────────────────────────────────────────────
  fieldFilter:    null,
  typeFilter:     null,
  searchQuery:    "",
  setFieldFilter: (field) => set({ fieldFilter: field }),
  setTypeFilter:  (type)  => set({ typeFilter: type }),
  setSearchQuery: (q)     => set({ searchQuery: q }),

  // ── Selected internship ───────────────────────────────────────────────────
  selected:    null,
  setSelected: (internship) => set({ selected: internship }),

  // ── Plan ──────────────────────────────────────────────────────────────────
  plan:           "free",
  showPricing:    false,
  setPlan:        (tier) => set({ plan: tier }),
  setShowPricing: (show) => set({ showPricing: show }),

  // ── Results ───────────────────────────────────────────────────────────────
  internships:    [],
  isLoading:      false,
  setInternships: (list)    => set({ internships: list }),
  setIsLoading:   (loading) => set({ isLoading: loading }),
}));