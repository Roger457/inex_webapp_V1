"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, Save } from "lucide-react";

const FIELDS_OF_STUDY = [
  "Computer Science", "Software Engineering", "Electrical Engineering",
  "Civil Engineering", "Mechanical Engineering", "Business Administration",
  "Accounting & Finance", "Marketing", "Law", "Medicine & Health Sciences",
  "Agriculture", "Architecture", "Other",
];

const LEVELS = ["HND", "BSc", "MSc", "PhD", "Other"];

type Profile = {
  id: string;
  full_name: string;
  email: string;
  university: string;
  field_of_study: string;
  level: string;
  bio: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [level, setLevel] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setUniversity(data.university || "");
        setFieldOfStudy(data.field_of_study || "");
        setLevel(data.level || "");
        setBio(data.bio || "");
      }
      setLoading(false);
    }
    init();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, university, field_of_study: fieldOfStudy, level, bio })
      .eq("id", profile.id);

    if (error) {
      setMessage("Failed to save. Please try again.");
    } else {
      setMessage("Profile updated successfully.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-blue-600">INEX</h1>
        <span className="text-gray-400 text-sm">/ My Profile</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Avatar + name */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {fullName || "Your Name"}
            </h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h3 className="font-semibold text-gray-900">Personal Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
            <select
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select your field</option>
              {FIELDS_OF_STUDY.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Level of Study</label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    level === l
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell companies a little about yourself..."
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-500"}`}>
              {message}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <h3 className="font-semibold text-gray-900">Quick Links</h3>
          <button
            onClick={() => router.push("/explore")}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 text-sm text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-colors"
          >
            → Explore Companies
          </button>
          <button
            onClick={() => router.push("/saved")}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 text-sm text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-colors"
          >
            → Saved Companies
          </button>
        </div>
      </div>
    </div>
  );
}