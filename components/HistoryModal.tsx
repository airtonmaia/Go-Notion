
import React, { useEffect, useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { NoteRevision } from '../types';
import * as StorageService from '../services/storage';
import { Clock, RotateCcw, FileText, Loader2, Calendar } from 'lucide-react';
import { cn } from './ui/utils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  onRestore: (title: string, content: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, noteId, onRestore }) => {
  const [revisions, setRevisions] = useState<NoteRevision[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<NoteRevision | null>(null);

  useEffect(() => {
    if (isOpen && noteId) {
      setLoading(true);
      StorageService.getNoteHistory(noteId)
        .then((data) => {
          setRevisions(data);
          if (data.length > 0) setSelectedRevision(data[0]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, noteId]);

  const handleRestore = () => {
    if (selectedRevision) {
      if (confirm('Tem certeza que deseja restaurar esta versão? O conteúdo atual será substituído (uma nova versão de backup será criada).')) {
        onRestore(selectedRevision.title, selectedRevision.content);
        onClose();
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Strip HTML for preview
  const getPreview = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} title="Histórico de Versões" className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
      <div className="flex h-full overflow-hidden">
        {/* Sidebar List */}
        <div className="w-1/3 border-r bg-muted/20 flex flex-col">
          <div className="p-4 border-b font-medium text-sm flex items-center gap-2">
            <Clock size={16} />
            Versões Anteriores
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : revisions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Nenhuma alteração registrada ainda.
              </div>
            ) : (
              <div className="divide-y">
                {revisions.map((rev) => (
                  <button
                    key={rev.id}
                    onClick={() => setSelectedRevision(rev)}
                    className={cn(
                      "w-full text-left p-3 text-sm hover:bg-muted transition-colors flex flex-col gap-1",
                      selectedRevision?.id === rev.id ? "bg-primary/10 border-l-4 border-primary" : "border-l-4 border-transparent"
                    )}
                  >
                    <span className="font-semibold text-foreground flex items-center gap-2">
                      <Calendar size={12} className="text-muted-foreground" />
                      {formatDate(rev.createdAt)}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full block">
                      {rev.title || "Sem título"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col h-full bg-background">
          {selectedRevision ? (
            <>
              <div className="p-4 border-b flex justify-between items-center bg-card">
                <div>
                  <h3 className="font-bold text-lg">{selectedRevision.title || "Sem Título"}</h3>
                  <p className="text-xs text-muted-foreground">
                    Salvo em {formatDate(selectedRevision.createdAt)}
                  </p>
                </div>
                <Button onClick={handleRestore} size="sm" className="gap-2">
                  <RotateCcw size={14} /> Restaurar esta versão
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 prose dark:prose-invert max-w-none">
                 <div dangerouslySetInnerHTML={{ __html: selectedRevision.content }} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <FileText size={48} className="opacity-20 mb-4" />
              <p>Selecione uma versão para visualizar</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default HistoryModal;
