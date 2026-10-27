import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { NavigationTiming } from "@/components/app/navigation-timing";
import { isAdminEmail } from "@/lib/admin";
import { getSupabaseUser } from "@/lib/supabase/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "KabarTekno",
  description: "RSS Reader untuk berita teknologi dan AI.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSupabaseUser();

  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full">
        <TooltipProvider>
          <Toaster>
            <SidebarProvider>
              <Suspense fallback={null}>
                <NavigationTiming />
              </Suspense>
              <AppSidebar isAdmin={user ? isAdminEmail(user.email) : false} />
              <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
          </Toaster>
        </TooltipProvider>
      </body>
    </html>
  );
}
