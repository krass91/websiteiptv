import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { 
  ShieldCheck, 
  Lock, 
  Tv, 
  Users, 
  Key, 
  Zap, 
  ArrowRight,
  Eye,
  Radio,
  Sparkles,
  Calendar,
  MessageSquare,
  Search
} from 'lucide-react';

interface LandingHeroProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onOpenRegister, onOpenLogin }) => {
  const { allUsers, allPosts, setIsUserSearchOpen } = useAuth();
  const [userQuery, setUserQuery] = useState('');

  const [selectedUserModal, setSelectedUserModal] = useState<any>(null);

  const displayedUsers = allUsers.filter(u => {
    if (!userQuery.trim()) return true;
    const q = userQuery.toLowerCase();
    return u.username.toLowerCase().includes(q) || (u.bio || '').toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  return (
    <div className="relative overflow-hidden space-y-16">
      {/* Background Glow Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none opacity-20">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-cyan-600 rounded-full blur-[120px]" />
      </div>

      {/* Hero Header */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-medium text-emerald-300 backdrop-blur-sm mb-6">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          <span>Dark IPTV · Криптирана частна платформа за стриймове</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto text-balance">
          Платформа за <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">IPTV портали</span>, M3U листи и MAC адреси
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Профилите и кураторите на общността са открити за разглеждане, но самото IPTV съдържание (стрийм адреси, портали и MAC ключове) е <strong className="text-emerald-400">напълно заключено до регистрация и вход</strong>.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onOpenRegister}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Регистрация с код за активация</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenLogin}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-slate-900 border border-slate-700 hover:border-slate-600 hover:bg-slate-800 transition-all"
          >
            <span>Вход за членове</span>
          </button>
        </div>
      </div>

      {/* Community Proof Metrics - Fresh start from 0! */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border border-slate-800/80 bg-slate-900/40 rounded-2xl">
          <div className="text-center">
            <p className="font-mono text-3xl font-bold text-white tabular-nums">{allPosts.length}</p>
            <p className="mt-1 text-xs text-slate-400">Активни публикации (Старт от 0)</p>
          </div>
          <div className="text-center border-l border-slate-800/80">
            <p className="font-mono text-3xl font-bold text-emerald-400 tabular-nums">{allUsers.length}</p>
            <p className="mt-1 text-xs text-slate-400">Регистрирани потребители</p>
          </div>
          <div className="text-center border-l border-slate-800/80">
            <p className="font-mono text-3xl font-bold text-teal-400 tabular-nums">0</p>
            <p className="mt-1 text-xs text-slate-400">Сталкери & MAC адреси (Чист старт)</p>
          </div>
          <div className="text-center border-l border-slate-800/80">
            <p className="font-mono text-3xl font-bold text-white tabular-nums">100%</p>
            <p className="mt-1 text-xs text-slate-400">Защитени стриймове</p>
          </div>
        </div>
      </div>

      {/* SECTION: OPEN PUBLIC PROFILES & WHAT USERS HAVE WRITTEN */}
      {/* Requirement: "открит да се виждат профилите и какво са писали ама постовете да са заключени докато не са регистрирани" */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <Eye className="h-4 w-4" />
              <span>Открита общност · Споделена база данни</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              Потребителски профили & Куратори
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Всеки регистриран потребител е видим в общата база данни, независимо от IP адреса.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsUserSearchOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Търси в пълната база данни</span>
            </button>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              {allUsers.length} регистрирани
            </span>
          </div>
        </div>

        {/* Quick inline search on landing page */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={userQuery}
            onChange={e => setUserQuery(e.target.value)}
            placeholder="Филтрирай потребители по име или био..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedUsers.map(user => {
            const userPosts = allPosts.filter(p => p.userId === user.id);
            const isAdmin = user.role === 'admin';

            return (
              <div
                key={user.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{user.username}</span>
                        {isAdmin && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950">
                            ADMIN
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {user.role === 'moderator' ? 'Модератор' : user.role === 'admin' ? 'Главен Администратор' : 'Член на платформата'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
                    {user.bio || 'Няма въведено описание.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Публикации:</span>
                    <span className="font-mono text-emerald-400 font-bold">{userPosts.length}</span>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    onClick={() => setSelectedUserModal(user)}
                    className="w-full py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Преглед на профила</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: LOCKED POSTS PREVIEW (Locked until registered) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 relative overflow-hidden">
          <div className="flex flex-col items-center text-center max-w-xl mx-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4">
              <Lock className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-white">
              IPTV стриймовете и MAC адресите са заключени
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              За да защитим порталите от претоварване и спиране, съдържанието на публикациите (M3U плейлисти, Stalker портове и MAC адреси) се отключва <strong className="text-white">единствено за регистрирани и верифицирани потребители</strong>.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <button
                onClick={onOpenRegister}
                className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm"
              >
                Регистрирай се за пълен достъп
              </button>
              <button
                onClick={onOpenLogin}
                className="px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-xl transition-colors"
              >
                Вече имам акаунт (Вход)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Modal for Guests */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setSelectedUserModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 pb-4 border-b border-slate-800 mb-4">
              <img
                src={selectedUserModal.avatar}
                alt={selectedUserModal.username}
                className="h-16 w-16 rounded-2xl object-cover border border-slate-700"
              />
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{selectedUserModal.username}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
                    {selectedUserModal.role}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Регистриран на {new Date(selectedUserModal.createdAt).toLocaleDateString('bg-BG')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  За потребителя:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedUserModal.bio || 'Няма въведено описание.'}
                </p>
              </div>

              {/* Locked posts section notice */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                  <Lock className="h-4 w-4" />
                  <span>Публикациите на {selectedUserModal.username} са заключени</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Този куратор споделя IPTV листи, портали и MAC ключове. Направете безплатна регистрация, за да отключите стриймовете.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedUserModal(null);
                    onOpenRegister();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors"
                >
                  Регистрация за отключване
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
