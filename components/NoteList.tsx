
import React from 'react';
import { Note } from '../types';
import { FileText, Clock, Menu, Book, CheckSquare } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from './ui/utils';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  searchQuery: string;
  onOpenMenu: () => void;
  notebookName?: string;
}

const NoteList: React.FC<NoteListProps> = ({ 
  notes, 
  selectedNoteId, 
  onSelectNote, 
  searchQuery, 
  onOpenMenu,
  notebookName
}) => {
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
  };

  const getExcerpt = (note: Note) => {
    if (note.excerpt && note.excerpt.trim()) return note.excerpt;
    if (note.content) {
      const plain = note.content
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return plain || 'Comece a escrever...';
    }
    return 'Comece a escrever...';
  };

  const getTaskCounts = (note: Note) => {
    const html = note.content || '';
    const matches = html.match(/<li[^>]*data-type="taskItem"[^>]*>/gi) || [];
    const doneMatches = html.match(/<li[^>]*data-type="taskItem"[^>]*data-checked=["']?(true|checked)["']?[^>]*>/gi) || [];

    // Fallback for markdown task list
    const mdMatches = html.match(/-\s*\[( |x|X)\]\s+/g) || [];
    const mdDone = (html.match(/-\s*\[(x|X)\]\s+/g) || []).length;

    const total = matches.length || mdMatches.length;
    const done = doneMatches.length || mdDone;
    return { total, done };
  };

  return (
    <div className="w-full flex flex-col h-full bg-background border-r">
      <div className="p-4 border-b flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onOpenMenu}
            className="md:hidden -ml-2 text-muted-foreground"
          >
            <Menu size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {notebookName || 'Todas as Notas'}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              {notebookName && <Book size={10} />}
              {notes.length} notas
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6 text-center">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">
              {searchQuery ? 'Nenhum resultado.' : 'Nenhuma nota aqui.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={cn(
                  "flex flex-col items-start gap-2 w-full p-4 text-left transition-all",
                  selectedNoteId === note.id
                    ? "bg-primary/5 border border-primary/50 shadow-sm rounded-lg -m-[1px]"
                    : "hover:bg-muted/40 rounded-lg"
                )}
              >
                <div className="flex flex-col gap-1 w-full">
                  <h3 className={cn("font-semibold leading-none", selectedNoteId === note.id ? "text-accent-foreground" : "text-foreground")}>
                    {note.title || 'Sem titulo'}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground leading-snug">
                    {getExcerpt(note)}
                  </p>
                </div>
                <div className="flex items-center text-xs text-muted-foreground gap-2 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>
                  {(() => {
                    const { total, done } = getTaskCounts(note);
                    if (total === 0) return null;
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                        <CheckSquare size={12} />
                        {done}/{total}
                      </span>
                    );
                  })()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteList;
