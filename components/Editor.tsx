import React, { useState, useEffect, useRef } from 'react';
import { Note, AIResponseState } from '../types';
import { MoreHorizontal, Calendar, Sparkles, Wand2, SpellCheck, PenLine, Expand, ArrowLeft, X, Edit3, Eye } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import { Button } from './ui/Button';
import { cn } from './ui/utils';
import { Dialog, DialogFooter } from './ui/Dialog';
import TiptapEditor from './TiptapEditor';

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
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Reference to Tiptap Editor instance
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setAiState({ isLoading: false, error: null, result: null });
    setShowAiMenu(false);
    setIsReadOnly(false);
  }, [note.id]);

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
        // Replace content with corrected text (formatted as simple paragraphs for now)
        // Ideally we would want to maintain formatting, but for grammar fix we replace
        editorRef.current.commands.setContent(result);
        setContent(editorRef.current.getHTML()); // Sync state
      } else if (action === 'continue') {
        const continuation = await GeminiService.continueWriting(currentText);
        result = continuation;
        // Append text
        editorRef.current.commands.insertContent(continuation);
        setContent(editorRef.current.getHTML()); // Sync state
      } else if (action === 'summarize') {
        result = await GeminiService.summarizeText(currentText);
        setAiState({ isLoading: false, error: null, result });
        return; 
      } else if (action === 'ideas') {
        result = await GeminiService.generateIdeas(title);
        // Append Ideas section
        const htmlIdeas = `<h3>Ideias Sugeridas por IA:</h3><p>${result.replace(/\n/g, '<br>')}</p>`;
        editorRef.current.commands.insertContent(htmlIdeas);
        setContent(editorRef.current.getHTML()); // Sync state
      }
      
      setAiState({ isLoading: false, error: null, result: null });
    } catch (err) {
      setAiState({ isLoading: false, error: 'Erro ao processar com IA.', result: null });
    }
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

          <Button variant="ghost" size="icon" onClick={() => onDelete(note.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <MoreHorizontal size={18} />
          </Button>
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
            className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 font-serif tracking-tight disabled:opacity-80"
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
    </div>
  );
};

export default Editor;