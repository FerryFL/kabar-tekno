"use client";

import { useEffect, useMemo, useState } from "react";
import { LogOutIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import Image from "next/image";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.22Z" />
      <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.54 13.84A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.84V7.63H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.37l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.23 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.38l3.24 2.53C7.31 7.85 9.46 6.13 12 6.13Z" />
    </svg>
  );
}

export function GoogleAuthButton({
  className,
  next = "/",
}: {
  className?: string;
  next?: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const displayName =
    user?.user_metadata.full_name ?? user?.user_metadata.name ?? user?.email ?? "Google user";
  const avatarUrl = user?.user_metadata.avatar_url ?? user?.user_metadata.picture;
  const initials = displayName.slice(0, 1).toUpperCase();

  async function signInWithGoogle() {
    setError(null);
    setIsLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (signInError) throw signInError;
      if (data.url) window.location.assign(data.url);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to start Google sign-in.");
      setIsLoading(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setError(null);
    setIsLoading(true);
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setIsLoading(false);
      return;
    }

    setUser(null);
    setIsLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      {user ? (
        <>
          <Button type="button" variant="outline" size="sm" className="w-full justify-start px-4 py-6" disabled>
            {avatarUrl && !avatarError ? (
              <Image
                src={avatarUrl}
                alt=""
                width={20}
                height={20}
                className="rounded-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {initials}
              </span>
            )}
            <span className="min-w-0 ps-1 truncate">{displayName}</span>
          </Button>
          <Button type="button" variant="destructive" size="sm" className="w-full justify-start bg-destructive text-destructive-foreground hover:bg-destructive/90 p-4" onClick={signOut} disabled={isLoading}>
            <LogOutIcon />
            <span>{isLoading ? "Mengeluarkan..." : "Keluar"}</span>
          </Button>
        </>
      ) : (
        <Button type="button" variant="outline" size={className ? "lg" : "sm"} className={className ?? "w-full justify-start"} onClick={signInWithGoogle} disabled={isLoading}>
          <GoogleIcon />
          <span>{isLoading ? "Menghubungkan..." : "Koneksi Akun Google"}</span>
        </Button>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
