"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookmarkIcon,
  GaugeIcon,
  NewspaperIcon,
  RadioIcon,
} from "lucide-react";
import { GoogleAuthButton } from "@/components/app/google-auth-button";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const primaryItems = [
  { href: "/", label: "Beranda", icon: NewspaperIcon },
  { href: "/saved", label: "Disimpan", icon: BookmarkIcon },
  { href: "/goals", label: "Target", icon: GaugeIcon },
];

const adminItems = [{ href: "/admin/feeds", label: "Kelola Sumber", icon: RadioIcon }];

export function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="KabarTekno"
              render={<Link href="/" />}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <NewspaperIcon />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-heading text-sm font-semibold">
                  KabarTekno
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Baca Kabar Teknologi, AI
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Baca Berita</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin ? (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={pathname === item.href}
                        tooltip={item.label}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <GoogleAuthButton />
      </SidebarFooter>
    </Sidebar>
  );
}
