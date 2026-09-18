import { SidebarTrigger } from "@/components/ui/sidebar";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex min-h-20 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
      <div className="flex w-full items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <div className="min-w-0 flex-1 py-3">
          <p className="font-mono text-xs uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
          <h1 className="line-clamp-1 text-2xl font-semibold">{title}</h1>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {action}
      </div>
    </header>
  );
}
