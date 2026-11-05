"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  FileSignature,
  Gem,
  HeartHandshake,
  Home,
  Map,
  MessagesSquare,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";
import { cn } from "@/components/ui";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** extra path prefixes that count as this item being active */
  match?: string[];
}

export const NAV: Record<Role, NavItem[]> = {
  hire: [
    { href: "/today", label: "Today", icon: Home },
    { href: "/roadmap", label: "Roadmap", icon: Map, match: ["/learn", "/quiz", "/checklist", "/pulse", "/labs", "/missions", "/review", "/certification"] },
    { href: "/contracts", label: "Contracts", icon: FileSignature },
    { href: "/people", label: "People", icon: Users, match: ["/practice"] },
    { href: "/me", label: "Me", icon: User },
  ],
  manager: [
    { href: "/team", label: "Team", icon: Users },
    { href: "/team#cohort", label: "Cohort", icon: Gem },
  ],
  buddy: [
    { href: "/buddy", label: "My hire", icon: HeartHandshake },
    { href: "/buddy#quests", label: "Quests", icon: ClipboardCheck },
    { href: "/buddy#debriefs", label: "Debriefs", icon: MessagesSquare },
  ],
};


function isActive(pathname: string, item: NavItem) {
  const base = item.href.split("#")[0];
  if (item.href.includes("#")) return false;
  const all = [base, ...(item.match ?? [])];
  return all.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function NavLinks({ role, variant }: { role: Role; variant: "sidebar" | "tabs" }) {
  const pathname = usePathname() ?? "";
  const items = NAV[role];
  if (variant === "tabs") {
    return (
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-accent" : "text-muted hover:text-text",
                )}
              >
                <Icon size={20} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-strong hover:text-text",
              )}
            >
              <Icon size={18} aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
