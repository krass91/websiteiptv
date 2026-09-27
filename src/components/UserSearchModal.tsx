import React, { useState, useMemo } from 'react';
import { useAuth } from '../services/authContext';
import { StorageEngine } from '../services/storage';
import { User } from '../types';
import {
  Search,
  X,
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  MessageSquare,
  Sparkles,
  Calendar,
  Layers,
  Check
} from 'lucide-react';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string, tab?: 'wall' | 'messages') => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
}) => {
  const { currentUser, isFriend, sendFriendRequest, setActiveModal } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'moderator' | 'member'>('all');
  const [actionFeedback, setActionFeedback] = useState<{ userId: string; message: string } | null>(null);

  // All users from StorageEngine (synced with central server across all IPs)
  const allUsers = StorageEngine.getUsers();

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allUsers.filter(user => {
      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }
      if (!q) return true;

      const matchUsername = user.username.toLowerCase().includes(q);
      const matchBio = (user.bio || '').toLowerCase().includes(q);
      const matchRole = user.role.toLowerCase().includes(q);
      const matchEmail = currentUser?.role === 'admin' ? user.email.toLowerCase().includes(q) : false;

      return matchUsername || matchBio || matchRole || matchEmail;
    });
  }, [allUsers, searchTerm, roleFilter, currentUser?.role]);

  if (!isOpen) return null;

  const handleSendFriend = (targetId: string, username: string) => {
    if (!currentUser) {
      setActiveModal('login');
      return;
    }
    const res = sendFriendRequest(targetId);
    setActionFeedback({
      userId: targetId,
      message: res.success ? `Поканата до @${username} е изпратена!` : res.message,
    });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleOpenUserWall = (userId: string) => {
    onSelectUser(userId, 'wall');
    onClose();
  };

  const handleOpenMessages = (userId: string) => {
    if (!currentUser) {
      setActiveModal('login');
      return;
    }
    onSelectUser(userId, 'messages');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Търсене на потребители</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  {allUsers.length} регистрирани
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Всички потребители регистрирани в платформата са видими и достъпни за търсене
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Търси потребител по потребителско име, описание или роля..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5">
            <span className="text-slate-400 mr-1 text-[11px] whitespace-nowrap">Филтър по роля:</span>
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                roleFilter === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Всички ({allUsers.length})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                roleFilter === 'admin'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Администратори ({allUsers.filter(u => u.role === 'admin').length})
            </button>
            <button
              onClick={() => setRoleFilter('moderator')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                roleFilter === 'moderator'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Модератори ({allUsers.filter(u => u.role === 'moderator').length})
            </button>
            <button
              onClick={() => setRoleFilter('member')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                roleFilter === 'member'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Членове ({allUsers.filter(u => u.role === 'member').length})
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
              <Users className="mx-auto h-8 w-8 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-white">Няма намерени потребители</p>
              <p className="text-xs text-slate-400 mt-1">
                Опитайте с друго потребителско име или изчистете търсенето.
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-3 px-3 py-1.5 text-xs text-emerald-400 hover:underline"
                >
                  Изчисти търсенето
                </button>
              )}
            </div>
          ) : (
            filteredUsers.map(user => {
              const isCurrentUser = currentUser?.id === user.id;
              const userIsFriend = currentUser ? isFriend(user.id) : false;
              const hasPending = currentUser ? StorageEngine.hasPendingRequest(currentUser.id, user.id) : false;
              const userPosts = StorageEngine.getPosts().filter(p => p.userId === user.id);
              const isNew = (Date.now() - new Date(user.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
              const feedback = actionFeedback?.userId === user.id ? actionFeedback.message : null;

              return (
                <div
                  key={user.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: User Avatar & Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      onClick={() => handleOpenUserWall(user.id)}
                      className="cursor-pointer shrink-0 relative group"
                    >
                      <img
                        src={user.avatar}
                        alt={user.username}
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 rounded-xl object-cover border border-slate-700 group-hover:border-emerald-400 transition-colors"
                      />
                      {user.role === 'admin' && (
                        <span className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-slate-950 shadow-sm" title="Главен Администратор">
                          <ShieldCheck className="h-3 w-3" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenUserWall(user.id)}
                          className="text-sm font-bold text-white hover:text-emerald-400 transition-colors truncate text-left"
                        >
                          @{user.username}
                        </button>

                        {/* Role badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            user.role === 'admin'
                              ? 'bg-emerald-400 text-slate-950'
                              : user.role === 'moderator'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {user.role === 'admin' ? 'Администратор' : user.role === 'moderator' ? 'Модератор' : 'Член'}
                        </span>

                        {isNew && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Нов</span>
                          </span>
                        )}

                        {isCurrentUser && (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            Вие
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        {user.bio || 'Няма въведено описание.'}
                      </p>

                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3 text-slate-500" />
                          <span>{userPosts.length} публикации</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>Регистриран: {new Date(user.createdAt).toLocaleDateString('bg-BG')}</span>
                        </span>
                      </div>

                      {feedback && (
                        <div className="mt-2 text-xs text-emerald-400 font-medium animate-in fade-in">
                          {feedback}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenUserWall(user.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                    >
                      Виж профил
                    </button>

                    {!isCurrentUser && (
                      <>
                        {userIsFriend ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-lg">
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Приятели</span>
                          </span>
                        ) : hasPending ? (
                          <span className="px-2.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/50 rounded-lg">
                            Чака одобрение
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendFriend(user.id, user.username)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Добави</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenMessages(user.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                          title="Изпрати лично съобщение"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Чат</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Показани {filteredUsers.length} от {allUsers.length} потребители</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Затвори
          </button>
        </div>
      </div>
    </div>
  );
};
