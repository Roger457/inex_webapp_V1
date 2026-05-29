export type MapCompany = {
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