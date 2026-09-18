import { RefreshCcwIcon, RssIcon } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createFeedSource, refreshFeedsAction } from "@/features/feeds/actions";
import { getFeedSources } from "@/features/feeds/queries";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { FeedSourceRow } from "@/app/admin/feeds/feed-source-row";

export default async function FeedAdminPage() {
  if (!(await isAdmin())) {
    redirect("/");
  }

  const sources = await getFeedSources();

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Kelola Sumber"
        description="Kelola sumber bacaan untuk dikonsumsi publik"
      />
      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-12 md:p-6">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RssIcon />
              Tambah Sumber
            </CardTitle>
            <CardDescription>Gunakan sumber yang menyediakan public xml</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createFeedSource} className="flex flex-col gap-3">
              <Input name="name" placeholder="Nama Sumber" required />
              <Input
                name="url"
                type="url"
                placeholder="https://example.com/rss"
                required
              />
              <Button type="submit">Add source</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="col-span-8">
          <CardHeader>
            <CardTitle>Sumber</CardTitle>
            <CardDescription>
              Sumber bisa diubah, atau dihapus. Refresh untuk update berita terbaru
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form action={refreshFeedsAction}>
              <Button type="submit" variant="secondary">
                <RefreshCcwIcon data-icon="inline-start" />
                Refresh
              </Button>
            </form>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">Berita</TableHead>
                  <TableHead>Diubah pada</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => <FeedSourceRow key={source.id} source={source} />)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
