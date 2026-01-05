import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, Zap, Shield, Terminal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/Header';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(username, password);
    
    if (success) {
      navigate('/admin');
    } else {
      setError('Usuário ou senha inválidos');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container flex items-center justify-center py-16">
        <div className="w-full max-w-md">
          {/* Decorative elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          </div>

          <div className="glass-strong rounded-2xl p-8 animate-slide-up relative overflow-hidden">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-2xl" />
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 rounded-xl bg-primary/30 blur-xl animate-glow-pulse" />
                <div className="relative rounded-xl bg-gradient-to-br from-primary to-accent p-4">
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Acesso <span className="text-primary">Restrito</span>
              </h1>
              <p className="text-sm font-mono text-muted-foreground">
                Autenticação necessária para continuar
              </p>
            </div>
          
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive animate-fade-in">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="font-mono">{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-mono text-muted-foreground">
                  USUÁRIO
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-12 glass border-border/50 focus:border-primary/50 font-mono"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-mono text-muted-foreground">
                  SENHA
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 glass border-border/50 focus:border-primary/50 font-mono"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold neon-glow bg-primary text-primary-foreground hover:bg-primary/90" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 animate-pulse" />
                    Autenticando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Acessar Sistema
                  </span>
                )}
              </Button>
            </form>

            {/* Status indicator */}
            <div className="mt-6 pt-6 border-t border-border/30 flex items-center justify-center gap-3 text-xs font-mono text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Sistema seguro • Conexão criptografada</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
