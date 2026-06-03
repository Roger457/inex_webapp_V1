"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Search, MapPin, Bookmark, LogOut, ChevronRight, Navigation } from "lucide-react";
import dynamic from "next/dynamic";

const MapSearchView = dynamic(() => import("@/components/MapSearchView"), { ssr: false });

type Company = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sector: string;
  logo_url: string | null;
  address: string;
  city: string;
  application_url: string;
  internship_types: string[];
  fields_offered: string[];
  what_you_gain: string[];
  is_premium: boolean;
  latitude: number;
  longitude: number;
  distance_km: number | null;
};

type Profile = {
  id: string;
  full_name: string;
  field_of_study: string;
  university: string;
};

const SECTORS = [
  "All", "Technology", "Finance", "Healthcare",
  "Engineering", "Marketing", "Legal", "Agriculture", "Education",
];

export default function ExplorePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [sector, setSector] = useState("All");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"home" | "map">("home");
  const [radiusKm, setRadiusKm] = useState(5);
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [manualCity, setManualCity] = useState("");
  const [locationError, setLocationError] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.0511, 9.7085]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        if (!refreshed) { router.push("/login"); return; }
        await loadData(refreshed.user.id);
        return;
      }
      await loadData(session.user.id);
    }
    init();
  }, []);

  async function loadData(userId: string) {
    setLoading(true);

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, field_of_study, university")
      .eq("id", userId)
      .single();

    if (profileData) setProfile(profileData);

    // Load subscription
    const { data: subData } = await supabase
      .from("subscriptions")
      .select("tier")
      .eq("student_id", userId)
      .single();

    const tier = subData?.tier || "free";
    setSubscriptionTier(tier);
    setRadiusKm(tier === "premium" ? 999 : tier === "pro" ? 25 : 5);

    // Load companies matching field of study
    const { data: companiesData } = await supabase.rpc("get_companies", {
      student_field: profileData?.field_of_study || null,
    });

    if (companiesData) setCompanies(companiesData);

    // Load saved
    const { data: savedData } = await supabase
      .from("saved_companies")
      .select("company_id")
      .eq("student_id", userId);

    if (savedData) setSavedIds(savedData.map((d: any) => d.company_id));

    setLoading(false);
  }

 async function toggleSave(e: React.MouseEvent, companyId: string) {
  e.stopPropagation();
  e.preventDefault();
  if (!profile) return;

  const isSaved = savedIds.includes(companyId);

  if (isSaved) {
    await supabase
      .from("saved_companies")
      .delete()
      .eq("student_id", profile.id)
      .eq("company_id", companyId);
    setSavedIds((prev) => prev.filter((id) => id !== companyId));
  } else {
    const { error } = await supabase
      .from("saved_companies")
      .insert({ student_id: profile.id, company_id: companyId });
    if (!error) {
      setSavedIds((prev) => [...prev, companyId]);
      await supabase.from("interactions").insert({
        student_id: profile.id,
        company_id: companyId,
        action: "saved",
      });
    }
  }
}

  function handleCardClick(company: Company) {
    if (profile) {
      supabase.from("interactions").insert({
        student_id: profile.id,
        company_id: company.id,
        action: "viewed",
      });
    }
    router.push(`/companies/${company.slug}`);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const filtered = sector === "All"
    ? companies
    : companies.filter((c) => c.sector === sector);

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  if (mode === "map") {
    
    const CITY_COORDS: Record<string, [number, number]> = {
  "douala": [4.0511, 9.7085],
  "yaoundé": [3.8480, 11.5021],
  "yaounde": [3.8480, 11.5021],
  "buea": [4.1527, 9.2412],
  "limbe": [4.0167, 9.2000],
  "bafoussam": [5.4764, 10.4176],
};

function handleUseGPS() {
  setLocationError("");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(coords);
      setMapCenter([coords.lat, coords.lng]);
      setShowLocationPrompt(false);
      setMode("map");
    },
    () => {
      setLocationError("Could not get your location. Try entering a city manually.");
    },
    { timeout: 10000 }
  );
}

function handleManualCity() {
  const key = manualCity.trim().toLowerCase();
  const coords = CITY_COORDS[key];
  if (!coords) {
    setLocationError("City not found. Try: Douala, Yaoundé, Buea, Limbe, Bafoussam");
    return;
  }
  setLocationError("");
  setUserLocation({ lat: coords[0], lng: coords[1] });
  setMapCenter(coords);
  setShowLocationPrompt(false);
  setMode("map");
}
    return (
      <MapSearchView
        profile={profile}
        savedIds={savedIds}
        radiusKm={radiusKm}
        subscriptionTier={subscriptionTier}
        onBack={() => setMode("home")}
        onViewCompany={(slug) => router.push(`/companies/${slug}`)}
        onToggleSave={toggleSave}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <header className="bg-white px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
          
            <p className="text-sm text-gray-500 mt-0.5">
              Find your perfect internship
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-gray-600"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar — opens map mode */}
        <button
          onClick={() => setMode("map")}
          className="w-full flex items-center gap-3 px-5 py-3.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-400">
            Search by location or field...
          </span>
        </button>

        {/* Quick action — Nearby */}
        <button
          onClick={() => setShowLocationPrompt(true)}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          Companies Nearby
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Sector filters */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {SECTORS.map((s) => (
            <button
              key={s}
              onClick={() => setSector(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                sector === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            Loading companies...
          </div>
        ) : (
          <>
            {/* Recommended for you */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Recommended for you
                </h2>
                <span className="text-xs text-gray-400">
                  Based on {profile?.field_of_study || "your profile"}
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p>No companies found for your field.</p>
                  <p className="text-xs mt-1">Try updating your profile or changing the filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map((company) => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      saved={savedIds.includes(company.id)}
                      onSave={(e) => toggleSave(e, company.id)}
                      onClick={() => handleCardClick(company)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function CompanyCard({
  company, saved, onSave, onClick
}: {
  company: Company;
  saved: boolean;
  onSave: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl shrink-0">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            company.name.charAt(0)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors truncate">
              {company.name}
            </h3>
            <button
              onClick={onSave}
              className="shrink-0 text-gray-300 hover:text-blue-500 transition-colors"
            >
              <Bookmark className={`w-5 h-5 ${saved ? "fill-blue-500 text-blue-500" : ""}`} />
            </button>
          </div>

          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            {company.city}
            {company.distance_km !== null && (
              <span className="ml-1 text-blue-500 font-medium">
                · {company.distance_km}km away
              </span>
            )}
          </p>

          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {company.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {company.internship_types?.slice(0, 2).map((type) => (
              <span key={type} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                {type}
              </span>
            ))}
            {company.sector && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                {company.sector}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}