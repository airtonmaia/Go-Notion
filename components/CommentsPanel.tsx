import React, { useEffect, useState } from 'react';
import { Comment } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import * as StorageService from '../services/storage';
import { supabase } from '../services/supabase';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { cn } from './ui/utils';

interface CommentsPanelProps {
  noteId: string;
  currentUserEmail?: string | null;
}

const formatTime = (dateIso: string) => {
  const date = new Date(dateIso);
  return date.toLocaleString();
};

const CommentsPanel: React.FC<CommentsPanelProps> = ({ noteId, currentUserEmail }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    const data = await StorageService.getComments(noteId);
    setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadComments();

    const channel = supabase
      .channel(`note-comments-${noteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'note_comments',
          filter: `note_id=eq.${noteId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await StorageService.addComment(noteId, message.trim());
    setMessage('');
    setSending(false);
  };

  return (
    <div className="w-full h-full flex flex-col border-l bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquarePlus size={16} />
          <span className="font-semibold text-sm">Comentários</span>
        </div>
        {currentUserEmail && (
          <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={currentUserEmail}>
            {currentUserEmail}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 size={14} className="animate-spin" />
            Carregando comentários...
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border bg-background p-3 shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className={cn("font-medium text-foreground")}>{comment.authorEmail || 'Colaborador'}</span>
                <span>{formatTime(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-3 space-y-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Deixe um comentário para sua equipe..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button className="w-full" onClick={handleSend} disabled={sending || !message.trim()}>
          {sending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Enviando...
            </>
          ) : (
            'Adicionar comentário'
          )}
        </Button>
      </div>
    </div>
  );
};

export default CommentsPanel;
