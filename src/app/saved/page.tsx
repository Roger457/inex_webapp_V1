"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bookmark, MapPin, ArrowLeft, ExternalLink } from "lucide-react";

type Company = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sector: string;
  logo_url: string | null;
  city: string;
  internship_types: string[];
  application_url: string;
};

export default function SavedPage() {
  const router = useRouter();
  const supabase = createClient();

  const [saved, setSaved] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);

      const { data } = await supabase
        .from("saved_companies")
        .select("company_id, companies(*)")
        .eq("student_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setSaved(data.map((d: any) => d.companies).filter(Boolean));
      }
      setLoading(false);
    }
    init();
  }, []);

  async function unsave(companyId: string) {
    if (!user) return;
    await supabase
      .from("saved_companies")
      .delete()
      .eq("student_id", user.id)
      .eq("company_id", companyId);
    setSaved((prev) => prev.filter((c) => c.id !== companyId));
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-blue-600">INEX</h1>
        <span className="text-gray-400 text-sm">/ Saved Companies</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-6">
          <Bookmark className="w-5 h-5 text-blue-600 fill-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Saved Companies</h2>
          <span className="ml-auto text-sm text-gray-400">{saved.length} saved</span>
        </div>

        {loading && (
          <p className="text-center text-gray-400 text-sm py-20">Loading...</p>
        )}

        {!loading && saved.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Bookmark className="w-10 h-10 mx-auto mb-3" />
            <p className="font-medium">No saved companies yet</p>
            <p className="text-sm mt-1">Bookmark companies from the explore page</p>
            <button
              onClick={() => router.push("/explore")}
              className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors"
            >
              Explore Companies
            </button>
          </div>
        )}

        <div className="space-y-4">
          {saved.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-md transition-all"
            >
              {/* Logo */}
              <div
                onClick={() => router.push(`/companies/${company.slug}`)}
                className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl shrink-0 cursor-pointer"
              >
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  company.name.charAt(0)
                )}
              </div>

              {/* Info */}
              <div
                className="flex-1 cursor-pointer"
                onClick={() => router.push(`/companies/${company.slug}`)}
              >
                <h3 className="font-semibold text-gray-900">{company.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {company.city}
                  {company.sector && ` · ${company.sector}`}
                </p>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {company.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {company.internship_types?.slice(0, 2).map((type) => (
                    <span key={type} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={() => unsave(company.id)}
                  className="text-blue-500 hover:text-red-400 transition-colors"
                  title="Remove from saved"
                >
                  <Bookmark className="w-5 h-5 fill-blue-500" />
                </button>
                <a
                  href={company.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                >
                  Apply <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}