
import React, { useState } from 'react';
import { Notebook } from '../types';
import { BookA, Plus, Trash2, Menu, CornerDownRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from './ui/utils';

interface NotebookListProps {
  notebooks: Notebook[];
  onSelectNotebook: (id: string) => void;
  onCreateNotebook: (name: string, parentId: string | null) => void;
  onDeleteNotebook: (id: string) => void;
  onOpenMenu: () => void;
  onDropNote?: (noteId: string, targetNotebookId: string) => void;
}

const NotebookList: React.FC<NotebookListProps> = ({ 
  notebooks, 
  onSelectNotebook, 
  onCreateNotebook, 
  onDeleteNotebook,
  onOpenMenu,
  onDropNote
}) => {
  const [newNotebookName, setNewNotebookName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNotebookName.trim()) {
      const parent = selectedParentId === '' ? null : selectedParentId;
      onCreateNotebook(newNotebookName, parent);
      setNewNotebookName('');
      setSelectedParentId('');
      setIsCreating(false);
    }
  };

  const renderSelectOptions = (parentId: string | null = null, depth: number = 0): React.ReactNode[] => {
    const children = notebooks
      .filter(nb => (nb.parentId || null) === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    let options: React.ReactNode[] = [];
    children.forEach(nb => {
      options.push(
        <option key={nb.id} value={nb.id}>
          {'\u00A0'.repeat(depth * 3)}{nb.name}
        </option>
      );
      options = [...options, ...renderSelectOptions(nb.id, depth + 1)];
    });
    return options;
  };

  const renderList = (parentId: string | null = null, depth: number = 0) => {
    const children = notebooks
      .filter(nb => (nb.parentId || null) === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (children.length === 0) return null;

    return (
      <div className={cn("w-full", depth > 0 && "ml-6 pl-2 border-l border-border")}>
        {children.map((notebook) => (
          <div key={notebook.id} className="w-full">
            <div 
               className="group flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors cursor-pointer mb-1" 
               onClick={() => onSelectNotebook(notebook.id)}
               onDragOver={(e) => {
                 if (!onDropNote) return;
                 e.preventDefault();
               }}
               onDrop={(e) => {
                 if (!onDropNote) return;
                 e.preventDefault();
                 const noteId = e.dataTransfer.getData('noteId');
                 if (noteId) {
                   onDropNote(noteId, notebook.id);
                 }
               }}
            >
              <div className="flex-1 flex items-center gap-3 text-left">
                {depth > 0 && <CornerDownRight size={14} className="text-muted-foreground" />}
                <BookA size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {notebook.name}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm(`Excluir o caderno "${notebook.name}"?`)) {
                    onDeleteNotebook(notebook.id);
                  }
                }}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            </div>
            {renderList(notebook.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col h-full bg-background">
      <div className="p-4 border-b flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onOpenMenu} className="md:hidden -ml-2">
            <Menu size={20} />
          </Button>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Cadernos</h2>
            <p className="text-xs text-muted-foreground">{notebooks.length} cadernos</p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)} size="sm" className="gap-2">
          <Plus size={16} /> Novo
        </Button>
      </div>
      
      {isCreating && (
        <div className="p-4 bg-muted/20 border-b animate-in slide-in-from-top-2">
          <form onSubmit={handleCreate} className="space-y-4 max-w-lg mx-auto bg-card p-4 rounded-lg border shadow-sm">
            <h3 className="font-semibold text-sm">Criar Caderno</h3>
            <div className="space-y-3">
              <Input
                autoFocus
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                placeholder="Nome do caderno..."
              />
              <div className="flex gap-2">
                 <select
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="flex-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Raiz</option>
                    {renderSelectOptions()}
                  </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
               <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
               <Button type="submit">Criar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {notebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6 text-center">
            <BookA size={48} className="mb-4 opacity-20" />
            <p className="text-sm">Nenhum caderno encontrado.</p>
          </div>
        ) : (
          renderList(null)
        )}
      </div>
    </div>
  );
};

export default NotebookList;
