"use client";

import { usePathname, useRouter } from "next/navigation";
import { Compass, Bookmark, User } from "lucide-react";

const tabs = [
  { label: "Explore", icon: Compass, href: "/explore" },
  { label: "Saved", icon: Bookmark, href: "/saved" },
  { label: "Profile", icon: User, href: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-50">
      {tabs.map(({ label, icon: Icon, href }) => {
        const active = pathname.startsWith(href);
        return (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
              active ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? "fill-blue-100" : ""}`} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}