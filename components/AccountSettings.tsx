import React, { useState, useEffect } from 'react';
import { User, Lock, Save, Shield, ShieldCheck, Mail, UserCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Profile } from '../types';
import * as AuthService from '../services/auth';

interface AccountSettingsProps {
  onBack: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await AuthService.getProfile();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erro ao carregar perfil.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await AuthService.updateProfile({ full_name: fullName });
      
      if (newPassword) {
        if (newPassword.length < 6) {
          throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("As senhas não coincidem.");
        }
        await AuthService.updatePassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
      }

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      loadProfile(); // Refresh
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar perfil.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full p-6 md:p-10 space-y-8">
        
        <div className="flex items-center justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Minha Conta</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e segurança.</p>
          </div>
          <Button variant="outline" onClick={onBack}>Voltar</Button>
        </div>

        {message && (
          <div className={`p-4 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-destructive/15 text-destructive'}`}>
            {message.text}
          </div>
        )}

        {profile?.role === 'admin' && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-4">
            <div className="p-2 bg-primary/20 rounded-full">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Super Administrador
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Ativo</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Você tem privilégios totais de gerenciamento no sistema.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-8">
          
          {/* Personal Info */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <UserCircle className="h-5 w-5" /> Informações Pessoais
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={profile?.email} disabled className="pl-9 bg-muted cursor-not-allowed opacity-70" />
                </div>
                <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo</label>
                <Input 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Seu nome"
                />
              </div>
            </div>
          </section>

          <hr />

          {/* Security */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Lock className="h-5 w-5" /> Segurança
            </h2>
            <p className="text-sm text-muted-foreground">Deixe os campos em branco se não quiser alterar sua senha.</p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nova Senha</label>
                <Input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmar Nova Senha</label>
                <Input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </section>

          <div className="pt-4 flex justify-end">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
              {!saving && <Save className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSettings;