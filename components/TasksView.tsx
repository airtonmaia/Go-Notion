import React, { useMemo, useState } from 'react';
import { TaskItem } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { CheckCircle, Circle, NotebookPen, Plus, Search, ArrowRight } from 'lucide-react';
import { cn } from './ui/utils';

interface TasksViewProps {
  tasks: TaskItem[];
  onSelectNote: (noteId: string) => void;
  onCreateTask: () => void;
  onToggleTask: (taskId: string, checked: boolean) => void;
}

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-';
  try {
    const d = new Date(timestamp);
    return d.toLocaleDateString();
  } catch (_e) {
    return '-';
  }
};

const TasksView: React.FC<TasksViewProps> = ({ tasks, onSelectNote, onCreateTask, onToggleTask }) => {
  const [query, setQuery] = useState('');
  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(t =>
      t.text.toLowerCase().includes(q) || t.noteTitle.toLowerCase().includes(q)
    );
  }, [tasks, query]);

  return (
    <div className="h-full w-full flex flex-col gap-4 p-6 bg-background text-foreground overflow-hidden">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Tarefas</h1>
              <span className="text-sm text-muted-foreground">{tasks.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Tarefas identificadas dentro das suas notas.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tarefa..."
                className="pl-8 w-60"
              />
            </div>
            <Button onClick={onCreateTask} className="gap-2">
              <Plus size={16} />
              Nova Tarefa
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Minhas tarefas</span>
          <span>Notas</span>
          <span>Hoje</span>
          <span>Atribuído</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-auto h-full">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur border-b text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3 w-1/2">Título</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Nota atribuída</th>
                <th className="text-left font-medium px-4 py-3">Atualizada</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhuma tarefa encontrada.
                  </td>
                </tr>
              )}
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onSelectNote(task.noteId)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        className={cn(
                          "h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
                          task.checked ? "border-emerald-500 bg-emerald-500/10" : "border-muted-foreground/60 hover:border-primary"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(task.id, !task.checked);
                        }}
                        aria-label={task.checked ? 'Desmarcar' : 'Marcar'}
                      >
                        {task.checked ? (
                          <CheckCircle size={14} className="text-emerald-600" />
                        ) : (
                          <Circle size={12} className="text-muted-foreground" />
                        )}
                      </button>
                      <span className={cn("truncate", task.checked && "line-through text-muted-foreground")}>{task.text}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      task.checked ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                    )}>
                      {task.checked ? 'Concluída' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <NotebookPen size={14} />
                      <span className="truncate" title={task.noteTitle || 'Nota'}>
                        {task.noteTitle || 'Nota'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(task.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNote(task.noteId);
                      }}
                    >
                      Abrir nota
                      <ArrowRight size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TasksView;
