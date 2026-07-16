"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "../lib/cn";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export interface BottomNavProps {
  items: BottomNavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-lg items-center justify-between px-2 py-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium transition-colors duration-150",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("flex size-6 items-center justify-center", isActive && "text-primary")}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
