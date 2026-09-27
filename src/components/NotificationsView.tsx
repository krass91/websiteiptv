import React from 'react';
import { useAuth } from '../services/authContext';
import { 
  Bell, 
  CheckCheck, 
  UserPlus, 
  UserCheck, 
  MessageSquare, 
  Flame, 
  Heart, 
  Clock,
  MessageCircle
} from 'lucide-react';

interface NotificationsViewProps {
  onSelectUser?: (userId: string, initialTab?: 'wall' | 'messages') => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onSelectUser }) => {
  const { 
    currentUser, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useAuth();

  if (!currentUser) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'direct_message':
        return <MessageCircle className="h-4 w-4 text-teal-400" />;
      case 'friend_request':
        return <UserPlus className="h-4 w-4 text-emerald-400" />;
      case 'friend_accepted':
        return <UserCheck className="h-4 w-4 text-teal-400" />;
      case 'new_follower':
        return <Heart className="h-4 w-4 text-rose-400" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-cyan-400" />;
      case 'reaction':
        return <Flame className="h-4 w-4 text-amber-400" />;
      default:
        return <Bell className="h-4 w-4 text-emerald-400" />;
    }
  };

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationRead(notif.id);
    if (notif.fromUser?.id && onSelectUser) {
      if (notif.type === 'direct_message') {
        onSelectUser(notif.fromUser.id, 'messages');
      } else {
        onSelectUser(notif.fromUser.id, 'wall');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Известия (Notifications)</h2>
              <p className="text-xs text-slate-400">
                Нови приятели, последователи, коментари и реакции към вашите публикации
              </p>
            </div>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors self-start sm:self-auto"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Маркирай всички като прочетени</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
            <Bell className="mx-auto h-8 w-8 text-slate-500 mb-2 opacity-50" />
            <p className="text-sm font-semibold text-white">Нямате нови известия</p>
            <p className="mt-1 text-xs text-slate-400">
              Когато някой хареса публикация, коментира или ви добави в приятели, ще получите известие тук.
            </p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                notif.read
                  ? 'border-slate-800/80 bg-slate-900/40 opacity-80'
                  : 'border-emerald-500/30 bg-slate-900/90 shadow-sm'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white">{notif.title}</h4>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 font-mono">
                    <Clock className="h-3 w-3" />
                    {new Date(notif.createdAt).toLocaleDateString('bg-BG')} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">{notif.message}</p>
              </div>

              {!notif.read && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
