
import React, { useState, useEffect, useRef } from 'react';
import { Note, AIResponseState } from '../types';
import { 
  MoreHorizontal, Calendar, Sparkles, Wand2, SpellCheck, PenLine, Expand, 
  ArrowLeft, X, Edit3, Eye, Star, Share2, Link as LinkIcon, ExternalLink,
  FolderInput, Copy, CopyPlus, Tags, Pin, Search, Info, History, Printer, Trash2
} from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import { Button } from './ui/Button';
import { cn } from './ui/utils';
import TiptapEditor from './TiptapEditor';
import HistoryModal from './HistoryModal';

interface EditorProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const Editor: React.FC<EditorProps> = ({ note, onUpdate, onDelete, onBack }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [aiState, setAiState] = useState<AIResponseState>({ isLoading: false, error: null, result: null });
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  
  // Reference to Tiptap Editor instance
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setAiState({ isLoading: false, error: null, result: null });
    setShowAiMenu(false);
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

  const handleAiAction = async (action: 'grammar' | 'summarize' | 'continue' | 'ideas') => {
    if (!editorRef.current) return;
    
    setAiState({ isLoading: true, error: null, result: null });
    setShowAiMenu(false);

    try {
      const currentText = editorRef.current.getText(); // Get plain text for AI context
      let result = '';

      if (action === 'grammar') {
        result = await GeminiService.fixGrammarAndStyle(currentText);
        editorRef.current.commands.setContent(result);
        setContent(editorRef.current.getHTML()); 
      } else if (action === 'continue') {
        const continuation = await GeminiService.continueWriting(currentText);
        result = continuation;
        editorRef.current.commands.insertContent(continuation);
        setContent(editorRef.current.getHTML()); 
      } else if (action === 'summarize') {
        result = await GeminiService.summarizeText(currentText);
        setAiState({ isLoading: false, error: null, result });
        return; 
      } else if (action === 'ideas') {
        result = await GeminiService.generateIdeas(title);
        const htmlIdeas = `<h3>Ideias Sugeridas por IA:</h3><p>${result.replace(/\n/g, '<br>')}</p>`;
        editorRef.current.commands.insertContent(htmlIdeas);
        setContent(editorRef.current.getHTML()); 
      }
      
      setAiState({ isLoading: false, error: null, result: null });
    } catch (err) {
      setAiState({ isLoading: false, error: 'Erro ao processar com IA.', result: null });
    }
  };

  const toggleFavorite = () => {
    onUpdate({ ...note, isFavorite: !note.isFavorite });
    setShowSettingsMenu(false);
  };

  const handleDuplicate = () => {
    alert("Funcionalidade de duplicação requer implementação no backend.");
    setShowSettingsMenu(false);
  };

  const handlePrint = () => {
    window.print();
    setShowSettingsMenu(false);
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Link copiado para a área de transferência!");
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

           <div className="h-4 w-px bg-border mx-1" />

           {/* AI Menu */}
           <div className="relative">
            <Button 
              size="sm"
              onClick={() => setShowAiMenu(!showAiMenu)}
              disabled={isReadOnly}
              className={cn("gap-2 h-8 rounded-full", showAiMenu && "ring-2 ring-primary ring-offset-2")}
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">AI Assistant</span>
            </Button>
            
            {showAiMenu && (
               <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAiMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in zoom-in-95 z-50 p-1">
                  <Button variant="ghost" className="w-full justify-start h-9" onClick={() => handleAiAction('grammar')}>
                    <SpellCheck size={16} className="mr-2 text-primary" /> Corrigir Gramática
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-9" onClick={() => handleAiAction('continue')}>
                    <PenLine size={16} className="mr-2 text-blue-500" /> Continuar Escrevendo
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-9" onClick={() => handleAiAction('summarize')}>
                    <Expand size={16} className="mr-2 text-purple-500" /> Resumir Nota
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-9" onClick={() => handleAiAction('ideas')}>
                    <Wand2 size={16} className="mr-2 text-amber-500" /> Gerar Ideias
                  </Button>
                </div>
              </>
            )}
           </div>

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
                    <Button size="sm" className="flex-1 bg-primary/90 hover:bg-primary text-xs h-8">
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

      {/* AI Processing Overlay */}
      {aiState.isLoading && (
        <div className="absolute top-16 left-0 right-0 z-30 flex justify-center px-4">
          <div className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
            <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
            Processando...
          </div>
        </div>
      )}

      {/* AI Result Area */}
      {aiState.result && !aiState.isLoading && (
        <div className="bg-muted/50 border-b p-6 relative animate-in slide-in-from-top-4 duration-300 max-h-48 overflow-y-auto">
          <div className="flex justify-between items-start mb-2 sticky top-0 pb-2">
            <h4 className="text-primary font-semibold text-sm flex items-center gap-2">
              <Sparkles size={14} /> Resumo IA
            </h4>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAiState(prev => ({...prev, result: null}))}>
              <X size={14} />
            </Button>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aiState.result}</p>
        </div>
      )}

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

      {/* Rich Text Editor */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <TiptapEditor 
          content={content} 
          onChange={setContent} 
          setEditorInstance={(editor) => editorRef.current = editor}
          editable={!isReadOnly}
        />
      </div>

      <HistoryModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)}
        noteId={note.id}
        onRestore={handleRestoreVersion}
      />
    </div>
  );
};

export default Editor;
