"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin, Bookmark, ExternalLink, ArrowLeft,
  Briefcase, GraduationCap, Star
} from "lucide-react";

type Company = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sector: string;
  logo_url: string | null;
  address: string;
  city: string;
  website_url: string;
  application_url: string;
  internship_types: string[];
  fields_offered: string[];
  what_you_gain: string[];
};

export default function CompanyDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);

      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!companyData) { router.push("/explore"); return; }
      setCompany(companyData);

      const { data: savedData } = await supabase
        .from("saved_companies")
        .select("id")
        .eq("student_id", session.user.id)
        .eq("company_id", companyData.id)
        .single();

      setSaved(!!savedData);
      setLoading(false);

      // Log view interaction
      await supabase.from("interactions").insert({
        student_id: session.user.id,
        company_id: companyData.id,
        action: "viewed",
      });
    }
    init();
  }, [slug]);

  async function toggleSave() {
    if (!user || !company) return;
    if (saved) {
      await supabase
        .from("saved_companies")
        .delete()
        .eq("student_id", user.id)
        .eq("company_id", company.id);
      setSaved(false);
    } else {
      await supabase
        .from("saved_companies")
        .insert({ student_id: user.id, company_id: company.id });
      await supabase.from("interactions").insert({
        student_id: user.id,
        company_id: company.id,
        action: "saved",
      });
      setSaved(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading company...
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-blue-600">INEX</h1>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={toggleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              saved
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-gray-200 text-gray-600 hover:border-blue-300"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-blue-600" : ""}`} />
            {saved ? "Saved" : "Save"}
          </button>
          <a
            href={company.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Apply Now
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Company header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-start gap-5">
          <div className="w-20 h-20 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-3xl shrink-0">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              company.name.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                {company.city}{company.address ? ` · ${company.address}` : ""}
              </span>
              {company.sector && (
                <span className="px-3 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                  {company.sector}
                </span>
              )}
              {company.website_url && (
                <a
                  href={company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                >
                  Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {company.description || "No description provided."}
          </p>
        </div>

        {/* Internship Types */}
        {company.internship_types?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Internship Types Offered
            </h3>
            <div className="flex flex-wrap gap-2">
              {company.internship_types.map((type) => (
                <span
                  key={type}
                  className="px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Fields Offered */}
        {company.fields_offered?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              Fields of Study Accepted
            </h3>
            <div className="flex flex-wrap gap-2">
              {company.fields_offered.map((field) => (
                <span
                  key={field}
                  className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* What You'll Gain */}
        {company.what_you_gain?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-600" />
              What You'll Gain
            </h3>
            <ul className="space-y-2">
              {company.what_you_gain.map((gain) => (
                <li key={gain} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  {gain}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Apply CTA */}
        <div className="bg-blue-600 rounded-2xl p-6 text-center">
          <h3 className="text-white font-bold text-lg mb-1">Ready to apply?</h3>
          <p className="text-blue-100 text-sm mb-4">
            You'll be redirected to {company.name}'s official application page.
          </p>
          <a
            href={company.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-full text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Apply on {company.name}'s Website
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

      </div>
    </div>
  );
}