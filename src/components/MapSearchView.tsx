"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, MapPin, Navigation, Search, ChevronUp, Bookmark, Lock } from "lucide-react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type Company = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sector: string;
  city: string;
  logo_url: string | null;
  internship_types: string[];
  application_url: string;
  latitude: number;
  longitude: number;
  distance_km: number | null;
};

type Profile = {
  id: string;
  full_name: string;
  field_of_study: string;
  university: string;
} | null;

type Props = {
  profile: Profile;
  savedIds: string[];
  radiusKm: number;
  subscriptionTier: string;
  onBack: () => void;
  onViewCompany: (slug: string) => void;
  onToggleSave: (e: React.MouseEvent, companyId: string) => void;
};

const CITY_COORDS: Record<string, [number, number]> = {
  "douala": [4.0511, 9.7085],
  "yaoundé": [3.8480, 11.5021],
  "yaounde": [3.8480, 11.5021],
  "buea": [4.1527, 9.2412],
  "limbe": [4.0167, 9.2000],
  "bafoussam": [5.4764, 10.4176],
};

export default function MapSearchView({
  profile, savedIds, radiusKm, subscriptionTier,
  onBack, onViewCompany, onToggleSave,
}: Props) {
  const supabase = createClient();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationMode, setLocationMode] = useState<"prompt" | "locating" | "located">("prompt");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualCity, setManualCity] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [locationError, setLocationError] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.0511, 9.7085]);

  function useGPS() {
    setLocationMode("locating");
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setMapCenter([coords.lat, coords.lng]);
        setLocationMode("located");
        fetchNearbyCompanies(coords.lat, coords.lng);
      },
      () => {
        setLocationError("Could not get your location. Try entering a city manually.");
        setLocationMode("prompt");
      },
      { timeout: 10000 }
    );
  }

  function useManualCity() {
    const key = manualCity.trim().toLowerCase();
    const coords = CITY_COORDS[key];
    if (!coords) {
      setLocationError("City not found. Try: Douala, Yaoundé, Buea, Limbe, Bafoussam");
      return;
    }
    setLocationError("");
    setUserLocation({ lat: coords[0], lng: coords[1] });
    setMapCenter(coords);
    setLocationMode("located");
    fetchNearbyCompanies(coords[0], coords[1]);
    
  }

  async function fetchNearbyCompanies(lat: number, lng: number) {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_companies", {
      student_field: profile?.field_of_study || null,
      student_lat: lat,
      student_lng: lng,
      radius_km: radiusKm,
    });
    if (!error && data) setCompanies(data);
    setLoading(false);
  }
  

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* Top bar — always visible */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-500 truncate">
            {locationMode === "located"
              ? `${profile?.field_of_study || "All fields"} · ${radiusKm === 999 ? "Unlimited" : radiusKm + "km radius"}`
              : "Find internships nearby..."}
          </span>
        </div>
      </div>

      {/* Location prompt — shown ABOVE map when no location yet */}
      {locationMode === "prompt" && (
        <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-5 space-y-3">
          <h2 className="text-base font-bold text-gray-900">
            Find internships near you
          </h2>
          <p className="text-sm text-gray-500">
            Use your location or enter a city to discover nearby opportunities.
          </p>

          <button
            onClick={useGPS}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Use My Location
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && useManualCity()}
              placeholder="Enter a city (e.g. Douala)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={useManualCity}
              className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Go
            </button>
          </div>

          {locationError && (
            <p className="text-xs text-red-500">{locationError}</p>
          )}
        </div>
      )}

      {/* Locating spinner */}
      {locationMode === "locating" && (
        <div className="shrink-0 bg-blue-50 border-b border-blue-100 px-4 py-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <p className="text-sm font-medium text-blue-700">Getting your location...</p>
        </div>
      )}

      {/* Map — takes remaining space */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <MapView
          companies={companies}
          selectedCompany={selectedCompany}
          onSelectCompany={setSelectedCompany}
          onViewDetails={onViewCompany}
          center={mapCenter}
          userLocation={userLocation}
          radiusKm={radiusKm}
        />
      </div>

      {/* Bottom drawer — always visible when located */}
      {locationMode === "located" && (
        <div className="shrink-0 bg-white border-t border-gray-200 shadow-lg"
          style={{ maxHeight: drawerOpen ? "45vh" : "64px", transition: "max-height 0.3s ease", overflow: "hidden" }}
        >
         {/* Drawer handle */}
<div
  onClick={() => setDrawerOpen(!drawerOpen)}
  className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
>
  <span className="text-sm font-semibold text-gray-900">
    {loading ? "Searching..." : `${companies.length} companies found`}
  </span>
  <div className="flex items-center gap-2">
    {subscriptionTier === "free" && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.location.href = "/pricing";
        }}
        className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors"
      >
        <Lock className="w-3 h-3" />
        5km limit · Upgrade →
      </button>
    )}
    <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${drawerOpen ? "rotate-180" : ""}`} />
  </div>
</div>
          {/* Scrollable company list */}
          <div className="overflow-y-auto px-4 pb-4 space-y-3"
            style={{ maxHeight: "calc(45vh - 64px)" }}
          >
            {loading && (
              <div className="py-6 text-center text-gray-400 text-sm">
                Looking for internships nearby...
              </div>
            )}

            {!loading && companies.length === 0 && (
              <div className="py-6 text-center text-gray-400 text-sm">
                <MapPin className="w-7 h-7 mx-auto mb-2" />
                <p>No companies found in this area.</p>
                {subscriptionTier === "free" && (
                  <button
                    onClick={() => window.location.href = "/pricing"}
                    className="text-xs mt-2 text-amber-600 underline"
                  >
                    Upgrade to Pro to search up to 25km →
                  </button>
                )}
              </div>
            )}

            {!loading && companies.map((company) => (
              <div
                key={company.id}
                onClick={() => onViewCompany(company.slug)}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 cursor-pointer transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    company.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{company.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {company.city}
                    {company.distance_km !== null && (
                      <span className="text-blue-500 font-medium ml-1">· {company.distance_km}km</span>
                    )}
                  </p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {company.internship_types?.slice(0, 1).map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => onToggleSave(e, company.id)}
                  className="shrink-0 p-1"
                >
                  <Bookmark className={`w-4 h-4 ${savedIds.includes(company.id) ? "fill-blue-500 text-blue-500" : "text-gray-300"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}