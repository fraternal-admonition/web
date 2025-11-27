import { Node, mergeAttributes } from "@tiptap/core";

export interface CalloutOptions {
  types: string[];
  HTMLAttributes: Record<string, string>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type: string) => ReturnType;
      toggleCallout: (type: string) => ReturnType;
    };
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: "callout",

  group: "block",

  content: "block+",

  defining: true,

  addOptions() {
    return {
      types: ["info", "warning", "success", "error", "tip"],
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element) => element.getAttribute("data-type"),
        renderHTML: (attributes) => ({
          "data-type": attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout="true"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.type || "info";
    
    const icons = {
      info: "ℹ️",
      warning: "⚠️",
      success: "✅",
      error: "❌",
      tip: "💡",
    };

    const colors = {
      info: "bg-blue-50 border-blue-500 text-blue-900",
      warning: "bg-yellow-50 border-yellow-500 text-yellow-900",
      success: "bg-green-50 border-green-500 text-green-900",
      error: "bg-red-50 border-red-500 text-red-900",
      tip: "bg-purple-50 border-purple-500 text-purple-900",
    };

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-callout": "true",
        "data-type": type,
        class: `callout callout-${type} ${colors[type as keyof typeof colors] || colors.info} border-l-4 rounded-lg p-4 my-4`,
      }),
      [
        "div",
        { class: "callout-icon text-2xl mb-2" },
        icons[type as keyof typeof icons] || icons.info,
      ],
      ["div", { class: "callout-content" }, 0],
    ];
  },

  addCommands() {
    return {
      setCallout:
        (type: string) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { type });
        },
      toggleCallout:
        (type: string) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, { type });
        },
    };
  },
});
