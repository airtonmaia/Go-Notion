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
  onAssignTask: (taskId: string, assignee: string) => void;
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

const TasksView: React.FC<TasksViewProps> = ({ tasks, onSelectNote, onCreateTask, onToggleTask, onAssignTask }) => {
  const [query, setQuery] = useState('');
  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(t =>
      t.text.toLowerCase().includes(q) || t.noteTitle.toLowerCase().includes(q)
    );
  }, [tasks, query]);

  return (
    <div className="h-full w-full flex flex-col gap-2 p-4 bg-background text-foreground overflow-hidden">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Tarefas</h1>
              <span className="text-xs text-muted-foreground">{tasks.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Tarefas identificadas nas notas.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tarefa..."
                className="pl-8 w-48 h-8 text-xs"
              />
            </div>
            <Button onClick={onCreateTask} className="gap-1 h-8 text-xs">
              <Plus size={14} />
              Nova
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Tarefas</span>
          <span>•</span>
          <span>Notas</span>
          <span>•</span>
          <span>Status</span>
          <span>•</span>
          <span>Data</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-auto h-full">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur border-b text-muted-foreground text-xs">
              <tr>
                <th className="text-left font-medium px-3 py-1.5 w-2/5">Título</th>
                <th className="text-left font-medium px-3 py-1.5 w-20">Status</th>
                <th className="text-left font-medium px-3 py-1.5 w-40">Nota</th>
                <th className="text-left font-medium px-3 py-1.5 w-32">Responsável</th>
                <th className="text-left font-medium px-3 py-1.5 w-20">Data</th>
                <th className="px-3 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center text-xs text-muted-foreground">
                    Nenhuma tarefa encontrada.
                  </td>
                </tr>
              )}
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer text-xs"
                  onClick={() => onSelectNote(task.noteId)}
                >
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center transition-colors flex-shrink-0",
                          task.checked ? "border-emerald-500 bg-emerald-500/10" : "border-muted-foreground/60 hover:border-primary"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(task.id, !task.checked);
                        }}
                        aria-label={task.checked ? 'Desmarcar' : 'Marcar'}
                      >
                        {task.checked ? (
                          <CheckCircle size={12} className="text-emerald-600" />
                        ) : (
                          <Circle size={10} className="text-muted-foreground" />
                        )}
                      </button>
                      <span className={cn("truncate", task.checked && "line-through text-muted-foreground")}>{task.text}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap",
                      task.checked ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                    )}>
                      {task.checked ? '✓' : '○'}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1 text-muted-foreground truncate">
                      <NotebookPen size={12} className="flex-shrink-0" />
                      <span className="truncate text-xs" title={task.noteTitle || 'Nota'}>
                        {task.noteTitle || 'Nota'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      value={task.assignee || ''}
                      placeholder="..."
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onAssignTask(task.id, e.target.value)}
                      className="h-6 text-xs px-2"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(task.updatedAt)}
                  </td>
                  <td className="px-3 py-1.5 text-right">
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
