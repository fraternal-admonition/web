"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  const navItems = [
    { href: "/admin/cms/pages", label: "Pages" },
    { href: "/admin/posts", label: "Posts" },
    { href: "/admin/contests", label: "Contests" },
    { href: "/admin/peer-verification", label: "Peer Verification" },
    { href: "/admin/cms/settings", label: "Settings" },
  ];

  return (
    <nav className="hidden md:flex space-x-6 items-center h-16">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm font-medium transition-colors h-full flex items-center ${
            isActive(item.href)
              ? "text-[#004D40] border-b-2 border-[#004D40]"
              : "text-[#666] hover:text-[#004D40]"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
