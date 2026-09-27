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
  Heart
} from 'lucide-react';

interface FeedProps {
  onOpenEdit: (post: Post) => void;
  filterUserOnly?: boolean;
  onSelectUser?: (userId: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ onOpenEdit, filterUserOnly = false, onSelectUser }) => {
  const { 
    currentUser, 
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

  // Requirement: strict visibility enforcement via StorageEngine.getAuthorizedPosts(currentUser)
  const accessiblePosts = StorageEngine.getAuthorizedPosts(currentUser);

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

  const getCategoryLabel = (cat: PostCategory) => {
    switch (cat) {
      case 'm3u': return 'IPTV M3U Плейлист';
      case 'portal': return 'Stalker / Xtream Портал';
      case 'mac': return 'MAC Адрес';
      case 'bundle': return 'Комбиниран пакет';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Търсене по заглавие, канали, държави, MAC..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: 'Всички' },
            { id: 'm3u', label: 'M3U' },
            { id: 'portal', label: 'Портали' },
            { id: 'mac', label: 'MAC' },
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
      </div>

      {/* Posts Count Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Показани {filteredPosts.length} публикации според вашите права за достъп</span>
        <span className="font-mono text-[11px] text-emerald-400">Частен криптиран feed</span>
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
              : 'Все още няма публикации с това ниво на видимост. Създайте първата си публикация!'}
          </p>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-5">
        {filteredPosts.map(post => {
          const isAuthor = currentUser?.id === post.userId;
          const hasWorkingReaction = post.reactions.working.includes(currentUser?.id || '');
          const hasLiked = post.reactions.like.includes(currentUser?.id || '');
          const hasOfflineReaction = post.reactions.offline.includes(currentUser?.id || '');

          return (
            <article
              key={post.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-5 hover:border-slate-700/80 transition-all shadow-sm"
            >
              {/* Header: Clean unboxed metadata with typographic separators */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectUser?.(post.userId)}
                    className="shrink-0 hover:opacity-85 transition-opacity text-left"
                    title={`Отвори стената на ${post.authorName}`}
                  >
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-xl object-cover border border-slate-700 hover:border-emerald-500 transition-colors"
                    />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectUser?.(post.userId)}
                        className="text-sm font-bold text-white hover:text-emerald-400 transition-colors text-left"
                        title={`Отвори стената на ${post.authorName}`}
                      >
                        {post.authorName}
                      </button>
                      {isAuthor && (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50">
                          Вие
                        </span>
                      )}
                    </div>
                    {/* Unboxed Metadata (Zero-Pill Rule) */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{getCategoryLabel(post.category)}</span>
                      <span aria-hidden="true">·</span>
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

              {/* Title & Description */}
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {post.title}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {post.description}
              </p>

              {/* IPTV Content Card Section */}
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

                {/* Additional Spec Attributes: Clean Inline Text with separators */}
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

              {/* Interactive Footer: Reactions & Comments */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Reactions */}
                  <div className="flex items-center gap-2">
                    {/* Primary Like button */}
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

                    {/* Working Stream confirmation */}
                    <button
                      onClick={() => reactToPost(post.id, 'working')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors border ${
                        hasWorkingReaction
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                          : 'bg-slate-800/90 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 border-slate-700/60'
                      }`}
                      title="Потвърди, че стриймът работи отлично"
                    >
                      <Flame className={`h-3.5 w-3.5 ${hasWorkingReaction ? 'fill-emerald-400 text-emerald-400' : 'text-emerald-400'}`} />
                      <span>Работи</span>
                      <span className="font-mono tabular-nums text-xs font-bold">
                        {post.reactions.working.length}
                      </span>
                    </button>

                    {/* Report Offline */}
                    <button
                      onClick={() => reactToPost(post.id, 'offline')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl transition-colors border ${
                        hasOfflineReaction
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-800/90 text-slate-400 hover:text-amber-300 hover:bg-slate-800 border-slate-700/60'
                      }`}
                      title="Сигнализирай за проблем/офлайн"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      {post.reactions.offline.length > 0 && (
                        <span className="font-mono tabular-nums text-xs">
                          {post.reactions.offline.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Comments toggle button */}
                  <button
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors border ${
                      activeCommentPostId === post.id
                        ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                        : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                    <span>Коментари ({post.comments.length})</span>
                  </button>
                </div>

                {/* Expandable Comments Section */}
                {activeCommentPostId === post.id && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3.5">
                    {/* Write a comment form */}
                    <form onSubmit={e => handleCommentSubmit(e, post.id)} className="flex items-center gap-2">
                      <img
                        src={currentUser?.avatar}
                        alt={currentUser?.username}
                        className="h-8 w-8 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={e => setNewCommentText(e.target.value)}
                        placeholder={`Коментирайте като ${currentUser?.username}...`}
                        className="flex-1 py-2 px-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!newCommentText.trim()}
                        className="px-4 py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
                      >
                        Коментирай
                      </button>
                    </form>

                    {/* Existing Comments List */}
                    <div className="space-y-2">
                      {post.comments.length === 0 ? (
                        <div className="p-4 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
                          <p className="text-xs text-slate-400 italic">Все още няма коментари под този стрийм. Бъдете първият!</p>
                        </div>
                      ) : (
                        post.comments.map(c => (
                          <div key={c.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs">
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                              <button
                                type="button"
                                onClick={() => onSelectUser?.(c.userId)}
                                className="font-semibold text-slate-200 hover:text-emerald-400 transition-colors flex items-center gap-2 text-left"
                              >
                                <img
                                  src={c.userAvatar}
                                  alt={c.username}
                                  className="h-5 w-5 rounded-lg object-cover border border-slate-700"
                                />
                                <span>{c.username}</span>
                              </button>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(c.createdAt).toLocaleDateString('bg-BG')} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-200 ml-7 whitespace-pre-wrap break-words">{c.content}</p>
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

      {/* Raw M3U Viewer Modal */}
      {rawM3uPreviewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Преглед на M3U плейлист</h3>
                <p className="text-xs text-slate-400">{rawM3uPreviewPost.title}</p>
              </div>
              <button
                onClick={() => setRawM3uPreviewPost(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <pre className="max-h-96 overflow-y-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
              {rawM3uPreviewPost.content.rawM3u}
            </pre>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => downloadM3uFile(rawM3uPreviewPost)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Свали като .m3u файл</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
