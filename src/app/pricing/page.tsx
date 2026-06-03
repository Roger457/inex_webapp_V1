"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, ArrowLeft, Zap, Star, Compass } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: 0,
    currency: "XAF",
    radius: "5km",
    tier: "free",
    icon: Compass,
    color: "gray",
    features: [
      "5km search radius",
      "Browse company profiles",
      "Save up to 5 companies",
      "Basic recommendations",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    name: "Pro",
    price: 2000,
    currency: "XAF",
    radius: "25km",
    tier: "pro",
    icon: Zap,
    color: "blue",
    features: [
      "25km search radius",
      "Unlimited saved companies",
      "Priority recommendations",
      "Field-based filtering",
      "Email notifications",
    ],
    cta: "Upgrade to Pro",
    disabled: false,
  },
  {
    name: "Premium",
    price: 5000,
    currency: "XAF",
    radius: "Unlimited",
    tier: "premium",
    icon: Star,
    color: "purple",
    features: [
      "Unlimited search radius",
      "Unlimited saved companies",
      "AI-powered recommendations",
      "Priority company matching",
      "Early access to new features",
    ],
    cta: "Upgrade to Premium",
    disabled: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentTier, setCurrentTier] = useState("free");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);

      const { data } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("student_id", session.user.id)
        .single();

      if (data) setCurrentTier(data.tier);
      setLoading(false);
    }
    init();
  }, []);
  const searchParams = new URLSearchParams(
  typeof window !== "undefined" ? window.location.search : ""
);
const success = searchParams.get("success");
const error = searchParams.get("error");

  async function handleUpgrade(tier: string, amount: number) {
    if (!user) return;
    setCheckoutLoading(tier);

    try {
      const response = await fetch("/api/notchpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          amount,
          email: user.email,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert("Failed to initiate payment. Please try again.");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    }

    setCheckoutLoading(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-blue-600">INEX</h1>
        <span className="text-gray-400 text-sm">/ Pricing</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            Find more, explore further
          </h2>
          <p className="text-gray-500 mt-2">
            Upgrade your plan to discover internships across a wider area.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentTier === plan.tier;
            const isPro = plan.tier === "pro";
            const isPremium = plan.tier === "premium";

            return (
              <div
                key={plan.tier}
                className={`bg-white rounded-2xl border-2 p-6 flex flex-col transition-all ${
                  isPremium
                    ? "border-purple-500 shadow-lg shadow-purple-100"
                    : isPro
                    ? "border-blue-500 shadow-lg shadow-blue-100"
                    : "border-gray-200"
                }`}
              >
                {/* Badge */}
                {isPremium && (
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon + name */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  isPremium ? "bg-purple-100" : isPro ? "bg-blue-100" : "bg-gray-100"
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isPremium ? "text-purple-600" : isPro ? "text-blue-600" : "text-gray-500"
                  }`} />
                </div>

                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className={`text-sm font-medium mt-1 ${
                  isPremium ? "text-purple-600" : isPro ? "text-blue-600" : "text-gray-400"
                }`}>
                  {plan.radius} search radius
                </p>

                {/* Price */}
                <div className="mt-4 mb-6">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-gray-900">Free</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-gray-900">
                        {plan.price.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">XAF/month</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isPremium ? "text-purple-500" : isPro ? "text-blue-500" : "text-gray-400"
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => !plan.disabled && !isCurrent && handleUpgrade(plan.tier, plan.price)}
                  disabled={plan.disabled || isCurrent || checkoutLoading === plan.tier}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isCurrent
                      ? "bg-gray-100 text-gray-400 cursor-default"
                      : isPremium
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : isPro
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-default"
                  } disabled:opacity-50`}
                >
                  {checkoutLoading === plan.tier
                    ? "Redirecting..."
                    : isCurrent
                    ? "Current Plan"
                    : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Payments are processed securely via Notchpay. Supports MTN MoMo and Orange Money.
        </p>
      </div>
    </div>
    
  );
}