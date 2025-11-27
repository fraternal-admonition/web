"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useEffect, useState } from "react";
import EditorToolbar from "./EditorToolbar";
import ImageDialog from "./ImageDialog";
import LinkDialog from "./LinkDialog";
import VideoDialog from "./VideoDialog";
import ButtonDialog from "./ButtonDialog";
import ColumnDialog from "./ColumnDialog";
import EmojiPicker from "./EmojiPicker";
import { Callout } from "./extensions/Callout";
import { FontSize } from "./extensions/FontSize";
import { Iframe } from "./extensions/Iframe";
import { Figure } from "./extensions/Figure";
import { Button } from "./extensions/Button";
import { Columns, Column } from "./extensions/Columns";

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing your content...",
}: RichTextEditorProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [buttonDialogOpen, setButtonDialogOpen] = useState(false);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#004D40] underline hover:text-[#C19A43] transition-colors cursor-pointer",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg",
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: "bg-yellow-200 px-1",
        },
      }),
      Typography,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-[#E5E5E0] bg-[#F9F9F7] px-4 py-2 font-semibold text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-[#E5E5E0] px-4 py-2",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "bg-[#222] text-[#F9F9F7] rounded-lg p-4 font-mono text-sm overflow-x-auto my-4",
        },
      }),
      FontSize,
      Callout,
      Iframe.configure({
        allowFullscreen: true,
        HTMLAttributes: {
          class: "rounded-lg",
        },
      }),
      Figure,
      Button,
      Columns,
      Column,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-3",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageInsert = (
    url: string,
    alt: string,
    alignment: string,
    width: string
  ) => {
    if (!editor) return;

    const widthPercent = parseInt(width);
    const style = `width: ${widthPercent}%; max-width: 100%; height: auto;`;

    // Insert the image
    editor
      .chain()
      .focus()
      .setImage({
        src: url,
        alt: alt || undefined,
        title: alt || undefined,
      })
      .run();

    // Apply alignment using a wrapper div approach
    const currentHtml = editor.getHTML();
    const lastImageMatch = currentHtml.lastIndexOf('<img');
    
    if (lastImageMatch !== -1) {
      const beforeImage = currentHtml.substring(0, lastImageMatch);
      const afterImageStart = currentHtml.substring(lastImageMatch);
      const imgCloseIndex = afterImageStart.indexOf('>');
      const imgTag = afterImageStart.substring(0, imgCloseIndex + 1);
      const afterImage = afterImageStart.substring(imgCloseIndex + 1);

      // Add style and alignment classes to the image tag
      const styledImgTag = imgTag.replace(
        '<img',
        `<img style="${style}" class="rounded-lg mx-${alignment === 'left' ? '0 mr-auto' : alignment === 'right' ? 'auto ml-auto' : 'auto'}"`
      );

      const newHtml = beforeImage + styledImgTag + afterImage;
      editor.commands.setContent(newHtml);
    }
  };

  const handleLinkInsert = (url: string, text: string, openInNewTab: boolean) => {
    if (!editor) return;

    const attributes: {
      href: string;
      target?: string;
      rel?: string;
      class?: string;
    } = {
      href: url,
      class: "text-[#004D40] underline hover:text-[#C19A43] transition-colors cursor-pointer",
      rel: "noopener noreferrer",
    };

    if (openInNewTab) {
      attributes.target = "_blank";
    }

    if (text) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          marks: [
            {
              type: "link",
              attrs: attributes,
            },
          ],
          text,
        })
        .run();
    } else {
      editor.chain().focus().setLink(attributes).run();
    }
  };

  const handleVideoInsert = (url: string, width: string) => {
    if (!editor) return;

    // Extract video ID
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);

    let embedUrl = "";

    if (youtubeMatch) {
      embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    } else if (vimeoMatch) {
      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    if (embedUrl) {
      editor.chain().focus().setIframe({ src: embedUrl, width }).run();
    }
  };

  const handleButtonInsert = (attrs: {
    text: string;
    href: string;
    variant: string;
    size: string;
    newTab: boolean;
  }) => {
    if (!editor) return;
    editor.chain().focus().setButton(attrs).run();
  };

  const handleColumnInsert = (columnCount: number) => {
    if (!editor) return;
    editor.chain().focus().setColumns(columnCount).run();
  };

  const handleEmojiInsert = (emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
  };

  if (!editor) {
    return (
      <div className="border border-[#E5E5E0] rounded-lg bg-white p-4 min-h-[400px] flex items-center justify-center">
        <span className="text-[#666]">Loading editor...</span>
      </div>
    );
  }

  return (
    <>
      <div className="border border-[#E5E5E0] rounded-lg bg-white overflow-hidden">
        {/* Toolbar */}
        <EditorToolbar
          editor={editor}
          onLinkClick={() => setLinkDialogOpen(true)}
          onImageClick={() => setImageDialogOpen(true)}
          onVideoClick={() => setVideoDialogOpen(true)}
          onButtonClick={() => setButtonDialogOpen(true)}
          onColumnClick={() => setColumnDialogOpen(true)}
          onEmojiClick={() => setEmojiPickerOpen(true)}
        />

        {/* Editor Content */}
        <div className="bg-white">
          <EditorContent editor={editor} />
        </div>

        {/* Character Count & Tips */}
        <div className="border-t border-[#E5E5E0] bg-[#F9F9F7] px-4 py-2 text-xs text-[#666] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="font-medium">
            {editor.storage.characterCount.characters()} characters •{" "}
            {editor.storage.characterCount.words()} words
          </span>
          <span className="text-[#999]">
            💡 Tip: Use Ctrl+B for bold, Ctrl+I for italic
          </span>
        </div>
      </div>

      {/* Dialogs */}
      <ImageDialog
        isOpen={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        onInsert={handleImageInsert}
      />
      <LinkDialog
        isOpen={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onInsert={handleLinkInsert}
        currentUrl={editor.isActive("link") ? editor.getAttributes("link").href : ""}
        currentText=""
      />
      <VideoDialog
        isOpen={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        onInsert={handleVideoInsert}
      />
      <ButtonDialog
        isOpen={buttonDialogOpen}
        onClose={() => setButtonDialogOpen(false)}
        onInsert={handleButtonInsert}
      />
      <ColumnDialog
        isOpen={columnDialogOpen}
        onClose={() => setColumnDialogOpen(false)}
        onInsert={handleColumnInsert}
      />
      <EmojiPicker
        isOpen={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        onInsert={handleEmojiInsert}
      />
    </>
  );
}
