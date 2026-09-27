import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../services/authContext';
import { StorageEngine } from '../services/storage';
import { Feed } from './Feed';
import { Post, DirectMessage, User } from '../types';
import { 
  User as UserIcon, 
  Shield, 
  Settings, 
  Check, 
  Mail, 
  Calendar, 
  FileText, 
  Users, 
  Eye, 
  Lock,
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Send,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserPlus,
  KeyRound,
  AlertCircle
} from 'lucide-react';

interface ProfileViewProps {
  onOpenEdit: (post: Post) => void;
  onSelectUser?: (userId: string) => void;
  initialTab?: 'profile' | 'messages' | 'posts';
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://api.dicebear.com/7.x/bottts/svg?seed=DarkIPTV1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=NeonStreamer',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberSat',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowCast',
];

interface ConversationGroup {
  otherUser: User;
  messages: DirectMessage[];
  lastMessage: DirectMessage;
  unreadCount: number;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  onOpenEdit, 
  onSelectUser, 
  initialTab = 'profile' 
}) => {
  const { 
    currentUser, 
    allUsers, 
    allPosts, 
    directMessages,
    updateProfile, 
    changePassword,
    sendDirectMessage, 
    markConversationAsRead, 
    setIsUserSearchOpen 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'messages' | 'posts'>(initialTab);
  const [senderFilter, setSenderFilter] = useState<'all' | 'incoming' | 'unread'>('all');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Profile Form state
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [allowFriendRequests, setAllowFriendRequests] = useState(currentUser?.privacy.allowFriendRequests ?? true);
  const [allowFollowers, setAllowFollowers] = useState(currentUser?.privacy.allowFollowers ?? true);
  const [showEmail, setShowEmail] = useState(currentUser?.privacy.showEmail ?? false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync profile form state only when switching users or on initial mount, not on every background poll
  useEffect(() => {
    if (currentUser && lastLoadedUserIdRef.current !== currentUser.id) {
      lastLoadedUserIdRef.current = currentUser.id;
      setUsername(currentUser.username);
      setBio(currentUser.bio || '');
      setAvatar(currentUser.avatar);
      setAllowFriendRequests(currentUser.privacy.allowFriendRequests ?? true);
      setAllowFollowers(currentUser.privacy.allowFollowers ?? true);
      setShowEmail(currentUser.privacy.showEmail ?? false);
    }
  }, [currentUser?.id]);

  // Messages Chat state
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Group messages into conversations with "кой ми е писал", deduplicating cleanly
  const conversations: ConversationGroup[] = useMemo(() => {
    if (!currentUser) return [];
    const allMsgs = directMessages.length > 0 ? directMessages : StorageEngine.getMessages();
    const myMsgs = allMsgs.filter(m => 
      m.senderId === currentUser.id || 
      m.recipientId === currentUser.id ||
      (m.senderUsername && m.senderUsername.toLowerCase() === currentUser.username.toLowerCase()) ||
      (m.recipientUsername && m.recipientUsername.toLowerCase() === currentUser.username.toLowerCase())
    );

    const map = new Map<string, DirectMessage[]>();
    for (const m of myMsgs) {
      let otherId = m.senderId === currentUser.id ? m.recipientId : m.senderId;
      // If otherId equals currentUser.id, resolve by username
      if (otherId === currentUser.id) {
        const otherUsername = m.senderUsername.toLowerCase() === currentUser.username.toLowerCase() ? m.recipientUsername : m.senderUsername;
        const resolvedUser = allUsers.find(u => u.username.toLowerCase() === otherUsername.toLowerCase());
        if (resolvedUser) otherId = resolvedUser.id;
      }
      if (!map.has(otherId)) {
        map.set(otherId, []);
      }

      const list = map.get(otherId)!;
      const timeBucket = Math.floor(new Date(m.createdAt).getTime() / 4000);
      const isDup = list.some(existing => 
        existing.id === m.id || 
        (existing.senderId === m.senderId && existing.recipientId === m.recipientId && existing.content.trim() === m.content.trim() && Math.abs(timeBucket - Math.floor(new Date(existing.createdAt).getTime() / 4000)) <= 1)
      );

      if (!isDup) {
        list.push(m);
      }
    }

    const result: ConversationGroup[] = [];
    for (const [otherId, msgs] of map.entries()) {
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const otherUser = allUsers.find(u => u.id === otherId) || StorageEngine.getUserById(otherId) || {
        id: otherId,
        username: msgs[0].senderId === currentUser.id ? msgs[0].recipientUsername : msgs[0].senderUsername,
        avatar: msgs[0].senderId === currentUser.id ? 'https://api.dicebear.com/7.x/bottts/svg?seed=' + otherId : msgs[0].senderAvatar,
        email: 'user@iptv.net',
        bio: 'Потребител на сайта',
        role: 'member' as const,
        isVerified: true,
        createdAt: new Date().toISOString(),
        privacy: { allowFriendRequests: true, allowFollowers: true, showEmail: false }
      };

      const unreadCount = msgs.filter(m => m.recipientId === currentUser.id && !m.read).length;
      const lastMessage = msgs[msgs.length - 1];

      result.push({
        otherUser,
        messages: msgs,
        lastMessage,
        unreadCount,
      });
    }

    // Sort by latest message date descending
    result.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    return result;
  }, [currentUser, allUsers, directMessages]);

  // Total unread messages for currentUser
  const totalUnreadMessages = useMemo(() => {
    return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  }, [conversations]);

  // Default select first conversation if none selected
  useEffect(() => {
    if (activeTab === 'messages' && conversations.length > 0 && !selectedChatUserId) {
      setSelectedChatUserId(conversations[0].otherUser.id);
    }
  }, [activeTab, conversations, selectedChatUserId]);

  // Mark conversation as read when active
  useEffect(() => {
    if (activeTab === 'messages' && selectedChatUserId && currentUser) {
      markConversationAsRead(selectedChatUserId);
    }
  }, [activeTab, selectedChatUserId, currentUser, markConversationAsRead]);

  // Scroll chat to bottom when conversation changes or new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedChatUserId, conversations]);

  if (!currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Моля изберете графичен файл (JPG, PNG, WebP).');
        return;
      }
      setErrorMessage(null);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Resize image via Canvas to max 256x256 for instant upload & storage
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 256;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.85);
              setAvatar(compressed);
            } else {
              setAvatar(reader.result as string);
            }
          };
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const trimmedNew = newPassword.trim();
    if (!trimmedNew || trimmedNew.length < 4) {
      setPasswordError('Новата парола трябва да е с дължина минимум 4 символа.');
      return false;
    }

    if (trimmedNew !== confirmPassword.trim()) {
      setPasswordError('Двете въведени нови пароли не съвпадат!');
      return false;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword(trimmedNew, currentPassword.trim());
      if (res.success) {
        setPasswordSuccess(res.message || 'Паролата за Вашия профил беше обновена успешно!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 4000);
        return true;
      } else {
        setPasswordError(res.message || 'Грешка при смяна на паролата.');
        return false;
      }
    } catch {
      setPasswordError('Възникна системна грешка при смяната на паролата.');
      return false;
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);
    setSavedSuccess(false);

    if (!username.trim()) {
      setErrorMessage('Потребителското име не може да бъде празно.');
      return;
    }

    // If new password was entered, validate it before submitting profile
    if (newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        setErrorMessage('Новата парола трябва да е минимум 4 символа.');
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        setErrorMessage('Въведената нова парола и потвърждението не съвпадат.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        username: username.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
        privacy: {
          allowFriendRequests,
          allowFollowers,
          showEmail,
        },
      };

      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await updateProfile(payload);

      if (res.success) {
        setSavedSuccess(true);
        if (newPassword.trim()) {
          setNewPassword('');
          setConfirmPassword('');
          setCurrentPassword('');
        }
        setTimeout(() => setSavedSuccess(false), 3500);
      } else if (res.message) {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Възникна грешка при запазване на профила.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatUserId) return;
    const textToSend = replyText.trim();
    setReplyText('');
    await sendDirectMessage(selectedChatUserId, textToSend);
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 60);
  };

  const myPostsCount = allPosts.filter(p => p.userId === currentUser.id).length;
  const friendsCount = StorageEngine.getFriendsOfUser(currentUser.id).length;
  const followersCount = StorageEngine.getFollowersOfUser(currentUser.id).length;
  const followingCount = StorageEngine.getFollowingOfUser(currentUser.id).length;

  const filteredConversations = conversations.filter(c => {
    if (senderFilter === 'incoming') {
      const hasIncoming = c.messages.some(m => m.recipientId === currentUser.id);
      if (!hasIncoming) return false;
    }
    if (senderFilter === 'unread') {
      if (c.unreadCount === 0) return false;
    }
    if (!conversationSearch.trim()) return true;
    const q = conversationSearch.toLowerCase();
    return (
      c.otherUser.username.toLowerCase().includes(q) ||
      c.lastMessage.content.toLowerCase().includes(q)
    );
  });

  const incomingConversationsCount = conversations.filter(c => c.messages.some(m => m.recipientId === currentUser.id)).length;

  const selectedConversation = conversations.find(c => c.otherUser.id === selectedChatUserId);
  const fallbackChatUser = selectedChatUserId 
    ? (allUsers.find(u => u.id === selectedChatUserId) || StorageEngine.getUserById(selectedChatUserId))
    : null;
  const activeChatUser = selectedConversation ? selectedConversation.otherUser : fallbackChatUser;

  return (
    <div className="space-y-6">
      {/* Profile Header Box */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                referrerPolicy="no-referrer"
                className="h-20 w-20 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-2xl text-[10px] text-white transition-opacity font-semibold"
                title="Смени профилната снимка"
              >
                <Camera className="h-4 w-4 mb-0.5 text-emerald-400" />
                <span>Смени</span>
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{currentUser.username}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  {currentUser.role === 'admin' ? 'Главен Администратор' : (currentUser.role === 'moderator' ? 'Модератор' : 'Потребител')}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{currentUser.email}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Член от {new Date(currentUser.createdAt).toLocaleDateString('bg-BG')}</span>
                </span>
              </p>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {currentUser.bio || 'Няма въведено кратко описание.'}
              </p>
            </div>
          </div>

          {/* Metrics summary with interactive jump to Messages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('posts')}
              className="text-center px-2 hover:opacity-85 transition-opacity"
            >
              <span className="block font-mono text-lg font-bold text-white tabular-nums">{myPostsCount}</span>
              <span className="text-[10px] text-slate-400">Публикации</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className="text-center px-2 border-l border-slate-800 hover:opacity-85 transition-opacity"
            >
              <span className="block font-mono text-lg font-bold text-purple-400 tabular-nums flex items-center justify-center gap-1">
                <span>{conversations.length}</span>
                {totalUnreadMessages > 0 && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </span>
              <span className="text-[10px] text-slate-400">Съобщения</span>
            </button>
            <div className="text-center px-2 border-l border-slate-800">
              <span className="block font-mono text-lg font-bold text-emerald-400 tabular-nums">{friendsCount}</span>
              <span className="text-[10px] text-slate-400">Приятели</span>
            </div>
            <div className="text-center px-2 border-l border-slate-800">
              <span className="block font-mono text-lg font-bold text-teal-400 tabular-nums">{followersCount}</span>
              <span className="text-[10px] text-slate-400">Последователи</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs within Profile */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'messages'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Съобщения (Кой ми е писал)</span>
          {totalUnreadMessages > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 font-mono text-[10px] font-bold">
              {totalUnreadMessages} нови
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
              {conversations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'profile'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-900/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Профил & Настройки</span>
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'posts'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-900/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Моите публикации ({myPostsCount})</span>
        </button>
      </div>

      {/* TAB 1: MESSAGES / КОЙ МИ Е ПИСАЛ */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
          {/* Left Column: Senders & Conversations List */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                <h2 className="text-sm font-bold text-white">Входящи съобщения</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsUserSearchOpen(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Нов чат</span>
              </button>
            </div>

            {/* Subfilters: Всички, Кой ми е писал, Непрочетени */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setSenderFilter('all')}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  senderFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Всички ({conversations.length})
              </button>
              <button
                type="button"
                onClick={() => setSenderFilter('incoming')}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  senderFilter === 'incoming'
                    ? 'bg-purple-900/60 text-purple-200 border border-purple-700/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Показва само хора, които са ви писали съобщение"
              >
                📩 Кой ми е писал ({incomingConversationsCount})
              </button>
              {totalUnreadMessages > 0 && (
                <button
                  type="button"
                  onClick={() => setSenderFilter('unread')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                    senderFilter === 'unread'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm'
                      : 'text-emerald-400 hover:text-white'
                  }`}
                >
                  🔔 Нови ({totalUnreadMessages})
                </button>
              )}
            </div>

            {/* Conversation search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={conversationSearch}
                onChange={e => setConversationSearch(e.target.value)}
                placeholder="Търсене на потребител или текст..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[500px]">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
                  <div className="h-10 w-10 mx-auto rounded-xl bg-purple-950/50 border border-purple-800 flex items-center justify-center text-purple-400 mb-2">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Няма съобщения в тази секция</h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    {conversationSearch
                      ? 'Няма съобщения, отговарящи на вашето търсене.'
                      : senderFilter === 'incoming'
                      ? 'Все още никой не ви е писал първи. Започнете разговор с някой от членовете по-долу!'
                      : 'Можете да изпратите лично съобщение до всеки потребител в сайта.'}
                  </p>

                  {/* Quick Members Directory to Start Chat */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-left">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Бърз старт: Пиши на потребител
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {allUsers
                        .filter(u => u.id !== currentUser.id)
                        .slice(0, 6)
                        .map(member => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              setSelectedChatUserId(member.id);
                            }}
                            className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-600/50 transition-colors text-left"
                          >
                            <img
                              src={member.avatar}
                              alt={member.username}
                              className="h-7 w-7 rounded-lg object-cover border border-slate-700 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-white truncate block">{member.username}</span>
                              <span className="text-[10px] text-purple-400 font-medium">Пиши съобщение →</span>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const isSelected = selectedChatUserId === conv.otherUser.id;
                  const isIncoming = conv.lastMessage.recipientId === currentUser.id;
                  const hasUnread = conv.unreadCount > 0;

                  return (
                    <button
                      key={conv.otherUser.id}
                      onClick={() => {
                        setSelectedChatUserId(conv.otherUser.id);
                        markConversationAsRead(conv.otherUser.id);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-700/60 ring-1 ring-purple-600/30'
                          : hasUnread
                          ? 'bg-slate-900 border-emerald-500/40 hover:border-emerald-500/60'
                          : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={conv.otherUser.avatar}
                          alt={conv.otherUser.username}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-xl object-cover border border-slate-700"
                        />
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span>{conv.otherUser.username}</span>
                            {conv.otherUser.role === 'admin' && (
                              <span className="text-[9px] px-1 rounded bg-emerald-400 text-slate-950 font-bold uppercase">
                                Admin
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className={`text-xs truncate ${hasUnread ? 'font-semibold text-white' : 'text-slate-400'}`}>
                          {isIncoming ? (
                            <span className="inline-block px-1 py-0.2 rounded bg-purple-950 text-purple-300 font-semibold text-[10px] mr-1 border border-purple-800/60">
                              📩 Писа ви
                            </span>
                          ) : (
                            <span className="text-slate-500 mr-1">Вие:</span>
                          )}
                          {conv.lastMessage.content}
                        </p>

                        {hasUnread && (
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                              {conv.unreadCount} ново {conv.unreadCount === 1 ? 'съобщение' : 'съобщения'}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation Chat Thread */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-4 flex flex-col h-[550px]">
            {activeChatUser ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeChatUser.avatar}
                      alt={activeChatUser.username}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{activeChatUser.username}</h3>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                          {activeChatUser.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {activeChatUser.bio || 'Регистриран потребител на Dark IPTV'}
                      </p>
                    </div>
                  </div>

                  {onSelectUser && (
                    <button
                      type="button"
                      onClick={() => onSelectUser(activeChatUser.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Виж стената и публикациите на този потребител"
                    >
                      Преглед на профил & стена
                    </button>
                  )}
                </div>

                {/* Messages Thread Container */}
                <div 
                  ref={chatScrollRef} 
                  className="flex-1 overflow-y-auto py-4 space-y-3 pr-2"
                >
                  {selectedConversation && selectedConversation.messages.length > 0 ? (
                    selectedConversation.messages.map(msg => {
                      const isMe = msg.senderId === currentUser.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isMe && (
                            <img
                              src={msg.senderAvatar || activeChatUser.avatar}
                              alt={msg.senderUsername}
                              referrerPolicy="no-referrer"
                              className="h-6 w-6 rounded-lg object-cover border border-slate-700 shrink-0 mb-1"
                            />
                          )}

                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-xs sm:text-sm ${
                            isMe 
                              ? 'bg-purple-600 text-white rounded-br-sm' 
                              : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/60'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? 'text-purple-200' : 'text-slate-400'}`}>
                              <Clock className="h-2.5 w-2.5" />
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && <Check className="h-3 w-3 text-purple-200 ml-0.5" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <MessageSquare className="h-8 w-8 text-purple-400 mx-auto mb-2 opacity-60" />
                      <p className="text-xs font-semibold text-white">Няма предишни съобщения с {activeChatUser.username}</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        Напишете съобщение в полето по-долу, за да започнете разговор!
                      </p>
                    </div>
                  )}
                </div>

                {/* Message Input Form */}
                <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Съобщение до ${activeChatUser.username}...`}
                      className="flex-1 py-2 px-3 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Изпрати</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <MessageSquare className="h-12 w-12 text-slate-700 mb-3" />
                <h3 className="text-sm font-bold text-white">Изберете разговор</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Изберете потребител от списъка вляво, за да прочетете съобщенията и да отговорите.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE SETTINGS */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Редакция на профила & Профилна снимка</h2>
            </div>
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800">
                <Check className="h-3.5 w-3.5" />
                <span>Промените са запазени успешно!</span>
              </span>
            )}
            {errorMessage && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-950/60 px-3 py-1 rounded-lg border border-rose-800">
                <span>{errorMessage}</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar Choice Selection: Upload from device, URL, or Gallery */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-white flex items-center gap-2">
                    <Camera className="h-4 w-4 text-emerald-400" />
                    <span>Профилна снимка по избор</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Качете файл от вашия компютър/телефон, поставете директен линк или изберете от готовата галерия.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Качи от устройство</span>
                  </button>
                </div>
              </div>

              {/* Current avatar preview and Direct URL input */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <div className="relative shrink-0">
                  <img
                    src={avatar}
                    alt="Преглед на аватара"
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Или поставете директен URL адрес на изображение:
                  </label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={e => setAvatar(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Quick Preset Avatars Gallery */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 mb-2">
                  Бърз избор от аватари:
                </span>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(presetUrl)}
                      className={`h-11 w-11 rounded-xl overflow-hidden border-2 transition-transform shrink-0 hover:scale-105 ${
                        avatar === presetUrl ? 'border-emerald-400 scale-105 ring-2 ring-emerald-500/30' : 'border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={presetUrl}
                        alt={`Avatar preset ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Потребителско име
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Имейл адрес
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full py-2 px-3 text-sm bg-slate-950/50 border border-slate-850 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Кратко описание (Био)
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Privacy Toggles */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                Настройки за поверителност (Privacy Controls)
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Разрешаване на заявки за приятелство
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Позволява на други регистрирани потребители да ви изпращат покани за приятелство.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowFriendRequests}
                    onChange={e => setAllowFriendRequests(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Разрешаване на последователи
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Позволява на потребители да ви следват и получават известия за новите ви стриймове.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowFollowers}
                    onChange={e => setAllowFollowers(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Показване на имейла в профила
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Ако е деактивирано, само приятели виждат вашия публичен контакт.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showEmail}
                    onChange={e => setShowEmail(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                </label>
              </div>
            </div>

            {/* Password Change Section (In-place update, never creates a new account) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Смяна на парола (Защита на акаунта)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Запазва същия профил и данни
                </span>
              </div>

              {passwordSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Нова парола (минимум 4 символа)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Въведете нова парола..."
                    autoComplete="new-password"
                    className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Потвърди новата парола
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Повторете новата парола..."
                    autoComplete="new-password"
                    className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !newPassword.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>{isChangingPassword ? 'Запазване...' : 'Смени само паролата'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm"
              >
                Запази настройките, снимката и паролата
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: USER'S OWN POSTS */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <span>Моите публикации & мисли ({myPostsCount})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Всички ваши споделени статуси, стрийм листи, портали и MAC адреси на стената.
              </p>
            </div>
          </div>
          <Feed onOpenEdit={onOpenEdit} filterUserOnly={true} onSelectUser={onSelectUser} />
        </div>
      )}
    </div>
  );
};
