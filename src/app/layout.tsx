import type { Metadata } from "next";

import "./globals.css";
import "leaflet/dist/leaflet.css";
import BottomNav from "@/components/BottomNav";


export const metadata: Metadata = {
  title: "InternMap — Find Internships Near You",
  description:
    "Discover internship opportunities at companies around you, filtered by your field of study and plotted on a live map.",
  keywords: ["internship", "Cameroon", "Buea", "Douala", "students", "jobs"],
  openGraph: {
    title: "InternMap",
    description: "Find internships near you, mapped by your field of study.",
    type: "website",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="font-sans"
    >
      <body className="font-display antialiased">
        {children}
        <BottomNav />
        {children}
      </body>
    </html>
  );
}