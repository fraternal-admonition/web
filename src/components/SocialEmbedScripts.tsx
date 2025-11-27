"use client";

import { useEffect } from 'react';

export default function SocialEmbedScripts() {
  useEffect(() => {
    // Load Twitter widgets script
    if (!document.querySelector('script[src*="platform.twitter.com"]')) {
      const twitterScript = document.createElement('script');
      twitterScript.src = 'https://platform.twitter.com/widgets.js';
      twitterScript.async = true;
      twitterScript.charset = 'utf-8';
      document.head.appendChild(twitterScript);
    }

    // Load Instagram embed script
    if (!document.querySelector('script[src*="instagram.com/embed"]')) {
      const instagramScript = document.createElement('script');
      instagramScript.src = '//www.instagram.com/embed.js';
      instagramScript.async = true;
      document.head.appendChild(instagramScript);
    }

    // Load TikTok embed script
    if (!document.querySelector('script[src*="tiktok.com/embed"]')) {
      const tiktokScript = document.createElement('script');
      tiktokScript.src = 'https://www.tiktok.com/embed.js';
      tiktokScript.async = true;
      document.head.appendChild(tiktokScript);
    }

    // Function to reinitialize embeds when content changes
    const reinitializeEmbeds = () => {
      setTimeout(() => {
        // Reinitialize Twitter widgets
        if (window.twttr && window.twttr.widgets) {
          window.twttr.widgets.load();
        }

        // Reinitialize Instagram embeds
        if (window.instgrm && window.instgrm.Embeds) {
          window.instgrm.Embeds.process();
        }

        // Force layout recalculation for proper sizing
        const embeds = document.querySelectorAll('[data-social-embed]');
        embeds.forEach((embed) => {
          const element = embed as HTMLElement;
          element.style.height = 'auto';
          element.style.overflow = 'visible';
        });
      }, 500);
    };

    // Set up a mutation observer to watch for new embeds
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          const hasEmbeds = addedNodes.some((node: any) => 
            node && node.nodeType === 1 && (
              (node.querySelector && (
                node.querySelector('.twitter-tweet') ||
                node.querySelector('.instagram-media') ||
                node.querySelector('.tiktok-embed')
              )) ||
              (node.classList && (
                node.classList.contains('twitter-tweet') ||
                node.classList.contains('instagram-media') ||
                node.classList.contains('tiktok-embed')
              ))
            )
          );
          
          if (hasEmbeds) {
            setTimeout(reinitializeEmbeds, 100);
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

// Extend window object for TypeScript
declare global {
  interface Window {
    twttr: any;
    instgrm: any;
  }
}
