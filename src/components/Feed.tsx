import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { StorageEngine } from '../services/storage';
import { Post, PostCategory, PostVisibility } from '../types';
import { 
  Tv, 
  Lock, 
  Globe, 
  Users, 
  Check, 
  Copy, 
  ThumbsUp, 
  Flame, 
  AlertTriangle, 
  MessageSquare, 
  Download, 
  Calendar, 
  Radio, 
  ExternalLink, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Edit, 
  Sparkles, 
  Heart,
  Plus,
  Send,
  MessageCircle,
  HelpCircle,
  Quote,
  User as UserIcon
} from 'lucide-react';

interface FeedProps {
  onOpenEdit: (post: Post) => void;
  filterUserOnly?: boolean;
  onSelectUser?: (userId: string, tab?: 'wall' | 'messages') => void;
  onOpenCreate?: (category?: PostCategory) => void;
}

export const Feed: React.FC<FeedProps> = ({ 
  onOpenEdit, 
  filterUserOnly = false, 
  onSelectUser,
  onOpenCreate 
}) => {
  const { 
    currentUser, 
    allPosts,
    allUsers,
    setIsUserSearchOpen,
    reactToPost, 
    addComment, 
    deletePost,
    isFriend 
  } = useAuth();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [rawM3uPreviewPost, setRawM3uPreviewPost] = useState<Post | null>(null);

  // Strict visibility enforcement via reactive allPosts from server database
  const accessiblePosts = allPosts.filter(post => {
    if (!currentUser) return post.visibility === 'public';
    if (currentUser.role === 'admin') return true;
    if (post.userId === currentUser.id || (post.authorName && currentUser.username && post.authorName.toLowerCase() === currentUser.username.toLowerCase())) return true;
    if (post.visibility === 'private') return false;
    if (post.visibility === 'friends') return StorageEngine.areFriends(currentUser.id, post.userId);
    if (post.visibility === 'public') return true;
    return false;
  });

  // Apply filters
  let filteredPosts = accessiblePosts;

  if (filterUserOnly && currentUser) {
    filteredPosts = filteredPosts.filter(p => p.userId === currentUser.id);
  }

  if (categoryFilter !== 'all') {
    filteredPosts = filteredPosts.filter(p => p.category === categoryFilter);
  }

  if (visibilityFilter !== 'all') {
    filteredPosts = filteredPosts.filter(p => p.visibility === visibilityFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q) ||
      (p.content.regions && p.content.regions.some(r => r.toLowerCase().includes(q))) ||
      (p.content.portalUrl && p.content.portalUrl.toLowerCase().includes(q)) ||
      (p.content.macAddress && p.content.macAddress.toLowerCase().includes(q))
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(postId, newCommentText);
    setNewCommentText('');
  };

  const downloadM3uFile = (post: Post) => {
    const content = post.content.rawM3u || `#EXTM3U\n#EXTINF:-1,${post.title}\n${post.content.m3uUrl || ''}`;
    const blob = new Blob([content], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const thoughtsCount = accessiblePosts.filter(p => p.category === 'thought').length;
  const m3uCount = accessiblePosts.filter(p => p.category === 'm3u').length;
  const portalCount = accessiblePosts.filter(p => p.category === 'portal').length;
  const macCount = accessiblePosts.filter(p => p.category === 'mac').length;
  const bundleCount = accessiblePosts.filter(p => p.category === 'bundle').length;

  const getCategoryBadge = (cat: PostCategory, authorName?: string) => {
    switch (cat) {
      case 'thought':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 border border-purple-500/40 text-purple-300">
            <MessageSquare className="h-3 w-3 text-purple-400" />
            <span>💬 Какво мисли {authorName || ''}</span>
          </span>
        );
      case 'm3u':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 border border-cyan-500/40 text-cyan-300">
            <Tv className="h-3 w-3 text-cyan-400" />
            <span>📺 M3U Стрийм Листа</span>
          </span>
        );
      case 'portal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
            <Globe className="h-3 w-3 text-emerald-400" />
            <span>🌐 Stalker Портал</span>
          </span>
        );
      case 'mac':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
            <Radio className="h-3 w-3 text-amber-400" />
            <span>🔑 MAC Ключ</span>
          </span>
        );
      case 'bundle':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 border border-indigo-500/40 text-indigo-300">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>📦 VIP Пакет</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SOCIAL QUICK COMPOSER RIBBON (Requirement: "вижда кой публикува в сайта дали пост публикация какво мисли или стрим листа, мак или портал") */}
      {!filterUserOnly && currentUser && (
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm shadow-md">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-xl object-cover border border-slate-700 shrink-0"
            />
            <button
              type="button"
              onClick={() => onOpenCreate?.('thought')}
              className="flex-1 text-left py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors text-xs sm:text-sm"
            >
              Какво мислите днес, <span className="text-white font-semibold">{currentUser.username}</span>? Споделете мисъл, статус или питане...
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenCreate?.('thought')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-950/60 border border-purple-800/60 text-purple-300 hover:bg-purple-900/60 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                <span>Сподели мисъл</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCreate?.('m3u')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 transition-colors"
              >
                <Tv className="h-3.5 w-3.5 text-cyan-400" />
                <span>Стрийм листа (M3U)</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCreate?.('portal')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 transition-colors"
              >
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span>Stalker Портал</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCreate?.('mac')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-950/60 border border-amber-800/60 text-amber-300 hover:bg-amber-900/60 transition-colors"
              >
                <Radio className="h-3.5 w-3.5 text-amber-400" />
                <span>MAC Адрес</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onOpenCreate?.('thought')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm ml-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Публикувай</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. TOP SEARCH & FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Търсене по автор, мисли, заглавие, държави, MAC..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: `Всички (${accessiblePosts.length})` },
            { id: 'thought', label: `💬 Какво мисли (${thoughtsCount})` },
            { id: 'm3u', label: `📺 M3U Листи (${m3uCount})` },
            { id: 'portal', label: `🌐 Портали (${portalCount})` },
            { id: 'mac', label: `🔑 MAC (${macCount})` },
            { id: 'bundle', label: `📦 Пакети (${bundleCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                categoryFilter === tab.id
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Visibility Filter Selector */}
        {!filterUserOnly && (
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            {[
              { id: 'all', label: 'Всички' },
              { id: 'public', label: 'Публични' },
              { id: 'friends', label: 'От приятели' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setVisibilityFilter(v.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  visibilityFilter === v.id
                    ? 'bg-slate-800 text-teal-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Quick User Search in Full DB */}
        <button
          onClick={() => setIsUserSearchOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors whitespace-nowrap self-end sm:self-auto"
          title="Търсене на потребители в цялата база данни"
        >
          <Users className="h-3.5 w-3.5 text-emerald-400" />
          <span>Потребители ({allUsers.length})</span>
        </button>
      </div>

      {/* Posts Count Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Показани {filteredPosts.length} публикации на фийд стената</span>
        <span className="font-mono text-[11px] text-emerald-400">Публична & Частна стена с контрол на видимост</span>
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 mb-3">
            <Tv className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">Няма намерени публикации</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? 'Опитайте да промените критериите за търсене или филтрите.'
              : 'Все още няма споделени публикации в тази категория. Бъдете първият, който публикува!'}
          </p>
          {currentUser && (
            <button
              onClick={() => onOpenCreate?.('thought')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Сподели мисъл или стрийм</span>
            </button>
          )}
        </div>
      )}

      {/* 3. POSTS FEED WALL */}
      <div className="space-y-5">
        {filteredPosts.map(post => {
          const isAuthor = currentUser?.id === post.userId;
          const hasWorkingReaction = post.reactions.working.includes(currentUser?.id || '');
          const hasLiked = post.reactions.like.includes(currentUser?.id || '');
          const hasOfflineReaction = post.reactions.offline.includes(currentUser?.id || '');

          return (
            <article
              key={post.id}
              className={`rounded-2xl border transition-all shadow-sm p-5 backdrop-blur-sm ${
                post.category === 'thought'
                  ? 'border-purple-900/30 bg-slate-900/70 hover:border-purple-700/60'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700/80'
              }`}
            >
              {/* Header: WHO POSTS & CATEGORY BADGE */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectUser?.(post.userId)}
                    className="shrink-0 hover:opacity-85 transition-opacity text-left relative group"
                    title={`Отвори стената и профила на ${post.authorName}`}
                  >
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 rounded-xl object-cover border border-slate-700 group-hover:border-emerald-400 transition-colors"
                    />
                  </button>

                  <div>
                    {/* Author & Badge Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onSelectUser?.(post.userId)}
                        className="text-sm font-bold text-white hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                        title={`Отвори стената на ${post.authorName}`}
                      >
                        <span>{post.authorName}</span>
                      </button>

                      {/* Role badge */}
                      {post.authorName.toLowerCase().includes('admin') || post.userId.includes('admin') ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950 uppercase">
                          Администратор
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                          Член
                        </span>
                      )}

                      {isAuthor && (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50">
                          Вие
                        </span>
                      )}

                      {/* TYPE OF POST BADGE */}
                      {getCategoryBadge(post.category, post.authorName)}
                    </div>

                    {/* Metadata line & Quick social actions with author */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        {post.visibility === 'public' && (
                          <>
                            <Globe className="h-3 w-3 text-slate-400" />
                            <span>Публична</span>
                          </>
                        )}
                        {post.visibility === 'friends' && (
                          <>
                            <Users className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Само за приятели</span>
                          </>
                        )}
                        {post.visibility === 'private' && (
                          <>
                            <Lock className="h-3 w-3 text-amber-400" />
                            <span className="text-amber-400">Лична</span>
                          </>
                        )}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(post.createdAt).toLocaleDateString('bg-BG')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {/* Quick social actions to interact with author */}
                      <span aria-hidden="true">·</span>
                      <div className="inline-flex items-center gap-1.5">
                        {!isAuthor && currentUser && (
                          <button
                            type="button"
                            onClick={() => onSelectUser?.(post.userId, 'messages')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/70 border border-purple-800/70 text-purple-300 hover:bg-purple-900 hover:text-white transition-colors"
                            title={`Пиши лично съобщение на ${post.authorName}`}
                          >
                            <MessageSquare className="h-3 w-3 text-purple-400" />
                            <span>Пиши съобщение</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectUser?.(post.userId, 'wall')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title={`Отвори стената и профила на ${post.authorName}`}
                        >
                          <UserIcon className="h-3 w-3 text-emerald-400" />
                          <span>Стена на автора</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Author or Admin Actions */}
                {(isAuthor || currentUser?.role === 'admin') && (
                  <div className="flex items-center gap-1">
                    {currentUser?.role === 'admin' && !isAuthor && (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                        Модерация
                      </span>
                    )}
                    <button
                      onClick={() => onOpenEdit(post)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title={currentUser?.role === 'admin' ? "Редактирай като админ" : "Редактирай"}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title={currentUser?.role === 'admin' ? "Изтрий като админ" : "Изтрий"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title Header */}
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {post.title}
              </h3>

              {/* CONTENT RENDERING: IF THOUGHT (МИСЪЛ) vs IPTV TECHNICAL DATA */}
              {post.category === 'thought' ? (
                <div className="mt-3 p-4 rounded-xl border border-purple-900/40 bg-purple-950/20 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-2 right-3 opacity-10 text-purple-400 pointer-events-none">
                    <Quote className="h-16 w-16" />
                  </div>
                  <div className="relative">
                    <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal whitespace-pre-wrap">
                      {post.description}
                    </p>

                    {post.content.notes && (
                      <div className="mt-3 pt-2 border-t border-purple-900/30 text-xs text-purple-300/80 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <span>Бележка: {post.content.notes}</span>
                      </div>
                    )}

                    {/* Optional stream data attached to thought */}
                    {(post.content.portalUrl || post.content.m3uUrl || post.content.macAddress) && (
                      <div className="mt-3 pt-3 border-t border-purple-900/40 space-y-2">
                        <span className="text-[11px] font-semibold text-purple-300 block">
                          Прикачени данни към мисълта:
                        </span>
                        {post.content.portalUrl && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                            <span className="text-xs font-mono text-emerald-400 truncate">{post.content.portalUrl}</span>
                            <button
                              onClick={() => handleCopy(post.content.portalUrl!, `portal_${post.id}`)}
                              className="px-2 py-0.5 text-[11px] rounded bg-slate-800 text-slate-200 hover:text-white"
                            >
                              {copiedKey === `portal_${post.id}` ? 'Копиран' : 'Копирай'}
                            </button>
                          </div>
                        )}
                        {post.content.m3uUrl && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                            <span className="text-xs font-mono text-cyan-400 truncate">{post.content.m3uUrl}</span>
                            <button
                              onClick={() => handleCopy(post.content.m3uUrl!, `m3u_${post.id}`)}
                              className="px-2 py-0.5 text-[11px] rounded bg-slate-800 text-slate-200 hover:text-white"
                            >
                              {copiedKey === `m3u_${post.id}` ? 'Копиран' : 'Копирай'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {post.description}
                  </p>

                  {/* IPTV Technical Content Card */}
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-3">
                    {/* 1. Portal URL */}
                    {post.content.portalUrl && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                            Портал URL:
                          </span>
                          <code className="text-xs font-mono text-emerald-400 truncate">
                            {post.content.portalUrl}
                          </code>
                        </div>
                        <button
                          onClick={() => handleCopy(post.content.portalUrl!, `portal_${post.id}`)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors shrink-0 self-end sm:self-auto"
                        >
                          {copiedKey === `portal_${post.id}` ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Копиран</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Копирай URL</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* 2. MAC Address */}
                    {post.content.macAddress && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                            MAC Адрес:
                          </span>
                          <code className="text-sm font-mono font-bold text-amber-400 tracking-wider">
                            {post.content.macAddress}
                          </code>
                        </div>
                        <button
                          onClick={() => handleCopy(post.content.macAddress!, `mac_${post.id}`)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors shrink-0 self-end sm:self-auto"
                        >
                          {copiedKey === `mac_${post.id}` ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Копиран</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Копирай MAC</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* 3. M3U Link / Download */}
                    {post.content.m3uUrl && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                            M3U Линк:
                          </span>
                          <code className="text-xs font-mono text-cyan-400 truncate">
                            {post.content.m3uUrl}
                          </code>
                        </div>
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => handleCopy(post.content.m3uUrl!, `m3u_${post.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                          >
                            {copiedKey === `m3u_${post.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>Копирай</span>
                          </button>
                          <button
                            onClick={() => downloadM3uFile(post)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/70 border border-emerald-800/60 rounded-md transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Свали .m3u</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 4. Raw M3U Preview Button */}
                    {post.content.rawM3u && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                        <span className="text-xs text-slate-300 font-medium">
                          Вградено M3U съдържание ({post.content.rawM3u.split('\n').length} реда)
                        </span>
                        <button
                          onClick={() => setRawM3uPreviewPost(post)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Преглед на плейлиста</span>
                        </button>
                      </div>
                    )}

                    {/* Additional Spec Attributes */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                      {post.content.channelsCount && (
                        <span>Канали: <strong className="text-slate-200 font-mono">{post.content.channelsCount}</strong></span>
                      )}
                      {post.content.expiryDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Валиден до: <strong className="text-emerald-400 font-mono">{post.content.expiryDate}</strong></span>
                        </>
                      )}
                      {post.content.serverSpeed && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Сървър: <strong className="text-slate-200">{post.content.serverSpeed}</strong></span>
                        </>
                      )}
                      {post.content.regions && post.content.regions.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Региони: <strong className="text-slate-200">{post.content.regions.join(', ')}</strong></span>
                        </>
                      )}
                    </div>

                    {post.content.notes && (
                      <p className="text-[11px] text-slate-400 italic border-t border-slate-800/60 pt-2">
                        Бележка: {post.content.notes}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Interactive Footer: Reactions & Comments */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Reactions */}
                  <div className="flex items-center gap-2">
                    {/* Like button */}
                    <button
                      onClick={() => reactToPost(post.id, 'like')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shadow-sm ${
                        hasLiked
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-rose-950/40'
                          : 'bg-slate-800/90 text-slate-300 hover:text-rose-400 hover:bg-slate-800 border border-slate-700/60'
                      }`}
                      title="Харесай публикацията"
                    >
                      <Heart className={`h-4 w-4 ${hasLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-rose-400'} transition-transform`} />
                      <span>{hasLiked ? 'Харесано' : 'Харесай'}</span>
                      <span className="font-mono tabular-nums text-xs ml-0.5 font-bold">
                        {post.reactions.like.length}
                      </span>
                    </button>

                    {/* Working Stream confirmation (for IPTV) */}
                    {post.category !== 'thought' && (
                      <button
                        onClick={() => reactToPost(post.id, 'working')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors border ${
                          hasWorkingReaction
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : 'bg-slate-800/90 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 border-slate-700/60'
                        }`}
                        title="Потвърди, че стриймът работи отлично"
                      >
                        <ThumbsUp className={`h-3.5 w-3.5 ${hasWorkingReaction ? 'text-emerald-400 fill-emerald-500/30' : 'text-slate-400'}`} />
                        <span>Работи</span>
                        <span className="font-mono tabular-nums text-xs ml-0.5">{post.reactions.working.length}</span>
                      </button>
                    )}

                    {/* Offline report (for IPTV) */}
                    {post.category !== 'thought' && (
                      <button
                        onClick={() => reactToPost(post.id, 'offline')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors border ${
                          hasOfflineReaction
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                            : 'bg-slate-800/90 text-slate-300 hover:text-amber-400 hover:bg-slate-800 border-slate-700/60'
                        }`}
                        title="Сигнализирай за проблем или офлайн"
                      >
                        <AlertTriangle className={`h-3.5 w-3.5 ${hasOfflineReaction ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span>Офлайн</span>
                        <span className="font-mono tabular-nums text-xs ml-0.5">{post.reactions.offline.length}</span>
                      </button>
                    )}
                  </div>

                  {/* Comments counter button */}
                  <button
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700/60"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Коментари ({post.comments.length})</span>
                  </button>
                </div>

                {/* Comments Section Drawer */}
                {activeCommentPostId === post.id && (
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="space-y-2">
                      {post.comments.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2 text-center">
                          Все още няма коментари. Напишете първия коментар!
                        </p>
                      ) : (
                        post.comments.map(c => (
                          <div key={c.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5">
                            <button
                              type="button"
                              onClick={() => onSelectUser?.(c.userId)}
                              className="shrink-0 hover:opacity-85"
                            >
                              <img
                                src={c.userAvatar}
                                alt={c.username}
                                referrerPolicy="no-referrer"
                                className="h-7 w-7 rounded-lg object-cover border border-slate-700"
                              />
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <button
                                  type="button"
                                  onClick={() => onSelectUser?.(c.userId)}
                                  className="text-xs font-bold text-white hover:text-emerald-400 transition-colors"
                                >
                                  {c.username}
                                </button>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(c.createdAt).toLocaleDateString('bg-BG')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Input */}
                    {currentUser && (
                      <form onSubmit={e => handleCommentSubmit(e, post.id)} className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={e => setNewCommentText(e.target.value)}
                          placeholder="Напишете вашия коментар или отговор тук..."
                          className="flex-1 py-1.5 px-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          disabled={!newCommentText.trim()}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 transition-colors"
                        >
                          Изпрати
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Raw M3U Preview Modal */}
      {rawM3uPreviewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tv className="h-4 w-4 text-emerald-400" />
                  <span>Преглед на плейлист: {rawM3uPreviewPost.title}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {rawM3uPreviewPost.content.rawM3u?.split('\n').length} реда в плейлиста
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadM3uFile(rawM3uPreviewPost)}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950 border border-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Свали .m3u</span>
                </button>
                <button
                  onClick={() => setRawM3uPreviewPost(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                >
                  Затвори
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-slate-950">
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap select-all leading-relaxed">
                {rawM3uPreviewPost.content.rawM3u}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
