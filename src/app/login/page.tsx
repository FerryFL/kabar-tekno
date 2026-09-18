import { NewspaperIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleAuthButton } from "@/components/app/google-auth-button";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-sm border-border/80 bg-card shadow-2xl shadow-black/20">
        <CardHeader className="items-center gap-4 pb-2 text-center">
          <div className="w-full flex justify-center items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <NewspaperIcon className="size-6" />
            </div>
            <p className="font-semibold text-lg">KabarTekno</p>
          </div>
          <div className="space-y-1">
            <CardTitle className="font-heading text-2xl">Selamat Datang</CardTitle>
            <CardDescription>Masuk untuk membaca kabar harian teknologi dan AI.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <GoogleAuthButton next={next} className="w-full" />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Gunakan akun Google untuk masuk
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
