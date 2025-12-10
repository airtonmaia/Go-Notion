import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2, 
  Heading3,
  Undo,
  Redo,
  Minus,
  CheckSquare,
  Plus,
  Link as LinkIcon,
  Image,
  File,
  Mic,
  PenTool,
  Code2
} from 'lucide-react';
import { cn } from './ui/utils';
import { Button } from './ui/Button';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  setEditorInstance?: (editor: any) => void;
  editable?: boolean;
}

const ToolbarButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false, 
  children,
  title
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  disabled?: boolean; 
  children?: React.ReactNode;
  title?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground",
      isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    {children}
  </button>
);

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, setEditorInstance, editable = true }) => {
  const [showInsertMenu, setShowInsertMenu] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Comece a escrever...',
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
        autolink: true,
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-250px)]',
      },
    },
  });

  // Sync content if it changes externally (e.g., from AI or switching notes)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Only set content if it's significantly different to avoid cursor jumping
      // Simple check: if editor is empty and content is not, or drastic change
      if (editor.getText() === '' && content) {
          editor.commands.setContent(content);
      } else if (Math.abs(editor.getHTML().length - content.length) > 10) {
           // We might want to be careful here about overwriting user input
           // But for switching notes, this is necessary
           editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  // Expose editor instance to parent for AI commands
  useEffect(() => {
    if (setEditorInstance && editor) {
      setEditorInstance(editor);
    }
  }, [editor, setEditorInstance]);

  // Update editable state
  useEffect(() => {
      if (editor) {
          editor.setEditable(editable);
      }
  }, [editable, editor]);

  if (!editor) {
    return null;
  }

  const insertTask = () => {
    editor
      .chain()
      .focus()
      .insertContent('<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Nova tarefa</p></li></ul>')
      .run();
  };

  const insertDivider = () => editor.chain().focus().setHorizontalRule().run();
  const insertQuote = () => editor.chain().focus().toggleBlockquote().run();
  const insertHeading = (level: 1 | 2 | 3) => editor.chain().focus().setHeading({ level }).run();
  const insertParagraph = () => editor.chain().focus().setParagraph().run();
  const insertBullet = () => editor.chain().focus().toggleBulletList().run();
  const insertOrdered = () => editor.chain().focus().toggleOrderedList().run();
  const insertTaskList = () => editor.chain().focus().toggleTaskList().run();
  const insertCheckbox = () => {
    editor
      .chain()
      .focus()
      .insertContent('<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Caixa de seleção</p></li></ul>')
      .run();
  };

  const insertLink = (text?: string, href?: string) => {
    const url = href || window.prompt('Insira a URL do link');
    if (!url) return;
    const display = text || window.prompt('Texto do link') || url;
    editor.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${display}</a>`).run();
  };

  const toggleLinkOnSelection = () => {
    const selection = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    ).trim();
    const previousUrl = editor.getAttributes('link').href;
    const assumedUrl = previousUrl || selection || '';
    const url = window.prompt('Insira a URL do link (deixe vazio para remover)', assumedUrl);
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const insertImage = () => {
    const url = window.prompt('Insira a URL da imagem');
    if (!url) return;
    editor.chain().focus().insertContent(`<img src="${url}" alt="Imagem" />`).run();
  };

  const insertFile = () => {
    const url = window.prompt('Insira a URL do arquivo');
    if (!url) return;
    const name = window.prompt('Nome do arquivo') || 'Arquivo';
    editor.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">📎 ${name}</a>`).run();
  };

  const insertRecording = () => {
    editor.chain().focus().insertContent('🎙️ Gravação (adicione o link/nota aqui)').run();
  };

  const insertSketch = () => {
    editor.chain().focus().insertContent('✏️ Esboço (adicione o link ou imagem aqui)').run();
  };

  const insertCodeBlock = () => editor.chain().focus().toggleCodeBlock().run();

  const closeMenu = () => setShowInsertMenu(false);

  return (
    <div className="flex flex-col w-full h-full">
      {editable && (
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10 px-4 py-2 flex flex-wrap gap-1 items-center animate-in slide-in-from-top-1">
        {editable && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setShowInsertMenu((prev) => !prev)}
            >
              <Plus size={16} />
              Inserir
            </Button>

            {showInsertMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={closeMenu} />
                <div className="absolute left-0 mt-2 w-64 rounded-md border bg-popover text-popover-foreground shadow-lg z-40 overflow-hidden">
                  <div className="px-3 py-2 border-b text-xs font-semibold text-muted-foreground">
                    Inserções rápidas
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertTask(); closeMenu(); }}>
                      <CheckSquare size={14} /> Nova tarefa
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertLink('Link para nota', '#'); closeMenu(); }}>
                      <LinkIcon size={14} /> Link para nota
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertLink(); closeMenu(); }}>
                      <LinkIcon size={14} /> Link
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { editor.chain().focus().toggleBulletList().run(); closeMenu(); }}>
                      <List size={14} /> Lista com marcadores
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertTaskList(); closeMenu(); }}>
                      <CheckSquare size={14} /> Lista de verificação
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertOrdered(); closeMenu(); }}>
                      <ListOrdered size={14} /> Lista numerada
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertCheckbox(); closeMenu(); }}>
                      <CheckSquare size={14} /> Caixa de seleção
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertHeading(1); closeMenu(); }}>
                      <Heading1 size={14} /> Cabeçalho grande
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertHeading(2); closeMenu(); }}>
                      <Heading2 size={14} /> Cabeçalho médio
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertHeading(3); closeMenu(); }}>
                      <Heading3 size={14} /> Cabeçalho pequeno
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertParagraph(); closeMenu(); }}>
                      <PenTool size={14} /> Texto normal
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertDivider(); closeMenu(); }}>
                      <Minus size={14} /> Divisor
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertQuote(); closeMenu(); }}>
                      <Quote size={14} /> Citação
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertImage(); closeMenu(); }}>
                      <Image size={14} /> Imagem
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertFile(); closeMenu(); }}>
                      <File size={14} /> Arquivo
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertRecording(); closeMenu(); }}>
                      <Mic size={14} /> Gravar
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertSketch(); closeMenu(); }}>
                      <PenTool size={14} /> Esboço
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => { insertCodeBlock(); closeMenu(); }}>
                      <Code2 size={14} /> Bloco de código
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Negrito (Ctrl+B)"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Itálico (Ctrl+I)"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Tachado"
          >
            <Strikethrough size={16} />
          </ToolbarButton>
          
          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Título 1"
          >
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Título 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>
           <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Título 3"
          >
            <Heading3 size={16} />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Lista com marcadores"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Lista numerada"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            title="Lista de tarefas"
          >
            <CheckSquare size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={toggleLinkOnSelection}
            isActive={editor.isActive('link')}
            title="Transformar em link"
          >
            <LinkIcon size={16} />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />
          
           <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Bloco de código"
          >
            <Code size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Citação"
          >
            <Quote size={16} />
          </ToolbarButton>
           <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Linha horizontal"
          >
            <Minus size={16} />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Desfazer (Ctrl+Z)"
          >
            <Undo size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Refazer (Ctrl+Y)"
          >
            <Redo size={16} />
          </ToolbarButton>

        </div>
      )}
      
      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8 cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
