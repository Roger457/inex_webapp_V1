"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const companyIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    background:#2563eb;color:white;
    padding:4px 10px;border-radius:999px;
    font-size:11px;font-weight:600;
    white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);
    cursor:pointer;
  ">📍</div>`,
  iconAnchor: [20, 12],
});

const userIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;
    background:#2563eb;border:3px solid white;
    border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconAnchor: [8, 8],
});

type MapCompany = {
  id: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  sector: string;
  longitude: number;
  latitude: number;
};

type Props = {
  companies: MapCompany[];
  selectedCompany: MapCompany | null;
  onSelectCompany: (company: MapCompany) => void;
  onViewDetails: (slug: string) => void;
  center?: [number, number];
  userLocation?: { lat: number; lng: number } | null;
  radiusKm?: number;
};

function MapUpdater({ center, companies }: { center?: [number, number]; companies: MapCompany[] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 12);
    } else if (companies.length > 0) {
      const bounds = L.latLngBounds(companies.map((c) => [c.latitude, c.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [center, companies]);
  return null;
}

export default function MapView({
  companies, selectedCompany, onSelectCompany,
  onViewDetails, center, userLocation, radiusKm = 5,
}: Props) {
  return (
    <MapContainer
      center={center || [4.0511, 9.7085]}
      zoom={12}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapUpdater center={center} companies={companies} />

      {/* User location dot */}
      {userLocation && (
        <>
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          />
          {/* Radius circle */}
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#2563eb",
              fillOpacity: 0.06,
              weight: 1.5,
              dashArray: "6 4",
            }}
          />
        </>
      )}

      {/* Company markers */}
      {companies.map((company) => (
        <Marker
          key={company.id}
          position={[company.latitude, company.longitude]}
          icon={companyIcon}
          eventHandlers={{ click: () => onSelectCompany(company) }}
        >
          <Popup>
            <div style={{ minWidth: "160px" }}>
              <p style={{ fontWeight: 600, fontSize: "13px", marginBottom: "4px" }}>
                {company.name}
              </p>
              <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px" }}>
                {company.city} · {company.sector}
              </p>
              <button
                onClick={() => onViewDetails(company.slug)}
                style={{
                  width: "100%", padding: "6px",
                  background: "#2563eb", color: "white",
                  border: "none", borderRadius: "6px",
                  fontSize: "11px", fontWeight: 600, cursor: "pointer",
                }}
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}