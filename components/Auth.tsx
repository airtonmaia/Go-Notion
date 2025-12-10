
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import * as AuthService from '../services/auth';
import { Loader2, Lock, Mail, AlertCircle, Coffee } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await AuthService.signIn(email, password);
      } else {
        await AuthService.signUp(email, password);
        // Auto login is handled by Supabase usually, but let's inform user if confirmation needed
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro de autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border shadow-lg">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Coffee className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isLogin ? 'Entre para acessar suas notas' : 'Comece a organizar suas ideias hoje'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
             <label className="text-sm font-medium leading-none">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
          </span>
          <button
            type="button"
            onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
            }}
            className="font-medium text-primary hover:underline"
          >
            {isLogin ? 'Cadastre-se' : 'Faça Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
