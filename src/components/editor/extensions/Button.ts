import { Node, mergeAttributes } from "@tiptap/core";

export const Button = Node.create({
  name: "button",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      text: {
        default: "Click Here",
      },
      href: {
        default: "#",
      },
      variant: {
        default: "primary", // primary, secondary, outline
      },
      size: {
        default: "medium", // small, medium, large
      },
      newTab: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-type="button"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { text, href, variant, size, newTab } = node.attrs;

    const baseClasses =
      "inline-block px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg text-center no-underline my-4";

    const variantClasses = {
      primary: "bg-[#004D40] text-white hover:bg-[#00695C]",
      secondary: "bg-[#C19A43] text-white hover:bg-[#D4A853]",
      outline:
        "border-2 border-[#004D40] text-[#004D40] hover:bg-[#004D40] hover:text-white",
    };

    const sizeClasses = {
      small: "px-4 py-2 text-sm",
      medium: "px-6 py-3 text-base",
      large: "px-8 py-4 text-lg",
    };

    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-type": "button",
        href,
        target: newTab ? "_blank" : undefined,
        rel: newTab ? "noopener noreferrer" : undefined,
        class: `${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClasses[size as keyof typeof sizeClasses]}`,
      }),
      text,
    ];
  },

  addCommands() {
    return {
      setButton:
        (attrs) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    button: {
      setButton: (attrs: {
        text: string;
        href: string;
        variant?: string;
        size?: string;
        newTab?: boolean;
      }) => ReturnType;
    };
  }
}
