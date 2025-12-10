
import React from 'react';
import { Note } from '../types';
import { FileText, Clock, Menu, Book } from 'lucide-react';
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
      
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6 text-center">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">
              {searchQuery ? 'Nenhum resultado.' : 'Nenhuma nota aqui.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={cn(
                  "flex flex-col items-start gap-2 w-full p-4 text-left transition-all hover:bg-accent/50",
                  selectedNoteId === note.id && "bg-accent"
                )}
              >
                <div className="flex flex-col gap-1 w-full">
                  <h3 className={cn("font-semibold leading-none", selectedNoteId === note.id ? "text-accent-foreground" : "text-foreground")}>
                    {note.title || 'Sem título'}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground leading-snug">
                    {note.content || 'Comece a escrever...'}
                  </p>
                </div>
                <div className="flex items-center text-xs text-muted-foreground gap-1.5 mt-1">
                  <Clock size={12} />
                  <span>{formatDate(note.updatedAt)}</span>
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