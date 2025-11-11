'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { FontSize } from '@/lib/tiptap-extensions/font-size';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  RemoveFormatting,
  Palette,
} from 'lucide-react';
import { uploadBlogImage } from '@/lib/supabase/blog';
import { useToast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
];

const FONT_SIZES = [
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' },
  { value: '36px', label: '36' },
  { value: '48px', label: '48' },
];

const TEXT_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#64748b',
];

const HIGHLIGHT_COLORS = [
  '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#fed7aa', '#fdba74',
  '#fca5a5', '#fecaca', '#f9a8d4', '#f0abfc', '#ddd6fe', '#c7d2fe',
  '#bfdbfe', '#bae6fd', '#a5f3fc', '#99f6e4', '#a7f3d0', '#bbf7d0',
  '#d9f99d', '#e9e9e9',
];

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const { toast } = useToast();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'mb-4',
          },
        },
        hardBreak: {
          HTMLAttributes: {
            class: 'block',
          },
        },
      }),
      TextStyle,
      FontSize.configure({
        types: ['textStyle'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Subscript,
      Superscript,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your content here...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-slate prose-lg max-w-none focus:outline-none min-h-[400px] px-6 py-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'Error',
            description: 'Image size must be less than 5MB',
            variant: 'destructive',
          });
          return;
        }

        try {
          toast({
            title: 'Uploading image...',
          });
          const url = await uploadBlogImage(file);
          editor.chain().focus().setImage({ src: url }).run();
          toast({
            title: 'Image uploaded successfully',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to upload image',
            variant: 'destructive',
          });
        }
      }
    };
    input.click();
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const setFontSize = (size: string) => {
    editor.chain().focus().setFontSize(size).run();
  };

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    children,
    tooltip,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    tooltip: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={isActive ? 'bg-slate-200' : ''}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="border-b bg-slate-50 p-2 flex flex-wrap gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          tooltip="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          tooltip="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-slate-300 mx-1" />

        <Select
          value={editor.getAttributes('textStyle').fontFamily || 'Inter'}
          onValueChange={(value) =>
            editor.chain().focus().setFontFamily(value).run()
          }
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={editor.getAttributes('textStyle').fontSize || '16px'}
          onValueChange={setFontSize}
        >
          <SelectTrigger className="w-[80px] h-9">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-px h-8 bg-slate-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          tooltip="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          tooltip="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          tooltip="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          tooltip="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <p className="text-sm font-medium">Text Color</p>
              <div className="grid grid-cols-10 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <p className="text-sm font-medium">Highlight Color</p>
              <div className="grid grid-cols-10 gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      editor.chain().focus().toggleHighlight({ color }).run()
                    }
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                Remove Highlight
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-8 bg-slate-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          tooltip="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          tooltip="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          tooltip="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-slate-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          tooltip="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          tooltip="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          tooltip="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          tooltip="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-slate-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          tooltip="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          tooltip="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          tooltip="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-slate-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          isActive={editor.isActive('subscript')}
          tooltip="Subscript"
        >
          <SubscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={editor.isActive('superscript')}
          tooltip="Superscript"
        >
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-slate-300 mx-1" />

        <ToolbarButton onClick={addLink} tooltip="Insert Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} tooltip="Insert Image">
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-slate-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          tooltip="Clear Formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
