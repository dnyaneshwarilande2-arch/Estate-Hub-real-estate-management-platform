import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Home, Heart, Plus, LayoutDashboard, LogOut, Menu, X, Building2, Key, Gem, User, Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from '@/components/Logo';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Find current language name from i18n state
  const currentLang = i18n.language.startsWith('hi') ? 'Hindi (हिंदी)' :
    i18n.language.startsWith('mr') ? 'Marathi (मराठी)' :
      i18n.language.startsWith('ta') ? 'Tamil (தமிழ்)' :
        i18n.language.startsWith('te') ? 'Telugu (తెలుగు)' : 'English';

  const [selectedLang, setSelectedLang] = useState(currentLang);

  const languages = [
    { name: 'English', code: 'en' },
    { name: 'Hindi (हिंदी)', code: 'hi' },
    { name: 'Marathi (मराठी)', code: 'mr' },
    { name: 'Tamil (தமிழ்)', code: 'ta' },
    { name: 'Telugu (తెలుగు)', code: 'te' },
  ];

  const handleLanguageChange = (lang: { name: string, code: string }) => {
    setSelectedLang(lang.name);
    i18n.changeLanguage(lang.code);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/'; // hard reload so state is fully clean
  };

  const links = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/properties?type=sale', label: t('nav.buy'), icon: Building2 },
    { to: '/properties?type=rent', label: t('nav.rent'), icon: Key },
    ...(user ? [
      ...(user.role !== 'admin' ? [
        { to: '/favorites', label: t('nav.favorites'), icon: Heart },
        { to: '/add-property', label: t('nav.sell'), icon: Plus },
        { to: '/dashboard', label: t('nav.my_properties'), icon: LayoutDashboard },
      ] : [
        { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
      ]),
    ] : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">

        {/* Logo */}
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(l => (
            <Button
              key={l.to}
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => {
                navigate(l.to);
                setMobileOpen(false);
              }}
            >
              <l.icon className="h-4 w-4" />{l.label}
            </Button>
          ))}
        </nav>

        {/* Desktop auth buttons & Language */}
        <div className="hidden items-center gap-3 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 font-medium">
                <Languages className="h-4 w-4 text-primary" />
                {selectedLang}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-border/50 bg-background/95 backdrop-blur-lg">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang)}
                  className={cn(
                    "flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-lg transition-colors",
                    selectedLang === lang.name ? "bg-primary/10 text-primary" : "hover:bg-accent"
                  )}
                >
                  <span className="font-medium">{lang.name}</span>
                  {selectedLang === lang.name && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-[1px] bg-border/40 mx-1" />

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground max-w-[150px] truncate">
                {user.fullName}
              </span>
              <Badge variant="outline" className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2 h-6 flex items-center justify-center",
                user.role === 'admin' ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-600"
              )}>
                {user.role}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" /> {t('nav.sign_out')}
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/login'}>
                {t('nav.sign_in')}
              </Button>
              <Button size="sm" onClick={() => window.location.href = '/register'}>
                {t('nav.register')}
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map(l => (
              <Button
                key={l.to}
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  navigate(l.to);
                  setMobileOpen(false);
                }}
              >
                <l.icon className="h-4 w-4" />{l.label}
              </Button>
            ))}
            {user ? (
              <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" /> {t('nav.sign_out')}
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="w-full justify-start" onClick={() => window.location.href = '/login'}>
                  {t('nav.sign_in')}
                </Button>
                <Button className="w-full mt-2" onClick={() => window.location.href = '/register'}>
                  {t('nav.register')}
                </Button>
              </>
            )}

            <div className="my-2 h-[1px] bg-border/40" />

            <div className="px-2 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-2">{t('nav.language')}</p>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={selectedLang === lang.name ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "justify-start h-9 px-3 rounded-lg text-xs font-medium",
                      selectedLang === lang.name ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
                    )}
                    onClick={() => handleLanguageChange(lang)}
                  >
                    {lang.name}
                  </Button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
