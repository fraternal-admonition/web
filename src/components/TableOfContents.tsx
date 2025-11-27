"use client";

import { useEffect, useState } from "react";

interface TOCItem {
  id: string;
  text: string;
  level: string;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export default function TableOfContents({ content, className = "" }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!content) return;

    // Parse HTML content to extract headings
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3, h4');
    
    const items: TOCItem[] = Array.from(headings).map((heading, index) => {
      const id = `heading-${index}`;
      const text = heading.textContent || '';
      const level = heading.tagName.toLowerCase();
      
      // Add ID to the heading in the actual DOM if it exists
      const actualHeading = document.querySelector(`${heading.tagName}:nth-of-type(${index + 1})`);
      if (actualHeading && !actualHeading.id) {
        actualHeading.id = id;
      }
      
      return { id, text, level };
    });
    
    setTocItems(items);
  }, [content]);

  useEffect(() => {
    // Set up intersection observer to track active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -35% 0%',
        threshold: 0
      }
    );

    // Observe all headings
    tocItems.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border border-[#E5E5E0] rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-[#222] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        Table of Contents
      </h3>
      
      <nav className="space-y-1">
        {tocItems.map(({ id, text, level }) => (
          <button
            key={id}
            onClick={() => scrollToHeading(id)}
            className={`
              block w-full text-left px-2 py-1 rounded text-sm transition-colors
              ${level === 'h2' ? 'font-medium' : level === 'h3' ? 'ml-4 font-normal' : 'ml-8 font-light'}
              ${activeId === id 
                ? 'bg-[#004D40] text-white' 
                : 'text-[#666] hover:text-[#004D40] hover:bg-[#F9F9F7]'
              }
            `}
          >
            {text}
          </button>
        ))}
      </nav>
      
      <div className="mt-4 pt-3 border-t border-[#E5E5E0]">
        <p className="text-xs text-[#999]">
          Click any heading to jump to that section
        </p>
      </div>
    </div>
  );
}
