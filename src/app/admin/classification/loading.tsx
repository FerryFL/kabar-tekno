import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-96 w-full" />
    </main>
  );
}
