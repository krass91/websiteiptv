import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { 
  Tv, 
  ShieldCheck, 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  User as UserIcon, 
  Plus, 
  Mail, 
  Users, 
  Sparkles,
  FileCode,
  CheckCircle2,
  Lock,
  Menu,
  X,
  Sliders,
  MessageSquare
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openCreateModal }) => {
  const { 
    currentUser, 
    isAuthenticated, 
    theme, 
    toggleTheme, 
    logout, 
    unreadNotifsCount, 
    unreadMessagesCount,
    setActiveModal,
    simulatedEmails,
    allUsers,
    setIsUserSearchOpen,
  } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('feed')} 
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Tv className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Dark
                <span className="text-emerald-400">IPTV</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  Private
                </span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean text with active state) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'feed'
                  ? 'bg-slate-800/80 text-emerald-400 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <span>Фийд Стена</span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'messages'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Лични съобщения — вижте кой ви е писал"
            >
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <span>Съобщения</span>
              {unreadMessagesCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-bold text-slate-950 px-1 animate-pulse font-mono">
                  {unreadMessagesCount}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('my-posts')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'my-posts'
                  ? 'bg-slate-800/80 text-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Моите публикации
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'social'
                  ? 'bg-slate-800/80 text-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Приятели & Мрежа
            </button>

            {/* Admin Control Panel Tab */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin-panel')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                  activeTab === 'admin-panel'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Контролен панел</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('m3u-tools')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'm3u-tools'
                  ? 'bg-slate-800/80 text-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              M3U Анализатор
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('architecture')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'architecture'
                    ? 'bg-slate-800/80 text-emerald-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
                title="Достъпна само за главен администратор"
              >
                <span>Архитектура & API</span>
                <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-400 px-1 py-0.2 rounded font-mono">ADMIN</span>
              </button>
            )}
          </nav>
        )}

        {/* Zone 3: Actions & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Universal User Search in Full Database Button */}
          <button
            onClick={() => setIsUserSearchOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 hover:text-white transition-colors text-xs font-semibold shadow-sm"
            title="Търсене на регистрирани потребители в цялата база данни"
          >
            <Users className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Търси потребители</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40">
              {allUsers.length}
            </span>
          </button>

          {/* Direct Messages Inbox Icon Trigger */}
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('messages')}
              title="Съобщения (Кой ми е писал)"
              className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                activeTab === 'messages'
                  ? 'border-purple-600 bg-purple-950 text-purple-200'
                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <MessageSquare className="h-4 w-4 text-purple-400" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-bold text-slate-950 animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          )}

          {/* Simulated Email Inbox Trigger */}
          <button
            onClick={() => setActiveModal('email-box')}
            title="Симулиран имейл входящ поток (Активационни кодове & Линк за ресет)"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <Mail className="h-4 w-4" />
            {simulatedEmails.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {simulatedEmails.length}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Превключване на тема"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Add Post Button */}
              <button
                onClick={openCreateModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Нова публикация</span>
              </button>

              {/* Notifications Button */}
              <button
                onClick={() => setActiveTab('notifications')}
                title="Известия"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors focus:outline-none"
                >
                  <img
                    src={currentUser?.avatar}
                    alt={currentUser?.username}
                    referrerPolicy="no-referrer"
                    className="h-7 w-7 rounded-md object-cover border border-slate-700"
                  />
                  <span className="hidden lg:inline text-xs font-medium text-slate-200 truncate max-w-[120px]">
                    {currentUser?.username}
                  </span>
                  {isAdmin && (
                    <span className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950 uppercase">
                      Admin
                    </span>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl ring-1 ring-black/40 z-50">
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                      <p className="text-xs font-semibold text-white truncate flex items-center justify-between">
                        <span>{currentUser?.username}</span>
                        {isAdmin && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950">
                            Главен Админ
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">{currentUser?.email}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Верифициран акаунт</span>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setActiveTab('admin-panel');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-950/40 rounded-md transition-colors font-semibold"
                      >
                        <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Контролен панел (Админ)</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveTab('messages');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-purple-300 hover:bg-purple-950/50 hover:text-white rounded-md transition-colors font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                        <span>Съобщения (Кой ми е писал)</span>
                      </span>
                      {unreadMessagesCount > 0 ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 font-bold text-[10px]">
                          {unreadMessagesCount} нови
                        </span>
                      ) : null}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>Моят профил & Настройки</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('my-posts');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Моите публикации</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('social');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Приятели & Последователи</span>
                    </button>

                    <div className="border-t border-slate-800/80 pt-1 mt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-md transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Изход от профила</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModal('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
              >
                Вход
              </button>
              <button
                onClick={() => setActiveModal('register')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
              >
                Регистрация
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300"
          >
            {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {showMobileMenu && isAuthenticated && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-2">
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setActiveTab('admin-panel');
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-emerald-400 font-semibold hover:bg-slate-900 rounded-lg"
              >
                ⚙ Контролен панел (Админ)
              </button>
              <button
                onClick={() => {
                  setActiveTab('architecture');
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 font-medium hover:bg-slate-900 rounded-lg flex items-center justify-between"
              >
                <span>Архитектура & API</span>
                <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-400 px-1 py-0.2 rounded font-mono">ADMIN</span>
              </button>
            </>
          )}
          <button
            onClick={() => {
              setActiveTab('feed');
              setShowMobileMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-emerald-400 font-semibold hover:bg-slate-900 rounded-lg flex items-center gap-2"
          >
            <span>Фийд Стена (Публикации & Стриймове)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('messages');
              setShowMobileMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-purple-300 font-semibold hover:bg-slate-900 rounded-lg flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <span>Съобщения (Кой ми е писал)</span>
            </span>
            {unreadMessagesCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-bold text-xs">
                {unreadMessagesCount} нови
              </span>
            ) : null}
          </button>
          <button
            onClick={() => {
              setActiveTab('my-posts');
              setShowMobileMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 rounded-lg"
          >
            Моите публикации
          </button>
          <button
            onClick={() => {
              setActiveTab('social');
              setShowMobileMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 rounded-lg"
          >
            Приятели & Мрежа
          </button>
          <button
            onClick={() => {
              setActiveTab('m3u-tools');
              setShowMobileMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 rounded-lg"
          >
            M3U Анализатор
          </button>
          <button
            onClick={() => {
              setActiveTab('profile');
              setShowMobileMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 rounded-lg"
          >
            Моят профил
          </button>
          <button
            onClick={() => {
              openCreateModal();
              setShowMobileMenu(false);
            }}
            className="w-full mt-2 py-2 text-sm font-semibold text-slate-950 bg-emerald-400 rounded-lg"
          >
            + Нова публикация
          </button>
        </div>
      )}
    </header>
  );
};
