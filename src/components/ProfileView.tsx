import React, { useState, useRef } from 'react';
import { useAuth } from '../services/authContext';
import { StorageEngine } from '../services/storage';
import { Feed } from './Feed';
import { Post } from '../types';
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
  Image as ImageIcon
} from 'lucide-react';

interface ProfileViewProps {
  onOpenEdit: (post: Post) => void;
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

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenEdit }) => {
  const { currentUser, updateProfile } = useAuth();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [allowFriendRequests, setAllowFriendRequests] = useState(currentUser?.privacy.allowFriendRequests ?? true);
  const [allowFollowers, setAllowFollowers] = useState(currentUser?.privacy.allowFollowers ?? true);
  const [showEmail, setShowEmail] = useState(currentUser?.privacy.showEmail ?? false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Изображението е по-голямо от 2MB. Моля изберете по-малък файл.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      username,
      bio,
      avatar,
      privacy: {
        allowFriendRequests,
        allowFollowers,
        showEmail,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const myPostsCount = StorageEngine.getPosts().filter(p => p.userId === currentUser.id).length;
  const friendsCount = StorageEngine.getFriendsOfUser(currentUser.id).length;
  const followersCount = StorageEngine.getFollowersOfUser(currentUser.id).length;
  const followingCount = StorageEngine.getFollowingOfUser(currentUser.id).length;

  return (
    <div className="space-y-8">
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
                  {currentUser.role}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <span>{currentUser.email}</span>
                <span aria-hidden="true">·</span>
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Член от {new Date(currentUser.createdAt).toLocaleDateString('bg-BG')}</span>
              </p>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {currentUser.bio}
              </p>
            </div>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="text-center px-2">
              <span className="block font-mono text-lg font-bold text-white tabular-nums">{myPostsCount}</span>
              <span className="text-[10px] text-slate-400">Публикации</span>
            </div>
            <div className="text-center px-2 border-l border-slate-800">
              <span className="block font-mono text-lg font-bold text-emerald-400 tabular-nums">{friendsCount}</span>
              <span className="text-[10px] text-slate-400">Приятели</span>
            </div>
            <div className="text-center px-2 border-l border-slate-800">
              <span className="block font-mono text-lg font-bold text-teal-400 tabular-nums">{followersCount}</span>
              <span className="text-[10px] text-slate-400">Последователи</span>
            </div>
            <div className="text-center px-2 border-l border-slate-800">
              <span className="block font-mono text-lg font-bold text-cyan-400 tabular-nums">{followingCount}</span>
              <span className="text-[10px] text-slate-400">Последвани</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings & Privacy Form */}
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

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm"
            >
              Запази настройките и профилната снимка
            </button>
          </div>
        </form>
      </div>

      {/* User's own posts list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            <span>Моите публикации ({myPostsCount})</span>
          </h2>
        </div>
        <Feed onOpenEdit={onOpenEdit} filterUserOnly={true} />
      </div>
    </div>
  );
};
