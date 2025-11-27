import { Node, mergeAttributes } from '@tiptap/core';

export interface SocialEmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    socialEmbed: {
      setSocialEmbed: (options: { url: string; platform: string }) => ReturnType;
    };
  }
}

export const SocialEmbed = Node.create<SocialEmbedOptions>({
  name: 'socialEmbed',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
      platform: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-social-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { url, platform } = HTMLAttributes;
    
    // Ensure we have valid url and platform
    if (!url || !platform) {
      return [
        'div',
        mergeAttributes(this.options.HTMLAttributes, {
          'data-social-embed': '',
          style: 'margin: 2rem 0; padding: 2rem; border: 1px solid #E5E5E0; border-radius: 8px; text-align: center; background: #F9F9F7;',
        }),
        [
          'p',
          {
            style: 'color: #666;',
          },
          'Invalid social media URL',
        ],
      ];
    }
    
    if (platform === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      if (videoId) {
        return [
          'div',
          mergeAttributes(this.options.HTMLAttributes, {
            'data-social-embed': '',
            'data-platform': platform,
            style: 'margin: 2rem 0; text-align: center;',
          }),
          [
            'iframe',
            {
              src: `https://www.youtube.com/embed/${videoId}`,
              width: '560',
              height: '315',
              frameborder: '0',
              allowfullscreen: '',
              style: 'max-width: 100%; border-radius: 8px;',
            },
          ],
        ];
      }
    }

    // Get platform display name safely
    const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Social Media';
    
    // Get platform icon safely
    const getIcon = (platformType: string) => {
      switch (platformType) {
        case 'twitter': return '🐦';
        case 'instagram': return '📷';
        case 'tiktok': return '🎵';
        default: return '🔗';
      }
    };

    // For other platforms, create a simple placeholder that will be replaced by scripts
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-social-embed': '',
        'data-platform': platform,
        'data-url': url,
        style: 'margin: 2rem 0; padding: 2rem; border: 1px solid #E5E5E0; border-radius: 8px; text-align: center; background: #F9F9F7; min-height: 200px; display: flex; flex-direction: column; justify-content: center; align-items: center;',
      }),
      [
        'div',
        {
          style: 'margin-bottom: 1rem; font-size: 2rem;',
        },
        getIcon(platform),
      ],
      [
        'p',
        {
          style: 'margin: 0.5rem 0; color: #666; font-weight: 600;',
        },
        `${platformName} Post`,
      ],
      [
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          style: 'color: #004D40; text-decoration: underline; font-size: 0.875rem;',
        },
        'View Original Post',
      ],
    ];
  },

  addCommands() {
    return {
      setSocialEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
