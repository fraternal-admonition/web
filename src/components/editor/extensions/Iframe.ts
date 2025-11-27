import { Node, mergeAttributes } from "@tiptap/core";

export interface IframeOptions {
  allowFullscreen: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    iframe: {
      setIframe: (options: { src: string; width?: string }) => ReturnType;
    };
  }
}

export const Iframe = Node.create<IframeOptions>({
  name: "iframe",

  group: "block",

  atom: true,

  addOptions() {
    return {
      allowFullscreen: true,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: "100",
      },
      frameborder: {
        default: 0,
      },
      allowfullscreen: {
        default: this.options.allowFullscreen,
        parseHTML: () => this.options.allowFullscreen,
        renderHTML: (attributes) => {
          if (!attributes.allowfullscreen) {
            return {};
          }

          return { allowfullscreen: "" };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-video-wrapper]",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const width = node.attrs.width || "100";
    const paddingBottom = (9 / 16) * parseFloat(width);

    return [
      "div",
      {
        "data-video-wrapper": "",
        class: "video-wrapper",
        style: `width: ${width}%; margin: 2rem auto; position: relative; padding-bottom: ${paddingBottom}%; height: 0; overflow: hidden; border-radius: 0.5rem;`,
      },
      [
        "iframe",
        mergeAttributes(this.options.HTMLAttributes, {
          ...HTMLAttributes,
          style:
            "position: absolute; top: 0; left: 0; width: 100%; height: 100%;",
          frameborder: "0",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "",
        }),
      ],
    ];
  },

  addCommands() {
    return {
      setIframe:
        (options: { src: string; width?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              width: options.width || "100",
            },
          });
        },
    };
  },
});
