import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, BookmarkIcon, ExternalLinkIcon } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toggleBookmark } from "@/features/news/actions";
import { getNewsById } from "@/features/news/queries";
import { formatShortDate } from "@/lib/dates";
import { MarkAsRead } from "../mark-as-read";

export default async function NewsDetailPage({ params }: PageProps<"/news/[id]">) {
  const { id } = await params;
  const item = await getNewsById(id);

  if (!item) {
    notFound();
  }

  return (
    <>
      <MarkAsRead newsId={item.id} />
      <PageHeader
        eyebrow={item.sourceName}
        title="Baca Berita"
        description={formatShortDate(item.publishedAt)}
        action={
          <Button
            nativeButton={false}
            variant="outline"
            render={<a href={item.link} target="_blank" rel="noreferrer" />}
          >
            Sumber
            <ExternalLinkIcon data-icon="inline-end" />
          </Button>
        }
      />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 md:p-6">
        <Button
          nativeButton={false}
          variant="ghost"
          className="w-fit"
          render={<Link href="/" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Kembali ke Beranda
        </Button>
        <article className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {item.sourceName}
            </Badge>
            {item.isBookmarked ? <Badge>Disimpan</Badge> : null}
          </div>
          <h1 className="font-heading text-4xl font-semibold leading-tight">
            {item.title}
          </h1>
          <Card>
            <CardContent className="prose prose-invert max-w-none pt-2 text-base leading-7 text-foreground">
              <p>
                {item.description ??
                  "Tidak ada rangkuman. Coba baca dari sumbernya langsung."}
              </p>
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-2">
            <form action={toggleBookmark.bind(null, item.id)}>
              <Button
                type="submit"
                variant={item.isBookmarked ? "default" : "outline"}
              >
                <BookmarkIcon data-icon="inline-start" />
                {item.isBookmarked ? "Disimpan" : "Simpan"}
              </Button>
            </form>
            <Button
              nativeButton={false}
              render={<a href={item.link} target="_blank" rel="noreferrer" />}
            >
              Sumber
              <ExternalLinkIcon data-icon="inline-end" />
            </Button>
          </div>
        </article>
      </main>
    </>
  );
}
