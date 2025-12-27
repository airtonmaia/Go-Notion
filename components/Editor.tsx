import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Note, Block } from '../types';
import { 
  MoreHorizontal, Calendar, Expand, 
  ArrowLeft, Edit3, Eye, Star, Share2, Link as LinkIcon, ExternalLink,
  FolderInput, Copy, CopyPlus, Tags, Pin, Search, Info, History, Printer, Trash2, MessageSquare
} from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from './ui/utils';
import TiptapEditor from './TiptapEditor';
import BlockEditor from './BlockEditor';
import HistoryModal from './HistoryModal';
import ShareModal from './ShareModal';
import { useToast } from '../hooks/useToast';

interface EditorProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  showComments: boolean;
  onToggleComments: () => void;
  currentUserEmail?: string | null;
}

const Editor: React.FC<EditorProps> = ({ note, onUpdate, onDelete, onBack, showComments, onToggleComments, currentUserEmail }) => {
  const { addToast } = useToast();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [blocks, setBlocks] = useState<Block[]>(note.blocks || []);
  const [useBlockEditor, setUseBlockEditor] = useState(!!note.blocks && note.blocks.length > 0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  
  // Reference to Tiptap Editor instance
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setBlocks(note.blocks || []);
    setUseBlockEditor(!!note.blocks && note.blocks.length > 0);
    setShowSettingsMenu(false);
    setIsReadOnly(false);
  }, [note.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsMenu]);

  useEffect(() => {
    const handler = setTimeout(() => {
      // Basic check to see if content changed
      if (title !== note.title || content !== note.content) {
        // Strip HTML tags for the excerpt
        const plainText = content.replace(/<[^>]+>/g, '');
        onUpdate({
          ...note,
          title,
          content,
          excerpt: plainText.substring(0, 100),
        });
        setLastSaved(new Date());
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [title, content, note, onUpdate]);

  const toggleFavorite = () => {
    onUpdate({ ...note, isFavorite: !note.isFavorite });
    setShowSettingsMenu(false);
  };

  const handleDuplicate = () => {
    addToast('Funcionalidade de duplicação requer implementação no backend', 'warning');
    setShowSettingsMenu(false);
  };

  const handlePrint = () => {
    window.print();
    setShowSettingsMenu(false);
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    addToast('Link copiado para a área de transferência!', 'success');
    setShowSettingsMenu(false);
  };

  const handleRestoreVersion = (restoredTitle: string, restoredContent: string) => {
    setTitle(restoredTitle);
    setContent(restoredContent);
    // Force editor update
    if (editorRef.current) {
      editorRef.current.commands.setContent(restoredContent);
    }
    // Trigger immediate save
    onUpdate({
      ...note,
      title: restoredTitle,
      content: restoredContent
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative w-full">
      {/* Top Bar */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background z-20 sticky top-0">
        <div className="flex items-center text-muted-foreground text-sm gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="md:hidden -ml-2 mr-2"
          >
            <ArrowLeft size={18} />
          </Button>

          <div className="hidden md:flex items-center gap-2 px-2 py-1">
            <Calendar size={14} />
            <span className="text-xs">
              {lastSaved ? 'Salvo' : new Date(note.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Read Only Toggle */}
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setIsReadOnly(!isReadOnly)}
             className={cn("gap-2", isReadOnly && "text-primary bg-primary/10")}
             title={isReadOnly ? "Voltar para edição" : "Modo Leitura"}
           >
             {isReadOnly ? <Edit3 size={16} /> : <Eye size={16} />}
             <span className="hidden sm:inline">{isReadOnly ? 'Editar' : 'Leitura'}</span>
           </Button>
           
           {/* Favorite Quick Toggle */}
           <Button
             variant="ghost"
             size="icon"
             onClick={toggleFavorite}
             className={cn("text-muted-foreground", note.isFavorite && "text-yellow-500 hover:text-yellow-600")}
             title="Favoritar"
           >
             <Star size={18} fill={note.isFavorite ? "currentColor" : "none"} />
           </Button>

           <Button
             variant="ghost"
             size="sm"
             onClick={onToggleComments}
             className={cn("gap-2", showComments && "text-primary bg-primary/10")}
             title="Abrir comentários"
           >
             <MessageSquare size={16} />
             <span className="hidden sm:inline">Comentários</span>
           </Button>

           <div className="h-4 w-px bg-border mx-1" />

          {/* Settings Menu Trigger */}
          <div className="relative" ref={settingsMenuRef}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettingsMenu(!showSettingsMenu)} 
              className={cn("h-8 w-8 text-muted-foreground hover:text-foreground", showSettingsMenu && "bg-accent text-accent-foreground")}
            >
              <MoreHorizontal size={18} />
            </Button>

            {/* Comprehensive Settings Dropdown */}
            {showSettingsMenu && (
              <div className="absolute right-0 top-10 w-64 rounded-xl border bg-popover text-popover-foreground shadow-xl outline-none animate-in fade-in zoom-in-95 z-50 flex flex-col py-1.5">
                
                {/* Header - Share */}
                <div className="px-2 pb-1.5 border-b mb-1 flex gap-2">
                    <Button size="sm" className="flex-1 bg-primary/90 hover:bg-primary text-xs h-8" onClick={() => setShowShareModal(true)}>
                       Compartilhar
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={copyLink} title="Copiar Link">
                       <LinkIcon size={14} />
                    </Button>
                </div>

                {/* Section 1 */}
                <div className="px-1">
                  <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors" onClick={() => setIsReadOnly(true)}>
                    <ExternalLink size={14} className="text-muted-foreground" />
                    Abrir no editor Lite
                  </button>
                  <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Share2 size={14} className="text-muted-foreground" />
                    Compartilhar
                  </button>
                   <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors" onClick={copyLink}>
                    <LinkIcon size={14} className="text-muted-foreground" />
                    Copiar link
                  </button>
                </div>
                <div className="h-px bg-border my-1" />

                {/* Section 2 */}
                <div className="px-1">
                   <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    <FolderInput size={14} className="text-muted-foreground" />
                    Mover
                  </button>
                  <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Copy size={14} className="text-muted-foreground" />
                    Copiar para
                  </button>
                  <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors" onClick={handleDuplicate}>
                    <CopyPlus size={14} className="text-muted-foreground" />
                    Duplicar
                  </button>
                </div>
                <div className="h-px bg-border my-1" />

                {/* Section 3 - Tags */}
                 <div className="px-1">
                   <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Tags size={14} className="text-muted-foreground" />
                    Editar tags
                  </button>
                   <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Copy size={14} className="text-muted-foreground" />
                    Salvar como Modelo
                  </button>
                </div>
                <div className="h-px bg-border my-1" />

                {/* Section 4 - Pin/Favorite */}
                <div className="px-1">
                   <button 
                     className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                     onClick={toggleFavorite}
                   >
                    <Star size={14} className={cn("text-muted-foreground", note.isFavorite && "fill-yellow-500 text-yellow-500")} />
                    {note.isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                  </button>
                   <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Pin size={14} className="text-muted-foreground" />
                    Fixar no Caderno
                  </button>
                </div>
                <div className="h-px bg-border my-1" />

                {/* Section 5 - Info */}
                <div className="px-1">
                  <button className="w-full text-left flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors group">
                    <span className="flex items-center gap-2">
                       <Expand size={14} className="text-muted-foreground" />
                       Seções expansíveis
                    </span>
                    <ArrowLeft size={12} className="text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100" />
                  </button>
                </div>
                 <div className="h-px bg-border my-1" />

                 <div className="px-1">
                   <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Search size={14} className="text-muted-foreground" />
                    Localizar na nota
                  </button>
                   <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Info size={14} className="text-muted-foreground" />
                    Informações da nota
                  </button>
                   <button 
                      className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setShowHistoryModal(true);
                      }}
                   >
                    <History size={14} className="text-muted-foreground" />
                    Histórico de notas
                  </button>
                </div>
                <div className="h-px bg-border my-1" />

                {/* Section 6 - Print/Delete */}
                 <div className="px-1">
                   <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors" onClick={handlePrint}>
                    <Printer size={14} className="text-muted-foreground" />
                    Imprimir
                  </button>
                </div>
                <div className="h-px bg-border my-1" />
                
                 <div className="px-1">
                   <button 
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                    onClick={() => onDelete(note.id)}
                   >
                    <Trash2 size={14} />
                    Mover para a Lixeira
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title Input */}
      <div className="px-6 md:px-8 pt-8 pb-4 bg-background">
         <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isReadOnly}
            placeholder="Título"
            className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 tracking-tight disabled:opacity-80"
          />
      </div>

      {/* Rich Text Editor + Comments */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-hidden flex flex-col">
          {useBlockEditor ? (
            <div className="flex-1 overflow-y-auto p-6">
              <Suspense fallback={<div className="text-muted-foreground">Carregando editor...</div>}>
                <BlockEditor 
                  blocks={blocks}
                  onBlocksChange={(updatedBlocks) => {
                    setBlocks(updatedBlocks);
                    onUpdate({
                      ...note,
                      blocks: updatedBlocks,
                    });
                  }}
                />
              </Suspense>
            </div>
          ) : (
            <TiptapEditor 
              content={content} 
              onChange={setContent} 
              setEditorInstance={(editor) => editorRef.current = editor}
              editable={!isReadOnly}
            />
          )}
        </div>

        {showComments && (
          <div className="w-80 border-l bg-card hidden md:flex">
            <CommentsPanel noteId={note.id} currentUserEmail={currentUserEmail} />
          </div>
        )}
      </div>

      <HistoryModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)}
        noteId={note.id}
        onRestore={handleRestoreVersion}
      />

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        resourceId={note.id}
        resourceType="note"
        title={note.title}
      />
    </div>
  );
};

export default Editor;
