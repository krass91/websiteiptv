import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/authContext';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { AuthModals } from './components/AuthModals';
import { Feed } from './components/Feed';
import { CreateEditPostModal } from './components/CreateEditPostModal';
import { FriendsAndFollowers } from './components/FriendsAndFollowers';
import { ProfileView } from './components/ProfileView';
import { M3uTester } from './components/M3uTester';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { NotificationsView } from './components/NotificationsView';
import { AdminPanel } from './components/AdminPanel';
import { UserProfileModal } from './components/UserProfileModal';
import { UserSearchModal } from './components/UserSearchModal';
import { Post, PostCategory } from './types';
import { 
  ShieldCheck, 
  Lock, 
  Tv, 
  Users, 
  FileCode, 
  Heart, 
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    isAuthenticated, 
    currentUser, 
    setActiveModal, 
    setVerifyEmailTarget,
    isUserSearchOpen,
    setIsUserSearchOpen,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('feed');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [createCategory, setCreateCategory] = useState<PostCategory>('thought');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserTab, setSelectedUserTab] = useState<'wall' | 'messages'>('wall');

  const handleOpenUserProfile = (userId: string, tab: 'wall' | 'messages' = 'wall') => {
    setSelectedUserId(userId);
    setSelectedUserTab(tab);
  };

  // Check URL query parameters for activation or password reset links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyCode = params.get('verify_code');
    const resetCode = params.get('reset_code');
    const email = params.get('email');

    if (verifyCode && email) {
      setVerifyEmailTarget(email);
      setActiveModal('verify');
    } else if (resetCode && email) {
      setActiveModal('forgot');
    }
  }, [setActiveModal, setVerifyEmailTarget]);

  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setCreateCategory(post.category);
    setIsCreateModalOpen(true);
  };

  const handleOpenCreate = (cat: PostCategory = 'thought') => {
    setEditingPost(null);
    setCreateCategory(cat);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Universal Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCreateModal={() => handleOpenCreate('thought')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          // UNREGISTERED / NOT LOGGED IN: Public landing page with ZERO posts
          <LandingHero
            onOpenRegister={() => setActiveModal('register')}
            onOpenLogin={() => setActiveModal('login')}
          />
        ) : (
          // AUTHENTICATED USER: Full access to features according to privacy and permissions
          <div>
            {activeTab === 'feed' && (
              <div className="space-y-6">
                {/* Welcome Ribbon */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                  <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>Добре дошли, {currentUser?.username}!</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        {currentUser?.role}
                      </span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-400">
                      Частен достъп до проверени IPTV стриймове, M3U листи, Stalker портали, MAC ключове и споделяне на мисли в реално време.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                    <button
                      onClick={() => handleOpenCreate('thought')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Сподели мисъл</span>
                    </button>
                    <button
                      onClick={() => handleOpenCreate('m3u')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Стрийм / Портал</span>
                    </button>
                  </div>
                </div>

                {/* The Secure Feed */}
                <Feed 
                  onOpenEdit={handleOpenEdit} 
                  onSelectUser={handleOpenUserProfile} 
                  onOpenCreate={handleOpenCreate} 
                />
              </div>
            )}

            {activeTab === 'my-posts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                  <div>
                    <h2 className="text-xl font-bold text-white">Моите споделени публикации & мисли</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Управление на вашите публични, приятелски и лични IPTV листи и статуси
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenCreate('thought')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Нова публикация</span>
                  </button>
                </div>
                <Feed 
                  onOpenEdit={handleOpenEdit} 
                  filterUserOnly={true} 
                  onSelectUser={handleOpenUserProfile} 
                  onOpenCreate={handleOpenCreate} 
                />
              </div>
            )}

            {activeTab === 'social' && <FriendsAndFollowers onSelectUser={handleOpenUserProfile} />}

            {activeTab === 'admin-panel' && <AdminPanel />}

            {(activeTab === 'profile' || activeTab === 'messages') && (
              <ProfileView 
                onOpenEdit={handleOpenEdit} 
                onSelectUser={handleOpenUserProfile} 
                initialTab={activeTab === 'messages' ? 'messages' : 'profile'}
              />
            )}

            {activeTab === 'm3u-tools' && <M3uTester />}

            {activeTab === 'architecture' && (
              currentUser?.role === 'admin' ? (
                <ArchitectureDocs />
              ) : (
                <div className="p-8 text-center rounded-2xl border border-rose-800 bg-rose-950/40 text-rose-300">
                  <h3 className="text-base font-bold">Ограничен достъп</h3>
                  <p className="text-xs mt-1">Full-Stack Архитектура & Документация е видима само за главния администратор.</p>
                </div>
              )
            )}

            {activeTab === 'notifications' && <NotificationsView onSelectUser={handleOpenUserProfile} />}
          </div>
        )}
      </main>

      {/* User Profile Wall & Messages Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onOpenEditPost={handleOpenEdit}
          initialTab={selectedUserTab}
        />
      )}

      {/* User Search & Database Modal */}
      <UserSearchModal
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
        onSelectUser={handleOpenUserProfile}
      />

      {/* Floating Create / Edit Modal */}
      <CreateEditPostModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPost(null);
        }}
        editingPost={editingPost}
        initialCategory={createCategory}
      />

      {/* Auth Modals (Login, Register, Verify, Forgot Password, Simulated Mailbox) */}
      <AuthModals />

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Dark IPTV. Частна защитена система с контрол на видимостта.</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>End-to-End Privacy</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Leak Gateway</span>
            <span aria-hidden="true">·</span>
            <span>Role-Based Access Control (RBAC)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
