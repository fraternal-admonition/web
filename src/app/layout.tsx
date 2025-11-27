import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Playfair_Display,
  Source_Serif_4,
  Merriweather_Sans,
} from "next/font/google";
import "./globals.css";
import "./editor.css";
import { AuthProvider } from "@/contexts/AuthContext";
import LayoutWrapper from "@/components/LayoutWrapper";
import { settingsCache } from "@/lib/cms/settings-cache";
import { createClient } from "@/lib/supabase/server";
import ConditionalAdminBanner from "@/components/admin/ConditionalAdminBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const merriweather = Merriweather_Sans({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Dynamic metadata that fetches site name from settings
export async function generateMetadata(): Promise<Metadata> {
  // In development, always invalidate cache to see changes immediately
  if (process.env.NODE_ENV === 'development') {
    settingsCache.invalidate();
  }

  try {
    const settings = await settingsCache.get();

    return {
      title: {
        default: settings.site_name,
        template: `%s | ${settings.site_name}`,
      },
      description:
        "Fraternal Admonition is the biblical principle of love expressed through admonition—an act of warning before public judgment.",
      openGraph: {
        siteName: settings.site_name,
        type: "website",
      },
    };
  } catch (error) {
    console.error("Failed to load settings for metadata:", error);
    // Fallback to default
    return {
      title: {
        default: "Fraternal Admonition",
        template: "%s | Fraternal Admonition",
      },
      description:
        "Fraternal Admonition is the biblical principle of love expressed through admonition—an act of warning before public judgment.",
      openGraph: {
        siteName: "Fraternal Admonition",
        type: "website",
      },
    };
  }
}

export const viewport = {
  themeColor: "#F9F9F7",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user and check if admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'ADMIN';
  }
  
  // Fetch settings for banner
  const settings = await settingsCache.get();
  
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${sourceSerif.variable} ${merriweather.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        {isAdmin && (
          <ConditionalAdminBanner
            initialMaintenanceMode={settings.maintenance_mode}
            initialSiteLockMode={settings.site_lock_mode}
          />
        )}
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
