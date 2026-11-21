import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-2 flex min-h-11 w-fit items-center gap-1 rounded-lg pr-3 pl-1 text-sm font-medium text-atlas-pine focus-visible:outline-2 focus-visible:outline-atlas-pine"
    >
      <ChevronLeft className="size-5" aria-hidden="true" />
      {label}
    </Link>
  );
}
