import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { StorageEngine } from '../services/storage';
import { User, Post, PostCategory, PostVisibility } from '../types';
import { CreateEditPostModal } from './CreateEditPostModal';
import { 
  ShieldCheck, 
  Settings, 
  Trash2, 
  Edit, 
  UserX, 
  Tv, 
  Users, 
  Lock, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Key,
  Globe,
  Calendar,
  Mail,
  FileText,
  UserCheck,
  Check,
  KeyRound,
  EyeOff,
  Copy,
  RefreshCw
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { currentUser, deletePost, adminDeleteUser, adminVerifyUser, adminResetPassword, refreshData } = useAuth();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'system'>('posts');
  const [searchPost, setSearchPost] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<{ id: string; username: string } | null>(null);
  const [resetPasswordModalUser, setResetPasswordModalUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSuccessNotice, setPasswordSuccessNotice] = useState<string | null>(null);
  const [copiedNewPass, setCopiedNewPass] = useState(false);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center rounded-2xl border border-rose-800 bg-rose-950/40 text-rose-300">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-400 mb-2" />
        <h3 className="text-base font-bold">Ограничен достъп</h3>
        <p className="text-xs mt-1">Този панел е достъпен само за главен администратор на системата.</p>
      </div>
    );
  }

  const allPosts = StorageEngine.getPosts();
  const allUsers = StorageEngine.getUsers();

  const filteredPosts = allPosts.filter(p => 
    p.title.toLowerCase().includes(searchPost.toLowerCase()) ||
    p.authorName.toLowerCase().includes(searchPost.toLowerCase()) ||
    (p.content.macAddress && p.content.macAddress.toLowerCase().includes(searchPost.toLowerCase())) ||
    (p.content.portalUrl && p.content.portalUrl.toLowerCase().includes(searchPost.toLowerCase()))
  );

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleEditClick = (post: Post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleDeletePost = (id: string, title: string) => {
    if (window.confirm(`Сигурни ли сте, че искате да изтриете публикацията: "${title}"?`)) {
      deletePost(id);
      setActionNotice(`Публикацията "${title}" бе изтрита от администратора.`);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleToggleUserRole = (userId: string) => {
    const user = StorageEngine.getUserById(userId);
    if (!user) return;
    if (user.role === 'admin' || user.id === currentUser.id) {
      alert('Не можете да променяте ролята на главния администратор.');
      return;
    }
    const newRole = user.role === 'moderator' ? 'member' : 'moderator';
    user.role = newRole;
    StorageEngine.saveUser(user);
    refreshData();
    setActionNotice(`Ролята на ${user.username} бе променена на ${newRole}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleVerifyUser = (userId: string) => {
    const res = adminVerifyUser(userId);
    setActionNotice(res.message || 'Профилът бе потвърден успешно.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleVerifyAllUnverified = () => {
    let count = 0;
    allUsers.forEach(u => {
      if (!u.isVerified) {
        adminVerifyUser(u.id);
        count++;
      }
    });
    setActionNotice(count > 0 ? `Потвърдени са профилите на ${count} потребителя!` : 'Всички потребители вече са потвърдени и активни.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteUser) return;
    const res = adminDeleteUser(confirmDeleteUser.id);
    setActionNotice(res.message || `Потребителят ${confirmDeleteUser.username} бе изтрит.`);
    setConfirmDeleteUser(null);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Dark#';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(res);
    setPasswordSuccessNotice(null);
    setCopiedNewPass(false);
  };

  const handleSavePassword = () => {
    if (!resetPasswordModalUser) return;
    const trimmed = newPasswordInput.trim();
    if (!trimmed || trimmed.length < 4) {
      setActionNotice('Паролата трябва да е с дължина минимум 4 символа.');
      return;
    }
    const res = adminResetPassword(resetPasswordModalUser.id, trimmed);
    if (res.success) {
      setPasswordSuccessNotice(res.message || 'Паролата бе обновена успешно.');
      setActionNotice(`Паролата на @${resetPasswordModalUser.username} бе сменена.`);
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      setActionNotice(res.message || 'Грешка при смяна на паролата.');
    }
  };

  const handleCopyNewPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedNewPass(true);
    setTimeout(() => setCopiedNewPass(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Admin Ribbon */}
      <div className="p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Администраторски контролен панел</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-400 text-slate-950">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Влезли сте като <strong className="text-emerald-400 font-mono">Главен Администратор ({currentUser?.username})</strong>. Имате пълен достъп за редакция и модерация на всички IPTV стриймове, портали и потребители.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
              <span className="block font-mono text-lg font-bold text-emerald-400">{allPosts.length}</span>
              <span className="text-[10px] text-slate-400">Публикации</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
              <span className="block font-mono text-lg font-bold text-teal-400">{allUsers.length}</span>
              <span className="text-[10px] text-slate-400">Потребители</span>
            </div>
          </div>
        </div>

        {actionNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              {actionNotice}
            </span>
            <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
            activeTab === 'posts'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tv className="h-4 w-4" />
          <span>Управление на всички публикации ({allPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
            activeTab === 'users'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Потребители & Роли ({allUsers.length})</span>
        </button>
      </div>

      {/* 1. Posts Management Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchPost}
                onChange={e => setSearchPost(e.target.value)}
                placeholder="Търси публикация по заглавие, автор, MAC, портал..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400 self-center">
              Общо {filteredPosts.length} резултата
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
              <Tv className="mx-auto h-8 w-8 text-slate-500 mb-2" />
              <p className="text-sm font-semibold text-white">
                {allPosts.length === 0 ? 'Все още няма създадени публикации (сайта стартира от 0)' : 'Няма публикации, отговарящи на търсенето'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Когато вие или регистрираните членове публикуват стриймове, портали или MAC адреси, тук ще можете да ги редактирате незабавно.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map(post => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{post.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {post.category.toUpperCase()}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        post.visibility === 'public'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                          : post.visibility === 'friends'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                      }`}>
                        {post.visibility === 'public' ? 'Публична' : post.visibility === 'friends' ? 'Само за приятели' : 'Лична'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1">{post.description || 'Няма описание'}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>Автор: <strong className="text-slate-200">{post.authorName}</strong></span>
                      <span aria-hidden="true">·</span>
                      {post.content.portalUrl && (
                        <span>Портал: <code className="text-emerald-400 font-mono">{post.content.portalUrl}</code></span>
                      )}
                      {post.content.macAddress && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>MAC: <code className="text-amber-400 font-mono font-bold">{post.content.macAddress}</code></span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{new Date(post.createdAt).toLocaleDateString('bg-BG')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button
                      onClick={() => handleEditClick(post)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                    >
                      <Edit className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Редактирай</span>
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id, post.title)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-900/60 rounded-lg transition-colors border border-rose-900/60"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      <span>Изтрий</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Users Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                placeholder="Търси потребител по имейл или username..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {allUsers.some(u => !u.isVerified) && (
                <button
                  onClick={handleVerifyAllUnverified}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Потвърди всички непотвърдени</span>
                </button>
              )}
              <span className="text-xs text-slate-400">Общо {allUsers.length} потребителя</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map(user => {
              const isTargetAdmin = user.role === 'admin';
              const isCurrentUser = user.id === currentUser.id;
              const userPostsCount = allPosts.filter(p => p.userId === user.id).length;
              const isUserVerified = user.isVerified !== false;

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-2xl border bg-slate-900/70 flex flex-col justify-between gap-4 hover:border-slate-700 transition-colors ${
                    !isUserVerified ? 'border-amber-700/60 bg-amber-950/10' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white truncate">{user.username}</h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.2 rounded uppercase ${
                          isTargetAdmin ? 'bg-emerald-400 text-slate-950 font-bold' : user.role === 'moderator' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {user.role}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                            Вие
                          </span>
                        )}
                        {isUserVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-1.5 py-0.2 rounded font-medium">
                            <Check className="h-2.5 w-2.5" />
                            <span>Потвърден</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded font-medium">
                            <AlertCircle className="h-2.5 w-2.5" />
                            <span>Чака потвърждение</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">{user.email}</p>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-1">{user.bio || 'Няма въведено био'}</p>

                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                        <span className="flex items-center gap-1 text-slate-300">
                          <FileText className="h-3 w-3 text-slate-500" />
                          <span>{userPostsCount} публикации</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>Член от {new Date(user.createdAt).toLocaleDateString('bg-BG')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60 flex-wrap">
                    {!isTargetAdmin ? (
                      <>
                        {!isUserVerified && (
                          <button
                            onClick={() => handleVerifyUser(user.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Потвърди профила</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setResetPasswordModalUser(user);
                            setNewPasswordInput('');
                            setShowNewPassword(false);
                            setPasswordSuccessNotice(null);
                            setCopiedNewPass(false);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900/80 rounded-lg transition-colors border border-amber-800/60 shadow-sm"
                          title="Смени паролата на този потребител"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                          <span>Смени парола</span>
                        </button>
                        <button
                          onClick={() => handleToggleUserRole(user.id)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                        >
                          {user.role === 'moderator' ? 'Свали до Member' : 'Направи Moderator'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteUser({ id: user.id, username: user.username })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 rounded-lg transition-colors border border-rose-900/60"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                          <span>Изтрий профила</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 font-semibold px-2 py-1">
                          Главна администрация
                        </span>
                        <button
                          onClick={() => {
                            setResetPasswordModalUser(user);
                            setNewPasswordInput('');
                            setShowNewPassword(false);
                            setPasswordSuccessNotice(null);
                            setCopiedNewPass(false);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900/80 rounded-lg transition-colors border border-amber-800/60 shadow-sm"
                          title="Смени парола на администратор"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                          <span>Смени парола</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-rose-800/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Изтриване на потребителски профил</h3>
                <p className="text-xs text-slate-400">Необратимо администраторско действие</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Сигурни ли сте, че искате да изтриете акаунта на <strong className="text-white">@{confirmDeleteUser.username}</strong>?
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>• Всички негови качени стриймове, портали и MAC адреси ще бъдат изтрити.</p>
              <p>• Коментарите, приятелствата и личните съобщения ще бъдат премахнати.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors"
              >
                Отказ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-sm"
              >
                Потвърди и изтрий
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset User Password Modal */}
      {resetPasswordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400">
                <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/70">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Смяна на парола на потребител</h3>
                  <p className="text-xs text-slate-400">Администраторско задаване на нова парола</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Target User Info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <img
                src={resetPasswordModalUser.avatar}
                alt={resetPasswordModalUser.username}
                className="h-10 w-10 rounded-lg object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  @{resetPasswordModalUser.username}
                </p>
                <p className="text-[11px] font-mono text-slate-400 truncate">
                  {resetPasswordModalUser.email}
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {resetPasswordModalUser.role}
              </span>
            </div>

            {/* Current Password Note */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
              <span className="text-slate-400">Текуща запазена парола:</span>
              <span className="font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {StorageEngine.getPassword(resetPasswordModalUser.id)}
              </span>
            </div>

            {passwordSuccessNotice ? (
              <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordSuccessNotice}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm text-white">
                  <span>{newPasswordInput.trim()}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyNewPassword(newPasswordInput.trim())}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors"
                  >
                    {copiedNewPass ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Копирана!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Копирай</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Потребителят получи системно известие в профила си. Можете да копирате новата парола и да му я изпратите при необходимост.
                </p>
                <button
                  type="button"
                  onClick={() => setResetPasswordModalUser(null)}
                  className="w-full py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Затвори
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Нова парола за акаунта
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Генерирай парола</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={e => setNewPasswordInput(e.target.value)}
                      placeholder="Въведете нова парола (мин. 4 символа)..."
                      className="w-full pr-10 pl-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setResetPasswordModalUser(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors"
                  >
                    Отказ
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePassword}
                    disabled={!newPasswordInput.trim() || newPasswordInput.trim().length < 4}
                    className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Запази новата парола</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal (Reusing CreateEditPostModal with full privileges) */}
      <CreateEditPostModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPost(null);
        }}
        editingPost={editingPost}
      />
    </div>
  );
};
