import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { Post, PostCategory, PostVisibility } from '../types';
import { 
  X, 
  Tv, 
  Globe, 
  Users, 
  Lock, 
  Key, 
  Sparkles, 
  FileText, 
  Calendar,
  Layers,
  Check,
  MessageSquare
} from 'lucide-react';

interface CreateEditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPost?: Post | null;
  initialCategory?: PostCategory;
}

export const CreateEditPostModal: React.FC<CreateEditPostModalProps> = ({
  isOpen,
  onClose,
  editingPost,
  initialCategory,
}) => {
  const { createPost, updatePost } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PostCategory>(initialCategory || 'thought');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  
  // Content fields
  const [portalUrl, setPortalUrl] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');
  const [rawM3u, setRawM3u] = useState('');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [channelsCount, setChannelsCount] = useState('');
  const [regionsStr, setRegionsStr] = useState('България, Европа');
  const [serverSpeed, setServerSpeed] = useState('');
  const [notes, setNotes] = useState('');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setDescription(editingPost.description);
      setCategory(editingPost.category);
      setVisibility(editingPost.visibility);
      setPortalUrl(editingPost.content.portalUrl || '');
      setMacAddress(editingPost.content.macAddress || '');
      setM3uUrl(editingPost.content.m3uUrl || '');
      setRawM3u(editingPost.content.rawM3u || '');
      setExpiryDate(editingPost.content.expiryDate || '2026-12-31');
      setChannelsCount(editingPost.content.channelsCount || '');
      setRegionsStr(editingPost.content.regions ? editingPost.content.regions.join(', ') : '');
      setServerSpeed(editingPost.content.serverSpeed || '');
      setNotes(editingPost.content.notes || '');
      setShowTechnicalDetails(editingPost.category !== 'thought');
    } else {
      const defaultCat = initialCategory || 'thought';
      setTitle('');
      setDescription('');
      setCategory(defaultCat);
      setVisibility('public');
      setPortalUrl('');
      setMacAddress('');
      setM3uUrl('');
      setRawM3u('');
      setExpiryDate('2026-12-31');
      setChannelsCount('');
      setRegionsStr('България, Европа');
      setServerSpeed('');
      setNotes('');
      setShowTechnicalDetails(defaultCat !== 'thought');
    }
  }, [editingPost, isOpen, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Моля въведете заглавие на публикацията.');
      return;
    }

    const cleanDesc = description.trim() || (
      category === 'portal' && portalUrl.trim() ? `IPTV Портал: ${portalUrl.trim()}` :
      category === 'm3u' && m3uUrl.trim() ? `IPTV M3U стрийм листа` :
      category === 'mac' && macAddress.trim() ? `MAG / Stalker MAC: ${macAddress.trim()}` :
      cleanTitle
    );

    const regions = regionsStr
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const contentData = {
      portalUrl: portalUrl.trim() || undefined,
      macAddress: macAddress.trim() || undefined,
      m3uUrl: m3uUrl.trim() || undefined,
      rawM3u: rawM3u.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      channelsCount: channelsCount.trim() || undefined,
      regions: regions.length > 0 ? regions : undefined,
      serverSpeed: serverSpeed.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (editingPost) {
      updatePost(editingPost.id, {
        title: cleanTitle,
        description: cleanDesc,
        category,
        visibility,
        content: contentData,
      });
    } else {
      createPost({
        title: cleanTitle,
        description: cleanDesc,
        category,
        visibility,
        content: contentData,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              category === 'thought' 
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              {category === 'thought' ? <MessageSquare className="h-5 w-5" /> : <Tv className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {editingPost 
                  ? 'Редактиране на публикация' 
                  : (category === 'thought' ? 'Нова публикация / Какво мислите' : 'Нов IPTV стрийм / портал')}
              </h2>
              <p className="text-xs text-slate-400">
                {category === 'thought' 
                  ? 'Споделете ваша мисъл, статус, въпрос или мнение на фийд стената'
                  : 'Задайте детайли, категория и ниво на видимост за стрийма'}
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

        {error && (
          <div className="mb-4 p-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category & Visibility Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Тип публикация
              </label>
              <select
                value={category}
                onChange={e => {
                  const val = e.target.value as PostCategory;
                  setCategory(val);
                  if (val !== 'thought') {
                    setShowTechnicalDetails(true);
                  }
                }}
                className="w-full py-2 px-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="thought">💬 Мисъл / Пост публикация (Какво мисля)</option>
                <option value="m3u">📺 IPTV Стрийм листа (M3U / M3U8)</option>
                <option value="portal">🌐 IPTV Портал (Stalker / Xtream)</option>
                <option value="mac">🔑 MAC Адрес (MAG / Stalker)</option>
                <option value="bundle">📦 Комбиниран VIP пакет</option>
              </select>
            </div>

            {/* Visibility Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ниво на видимост (Контрол на достъпа)
              </label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as PostVisibility)}
                className="w-full py-2 px-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="public">🌐 Публична (за цялата фийд стена)</option>
                <option value="friends">👥 Само за приятели (строг достъп)</option>
                <option value="private">🔒 Лична (видима само за вас)</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {category === 'thought' ? 'Заглавие / Тема на мисълта *' : 'Заглавие на публикацията *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={
                category === 'thought'
                  ? 'напр. Какво мислите за новите Stalker 5.x портали?'
                  : 'напр. Full HD Български канали + Спортен пакет M3U'
              }
              className="w-full py-2 px-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {category === 'thought' ? 'Какво мислите? (Текст на публикацията) *' : 'Описание и насоки за гледане'}
            </label>
            <textarea
              rows={category === 'thought' ? 4 : 2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={
                category === 'thought'
                  ? 'Напишете вашето мнение, коментар, препоръка или попитайте общността за IPTV стриймове, софтуер или портали...'
                  : 'Опишете качеството, битрейта, подходящи плеъри (TiviMate, IPTV Smarters, VLC)...'
              }
              className="w-full py-2 px-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* If Category is Thought: Option to attach IPTV technical data optionally */}
          {category === 'thought' && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
              >
                <span>{showTechnicalDetails ? '− Скрий технически данни' : '+ Прикачи линк, портал или стрийм към мисълта (по избор)'}</span>
              </button>
            </div>
          )}

          {/* Content Specifications */}
          {(showTechnicalDetails || category !== 'thought') && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3 animate-in fade-in duration-150">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Технически данни за стрийма / портала
              </h3>

              {(category === 'portal' || category === 'mac' || category === 'bundle' || category === 'thought') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Портал URL</label>
                    <input
                      type="text"
                      value={portalUrl}
                      onChange={e => setPortalUrl(e.target.value)}
                      placeholder="http://portal.mag-iptv.net:8080/c/"
                      className="w-full py-1.5 px-3 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">MAC Адрес</label>
                    <input
                      type="text"
                      value={macAddress}
                      onChange={e => setMacAddress(e.target.value)}
                      placeholder="00:1A:79:XX:XX:XX"
                      className="w-full py-1.5 px-3 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-amber-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {(category === 'm3u' || category === 'bundle' || category === 'thought') && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">M3U / M3U8 Директен URL</label>
                  <input
                    type="text"
                    value={m3uUrl}
                    onChange={e => setM3uUrl(e.target.value)}
                    placeholder="https://server.domain.com/live/playlist.m3u8"
                    className="w-full py-1.5 px-3 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-cyan-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Вграден текст на M3U плейлиста (опционално)
                </label>
                <textarea
                  rows={2}
                  value={rawM3u}
                  onChange={e => setRawM3u(e.target.value)}
                  placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-name=Channel1,Канал 1&#10;http://..."
                  className="w-full py-1.5 px-3 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Брой канали</label>
                  <input
                    type="text"
                    value={channelsCount}
                    onChange={e => setChannelsCount(e.target.value)}
                    placeholder="1,200+"
                    className="w-full py-1.5 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Валиден до дата</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full py-1.5 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Държави/Региони</label>
                  <input
                    type="text"
                    value={regionsStr}
                    onChange={e => setRegionsStr(e.target.value)}
                    placeholder="България, Великобритания"
                    className="w-full py-1.5 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Допълнителни бележки</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Препоръчителен буфер, EPG линк, таймзона..."
                  className="w-full py-1.5 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Отказ
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-semibold rounded-xl transition-colors shadow-sm ${
                category === 'thought'
                  ? 'text-white bg-purple-600 hover:bg-purple-500'
                  : 'text-slate-950 bg-emerald-400 hover:bg-emerald-300'
              }`}
            >
              {editingPost 
                ? 'Запази промените' 
                : (category === 'thought' ? 'Публикувай мисълта' : 'Публикувай стрийма')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
