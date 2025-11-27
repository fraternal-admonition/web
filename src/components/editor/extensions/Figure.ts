import { Node, mergeAttributes } from "@tiptap/core";

export interface FigureOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      setFigure: (options: {
        src: string;
        alt?: string;
        caption?: string;
        width?: string;
        alignment?: string;
      }) => ReturnType;
    };
  }
}

export const Figure = Node.create<FigureOptions>({
  name: "figure",

  group: "block",

  content: "inline*",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      caption: {
        default: null,
      },
      width: {
        default: "100",
      },
      alignment: {
        default: "center",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-type=\"image-figure\"]",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { src, alt, caption, width, alignment } = node.attrs;
    const alignClass =
      alignment === "left"
        ? "mr-auto"
        : alignment === "right"
        ? "ml-auto"
        : "mx-auto";

    return [
      "figure",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "image-figure",
        class: `image-figure ${alignClass}`,
        style: `width: ${width}%; max-width: 100%;`,
      }),
      [
        "img",
        {
          src,
          alt: alt || "",
          class: "rounded-lg w-full h-auto",
        },
      ],
      caption
        ? [
            "figcaption",
            {
              class: "text-center text-sm text-gray-600 mt-2 italic",
            },
            caption,
          ]
        : ["figcaption", { class: "hidden" }],
    ];
  },

  addCommands() {
    return {
      setFigure:
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
