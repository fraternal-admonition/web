import { Node, mergeAttributes } from "@tiptap/core";

export const Columns = Node.create({
  name: "columns",

  group: "block",

  content: "column+",

  defining: true,

  addAttributes() {
    return {
      columnCount: {
        default: 2,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { columnCount } = node.attrs;

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "columns",
        class: `columns-layout grid grid-cols-1 md:grid-cols-${columnCount} gap-6 my-4`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setColumns:
        (columnCount = 2) =>
        ({ commands }: any) => {
          const columns = [];
          for (let i = 0; i < columnCount; i++) {
            columns.push({
              type: "column",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: `Column ${i + 1}` }],
                },
              ],
            });
          }

          return commands.insertContent({
            type: this.name,
            attrs: { columnCount },
            content: columns,
          });
        },
    };
  },
});

export const Column = Node.create({
  name: "column",

  content: "block+",

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "column",
        class: "column p-4 border border-gray-200 rounded-lg",
      }),
      0,
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      setColumns: (columnCount?: number) => ReturnType;
    };
  }
}
