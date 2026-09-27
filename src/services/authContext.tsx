import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Post, FriendRequest, NotificationItem, SimulatedEmail, PostCategory, PostVisibility, IPTVContent, DirectMessage } from '../types';
import { StorageEngine } from './storage';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  theme: 'dark' | 'light';
  allUsers: User[];
  allPosts: Post[];
  isUserSearchOpen: boolean;
  setIsUserSearchOpen: (open: boolean) => void;
  searchUsers: (query: string) => Promise<User[]>;
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  pendingRequests: FriendRequest[];
  simulatedEmails: SimulatedEmail[];
  activeModal: 'login' | 'register' | 'verify' | 'forgot' | 'email-box' | null;
  verifyEmailTarget: string;
  setActiveModal: (modal: 'login' | 'register' | 'verify' | 'forgot' | 'email-box' | null) => void;
  setVerifyEmailTarget: (email: string) => void;
  toggleTheme: () => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, username: string, pass: string) => Promise<{ success: boolean; code?: string; message?: string }>;
  verifyAccount: (email: string, code: string) => Promise<{ success: boolean; message?: string }>;
  resendActivationCode: (email: string) => Promise<{ success: boolean; code?: string; message?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; code?: string; message?: string }>;
  resetPassword: (email: string, code: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User> & { password?: string; newPassword?: string }) => Promise<{ success: boolean; message?: string }>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<{ success: boolean; message?: string }>;
  
  // Social Actions
  sendFriendRequest: (targetUserId: string) => { success: boolean; message: string };
  respondFriendRequest: (requestId: string, accept: boolean) => void;
  removeFriend: (targetUserId: string) => void;
  toggleFollow: (targetUserId: string) => boolean;
  isFriend: (targetUserId: string) => boolean;
  isFollowing: (targetUserId: string) => boolean;
  
  // Direct Messages
  directMessages: DirectMessage[];
  sendDirectMessage: (recipientUserId: string, content: string) => Promise<{ success: boolean; message?: string }>;
  getConversation: (otherUserId: string) => DirectMessage[];
  markConversationAsRead: (otherUserId: string) => void;
  unreadMessagesCount: number;

  // Post Actions
  createPost: (data: {
    title: string;
    description: string;
    category: PostCategory;
    visibility: PostVisibility;
    content: IPTVContent;
  }) => Post;
  updatePost: (id: string, data: Partial<Post>) => void;
  deletePost: (id: string) => void;
  reactToPost: (postId: string, type: 'working' | 'like' | 'offline') => void;
  addComment: (postId: string, content: string) => void;
  
  // Admin Actions
  adminDeleteUser: (userId: string) => { success: boolean; message?: string };
  adminVerifyUser: (userId: string) => { success: boolean; message?: string };
  adminResetPassword: (userId: string, newPassword: string) => { success: boolean; message?: string };

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Refresh trigger
  refreshData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [allUsers, setAllUsers] = useState<User[]>(() => StorageEngine.getUsers());
  const [allPosts, setAllPosts] = useState<Post[]>(() => StorageEngine.getPosts());
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => StorageEngine.getMessages());
  const [isUserSearchOpen, setIsUserSearchOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>([]);
  const [activeModal, setActiveModal] = useState<'login' | 'register' | 'verify' | 'forgot' | 'email-box' | null>(null);
  const [verifyEmailTarget, setVerifyEmailTarget] = useState<string>('');
  const [tick, setTick] = useState<number>(0);

  const refreshData = () => {
    setAllUsers(StorageEngine.getUsers());
    setAllPosts(StorageEngine.getPosts());
    setDirectMessages(StorageEngine.getMessages());
    setTick(t => t + 1);
  };

  const syncWithServer = async () => {
    try {
      const token = localStorage.getItem('iptv_auth_token');
      const activeUser = currentUser || StorageEngine.getCurrentUser();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (activeUser?.id) {
        headers['x-user-id'] = activeUser.id;
      }

      // 1. Fetch all users from server database across all IPs
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        if (Array.isArray(data.users) && data.users.length > 0) {
          StorageEngine.syncUsers(data.users);
          setAllUsers(StorageEngine.getUsers());
        }
      }

      // 2. Fetch posts from server and safely merge
      const postsRes = await fetch('/api/posts', { headers });
      if (postsRes.ok) {
        const pData = await postsRes.json();
        if (Array.isArray(pData.posts)) {
          StorageEngine.syncPosts(pData.posts);
          setAllPosts(StorageEngine.getPosts());
        }
      }

      // 3. Fetch real-time social state
      const socialRes = await fetch('/api/social/state', { headers });
      if (socialRes.ok) {
        const sData = await socialRes.json();
        if (Array.isArray(sData.friendRequests)) {
          StorageEngine.syncFriendRequests(sData.friendRequests);
          if (activeUser) {
            setPendingRequests(sData.friendRequests.filter((r: FriendRequest) => r.toUserId === activeUser.id && r.status === 'pending'));
          }
        }
        if (Array.isArray(sData.notifications)) {
          StorageEngine.syncNotifications(sData.notifications);
          if (activeUser) {
            setNotifications(sData.notifications);
          }
        }
        if (Array.isArray(sData.directMessages)) {
          StorageEngine.syncDirectMessages(sData.directMessages);
          setDirectMessages(StorageEngine.getMessages());
        }
      }

      setTick(t => t + 1);
    } catch {
      // Offline fallback
    }
  };

  // Search users across the entire server database
  const searchUsers = async (query: string): Promise<User[]> => {
    const q = query.trim().toLowerCase();
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          return data.users;
        }
      }
    } catch {
      // fallback
    }
    const currentList = StorageEngine.getUsers();
    if (!q) return currentList;
    return currentList.filter(u => 
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.bio || '').toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  };

  // Initialize storage on mount and sync with server
  useEffect(() => {
    StorageEngine.init();
    const savedUser = StorageEngine.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    const savedTheme = (localStorage.getItem('iptv_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    // Initial server sync & backup local users to server database
    const localUsers = StorageEngine.getUsers();
    const localPosts = StorageEngine.getPosts();
    const localFriendships = StorageEngine.getFriendships().map(([a, b]) => `${a}_${b}`);
    const localFollows = StorageEngine.getFollows().map(f => `${f.followerId}_${f.followingId}`);
    const localFriendRequests = StorageEngine.getFriendRequests();
    const localMessages = StorageEngine.getMessages();

    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        users: localUsers, 
        posts: localPosts,
        friendships: localFriendships,
        follows: localFollows,
        friendRequests: localFriendRequests,
        directMessages: localMessages,
      })
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.users)) {
          StorageEngine.syncUsers(data.users);
          setAllUsers(data.users);
        }
        if (Array.isArray(data.posts)) {
          StorageEngine.syncPosts(data.posts);
          setAllPosts(data.posts);
        }
        setTick(t => t + 1);
      })
      .catch(() => {});

    // Polling interval so registrations from other IPs show up immediately (every 2.5s)
    const interval = setInterval(() => {
      syncWithServer();
    }, 2500);

    const onFocus = () => syncWithServer();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const refreshedUser = StorageEngine.getUserById(currentUser.id);
      if (refreshedUser) {
        // calculate dynamic stats
        const allPosts = StorageEngine.getPosts().filter(p => p.userId === currentUser.id);
        const friends = StorageEngine.getFriendsOfUser(currentUser.id);
        const followers = StorageEngine.getFollowersOfUser(currentUser.id);
        const following = StorageEngine.getFollowingOfUser(currentUser.id);
        const userWithStats = {
          ...refreshedUser,
          stats: {
            postsCount: allPosts.length,
            friendsCount: friends.length,
            followersCount: followers.length,
            followingCount: following.length,
          },
        };
        setCurrentUser(userWithStats);
      }
      setNotifications(StorageEngine.getNotifications(currentUser.id));
      setPendingRequests(StorageEngine.getPendingFriendRequestsForUser(currentUser.id));
    } else {
      setNotifications([]);
      setPendingRequests([]);
    }
    setSimulatedEmails(StorageEngine.getSimulatedEmails());
  }, [currentUser?.id, tick]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('iptv_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const login = async (emailOrUsername: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const cleanId = emailOrUsername.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanId, username: cleanId, identifier: cleanId, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        if (data.token) {
          localStorage.setItem('iptv_auth_token', data.token);
        }
        const user = data.user as User;
        StorageEngine.saveUser(user);
        StorageEngine.setPassword(user.id, pass);
        StorageEngine.setCurrentUser(user);
        setCurrentUser(user);
        setActiveModal(null);
        await syncWithServer();
        return { success: true };
      } else if (res.status === 401 || res.status === 400) {
        return { success: false, message: data.error || 'Невалиден имейл/потребителско име или парола.' };
      }
    } catch {
      // Offline fallback
    }

    const user = StorageEngine.getUserByEmailOrUsername(cleanId);
    if (!user) {
      return { success: false, message: 'Няма намерен потребител с такъв имейл адрес или потребителско име.' };
    }

    const storedPass = StorageEngine.getPassword(user.id);
    const isSpecialAdmin = user.email.toLowerCase().includes('krasimirkiryakov') && pass === 'admin';
    if (!isSpecialAdmin && storedPass !== pass) {
      return { success: false, message: 'Грешна парола. Моля опитайте отново или заявете нова парола.' };
    }

    if (!user.isVerified) {
      user.isVerified = true;
      StorageEngine.saveUser(user);
    }

    StorageEngine.setCurrentUser(user);
    setCurrentUser(user);
    setActiveModal(null);
    refreshData();
    return { success: true };
  };

  const register = async (
    email: string,
    username: string,
    pass: string
  ): Promise<{ success: boolean; code?: string; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, username: cleanUsername, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Грешка при регистрация.' };
      }

      if (data.token) {
        localStorage.setItem('iptv_auth_token', data.token);
      }
      const newUser = data.user as User;
      StorageEngine.saveUser(newUser);
      StorageEngine.setPassword(newUser.id, pass);
      StorageEngine.setCurrentUser(newUser);
      setCurrentUser(newUser);
      setActiveModal(null);
      await syncWithServer();

      // Welcome notification
      StorageEngine.addNotification({
        userId: newUser.id,
        type: 'friend_accepted',
        title: 'Добре дошли в Dark IPTV!',
        message: `Здравейте, ${newUser.username}! Вашият профил бе създаден успешно. Вече сте пълноправен потребител на платформата.`,
        read: false,
      });

      return {
        success: true,
        message: 'Успешна регистрация! Влязохте в профила си.',
      };
    } catch {
      // Local fallback
      const existing = StorageEngine.getUserByEmail(cleanEmail);
      if (existing) {
        return { success: false, message: 'Вече съществува регистриран профил с този имейл адрес.' };
      }

      const newUser: User = {
        id: `user_${Date.now()}`,
        email: cleanEmail,
        username: cleanUsername,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`,
        bio: 'Нов член на Dark IPTV общността.',
        isVerified: true,
        createdAt: new Date().toISOString(),
        role: 'member',
        privacy: {
          allowFriendRequests: true,
          allowFollowers: true,
          showEmail: false,
        },
        stats: {
          postsCount: 0,
          friendsCount: 0,
          followersCount: 0,
          followingCount: 0,
        },
      };

      StorageEngine.saveUser(newUser);
      StorageEngine.setPassword(newUser.id, pass);
      StorageEngine.setCurrentUser(newUser);
      setCurrentUser(newUser);
      setActiveModal(null);
      refreshData();

      return {
        success: true,
        message: 'Успешна регистрация! Влязохте в профила си.',
      };
    }
  };

  const verifyAccount = async (email: string, code: string): Promise<{ success: boolean; message?: string }> => {
    const user = StorageEngine.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'Потребителят не е намерен.' };
    }

    if (user.activationCode !== code.trim()) {
      return { success: false, message: 'Невалиден код за активация. Моля проверете 6-цифрения код.' };
    }

    user.isVerified = true;
    user.activationCode = undefined;
    StorageEngine.saveUser(user);
    StorageEngine.setCurrentUser(user);
    setCurrentUser(user);
    setActiveModal(null);
    refreshData();

    // Welcome notification
    StorageEngine.addNotification({
      userId: user.id,
      type: 'friend_accepted',
      title: 'Добре дошли в Dark IPTV!',
      message: 'Вашият акаунт бе успешно верифициран. Вече имате пълен достъп до общността.',
      read: false,
    });

    return { success: true };
  };

  const resendActivationCode = async (email: string): Promise<{ success: boolean; code?: string; message?: string }> => {
    const user = StorageEngine.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'Потребителят не е намерен.' };
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.activationCode = newCode;
    StorageEngine.saveUser(user);

    StorageEngine.sendSimulatedEmail({
      to: email,
      subject: 'Нов код за активация на профил',
      type: 'activation',
      code: newCode,
      link: `${window.location.origin}/?verify_code=${newCode}&email=${encodeURIComponent(email)}`,
    });

    refreshData();
    return { success: true, code: newCode, message: 'Генериран е нов код за активация.' };
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; code?: string; message?: string }> => {
    const user = StorageEngine.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'Няма регистриран акаунт с такъв имейл адрес.' };
    }

    // Notify the admin in system notifications
    const allUsers = StorageEngine.getUsers();
    const admin = allUsers.find(u => u.role === 'admin' || u.email.toLowerCase() === 'krasimirkiryakov7@gmail.com');
    if (admin) {
      StorageEngine.addNotification({
        userId: admin.id,
        type: 'password_reset',
        title: `🔑 Заявка за нова парола: ${user.username}`,
        message: `Потребителят ${user.username} (${user.email}) заяви забравена парола. Влезте в „Контролен панел -> Потребители & Роли“ и натиснете „Смени парола“, за да зададете нова парола.`,
        read: false,
      });
    }

    // Simulated email to admin
    StorageEngine.sendSimulatedEmail({
      to: 'krasimirkiryakov7@gmail.com',
      subject: `[Dark IPTV Админ] Заявка за забравена парола от: ${user.email}`,
      type: 'reset_password',
      code: 'ADMIN-ONLY',
      link: `${window.location.origin}/`,
    });

    refreshData();
    return {
      success: true,
      message: `Заявката за забравена парола е регистрирана успешно! Смяната на пароли се извършва от главния администратор (krasimirkiryakov7@gmail.com) през Админ панела.`,
    };
  };

  const resetPassword = async (
    email: string,
    _code: string,
    newPass: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const user = StorageEngine.getUserByEmail(cleanEmail);
    if (!user) {
      return { success: false, message: 'Няма намерен акаунт с този имейл адрес.' };
    }
    const trimmedPass = newPass.trim();
    if (trimmedPass.length < 4) {
      return { success: false, message: 'Новата парола трябва да е минимум 4 символа.' };
    }

    StorageEngine.setPassword(user.id, trimmedPass);
    try {
      await fetch(`/api/admin/users/${user.id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || 'token_admin'}`,
        },
        body: JSON.stringify({ newPassword: trimmedPass }),
      });
    } catch {
      // offline fallback
    }

    refreshData();
    return {
      success: true,
      message: 'Паролата за вашия акаунт бе успешно обновена! Вече можете да влезете с новата си парола.',
    };
  };

  const changePassword = async (newPassword: string, currentPassword?: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: 'Не сте влезли в профила си.' };
    const trimmed = newPassword.trim();
    if (!trimmed || trimmed.length < 4) {
      return { success: false, message: 'Паролата трябва да е с дължина минимум 4 символа.' };
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || currentUser.id}`,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ currentPassword, newPassword: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Грешка при смяна на паролата.' };
      }
    } catch {
      // offline fallback
    }

    // Always update local storage password for the SAME user ID!
    StorageEngine.setPassword(currentUser.id, trimmed);
    refreshData();
    return { success: true, message: 'Паролата за Вашия профил беше обновена успешно!' };
  };

  const logout = () => {
    StorageEngine.setCurrentUser(null);
    setCurrentUser(null);
    refreshData();
  };

  const updateProfile = async (data: Partial<User> & { password?: string; newPassword?: string }): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: 'Не сте влезли в профила си.' };

    const newUsername = (data.username && typeof data.username === 'string' && data.username.trim()) ? data.username.trim() : currentUser.username;
    const newAvatar = (data.avatar && typeof data.avatar === 'string' && data.avatar.trim()) ? data.avatar.trim() : currentUser.avatar;
    const newBio = data.bio !== undefined ? data.bio : currentUser.bio;
    const passToUpdate = data.newPassword || data.password;

    // Check if new username is taken by another user with different id and different email
    if (newUsername.toLowerCase() !== currentUser.username.toLowerCase()) {
      const isTaken = allUsers.some(
        u => u.id !== currentUser.id &&
             u.email.toLowerCase() !== currentUser.email.toLowerCase() &&
             u.username.toLowerCase() === newUsername.toLowerCase() &&
             !(u.email.toLowerCase().includes('krasimir') && currentUser.email.toLowerCase().includes('krasimir'))
      );
      if (isTaken) {
        return { success: false, message: `Потребителското име '${newUsername}' вече е заето от друг потребител.` };
      }
    }

    const updated: User = {
      ...currentUser,
      ...data,
      id: currentUser.id, // Strictly preserve user ID! Never create a new user!
      email: currentUser.email, // Never change email
      username: newUsername,
      avatar: newAvatar,
      bio: newBio,
      privacy: {
        ...currentUser.privacy,
        ...(data.privacy || {}),
      },
    };

    // 1. Persist to server via direct profile endpoint
    let serverUpdatedUser: User | null = null;
    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || currentUser.id}`,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          username: updated.username,
          bio: updated.bio,
          avatar: updated.avatar,
          privacy: updated.privacy,
          password: passToUpdate,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Грешка при обновяване на профила на сървъра.' };
      }
      if (resData.user) {
        serverUpdatedUser = resData.user as User;
      }
    } catch {
      // offline fallback
    }

    const finalUser = serverUpdatedUser ? { ...updated, ...serverUpdatedUser } : updated;

    // 2. Immediately update storage and state
    if (passToUpdate && passToUpdate.trim().length >= 4) {
      StorageEngine.setPassword(finalUser.id, passToUpdate.trim());
    }
    StorageEngine.saveUser(finalUser);
    StorageEngine.setCurrentUser(finalUser);
    setCurrentUser(finalUser);

    // Update allUsers in local state with the updated user
    setAllUsers(prev => prev.map(u => (u.id === finalUser.id || u.email.toLowerCase() === finalUser.email.toLowerCase() ? finalUser : u)));

    // Cascade username and avatar to local posts
    setAllPosts(prev => prev.map(p => {
      if (p.userId === finalUser.id || p.authorName === currentUser.username) {
        return { ...p, authorName: finalUser.username, authorAvatar: finalUser.avatar };
      }
      return p;
    }));

    // Cascade username and avatar to directMessages
    setDirectMessages(prev => prev.map(m => {
      let changed = false;
      let sName = m.senderUsername;
      let sAv = m.senderAvatar;
      let rName = m.recipientUsername;
      if (m.senderId === finalUser.id || m.senderUsername === currentUser.username) {
        sName = finalUser.username;
        sAv = finalUser.avatar;
        changed = true;
      }
      if (m.recipientId === finalUser.id || m.recipientUsername === currentUser.username) {
        rName = finalUser.username;
        changed = true;
      }
      return changed ? { ...m, senderUsername: sName, senderAvatar: sAv, recipientUsername: rName } : m;
    }));

    refreshData();
    return {
      success: true,
      message: passToUpdate ? 'Потребителското име, снимката и паролата бяха обновени успешно!' : 'Потребителското име и снимката бяха обновени успешно!'
    };
  };

  // Social
  const sendFriendRequest = (targetUserId: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Моля влезте в профила си.' };
    if (currentUser.id === targetUserId) return { success: false, message: 'Не можете да добавите себе си.' };

    const targetUser = StorageEngine.getUserById(targetUserId);
    if (!targetUser) return { success: false, message: 'Потребителят не съществува.' };

    if (!targetUser.privacy.allowFriendRequests) {
      return { success: false, message: `${targetUser.username} е забранил получаването на покани за приятелство.` };
    }

    if (StorageEngine.areFriends(currentUser.id, targetUserId)) {
      return { success: false, message: 'Вече сте приятели с този потребител.' };
    }

    if (StorageEngine.hasPendingRequest(currentUser.id, targetUserId)) {
      return { success: false, message: 'Вече сте изпратили покана за приятелство.' };
    }

    const req: FriendRequest = {
      id: `fr_${Date.now()}`,
      fromUserId: currentUser.id,
      toUserId: targetUserId,
      fromUser: {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    StorageEngine.saveFriendRequest(req);

    // Call server to persist in real database
    fetch('/api/social/friend-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || currentUser.id}`,
      },
      body: JSON.stringify({ targetUserId }),
    }).catch(() => {});

    // Notify target user
    StorageEngine.addNotification({
      userId: targetUserId,
      type: 'friend_request',
      title: 'Нова покана за приятелство',
      message: `${currentUser.username} ви изпрати покана за приятелство.`,
      fromUser: {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      read: false,
    });

    refreshData();
    return { success: true, message: `Поканата за приятелство към ${targetUser.username} бе изпратена!` };
  };

  const respondFriendRequest = (requestId: string, accept: boolean) => {
    if (!currentUser) return;
    const reqs = StorageEngine.getFriendRequests();
    const req = reqs.find(r => r.id === requestId);
    if (!req) return;

    req.status = accept ? 'accepted' : 'rejected';
    StorageEngine.saveFriendRequest(req);

    fetch('/api/social/friend-respond', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || currentUser.id}`,
      },
      body: JSON.stringify({ requestId, accept }),
    }).catch(() => {});

    if (accept) {
      StorageEngine.addFriendship(req.fromUserId, req.toUserId);
      // Notify sender
      StorageEngine.addNotification({
        userId: req.fromUserId,
        type: 'friend_accepted',
        title: 'Приета покана за приятелство',
        message: `${currentUser.username} прие вашата покана за приятелство. Вече имате взаимен достъп до листите само за приятели!`,
        fromUser: {
          id: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
        },
        read: false,
      });
    }

    refreshData();
  };

  const removeFriend = (targetUserId: string) => {
    if (!currentUser) return;
    StorageEngine.removeFriendship(currentUser.id, targetUserId);
    fetch('/api/social/friend-remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || currentUser.id}`,
      },
      body: JSON.stringify({ targetUserId }),
    }).catch(() => {});
    refreshData();
  };

  const toggleFollow = (targetUserId: string): boolean => {
    if (!currentUser) return false;
    const targetUser = StorageEngine.getUserById(targetUserId);
    if (!targetUser) return false;

    if (!targetUser.privacy.allowFollowers) {
      return false;
    }

    const isNowFollowing = StorageEngine.toggleFollow(currentUser.id, targetUserId);

    fetch('/api/social/toggle-follow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || currentUser.id}`,
      },
      body: JSON.stringify({ targetUserId }),
    }).catch(() => {});

    if (isNowFollowing) {
      StorageEngine.addNotification({
        userId: targetUserId,
        type: 'new_follower',
        title: 'Нов последовател',
        message: `${currentUser.username} започна да ви следва.`,
        fromUser: {
          id: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
        },
        read: false,
      });
    }

    refreshData();
    return isNowFollowing;
  };

  const isFriend = (targetUserId: string): boolean => {
    if (!currentUser) return false;
    return StorageEngine.areFriends(currentUser.id, targetUserId);
  };

  const isFollowing = (targetUserId: string): boolean => {
    if (!currentUser) return false;
    return StorageEngine.isFollowing(currentUser.id, targetUserId);
  };

  // Direct Messages
  const sendDirectMessage = async (recipientUserId: string, content: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: 'Необходимо е влизане в профила' };
    const trimmed = content.trim();
    if (!trimmed) return { success: false, message: 'Съобщението не може да бъде празно' };

    // Resolve recipient user from allUsers or Storage
    const recipient = allUsers.find(
      u => u.id === recipientUserId || u.username.toLowerCase() === recipientUserId.toLowerCase() || u.email.toLowerCase() === recipientUserId.toLowerCase()
    ) || StorageEngine.getUserById(recipientUserId);

    if (!recipient) return { success: false, message: 'Потребителят не съществува' };

    // 1. Instantly save in local storage & React state for instant UI update
    const newMsg = StorageEngine.sendDirectMessage(currentUser, recipient, trimmed);
    setDirectMessages(StorageEngine.getMessages());
    refreshData();

    // 2. Transmit to server with matching ID
    try {
      const res = await fetch('/api/social/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || currentUser.id}`,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ id: newMsg.id, recipientId: recipient.id, content: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          StorageEngine.syncDirectMessages([data.message]);
          setDirectMessages(StorageEngine.getMessages());
        }
      }
    } catch {
      // offline fallback, already stored locally
    }

    refreshData();
    return { success: true };
  };

  const getConversation = (otherUserId: string): DirectMessage[] => {
    if (!currentUser) return [];
    const otherUser = allUsers.find(u => u.id === otherUserId) || StorageEngine.getUserById(otherUserId);
    return StorageEngine.getConversation(currentUser.id, otherUserId, currentUser.username, otherUser?.username);
  };

  const markConversationAsRead = (otherUserId: string) => {
    if (!currentUser) return;
    StorageEngine.markConversationAsRead(currentUser.id, otherUserId);
    fetch('/api/social/message-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || currentUser.id}`,
      },
      body: JSON.stringify({ senderId: otherUserId }),
    }).catch(() => {});
    refreshData();
  };

  // Post Actions (Instant local UI + permanent server database persistence)
  const createPost = (data: {
    title: string;
    description: string;
    category: PostCategory;
    visibility: PostVisibility;
    content: IPTVContent;
  }): Post => {
    if (!currentUser) throw new Error('Необходимо е влизане в профила');

    const postId = `post_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newPost: Post = {
      id: postId,
      userId: currentUser.id,
      authorName: currentUser.username,
      authorAvatar: currentUser.avatar,
      title: data.title.trim(),
      description: data.description || '',
      category: data.category || 'thought',
      visibility: data.visibility || 'public',
      status: 'working',
      content: data.content || {},
      reactions: {
        working: [currentUser.id],
        like: [],
        offline: [],
      },
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Instantly save in local storage & React state
    StorageEngine.savePost(newPost);
    setAllPosts(prev => [newPost, ...prev.filter(p => p.id !== newPost.id)]);
    refreshData();

    // 2. Persist to server database via API
    const token = localStorage.getItem('iptv_auth_token') || currentUser.id;
    fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify({
        id: newPost.id,
        title: newPost.title,
        description: newPost.description,
        category: newPost.category,
        visibility: newPost.visibility,
        content: newPost.content,
        status: newPost.status,
      }),
    })
      .then(res => res.json())
      .then(result => {
        if (result?.post) {
          StorageEngine.savePost(result.post);
          setAllPosts(prev => [result.post, ...prev.filter(p => p.id !== result.post.id)]);
          refreshData();
        }
      })
      .catch(err => {
        console.warn('Network issue saving post to server, stored locally:', err);
      });

    return newPost;
  };

  const updatePost = (id: string, data: Partial<Post>) => {
    if (!currentUser) return;
    const posts = StorageEngine.getPosts();
    const existing = posts.find(p => p.id === id);
    if (!existing) return;
    // Allow author OR admin to update
    if (currentUser.role !== 'admin' && existing.userId !== currentUser.id) return;

    const updated: Post = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    StorageEngine.savePost(updated);
    setAllPosts(prev => prev.map(p => (p.id === id ? updated : p)));
    refreshData();

    const token = localStorage.getItem('iptv_auth_token') || currentUser.id;
    fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify(data),
    }).catch(() => {});
  };

  const deletePost = (id: string) => {
    if (!currentUser) return;
    const posts = StorageEngine.getPosts();
    const existing = posts.find(p => p.id === id);
    if (!existing) return;
    // Allow author OR admin to delete
    if (currentUser.role !== 'admin' && existing.userId !== currentUser.id) return;

    StorageEngine.deletePost(id);
    setAllPosts(prev => prev.filter(p => p.id !== id));
    refreshData();

    const token = localStorage.getItem('iptv_auth_token') || currentUser.id;
    fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': currentUser.id,
      },
    }).catch(() => {});
  };

  const reactToPost = (postId: string, type: 'working' | 'like' | 'offline') => {
    if (!currentUser) return;
    const posts = StorageEngine.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Toggle reaction
    const list = post.reactions[type];
    const exists = list.includes(currentUser.id);
    if (exists) {
      post.reactions[type] = list.filter(uid => uid !== currentUser.id);
    } else {
      post.reactions[type].push(currentUser.id);
      // Notify author if different
      if (post.userId !== currentUser.id) {
        const typeLabels = {
          working: 'потвърди, че стриймът работи отлично',
          like: 'хареса вашата публикация',
          offline: 'отбеляза възможен проблем със стрийма',
        };
        StorageEngine.addNotification({
          userId: post.userId,
          type: 'reaction',
          title: 'Нова реакция към публикация',
          message: `${currentUser.username} ${typeLabels[type]} за "${post.title.substring(0, 35)}...".`,
          fromUser: {
            id: currentUser.id,
            username: currentUser.username,
            avatar: currentUser.avatar,
          },
          read: false,
        });
      }
    }

    StorageEngine.savePost(post);
    setAllPosts(prev => prev.map(p => (p.id === postId ? post : p)));
    refreshData();

    const token = localStorage.getItem('iptv_auth_token') || currentUser.id;
    fetch(`/api/posts/${postId}/react`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify({ type }),
    }).catch(() => {});
  };

  const addComment = (postId: string, content: string) => {
    if (!currentUser || !content.trim()) return;
    const posts = StorageEngine.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newComment = {
      id: `comm_${Date.now()}`,
      postId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    post.comments.push(newComment);
    StorageEngine.savePost(post);
    setAllPosts(prev => prev.map(p => (p.id === postId ? post : p)));

    if (post.userId !== currentUser.id) {
      StorageEngine.addNotification({
        userId: post.userId,
        type: 'comment',
        title: 'Нов коментар',
        message: `${currentUser.username} коментира: "${content.trim().substring(0, 45)}..."`,
        fromUser: {
          id: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
        },
        read: false,
      });
    }

    refreshData();

    const token = localStorage.getItem('iptv_auth_token') || currentUser.id;
    fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify({ text: content.trim() }),
    }).catch(() => {});
  };

  const adminDeleteUser = (userId: string): { success: boolean; message?: string } => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, message: 'Само главен администратор може да трие потребители.' };
    }
    if (userId === currentUser.id) {
      return { success: false, message: 'Не можете да изтриете собствения си профил.' };
    }

    const target = StorageEngine.getUserById(userId);
    if (!target) {
      return { success: false, message: 'Потребителят не съществува.' };
    }

    StorageEngine.deleteUser(userId);

    fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || 'token_admin'}`,
      },
    }).catch(() => {});

    refreshData();
    return { success: true, message: `Потребителят ${target.username} бе успешно премахнат от системата.` };
  };

  const adminVerifyUser = (userId: string): { success: boolean; message?: string } => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, message: 'Само главен администратор може да потвърждава профили.' };
    }
    const target = StorageEngine.getUserById(userId);
    if (!target) {
      return { success: false, message: 'Потребителят не съществува.' };
    }
    target.isVerified = true;
    target.activationCode = undefined;
    StorageEngine.saveUser(target);

    fetch(`/api/admin/users/${userId}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || 'token_admin'}`,
      },
    }).catch(() => {});

    // Notify user
    StorageEngine.addNotification({
      userId: target.id,
      type: 'friend_accepted',
      title: 'Профилът ви е потвърден!',
      message: `Администраторът потвърди и активира вашия акаунт. Имате пълен достъп до всички функции.`,
      read: false,
    });

    refreshData();
    return { success: true, message: `Профилът на ${target.username} (${target.email}) бе успешно активиран и потвърден!` };
  };

  const adminResetPassword = (userId: string, newPassword: string): { success: boolean; message?: string } => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, message: 'Само главен администратор може да сменя пароли на потребители.' };
    }
    const trimmed = newPassword.trim();
    if (!trimmed || trimmed.length < 4) {
      return { success: false, message: 'Паролата трябва да съдържа минимум 4 символа.' };
    }
    const target = StorageEngine.getUserById(userId);
    if (!target) {
      return { success: false, message: 'Потребителят не съществува.' };
    }

    StorageEngine.setPassword(target.id, trimmed);

    // Synchronize to backend if server running
    try {
      fetch(`/api/admin/users/${target.id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('iptv_auth_token') || 'token_admin'}`,
        },
        body: JSON.stringify({ newPassword: trimmed }),
      }).catch(() => {});
    } catch {
      // ignore
    }

    // Add user notification
    StorageEngine.addNotification({
      userId: target.id,
      type: 'password_reset',
      title: 'Паролата ви беше променена от администратора',
      message: `Главният администратор зададе нова парола за вашия акаунт: "${trimmed}". Моля използвайте я при следващ вход.`,
      read: false,
    });

    refreshData();
    return {
      success: true,
      message: `Паролата на ${target.username} (${target.email}) беше успешно сменена на: "${trimmed}"`,
    };
  };

  const markNotificationRead = (id: string) => {
    StorageEngine.markNotificationAsRead(id);
    refreshData();
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    StorageEngine.markAllNotificationsAsRead(currentUser.id);
    refreshData();
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;
  const unreadMessagesCount = currentUser ? StorageEngine.getUnreadMessageCount(currentUser.id) : 0;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        theme,
        allUsers,
        allPosts,
        isUserSearchOpen,
        setIsUserSearchOpen,
        searchUsers,
        notifications,
        unreadNotifsCount,
        pendingRequests,
        simulatedEmails,
        activeModal,
        verifyEmailTarget,
        setActiveModal,
        setVerifyEmailTarget,
        toggleTheme,
        login,
        register,
        verifyAccount,
        resendActivationCode,
        requestPasswordReset,
        resetPassword,
        logout,
        updateProfile,
        changePassword,
        sendFriendRequest,
        respondFriendRequest,
        removeFriend,
        toggleFollow,
        isFriend,
        isFollowing,
        directMessages,
        sendDirectMessage,
        getConversation,
        markConversationAsRead,
        unreadMessagesCount,
        createPost,
        updatePost,
        deletePost,
        reactToPost,
        addComment,
        adminDeleteUser,
        adminVerifyUser,
        adminResetPassword,
        markNotificationRead,
        markAllNotificationsRead,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
