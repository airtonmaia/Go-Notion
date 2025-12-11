import React, { useEffect, useMemo, useState } from 'react';
import { Share } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog, DialogFooter } from './ui/Dialog';
import { Mail, Link as LinkIcon, Globe2, UserX, Shield } from 'lucide-react';
import * as StorageService from '../services/storage';
import { cn } from './ui/utils';
import { supabase } from '../services/supabase';

interface ShareModalProps {
  resourceId: string;
  resourceType: 'note' | 'notebook';
  title: string;
  open: boolean;
  onClose: () => void;
}

const roleLabel: Record<'viewer' | 'editor', string> = {
  viewer: 'Pode visualizar',
  editor: 'Pode editar',
};

const ShareModal: React.FC<ShareModalProps> = ({ resourceId, resourceType, title, open, onClose }) => {
  const [shares, setShares] = useState<Share[]>([]);
  const [emailsInput, setEmailsInput] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [loading, setLoading] = useState(false);
  const [publicShare, setPublicShare] = useState<Share | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const accessOption = publicShare ? 'link_view' : 'restricted';
  const [ownerName, setOwnerName] = useState<string>('Você');
  const [ownerEmail, setOwnerEmail] = useState<string>('');

  const fetchShares = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setOwnerEmail(user.email || '');
      setOwnerName(user.user_metadata?.full_name || user.email || 'Você');
    }
    const data = await StorageService.getSharesForResource(resourceType, resourceId);
    setShares(data);
    const pub = data.find(s => s.publicRole);
    setPublicShare(pub || null);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchShares();
      setCopyStatus('idle');
    }
  }, [open]);

  const handleInvite = async () => {
    const emails = emailsInput
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);
    if (emails.length === 0) return;
    setLoading(true);
    for (const email of emails) {
      await StorageService.inviteShare(resourceType, resourceId, email, inviteRole);
    }
    setEmailsInput('');
    await fetchShares();
  };

  const handleRoleChange = async (shareId: string, role: 'viewer' | 'editor') => {
    setLoading(true);
    await StorageService.updateShareRole(shareId, role);
    await fetchShares();
  };

  const handleRemove = async (shareId: string) => {
    setLoading(true);
    await StorageService.removeShare(shareId);
    await fetchShares();
  };

  const togglePublic = async () => {
    setLoading(true);
    const next = await StorageService.setPublicShare(resourceType, resourceId, !publicShare);
    setPublicShare(next);
    await fetchShares();
  };

  const publicLink = useMemo(() => {
    if (!publicShare || !publicShare.publicToken) return '';
    return `${window.location.origin}/?share=${publicShare.publicToken}`;
  }, [publicShare]);

  const copyPublicLink = async () => {
    if (!publicLink) return;
    await navigator.clipboard.writeText(publicLink);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleAccessChange = async (option: 'restricted' | 'link_view' | 'link_edit') => {
    if (option === 'restricted') {
      await StorageService.setPublicShare(resourceType, resourceId, false);
      setPublicShare(null);
    } else if (option === 'link_view') {
      const next = await StorageService.setPublicShare(resourceType, resourceId, true);
      setPublicShare(next);
    } else {
      // link_edit not supported; ignore
    }
    await fetchShares();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()} title="Compartilhe este item" className="max-w-xl">
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Compartilhando: <span className="font-medium text-foreground">{title || '(sem título)'}</span></p>
              <p className="text-xs text-muted-foreground">Permissões: visualizar ou editar.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1" onClick={copyPublicLink} disabled={!publicShare || !publicLink}>
                <LinkIcon size={14} />
                {copyStatus === 'copied' ? 'Copiado' : 'Copiar link'}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Input
              value={emailsInput}
              onChange={(e) => setEmailsInput(e.target.value)}
              placeholder="Adicionar nome ou e-mail"
              className="flex-1"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor')}
              className="h-10 rounded-md border px-2 text-sm bg-background"
            >
              <option value="viewer">Pode visualizar</option>
              <option value="editor">Pode editar</option>
            </select>
            <Button onClick={handleInvite} disabled={loading || !emailsInput.trim()}>
              Enviar convite
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Pessoas com acesso</h4>
            <div className="rounded-lg border divide-y">
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ownerName} · Você</p>
                    <p className="text-xs text-muted-foreground">{ownerEmail}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Proprietário</span>
              </div>

              {publicShare && (
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Globe2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Qualquer pessoa com o link</p>
                      <p className="text-xs text-muted-foreground">Pode visualizar (link público permanente)</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={togglePublic} disabled={loading}>Desativar</Button>
                </div>
              )}

              {shares.filter(s => !s.publicRole).length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground">Nenhum convite ainda.</div>
              ) : (
                shares.filter(s => !s.publicRole).map((share) => (
                  <div key={share.id} className="flex items-center justify-between px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Mail size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{share.granteeEmail || 'Convite'}</p>
                        <p className="text-xs text-muted-foreground">Convite {share.role === 'editor' ? 'com edição' : 'apenas leitura'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={share.role || 'viewer'}
                        onChange={(e) => handleRoleChange(share.id, e.target.value as 'viewer' | 'editor')}
                        className="h-9 rounded-md border px-2 text-sm bg-background"
                        disabled={loading}
                      >
                        <option value="viewer">Visualizar</option>
                        <option value="editor">Editar</option>
                      </select>
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(share.id)} disabled={loading} title="Remover acesso">
                        <UserX size={16} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 px-3 py-3 text-xs text-muted-foreground flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={14} />
                <span className="text-sm text-foreground">
                  {accessOption === 'restricted' ? 'Acesso restrito' : 'Qualquer pessoa com o link'}
                </span>
              </div>
              <select
                value={accessOption}
                onChange={(e) => handleAccessChange(e.target.value as 'restricted' | 'link_view' | 'link_edit')}
                className="h-9 rounded-md border px-2 text-sm bg-background"
                disabled={loading}
              >
                <option value="restricted">Apenas convites</option>
                <option value="link_view">Link público (visualizar)</option>
                <option value="link_edit" disabled>Link público (editar) - indisponível</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span>Link público não expira.</span>
              <Button variant="ghost" size="sm" className="gap-1" onClick={copyPublicLink} disabled={!publicShare || !publicLink}>
                <LinkIcon size={14} />
                {copyStatus === 'copied' ? 'Copiado' : 'Copiar link'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={onClose}>Fechar</Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ShareModal;
