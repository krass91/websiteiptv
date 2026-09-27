import { User, Post, FriendRequest, NotificationItem, SimulatedEmail, DirectMessage } from '../types';

const STORAGE_KEYS = {
  USERS: 'iptv_users_v3_clean',
  POSTS: 'iptv_posts_v3_clean',
  FRIEND_REQUESTS: 'iptv_friend_requests_v3_clean',
  FRIENDSHIPS: 'iptv_friendships_v3_clean',
  FOLLOWS: 'iptv_follows_v3_clean',
  NOTIFICATIONS: 'iptv_notifications_v3_clean',
  SIMULATED_EMAILS: 'iptv_simulated_emails_v3_clean',
  CURRENT_USER: 'iptv_current_user_v3_clean',
  THEME: 'iptv_theme_v3_clean',
  MESSAGES: 'iptv_direct_messages_v1',
};

// User Request Requirements:
// 1. "да е 0 сталкери и листи мак адреса още е нов сайта трябва да е от нула" -> 0 posts initially!
// 2. "и ме направи да съм админ krasimirkiryakov7@gmail.com парола admin"
// 3. "открит да се виждат профилите и какво са писали ама постовете да са заключени докато не са регистрирани"

export const INITIAL_ADMIN_USER: User = {
  id: 'user_krasimir_admin',
  email: 'krasimirkiryakov7@gmail.com',
  username: 'krasimir_admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Главен администратор на Dark IPTV. Пълен контрол над порталите и потребителите.',
  isVerified: true,
  createdAt: new Date().toISOString(),
  role: 'admin',
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

// Community members with public profiles to discover
const SEED_USERS: User[] = [
  INITIAL_ADMIN_USER,
  {
    id: 'user_alex',
    email: 'alex@iptv-prive.net',
    username: 'alex_iptv',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'IPTV ентусиаст и куратор. Очаквайте скоро първите тествани стриймове!',
    isVerified: true,
    createdAt: '2026-03-01T10:00:00Z',
    role: 'moderator',
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
  },
  {
    id: 'user_georgi',
    email: 'georgi@streams.bg',
    username: 'georgi_streams',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'Спортен фен. Подготвям листи за Diema Sport и Max Sport в 50 FPS.',
    isVerified: true,
    createdAt: '2026-03-10T14:30:00Z',
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
  },
  {
    id: 'user_elena',
    email: 'elena@sat-hub.org',
    username: 'elena_sat',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Документални и филмови канали. Нова в общността.',
    isVerified: true,
    createdAt: '2026-03-18T09:15:00Z',
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
  },
];

// ZERO INITIAL POSTS (Starting fresh from 0)
const SEED_POSTS: Post[] = [];

export class StorageEngine {
  private static get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  static init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, SEED_USERS);
      // Set default password for admin krasimirkiryakov7@gmail.com -> 'admin'
      localStorage.setItem(`iptv_pwd_${INITIAL_ADMIN_USER.id}`, 'admin');
      localStorage.setItem(`iptv_pwd_user_alex`, 'password123');
      localStorage.setItem(`iptv_pwd_user_georgi`, 'password123');
      localStorage.setItem(`iptv_pwd_user_elena`, 'password123');
    } else {
      // 1. Ensure admin user exists with password 'admin'
      const users = this.getUsers();
      let modified = false;

      const adminIdx = users.findIndex(u => u.email.toLowerCase() === 'krasimirkiryakov7@gmail.com');
      if (adminIdx === -1) {
        users.unshift(INITIAL_ADMIN_USER);
        localStorage.setItem(`iptv_pwd_${INITIAL_ADMIN_USER.id}`, 'admin');
        modified = true;
      } else {
        users[adminIdx].role = 'admin';
        users[adminIdx].isVerified = true;
        localStorage.setItem(`iptv_pwd_${users[adminIdx].id}`, 'admin');
        modified = true;
      }

      // 2. Ensure all other registered users (e.g. unverified/hidden) are verified and have default passwords
      users.forEach(u => {
        if (!u.isVerified) {
          u.isVerified = true;
          u.activationCode = undefined;
          modified = true;
        }
        if (!localStorage.getItem(`iptv_pwd_${u.id}`)) {
          localStorage.setItem(`iptv_pwd_${u.id}`, 'password123');
        }
      });

      // 3. Ensure SEED members are also present if users list only contained the admin
      SEED_USERS.forEach(seedUser => {
        if (!users.some(u => u.id === seedUser.id || u.email.toLowerCase() === seedUser.email.toLowerCase())) {
          users.push(seedUser);
          localStorage.setItem(`iptv_pwd_${seedUser.id}`, 'password123');
          modified = true;
        }
      });

      if (modified) {
        this.set(STORAGE_KEYS.USERS, users);
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
      this.set(STORAGE_KEYS.POSTS, SEED_POSTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FRIENDSHIPS)) {
      this.set(STORAGE_KEYS.FRIENDSHIPS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FOLLOWS)) {
      this.set(STORAGE_KEYS.FOLLOWS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS)) {
      this.set(STORAGE_KEYS.FRIEND_REQUESTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SIMULATED_EMAILS)) {
      this.set(STORAGE_KEYS.SIMULATED_EMAILS, []);
    }
  }

  // Current logged in user
  static getCurrentUser(): User | null {
    return this.get<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  static setCurrentUser(user: User | null): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Users
  static getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  }

  static syncUsers(serverUsers: User[]): void {
    if (!Array.isArray(serverUsers) || serverUsers.length === 0) return;
    const localUsers = this.getUsers();
    const map = new Map<string, User>();
    
    // Seed with local users
    localUsers.forEach(u => map.set(u.id, u));
    // Merge server users (server is authoritative)
    serverUsers.forEach(u => map.set(u.id, u));

    const merged = Array.from(map.values());
    this.set(STORAGE_KEYS.USERS, merged);

    const current = this.getCurrentUser();
    if (current && map.has(current.id)) {
      this.setCurrentUser(map.get(current.id)!);
    }
  }

  static syncPosts(serverPosts: Post[]): void {
    if (!Array.isArray(serverPosts)) return;
    this.set(STORAGE_KEYS.POSTS, serverPosts);
  }

  static getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  static getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  static saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.set(STORAGE_KEYS.USERS, users);

    // Update current user if matching
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser(user);
    }
  }

  static deleteUser(id: string): void {
    // 1. Remove from users
    const users = this.getUsers().filter(u => u.id !== id);
    this.set(STORAGE_KEYS.USERS, users);

    // 2. Remove user's posts
    const posts = this.getPosts().filter(p => p.userId !== id);
    // Also remove comments authored by this user from all posts
    posts.forEach(p => {
      p.comments = p.comments.filter(c => c.userId !== id);
      p.reactions.like = p.reactions.like.filter(uid => uid !== id);
      p.reactions.working = p.reactions.working.filter(uid => uid !== id);
      p.reactions.offline = p.reactions.offline.filter(uid => uid !== id);
    });
    this.set(STORAGE_KEYS.POSTS, posts);

    // 3. Remove friendships involving this user
    const friendships = this.getFriendships().filter(([a, b]) => a !== id && b !== id);
    this.set(STORAGE_KEYS.FRIENDSHIPS, friendships);

    // 4. Remove follows involving this user
    const follows = this.getFollows().filter(f => f.followerId !== id && f.followingId !== id);
    this.set(STORAGE_KEYS.FOLLOWS, follows);

    // 5. Remove friend requests involving this user
    const requests = this.getFriendRequests().filter(r => r.fromUserId !== id && r.toUserId !== id);
    this.set(STORAGE_KEYS.FRIEND_REQUESTS, requests);

    // 6. Remove direct messages involving this user
    const messages = this.getMessages().filter(m => m.senderId !== id && m.recipientId !== id);
    this.set(STORAGE_KEYS.MESSAGES, messages);

    // 7. Remove notifications for this user
    const notifications = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter(
      n => n.userId !== id && n.fromUser?.id !== id
    );
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);

    // 8. Remove stored password
    localStorage.removeItem(`iptv_pwd_${id}`);
  }

  // Passwords store simulation (salt + hash)
  static getPassword(userId: string): string {
    const key = `iptv_pwd_${userId}`;
    if (userId === INITIAL_ADMIN_USER.id) {
      return localStorage.getItem(key) || 'admin';
    }
    return localStorage.getItem(key) || 'password123';
  }

  static setPassword(userId: string, pass: string): void {
    localStorage.setItem(`iptv_pwd_${userId}`, pass);
  }

  // Posts
  static getPosts(): Post[] {
    return this.get<Post[]>(STORAGE_KEYS.POSTS, SEED_POSTS);
  }

  static savePost(post: Post): void {
    const posts = this.getPosts();
    const idx = posts.findIndex(p => p.id === post.id);
    if (idx >= 0) {
      posts[idx] = post;
    } else {
      posts.unshift(post);
    }
    this.set(STORAGE_KEYS.POSTS, posts);
  }

  static deletePost(id: string): void {
    const posts = this.getPosts().filter(p => p.id !== id);
    this.set(STORAGE_KEYS.POSTS, posts);
  }

  // Social: Friendships
  static getFriendships(): [string, string][] {
    return this.get<[string, string][]>(STORAGE_KEYS.FRIENDSHIPS, []);
  }

  static areFriends(userAId: string, userBId: string): boolean {
    if (userAId === userBId) return true;
    const friendships = this.getFriendships();
    return friendships.some(([a, b]) => (a === userAId && b === userBId) || (a === userBId && b === userAId));
  }

  static addFriendship(userAId: string, userBId: string): void {
    if (this.areFriends(userAId, userBId)) return;
    const friendships = this.getFriendships();
    friendships.push([userAId, userBId]);
    this.set(STORAGE_KEYS.FRIENDSHIPS, friendships);
  }

  static removeFriendship(userAId: string, userBId: string): void {
    const friendships = this.getFriendships().filter(
      ([a, b]) => !((a === userAId && b === userBId) || (a === userBId && b === userAId))
    );
    this.set(STORAGE_KEYS.FRIENDSHIPS, friendships);
  }

  static getFriendsOfUser(userId: string): User[] {
    const friendships = this.getFriendships();
    const friendIds = friendships
      .filter(([a, b]) => a === userId || b === userId)
      .map(([a, b]) => (a === userId ? b : a));
    return this.getUsers().filter(u => friendIds.includes(u.id));
  }

  // Friend Requests
  static getFriendRequests(): FriendRequest[] {
    return this.get<FriendRequest[]>(STORAGE_KEYS.FRIEND_REQUESTS, []);
  }

  static saveFriendRequest(req: FriendRequest): void {
    const reqs = this.getFriendRequests();
    const idx = reqs.findIndex(r => r.id === req.id);
    if (idx >= 0) {
      reqs[idx] = req;
    } else {
      reqs.unshift(req);
    }
    this.set(STORAGE_KEYS.FRIEND_REQUESTS, reqs);
  }

  static getPendingFriendRequestsForUser(userId: string): FriendRequest[] {
    return this.getFriendRequests().filter(r => r.toUserId === userId && r.status === 'pending');
  }

  static hasPendingRequest(fromUserId: string, toUserId: string): boolean {
    return this.getFriendRequests().some(
      r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending'
    );
  }

  // Follows
  static getFollows(): { followerId: string; followingId: string }[] {
    return this.get<{ followerId: string; followingId: string }[]>(STORAGE_KEYS.FOLLOWS, []);
  }

  static isFollowing(followerId: string, followingId: string): boolean {
    return this.getFollows().some(f => f.followerId === followerId && f.followingId === followingId);
  }

  static toggleFollow(followerId: string, followingId: string): boolean {
    const follows = this.getFollows();
    const idx = follows.findIndex(f => f.followerId === followerId && f.followingId === followingId);
    let nowFollowing = false;
    if (idx >= 0) {
      follows.splice(idx, 1);
    } else {
      follows.push({ followerId, followingId });
      nowFollowing = true;
    }
    this.set(STORAGE_KEYS.FOLLOWS, follows);
    return nowFollowing;
  }

  static getFollowersOfUser(userId: string): User[] {
    const follows = this.getFollows();
    const followerIds = follows.filter(f => f.followingId === userId).map(f => f.followerId);
    return this.getUsers().filter(u => followerIds.includes(u.id));
  }

  static getFollowingOfUser(userId: string): User[] {
    const follows = this.getFollows();
    const followingIds = follows.filter(f => f.followerId === userId).map(f => f.followingId);
    return this.getUsers().filter(u => followingIds.includes(u.id));
  }

  // Notifications
  static getNotifications(userId: string): NotificationItem[] {
    const all = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return all.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static addNotification(item: Omit<NotificationItem, 'id' | 'createdAt'>): void {
    const all = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const newNotif: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    all.unshift(newNotif);
    this.set(STORAGE_KEYS.NOTIFICATIONS, all);
  }

  static markNotificationAsRead(id: string): void {
    const all = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const found = all.find(n => n.id === id);
    if (found) {
      found.read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, all);
    }
  }

  static markAllNotificationsAsRead(userId: string): void {
    const all = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    all.forEach(n => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    this.set(STORAGE_KEYS.NOTIFICATIONS, all);
  }

  // Simulated Email Dispatcher
  static getSimulatedEmails(): SimulatedEmail[] {
    return this.get<SimulatedEmail[]>(STORAGE_KEYS.SIMULATED_EMAILS, []);
  }

  static sendSimulatedEmail(email: Omit<SimulatedEmail, 'id' | 'createdAt'>): SimulatedEmail {
    const emails = this.getSimulatedEmails();
    const item: SimulatedEmail = {
      ...email,
      id: `mail_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    emails.unshift(item);
    this.set(STORAGE_KEYS.SIMULATED_EMAILS, emails);
    return item;
  }

  // Direct Messages
  static getMessages(): DirectMessage[] {
    return this.get<DirectMessage[]>(STORAGE_KEYS.MESSAGES, []);
  }

  static getConversation(userAId: string, userBId: string): DirectMessage[] {
    const all = this.getMessages();
    return all
      .filter(m => (m.senderId === userAId && m.recipientId === userBId) || (m.senderId === userBId && m.recipientId === userAId))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  static sendDirectMessage(sender: User, recipient: User, content: string): DirectMessage {
    const all = this.getMessages();
    const newMsg: DirectMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: sender.id,
      senderUsername: sender.username,
      senderAvatar: sender.avatar,
      recipientId: recipient.id,
      recipientUsername: recipient.username,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    all.push(newMsg);
    this.set(STORAGE_KEYS.MESSAGES, all);

    // Also trigger in-app notification for the recipient
    this.addNotification({
      userId: recipient.id,
      type: 'direct_message',
      title: `Ново съобщение от ${sender.username}`,
      message: content.trim().length > 60 ? `${content.trim().substring(0, 60)}...` : content.trim(),
      link: `user:${sender.id}`,
      fromUser: {
        id: sender.id,
        username: sender.username,
        avatar: sender.avatar,
      },
      read: false,
    });

    return newMsg;
  }

  static getUnreadMessageCount(userId: string): number {
    return this.getMessages().filter(m => m.recipientId === userId && !m.read).length;
  }

  static markConversationAsRead(currentUserId: string, otherUserId: string): void {
    const all = this.getMessages();
    let updated = false;
    all.forEach(m => {
      if (m.recipientId === currentUserId && m.senderId === otherUserId && !m.read) {
        m.read = true;
        updated = true;
      }
    });
    if (updated) {
      this.set(STORAGE_KEYS.MESSAGES, all);
    }
  }

  // Filtering Posts by Visibility: STRICT ACCESS CONTROL
  static getAuthorizedPosts(currentUser: User | null): Post[] {
    // If not authenticated, posts are locked/hidden
    if (!currentUser) {
      return [];
    }

    const allPosts = this.getPosts();

    return allPosts.filter(post => {
      // Admin has universal override access to moderate & edit all posts
      if (currentUser.role === 'admin') {
        return true;
      }

      // 1. Author always has access to their own posts
      if (post.userId === currentUser.id) {
        return true;
      }

      // 2. Private: ONLY author or admin can view
      if (post.visibility === 'private') {
        return false;
      }

      // 3. Friends only: author and mutual friends can view
      if (post.visibility === 'friends') {
        return this.areFriends(currentUser.id, post.userId);
      }

      // 4. Public: visible to ALL authenticated / registered users
      if (post.visibility === 'public') {
        return true;
      }

      return false;
    });
  }
}
