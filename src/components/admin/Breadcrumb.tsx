"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link
        href="/admin"
        className="text-[#666] hover:text-[#004D40] transition-colors"
      >
        Admin
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <span className="text-[#999]">/</span>
          {item.href ? (
            <Link
              href={item.href}
              className="text-[#666] hover:text-[#004D40] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#222] font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
