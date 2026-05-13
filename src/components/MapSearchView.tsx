"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, MapPin, Navigation, Search, X, ChevronUp, Bookmark, Lock } from "lucide-react";
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

export default function MapSearchView({
  profile, savedIds, radiusKm, subscriptionTier,
  onBack, onViewCompany, onToggleSave,
}: Props) {
  const supabase = createClient();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationMode, setLocationMode] = useState<"prompt" | "locating" | "located" | "manual">("prompt");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualCity, setManualCity] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [locationError, setLocationError] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.0511, 9.7085]);

  // City coordinates for manual search
  const CITY_COORDS: Record<string, [number, number]> = {
    "douala": [4.0511, 9.7085],
    "yaoundé": [3.8480, 11.5021],
    "yaounde": [3.8480, 11.5021],
    "buea": [4.1527, 9.2412],
    "limbe": [4.0167, 9.2000],
    "bafoussam": [5.4764, 10.4176],
  };

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
      (err) => {
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
      setLocationError(`City not found. Try: Douala, Yaoundé, Buea, Limbe, Bafoussam`);
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
    setDrawerOpen(true);

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
    <div className="h-screen flex flex-col relative bg-gray-900">

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 bg-white rounded-full shadow-md px-4 py-2.5 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-500 truncate">
            {locationMode === "located" && userLocation
              ? `${profile?.field_of_study || "All fields"} · ${radiusKm === 999 ? "Unlimited" : radiusKm + "km radius"}`
              : "Find internships nearby..."
            }
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
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

      {/* Location prompt overlay */}
      {locationMode === "prompt" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Find internships near you
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Use your location or enter a city to discover nearby opportunities.
            </p>

            <button
              onClick={useGPS}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors mb-3"
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
              <p className="text-xs text-red-500 mt-2">{locationError}</p>
            )}

            <button
              onClick={onBack}
              className="w-full mt-3 text-center text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Locating spinner */}
      {locationMode === "locating" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 text-center shadow-xl">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">Getting your location...</p>
          </div>
        </div>
      )}

      {/* Bottom drawer — results */}
      {locationMode === "located" && (
        <div className={`absolute left-0 right-0 bottom-0 z-20 bg-white rounded-t-2xl shadow-xl transition-all duration-300 ${
          drawerOpen ? "max-h-[55vh]" : "max-h-[80px]"
        }`}>

          {/* Drawer handle */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="w-full flex flex-col items-center pt-3 pb-2"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mb-2" />
            <div className="flex items-center gap-2 px-5 w-full justify-between">
              <span className="text-sm font-semibold text-gray-900">
                {loading ? "Searching..." : `${companies.length} companies found`}
              </span>
              <div className="flex items-center gap-2">
                {subscriptionTier === "free" && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    5km limit · Upgrade to expand
                  </span>
                )}
                <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${drawerOpen ? "rotate-180" : ""}`} />
              </div>
            </div>
          </button>

          {/* Company list */}
          <div className="overflow-y-auto px-4 pb-6 space-y-3" style={{ maxHeight: "calc(55vh - 60px)" }}>
            {loading && (
              <div className="py-8 text-center text-gray-400 text-sm">
                Looking for internships nearby...
              </div>
            )}

            {!loading && companies.length === 0 && (
              <div className="py-8 text-center text-gray-400 text-sm">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p>No companies found in this area.</p>
                {subscriptionTier === "free" && (
                  <p className="text-xs mt-1 text-amber-600">
                    Upgrade to Pro to search up to 25km away.
                  </p>
                )}
              </div>
            )}

            {!loading && companies.map((company) => (
              <div
                key={company.id}
                onClick={() => onViewCompany(company.slug)}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
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
                      <span className="text-blue-500 font-medium ml-1">
                        · {company.distance_km}km
                      </span>
                    )}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {company.internship_types?.slice(0, 1).map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => onToggleSave(e, company.id)}
                  className="shrink-0"
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