import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../services/authContext';
import { StorageEngine } from '../services/storage';
import { User, Post, DirectMessage } from '../types';
import { Feed } from './Feed';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Shield, 
  Calendar, 
  Mail, 
  Heart, 
  FileText, 
  Eye, 
  Check, 
  X,
  Lock,
  Globe,
  ThumbsUp,
  Flame,
  AlertTriangle
} from 'lucide-react';

interface UserProfileModalProps {
  userId: string | null;
  onClose: () => void;
  onOpenEditPost?: (post: Post) => void;
  initialTab?: 'wall' | 'messages';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  onClose,
  onOpenEditPost,
  initialTab = 'wall',
}) => {
  const { 
    currentUser, 
    allUsers,
    allPosts,
    directMessages,
    sendFriendRequest, 
    respondFriendRequest, 
    removeFriend, 
    toggleFollow, 
    isFriend, 
    isFollowing,
    sendDirectMessage,
    getConversation,
    markConversationAsRead,
    reactToPost,
    addComment
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'wall' | 'messages'>(initialTab);
  const [chatMessage, setChatMessage] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (userId && currentUser && activeTab === 'messages') {
      markConversationAsRead(userId);
    }
  }, [userId, currentUser, activeTab]);

  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, userId]);

  if (!userId) return null;

  const targetUser = allUsers.find(u => u.id === userId) || StorageEngine.getUserById(userId);
  if (!targetUser) return null;

  const isSelf = currentUser?.id === targetUser.id;
  const userIsFriend = currentUser ? isFriend(targetUser.id) : false;
  const userIsFollowing = currentUser ? isFollowing(targetUser.id) : false;
  const hasPending = currentUser ? StorageEngine.hasPendingRequest(currentUser.id, targetUser.id) : false;
  const hasIncomingPending = currentUser ? StorageEngine.getPendingFriendRequestsForUser(currentUser.id).find(r => r.fromUserId === targetUser.id) : null;

  // Posts visible according to privacy:
  // If targetUser posts are queried, filter through StorageEngine.getAuthorizedPosts
  // And filter only those by targetUser!
  const userPosts = StorageEngine.getAuthorizedPosts(currentUser).filter(p => p.userId === targetUser.id);
  const allUserPostsCount = StorageEngine.getPosts().filter(p => p.userId === targetUser.id).length;
  const hiddenPostsCount = allUserPostsCount - userPosts.length;

  const friendsCount = StorageEngine.getFriendsOfUser(targetUser.id).length;
  const followersCount = StorageEngine.getFollowersOfUser(targetUser.id).length;
  const followingCount = StorageEngine.getFollowingOfUser(targetUser.id).length;

  const conversation: DirectMessage[] = useMemo(() => {
    if (!currentUser || !targetUser) return [];
    const all = directMessages.length > 0 ? directMessages : StorageEngine.getMessages();
    const filtered = all.filter(m => 
      (m.senderId === currentUser.id && m.recipientId === targetUser.id) ||
      (m.senderId === targetUser.id && m.recipientId === currentUser.id) ||
      (m.senderUsername?.toLowerCase() === currentUser.username.toLowerCase() && m.recipientUsername?.toLowerCase() === targetUser.username.toLowerCase()) ||
      (m.senderUsername?.toLowerCase() === targetUser.username.toLowerCase() && m.recipientUsername?.toLowerCase() === currentUser.username.toLowerCase())
    );

    // Deduplicate in display: ensure no message with same ID or signature is shown twice
    const unique: DirectMessage[] = [];
    const seenIds = new Set<string>();
    const seenSigs = new Set<string>();

    for (const msg of filtered) {
      if (!msg?.id || seenIds.has(msg.id)) continue;
      const timeBucket = Math.floor(new Date(msg.createdAt).getTime() / 4000);
      const sig = `${msg.senderId}_${msg.recipientId}_${msg.content.trim()}_${timeBucket}`;
      if (seenSigs.has(sig)) continue;

      seenIds.add(msg.id);
      seenSigs.add(sig);
      unique.push(msg);
    }

    return unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [currentUser, targetUser, directMessages]);

  const triggerFeedback = (text: string, error = false) => {
    setFeedback({ text, error });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSendFriendRequest = () => {
    if (!currentUser) return;
    const res = sendFriendRequest(targetUser.id);
    triggerFeedback(res.message, !res.success);
  };

  const handleToggleFollow = () => {
    if (!currentUser) return;
    const nowFollowing = toggleFollow(targetUser.id);
    triggerFeedback(nowFollowing ? `Вече следвате ${targetUser.username}` : `Спряхте да следвате ${targetUser.username}`);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !chatMessage.trim()) return;
    const textToSend = chatMessage.trim();
    setChatMessage('');
    const res = await sendDirectMessage(targetUser.id, textToSend);
    if (res.success) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else if (res.message) {
      triggerFeedback(res.message, true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Затвори"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Стена на профила:</span>
              <span className="text-emerald-400 font-mono">@{targetUser.username}</span>
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
            feedback.error ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
          }`}>
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* User Profile Banner & Header */}
        <div className="p-6 bg-gradient-to-b from-slate-950/80 to-slate-900 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative group">
                <img
                  src={targetUser.avatar}
                  alt={targetUser.username}
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg"
                />
                {targetUser.role === 'admin' && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-[10px] font-extrabold text-slate-950 shadow">
                    ADMIN
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{targetUser.username}</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 capitalize">
                    {targetUser.role}
                  </span>
                  {userIsFriend && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" />
                      <span>Приятел</span>
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                  {targetUser.privacy.showEmail && targetUser.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      {targetUser.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    Член от {new Date(targetUser.createdAt).toLocaleDateString('bg-BG')}
                  </span>
                </div>

                <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  {targetUser.bio || 'Няма въведено описание.'}
                </p>
              </div>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-4 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center shrink-0 w-full sm:w-auto">
              <div className="px-2">
                <span className="block font-mono text-base sm:text-lg font-bold text-white tabular-nums">{allUserPostsCount}</span>
                <span className="text-[10px] text-slate-400">Стриймове</span>
              </div>
              <div className="px-2 border-l border-slate-800">
                <span className="block font-mono text-base sm:text-lg font-bold text-emerald-400 tabular-nums">{friendsCount}</span>
                <span className="text-[10px] text-slate-400">Приятели</span>
              </div>
              <div className="px-2 border-l border-slate-800">
                <span className="block font-mono text-base sm:text-lg font-bold text-teal-400 tabular-nums">{followersCount}</span>
                <span className="text-[10px] text-slate-400">Последователи</span>
              </div>
              <div className="px-2 border-l border-slate-800">
                <span className="block font-mono text-base sm:text-lg font-bold text-cyan-400 tabular-nums">{followingCount}</span>
                <span className="text-[10px] text-slate-400">Последвани</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Friend Request, Follow, Direct Message */}
          {!isSelf && currentUser && (
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2.5 flex-wrap">
              {/* 1. Friend Request Button */}
              {userIsFriend ? (
                <button
                  onClick={() => {
                    removeFriend(targetUser.id);
                    triggerFeedback(`Премахнахте ${targetUser.username} от приятели.`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-400 hover:text-white bg-slate-800 hover:bg-rose-950/60 rounded-xl transition-colors border border-slate-700"
                >
                  <UserX className="h-3.5 w-3.5" />
                  <span>Премахни от приятели</span>
                </button>
              ) : hasIncomingPending ? (
                <button
                  onClick={() => {
                    respondFriendRequest(hasIncomingPending.id, true);
                    triggerFeedback(`Приехте поканата от ${targetUser.username}!`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Приеми поканата за приятелство</span>
                </button>
              ) : hasPending ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded-xl">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Поканата е изпратена (чака)</span>
                </span>
              ) : (
                <button
                  onClick={handleSendFriendRequest}
                  disabled={!targetUser.privacy.allowFriendRequests}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  title={!targetUser.privacy.allowFriendRequests ? 'Потребителят е спрял поканите за приятелство' : 'Изпрати покана за приятелство'}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Поискай приятелство</span>
                </button>
              )}

              {/* 2. Follow Button */}
              <button
                onClick={handleToggleFollow}
                disabled={!targetUser.privacy.allowFollowers}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors border ${
                  userIsFollowing
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                    : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Heart className={`h-3.5 w-3.5 ${userIsFollowing ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                <span>{userIsFollowing ? 'Следван' : 'Последвай'}</span>
              </button>

              {/* 3. Direct Message Button */}
              <button
                onClick={() => setActiveTab('messages')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors border ${
                  activeTab === 'messages'
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                <span>Лично съобщение</span>
                {conversation.filter(m => m.recipientId === currentUser?.id && !m.read).length > 0 && (
                  <span className="h-4 w-4 rounded-full bg-teal-500 text-[10px] font-bold text-slate-950 flex items-center justify-center">
                    {conversation.filter(m => m.recipientId === currentUser?.id && !m.read).length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation: Wall (Стена) vs Direct Messages (Чат) */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('wall')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'wall'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Стена с публикации ({userPosts.length})</span>
          </button>

          {!isSelf && currentUser && (
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition-colors border-b-2 ${
                activeTab === 'messages'
                  ? 'border-teal-400 text-teal-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Чат & Съобщения ({conversation.length})</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          {activeTab === 'wall' && (
            <div className="space-y-4">
              {/* Privacy Notice if some posts are hidden */}
              {hiddenPostsCount > 0 && !userIsFriend && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-200 text-xs flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    {targetUser.username} има {hiddenPostsCount} допълнителни публикации с видимост &ldquo;Само за приятели&rdquo;. Добавете се като приятели за пълен достъп.
                  </span>
                </div>
              )}

              {userPosts.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
                  <FileText className="mx-auto h-8 w-8 text-slate-500 mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-white">Все още няма видими публикации на стената</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Потребителят няма качени публични стриймове или портали за момента.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map(post => {
                    const isPostAuthor = currentUser?.id === post.userId;
                    return (
                      <article
                        key={post.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-slate-700 transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-bold text-white">{post.title}</h4>
                              {post.category === 'thought' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-800">
                                  Мисъл
                                </span>
                              ) : post.category === 'm3u' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-800">
                                  M3U
                                </span>
                              ) : post.category === 'portal' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-800">
                                  Портал
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-800">
                                  MAC
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{post.description}</p>
                          </div>
                          {post.category !== 'thought' && (
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border shrink-0 ${
                              post.status === 'working' ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                              {post.status === 'working' ? 'Работещ' : post.status}
                            </span>
                          )}
                        </div>

                        {/* Content Preview if not thought, or if thought with data */}
                        {(post.content.portalUrl || post.content.macAddress || post.content.m3uUrl || post.content.channelsCount) && (
                          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono space-y-1">
                            {post.content.portalUrl && (
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-slate-500">Портал:</span>
                                <span className="text-emerald-400 truncate">{post.content.portalUrl}</span>
                              </div>
                            )}
                            {post.content.macAddress && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">MAC:</span>
                                <span className="text-teal-300 font-bold">{post.content.macAddress}</span>
                              </div>
                            )}
                            {post.content.m3uUrl && (
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-slate-500">M3U:</span>
                                <span className="text-cyan-300 truncate">{post.content.m3uUrl}</span>
                              </div>
                            )}
                            {post.content.channelsCount && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">Канали:</span>
                                <span className="text-slate-300">{post.content.channelsCount}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interactive Reactions & Comments Footer */}
                        <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                              {/* Like button */}
                              <button
                                onClick={() => reactToPost(post.id, 'like')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                                  post.reactions.like.includes(currentUser?.id || '')
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                                    : 'bg-slate-950/80 text-slate-300 hover:text-rose-400 border-slate-800'
                                }`}
                                title="Харесай публикацията"
                              >
                                <Heart className={`h-3.5 w-3.5 ${post.reactions.like.includes(currentUser?.id || '') ? 'fill-rose-500 text-rose-500 scale-110' : 'text-rose-400'}`} />
                                <span>Харесване</span>
                                <span className="font-mono tabular-nums text-xs font-bold">
                                  {post.reactions.like.length}
                                </span>
                              </button>

                              {/* Working stream reaction */}
                              <button
                                onClick={() => reactToPost(post.id, 'working')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors border ${
                                  post.reactions.working.includes(currentUser?.id || '')
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                    : 'bg-slate-950/80 text-slate-300 hover:text-emerald-400 border-slate-800'
                                }`}
                                title="Работи"
                              >
                                <Flame className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Работи</span>
                                <span className="font-mono tabular-nums text-xs">
                                  {post.reactions.working.length}
                                </span>
                              </button>
                            </div>

                            {/* Comments Toggle */}
                            <button
                              onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors border ${
                                activeCommentPostId === post.id
                                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white'
                              }`}
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                              <span>Коментари ({post.comments.length})</span>
                            </button>
                          </div>

                          {/* Expandable comments & form */}
                          {activeCommentPostId === post.id && (
                            <div className="pt-2 border-t border-slate-800/80 space-y-3">
                              {/* Comment Input */}
                              {currentUser && (
                                <form
                                  onSubmit={e => {
                                    e.preventDefault();
                                    if (!newCommentText.trim()) return;
                                    addComment(post.id, newCommentText);
                                    setNewCommentText('');
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="text"
                                    value={newCommentText}
                                    onChange={e => setNewCommentText(e.target.value)}
                                    placeholder="Напишете коментар..."
                                    className="flex-1 py-1.5 px-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!newCommentText.trim()}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors disabled:opacity-40"
                                  >
                                    Коментирай
                                  </button>
                                </form>
                              )}

                              {/* Comment List */}
                              <div className="space-y-2">
                                {post.comments.length === 0 ? (
                                  <p className="text-xs text-slate-500 italic p-2 text-center">Все още няма коментари. Напишете първия коментар!</p>
                                ) : (
                                  post.comments.map(c => (
                                    <div key={c.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                                      <div className="flex items-center justify-between text-slate-400 mb-1">
                                        <div className="flex items-center gap-2">
                                          <img src={c.userAvatar} alt={c.username} className="h-4 w-4 rounded-full object-cover" />
                                          <span className="font-semibold text-slate-200">{c.username}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500">
                                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className="text-slate-300 ml-6">{c.content}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && !isSelf && currentUser && (
            <div className="flex flex-col h-[400px]">
              {/* Message History */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {conversation.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                    <MessageSquare className="h-8 w-8 text-teal-500/40 mb-2" />
                    <p className="text-xs font-semibold text-white">Все още няма съобщения с {targetUser.username}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Напишете първото съобщение отдолу – за обмен на листи, въпроси или IPTV съвети.
                    </p>
                  </div>
                ) : (
                  conversation.map(msg => {
                    const isFromMe = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isFromMe && (
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderUsername}
                            className="h-7 w-7 rounded-lg object-cover border border-slate-700 mt-1 shrink-0"
                          />
                        )}
                        <div
                          className={`max-w-[78%] rounded-2xl p-3 text-xs leading-relaxed ${
                            isFromMe
                              ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                              : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <span className={`block mt-1 text-[9px] font-mono text-right ${
                            isFromMe ? 'text-emerald-200' : 'text-slate-400'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  placeholder={`Напишете лично съобщение до ${targetUser.username}...`}
                  className="flex-1 px-4 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors disabled:opacity-40 shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Изпрати</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
