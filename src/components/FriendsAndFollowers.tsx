import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { StorageEngine } from '../services/storage';
import { User, FriendRequest } from '../types';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Shield, 
  Check, 
  X, 
  Heart, 
  Search,
  MessageCircle,
  Radio,
  Calendar,
  Sparkles
} from 'lucide-react';

interface FriendsAndFollowersProps {
  onSelectUser?: (userId: string, initialTab?: 'wall' | 'messages') => void;
}

export const FriendsAndFollowers: React.FC<FriendsAndFollowersProps> = ({ onSelectUser }) => {
  const { 
    currentUser, 
    pendingRequests, 
    sendFriendRequest, 
    respondFriendRequest, 
    removeFriend, 
    toggleFollow,
    isFriend,
    isFollowing
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'following' | 'followers' | 'discover'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!currentUser) return null;

  const allUsers = StorageEngine.getUsers();
  const friends = StorageEngine.getFriendsOfUser(currentUser.id);
  const following = StorageEngine.getFollowingOfUser(currentUser.id);
  const followers = StorageEngine.getFollowersOfUser(currentUser.id);

  // Users available to discover (excluding current user)
  const discoverUsers = allUsers.filter(u => u.id !== currentUser.id);

  const showFeedback = (text: string, error = false) => {
    setFeedbackMsg({ text, error });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleSendRequest = (targetId: string) => {
    const res = sendFriendRequest(targetId);
    showFeedback(res.message, !res.success);
  };

  const handleToggleFollow = (targetId: string) => {
    const nowFollowing = toggleFollow(targetId);
    const target = StorageEngine.getUserById(targetId);
    showFeedback(nowFollowing ? `Вече следвате ${target?.username}` : `Спряхте да следвате ${target?.username}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              <span>Социална мрежа & Приятелства</span>
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Управлявайте вашите контакти. Достъпът до публикациите с видимост &ldquo;Само за приятели&rdquo; се предоставя на mutual friends.
            </p>
          </div>

          {/* Social Counts Bar (Tabular figures) */}
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-mono font-bold text-emerald-400 tabular-nums">{friends.length}</span>
              <span className="ml-1.5 text-slate-400">Приятели</span>
            </div>
            <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-mono font-bold text-teal-400 tabular-nums">{following.length}</span>
              <span className="ml-1.5 text-slate-400">Последвани</span>
            </div>
            <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-mono font-bold text-cyan-400 tabular-nums">{followers.length}</span>
              <span className="ml-1.5 text-slate-400">Последователи</span>
            </div>
          </div>
        </div>

        {/* Feedback alert */}
        {feedbackMsg && (
          <div className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
            feedbackMsg.error ? 'bg-rose-950/70 border border-rose-800 text-rose-300' : 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
          }`}>
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeTab === 'friends'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>Приятели ({friends.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`relative flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeTab === 'requests'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Покани</span>
          {pendingRequests.length > 0 && (
            <span className="h-4 w-4 rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('following')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeTab === 'following'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Последвани ({following.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('followers')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeTab === 'followers'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Последователи ({followers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('discover')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeTab === 'discover'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Открий членове</span>
        </button>
      </div>

      {/* Tab 1: Friends */}
      {activeTab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
              <Users className="mx-auto h-8 w-8 text-slate-500 mb-2" />
              <p className="text-sm font-semibold text-white">Все още нямате добавени приятели</p>
              <p className="mt-1 text-xs text-slate-400">
                Преминете към раздела &ldquo;Открий членове&rdquo; и изпратете покана на активни куратори.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map(friend => {
                const followingUser = isFollowing(friend.id);
                return (
                  <div
                    key={friend.id}
                    className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start justify-between gap-4"
                  >
                    <div 
                      onClick={() => onSelectUser?.(friend.id, 'wall')}
                      className="flex items-center gap-3 cursor-pointer group flex-1"
                    >
                      <img
                        src={friend.avatar}
                        alt={friend.username}
                        referrerPolicy="no-referrer"
                        className="h-11 w-11 rounded-xl object-cover border border-slate-700 group-hover:border-emerald-500 transition-colors"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                          <span>{friend.username}</span>
                          <span className="text-[10px] text-emerald-400 font-normal underline">Виж стената</span>
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{friend.bio}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-400">
                          <Check className="h-3 w-3" />
                          <span>Има взаимен достъп до &ldquo;Само за приятели&rdquo;</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => onSelectUser?.(friend.id, 'messages')}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1 text-xs font-semibold text-teal-300 bg-teal-950/60 border border-teal-800/80 hover:bg-teal-900/60 rounded-lg transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Чат</span>
                      </button>
                      <button
                        onClick={() => handleToggleFollow(friend.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          followingUser
                            ? 'bg-slate-800 text-slate-300 hover:text-white'
                            : 'bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                        }`}
                      >
                        {followingUser ? 'Следван' : 'Следвай'}
                      </button>
                      <button
                        onClick={() => removeFriend(friend.id)}
                        className="px-3 py-1 text-xs font-medium text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors"
                      >
                        Премахни
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Friend Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
              <UserCheck className="mx-auto h-8 w-8 text-slate-500 mb-2" />
              <p className="text-sm font-semibold text-white">Нямате чакащи покани за приятелство</p>
              <p className="mt-1 text-xs text-slate-400">
                Когато други членове ви изпратят покана, ще можете да я одобрите тук.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(req => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.fromUser.avatar}
                      alt={req.fromUser.username}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{req.fromUser.username}</h4>
                      <p className="text-xs text-slate-400">
                        Изпрати покана на {new Date(req.createdAt).toLocaleDateString('bg-BG')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => respondFriendRequest(req.id, true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Приеми</span>
                    </button>
                    <button
                      onClick={() => respondFriendRequest(req.id, false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Откажи</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Following */}
      {activeTab === 'following' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {following.length === 0 ? (
            <div className="col-span-2 p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
              <p className="text-sm text-slate-400">Все още не следвате никого.</p>
            </div>
          ) : (
            following.map(user => (
              <div key={user.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
                <div 
                  onClick={() => onSelectUser?.(user.id, 'wall')}
                  className="flex items-center gap-3 cursor-pointer group flex-1"
                >
                  <img src={user.avatar} alt={user.username} className="h-10 w-10 rounded-xl object-cover border border-slate-700 group-hover:border-emerald-500 transition-colors" />
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{user.username}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{user.bio}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onSelectUser?.(user.id, 'messages')}
                    className="p-1.5 text-xs text-teal-400 hover:text-white bg-teal-950/60 border border-teal-800/80 rounded-lg"
                    title="Изпрати съобщение"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleFollow(user.id)}
                    className="px-3 py-1 text-xs font-medium text-slate-300 hover:text-rose-400 bg-slate-800 rounded-lg"
                  >
                    Отследвай
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Followers */}
      {activeTab === 'followers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {followers.length === 0 ? (
            <div className="col-span-2 p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
              <p className="text-sm text-slate-400">Все още нямате последователи.</p>
            </div>
          ) : (
            followers.map(user => (
              <div key={user.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
                <div 
                  onClick={() => onSelectUser?.(user.id, 'wall')}
                  className="flex items-center gap-3 cursor-pointer group flex-1"
                >
                  <img src={user.avatar} alt={user.username} className="h-10 w-10 rounded-xl object-cover border border-slate-700 group-hover:border-emerald-500 transition-colors" />
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{user.username}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{user.bio}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectUser?.(user.id, 'messages')}
                    className="p-1.5 text-xs text-teal-400 hover:text-white bg-teal-950/60 border border-teal-800/80 rounded-lg"
                    title="Изпрати съобщение"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs text-emerald-400">Следва ви</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 5: Discover Users */}
      {activeTab === 'discover' && (
        <div className="space-y-4">
          {/* Search & Info Bar */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Търси регистриран потребител по име, био..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-400">
              <span className="font-mono text-emerald-400 font-bold tabular-nums">
                {discoverUsers.filter(u => !searchQuery || u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.bio.toLowerCase().includes(searchQuery.toLowerCase())).length}
              </span>
              <span>регистрирани потребители</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discoverUsers
              .filter(u => !searchQuery || u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.bio.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(user => {
                const userIsFriend = isFriend(user.id);
                const userIsFollowing = isFollowing(user.id);
                const hasPending = StorageEngine.hasPendingRequest(currentUser.id, user.id);
                const userPosts = StorageEngine.getPosts().filter(p => p.userId === user.id);
                const isNewUser = (Date.now() - new Date(user.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

                return (
                  <div
                    key={user.id}
                    className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-between gap-3 hover:border-slate-700/80 transition-all shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        onClick={() => onSelectUser?.(user.id, 'wall')}
                        className="cursor-pointer shrink-0"
                      >
                        <img
                          src={user.avatar}
                          alt={user.username}
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 rounded-xl object-cover border border-slate-700 hover:border-emerald-500 transition-colors"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onSelectUser?.(user.id, 'wall')}
                            className="text-sm font-bold text-white hover:text-emerald-400 transition-colors truncate text-left"
                          >
                            {user.username}
                          </button>
                          <span className={`text-[10px] font-semibold px-2 py-0.2 rounded uppercase ${
                            user.role === 'admin' ? 'bg-emerald-400 text-slate-950 font-bold' : user.role === 'moderator' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {user.role}
                          </span>
                          {isNewUser && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                              <Sparkles className="h-2.5 w-2.5" />
                              <span>Нов</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">{user.bio || 'Няма описание'}</p>

                        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            <span>Член от {new Date(user.createdAt).toLocaleDateString('bg-BG')}</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{userPosts.length} публикации</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => onSelectUser?.(user.id, 'wall')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        Виж профила & стената →
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectUser?.(user.id, 'messages')}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-300 bg-teal-950/60 border border-teal-800/80 hover:bg-teal-900/60 rounded-lg transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Чат</span>
                        </button>

                        {userIsFriend ? (
                          <span className="px-2.5 py-1 text-center text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 rounded-lg">
                            Приятел
                          </span>
                        ) : hasPending ? (
                          <span className="px-2.5 py-1 text-center text-xs text-slate-400 bg-slate-800 rounded-lg">
                            Изпратена
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(user.id)}
                            disabled={!user.privacy.allowFriendRequests}
                            className="px-2.5 py-1 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors disabled:opacity-40"
                          >
                            + Приятелство
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleFollow(user.id)}
                          disabled={!user.privacy.allowFollowers}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 ${
                            userIsFollowing
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-white'
                          }`}
                        >
                          {userIsFollowing ? 'Следван' : 'Следвай'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
