import { Node, mergeAttributes } from "@tiptap/core";

export const Details = Node.create({
  name: "details",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      summary: {
        default: "Click to expand",
      },
      open: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "details",
        getAttrs: (element) => {
          const summary = element.querySelector('summary')?.textContent || 'Click to expand';
          const open = element.hasAttribute('open');
          return { summary, open };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "details",
      mergeAttributes(HTMLAttributes, {
        open: node.attrs.open || undefined,
        class: "simple-collapsible",
      }),
      [
        "summary",
        {
          class: "simple-summary",
        },
        node.attrs.summary,
      ],
      ["div", { class: "simple-content" }, 0],
    ];
  },

  addCommands() {
    return {
      setDetails:
        (attrs) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Add your content here..." }],
              },
            ],
          });
        },
      toggleDetails:
        (attrs) =>
        ({ commands }: any) => {
          return commands.toggleWrap(this.name, attrs);
        },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    details: {
      setDetails: (attrs?: { summary?: string; open?: boolean }) => ReturnType;
      toggleDetails: (attrs?: { summary?: string; open?: boolean }) => ReturnType;
    };
  }
}
