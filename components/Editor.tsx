import React, { useState, useEffect, useRef } from 'react';
import { Note, AIResponseState } from '../types';
import { MoreHorizontal, Calendar, Tag, Sparkles, Wand2, SpellCheck, PenLine, Expand, ArrowLeft, X, Code, Eye, Edit3 } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import { Button } from './ui/Button';
import { cn } from './ui/utils';
import { Dialog, DialogFooter } from './ui/Dialog';
import { Input } from './ui/Input';

// Define Prism for Typescript usage since it's loaded via CDN
declare global {
  interface Window {
    Prism: any;
  }
}

interface EditorProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'php', label: 'PHP' },
  { value: 'sql', label: 'SQL' },
  { value: 'python', label: 'Python' },
  { value: 'json', label: 'JSON' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'markdown', label: 'Markdown' },
];

const Editor: React.FC<EditorProps> = ({ note, onUpdate, onDelete, onBack }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [aiState, setAiState] = useState<AIResponseState>({ isLoading: false, error: null, result: null });
  const [showAiMenu, setShowAiMenu] = useState(false);
  
  // Code and Preview States
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeSnippet, setCodeSnippet] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setAiState({ isLoading: false, error: null, result: null });
    setShowAiMenu(false);
    setIsPreviewMode(false); // Reset to edit mode on note change
  }, [note.id]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        onUpdate({
          ...note,
          title,
          content,
          excerpt: content.substring(0, 100),
        });
        setLastSaved(new Date());
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [title, content, note, onUpdate]);

  // Highlight code when entering preview mode
  useEffect(() => {
    if (isPreviewMode && window.Prism) {
      setTimeout(() => {
        window.Prism.highlightAll();
      }, 50);
    }
  }, [isPreviewMode, content]);

  const handleAiAction = async (action: 'grammar' | 'summarize' | 'continue' | 'ideas') => {
    setAiState({ isLoading: true, error: null, result: null });
    setShowAiMenu(false);

    try {
      let result = '';
      if (action === 'grammar') {
        result = await GeminiService.fixGrammarAndStyle(content);
        setContent(result);
      } else if (action === 'continue') {
        const continuation = await GeminiService.continueWriting(content);
        result = continuation;
        setContent(prev => prev + '\n\n' + continuation);
      } else if (action === 'summarize') {
        result = await GeminiService.summarizeText(content);
        setAiState({ isLoading: false, error: null, result });
        return; 
      } else if (action === 'ideas') {
        result = await GeminiService.generateIdeas(title);
        setContent(prev => prev + '\n\n## Ideias Sugeridas por IA:\n' + result);
      }
      
      setAiState({ isLoading: false, error: null, result: null });
    } catch (err) {
      setAiState({ isLoading: false, error: 'Erro ao processar com IA.', result: null });
    }
  };

  const insertCodeBlock = () => {
    const block = `\n\`\`\`${codeLanguage}\n${codeSnippet}\n\`\`\`\n`;
    
    // Insert at cursor position if possible
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = content;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      setContent(before + block + after);
    } else {
      setContent(prev => prev + block);
    }
    
    setShowCodeDialog(false);
    setCodeSnippet('');
  };

  // Simple Markdown Renderer for Preview Mode
  const renderPreview = () => {
    if (!content) return <p className="text-muted-foreground italic">Nada para visualizar...</p>;

    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // Extract language and code
        const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
        if (match) {
          const lang = match[1] || 'plaintext';
          const code = match[2];
          return (
            <pre key={index} className={`language-${lang} rounded-md text-sm shadow-sm overflow-x-auto`}>
              <code className={`language-${lang}`}>{code}</code>
            </pre>
          );
        }
      }
      
      // Render paragraphs, headings, etc. (Basic Markdown)
      return (
        <div key={index} className="prose dark:prose-invert max-w-none">
           {part.split('\n').map((line, i) => {
             if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-foreground">{line.replace('### ', '')}</h3>;
             if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-foreground border-b pb-1">{line.replace('## ', '')}</h2>;
             if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-8 mb-4 text-primary">{line.replace('# ', '')}</h1>;
             if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc mb-1">{line.replace('- ', '')}</li>;
             if (line.trim() === '') return <br key={i} />;
             return <p key={i} className="mb-2 leading-relaxed text-foreground">{line}</p>;
           })}
        </div>
      );
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
           {/* Preview Toggle */}
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setIsPreviewMode(!isPreviewMode)}
             className={cn("gap-2", isPreviewMode && "text-primary bg-primary/10")}
             title={isPreviewMode ? "Voltar para edição" : "Visualizar nota"}
           >
             {isPreviewMode ? <Edit3 size={16} /> : <Eye size={16} />}
             <span className="hidden sm:inline">{isPreviewMode ? 'Editar' : 'Visualizar'}</span>
           </Button>

           {/* Code Button */}
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => setShowCodeDialog(true)}
             title="Inserir Código"
             disabled={isPreviewMode}
           >
             <Code size={18} />
           </Button>

           <div className="h-4 w-px bg-border mx-1" />

           {/* AI Menu */}
           <div className="relative">
            <Button 
              size="sm"
              onClick={() => setShowAiMenu(!showAiMenu)}
              disabled={isPreviewMode}
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

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-4 h-full">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPreviewMode}
            placeholder="Título"
            className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 font-serif tracking-tight disabled:opacity-80"
          />
          
          {isPreviewMode ? (
            <div className="w-full pb-20 font-serif leading-relaxed text-lg">
              {renderPreview()}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Comece a escrever... (Use Markdown ou clique em <> para código)"
              className="w-full h-[calc(100%-100px)] resize-none text-lg leading-relaxed bg-transparent border-none outline-none placeholder:text-muted-foreground/40 font-serif font-light"
            />
          )}
        </div>
      </div>

      {/* Code Insertion Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog} title="Inserir Trecho de Código">
         <div className="space-y-4 pt-2">
           <div className="space-y-2">
             <label className="text-sm font-medium">Linguagem</label>
             <div className="relative">
               <select 
                 value={codeLanguage}
                 onChange={(e) => setCodeLanguage(e.target.value)}
                 className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
               >
                 {LANGUAGES.map(lang => (
                   <option key={lang.value} value={lang.value}>{lang.label}</option>
                 ))}
               </select>
             </div>
           </div>
           
           <div className="space-y-2">
             <label className="text-sm font-medium">Código</label>
             <textarea 
               value={codeSnippet}
               onChange={(e) => setCodeSnippet(e.target.value)}
               className="flex min-h-[150px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
               placeholder="Cole seu código aqui..."
             />
           </div>

           <DialogFooter>
             <Button variant="outline" onClick={() => setShowCodeDialog(false)}>Cancelar</Button>
             <Button onClick={insertCodeBlock}>Inserir</Button>
           </DialogFooter>
         </div>
      </Dialog>
    </div>
  );
};

export default Editor;