import { Link, useLocation } from 'react-router-dom';
import { Images, LogIn, LogOut, Hexagon, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// Identificador da instância (configurar via variável de ambiente no Azure)
const INSTANCE_ID = import.meta.env.VITE_INSTANCE_ID || 'Local';

export function Header() {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-primary/20 blur-lg group-hover:bg-primary/30 transition-colors" />
            <div className="relative rounded-lg bg-gradient-to-br from-primary to-accent p-2.5">
              <Images className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground tracking-tight">
              AZURE<span className="text-primary">GALLERY</span>
            </span>
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
              Media Storage System
            </span>
          </div>
        </Link>

        {/* Identificador da Instância - para demonstração de Load Balancing */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 border border-border/50">
          <Server className="h-3 w-3 text-primary" />
          <span className="text-xs font-mono text-muted-foreground">
            {INSTANCE_ID}
          </span>
        </div>

        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button
                variant={location.pathname === '/admin' ? 'default' : 'ghost'}
                size="sm"
                asChild
                className={location.pathname === '/admin' ? 'neon-glow' : 'hover:text-primary'}
              >
                <Link to="/admin">
                  <Hexagon className="mr-2 h-4 w-4" />
                  Admin
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="hover:text-primary"
            >
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
