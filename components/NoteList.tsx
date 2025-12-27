
import React from 'react';
import { Note } from '../types';
import { FileText, Clock, Menu, CheckSquare } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from './ui/utils';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  searchQuery: string;
  onOpenMenu: () => void;
  notebookName?: string;
  onShareNotebook?: () => void;
  notebookId?: string | null;
  onReorderNote?: (notebookId: string, sourceId: string, targetId: string) => void;
  onMoveNote?: (noteId: string, targetNotebookId: string) => void;
}

const NoteList: React.FC<NoteListProps> = ({ 
  notes, 
  selectedNoteId, 
  onSelectNote, 
  searchQuery, 
  onOpenMenu,
  notebookName,
  onShareNotebook,
  notebookId,
  onReorderNote,
  onMoveNote
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
    <div className="w-full flex flex-col h-full bg-background">
      <div className="p-3 flex items-center justify-between sticky top-0 z-10 bg-muted/40 backdrop-blur border-b">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onOpenMenu}
            className="md:hidden -ml-2 text-muted-foreground h-8 w-8"
          >
            <Menu size={16} />
          </Button>
          <div className="w-full flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {notebookName || 'Todas as Notas'}
              </h2>
              {notebookName && onShareNotebook && (
                <button
                  onClick={onShareNotebook}
                  className="text-xs text-primary hover:underline"
                  title="Compartilhar caderno"
                >
                  Compartilhar
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {notes.length} notas
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6 text-center">
            <FileText size={40} className="mb-4 opacity-20" />
            <p className="text-xs font-medium">
              {searchQuery ? 'Nenhum resultado.' : 'Nenhuma nota aqui.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur border-b text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-1.5 text-xs">Título</th>
                <th className="text-left font-medium px-3 py-1.5 text-xs w-24">Atualizado</th>
                <th className="text-center font-medium px-3 py-1.5 text-xs w-20">Tarefas</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => (
                <tr
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  draggable={!!onReorderNote && !!notebookId}
                  onDragStart={(e) => {
                    if (!onReorderNote || !notebookId) return;
                    e.dataTransfer.setData('noteId', note.id);
                    e.dataTransfer.setData('notebookId', notebookId);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    if (!onReorderNote || !notebookId) return;
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    if (!onReorderNote || !notebookId) return;
                    e.preventDefault();
                    const sourceId = e.dataTransfer.getData('noteId');
                    const sourceNotebook = e.dataTransfer.getData('notebookId');
                    if (sourceNotebook && sourceNotebook !== notebookId) return;
                    if (sourceId && sourceId !== note.id) {
                      onReorderNote(notebookId, sourceId, note.id);
                    }
                  }}
                  className={cn(
                    "border-b hover:bg-muted/50 cursor-pointer transition-colors h-14",
                    selectedNoteId === note.id && "bg-primary/10 border-l-2 border-l-primary"
                  )}
                >
                  <td className="px-3 py-1.5 text-left align-middle">
                    <div className="flex flex-col gap-0.5 truncate">
                      <div className="font-medium truncate text-foreground text-xs">
                        {note.title || 'Sem título'}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {getExcerpt(note)}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap text-xs align-middle">
                    {formatDate(note.updatedAt)}
                  </td>
                  <td className="px-3 py-1.5 text-center align-middle">
                    {(() => {
                      const { total, done } = getTaskCounts(note);
                      if (total === 0) return <span className="text-xs text-muted-foreground">—</span>;
                      return (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                          done === total 
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                        )}>
                          <CheckSquare size={10} className="flex-shrink-0" />
                          <span>{done}/{total}</span>
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NoteList;
