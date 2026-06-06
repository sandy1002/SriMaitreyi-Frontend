import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, BookOpen, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { AppLogo } from '@/components/layout/AppLogo';

export function Header() {
  const { user, patient, logout, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to={isAdmin ? '/admin' : isStaff ? '/staff' : user ? '/dashboard' : '/login'} className="flex items-center gap-3">
          <AppLogo size="md" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Srimai</h1>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Admin Console' : isStaff ? 'Staff Workspace' : 'Patient Journal'}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <ShieldCheck className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </Button>
          )}
          {isStaff && !isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/staff">
                <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Staff</span>
              </Link>
            </Button>
          )}
          {!isAdmin && !isStaff && user && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/architecture">
                <BookOpen className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Schema &amp; architecture</span>
              </Link>
            </Button>
          )}

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
              <User className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <span className="font-medium text-foreground">
                  {isAdmin || isStaff ? user.name : patient?.name}
                </span>
                <span className="mx-2 text-muted-foreground">•</span>
                <span className="text-muted-foreground capitalize">{user.role}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Logout</span>
            </Button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
