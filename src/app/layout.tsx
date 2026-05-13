import type { Metadata } from "next";
import { Syne, DM_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

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
      className={`${syne.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-display antialiased">
        {children}
        <BottomNav />
        {children}
      </body>
    </html>
  );
}