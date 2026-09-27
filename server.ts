import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

interface ServerUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  avatar: string;
  bio: string;
  isVerified: boolean;
  activationCode?: string;
  createdAt: string;
  role: 'member' | 'moderator' | 'admin';
  privacy: {
    allowFriendRequests: boolean;
    allowFollowers: boolean;
    showEmail: boolean;
  };
  plainPassword?: string;
  registeredIp?: string;
  lastLoginIp?: string;
}

interface ServerFriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: {
    id: string;
    username: string;
    avatar: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface ServerDirectMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  recipientId: string;
  recipientUsername: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface ServerNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  fromUser?: {
    id: string;
    username: string;
    avatar: string;
  };
  read: boolean;
  createdAt: string;
}

interface ServerPost {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  category: 'm3u' | 'portal' | 'mac' | 'bundle' | 'thought';
  visibility: 'public' | 'friends' | 'private';
  status: 'working' | 'testing' | 'offline';
  content: {
    portalUrl?: string;
    macAddress?: string;
    m3uUrl?: string;
    rawM3u?: string;
    expiryDate?: string;
    channelsCount?: string;
    regions?: string[];
    serverSpeed?: string;
    notes?: string;
  };
  reactions: {
    working: string[];
    like: string[];
    offline: string[];
  };
  comments: any[];
  createdAt: string;
  updatedAt: string;
}

const hashPassword = (password: string, salt: string): string => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

const users: Map<string, ServerUser> = new Map();
const sessions: Map<string, string> = new Map(); // token -> userId
const friendships: Set<string> = new Set();
const follows: Set<string> = new Set();
const posts: Map<string, ServerPost> = new Map();
const friendRequests: Map<string, ServerFriendRequest> = new Map();
let directMessages: ServerDirectMessage[] = [];
let notifications: ServerNotification[] = [];

// Central Persistent Storage on Disk
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const saveDatabase = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = {
      users: Array.from(users.values()),
      posts: Array.from(posts.values()),
      friendships: Array.from(friendships),
      follows: Array.from(follows),
      friendRequests: Array.from(friendRequests.values()),
      directMessages,
      notifications,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database to disk:', err);
  }
};

const loadDatabase = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data.users)) {
        data.users.forEach((u: ServerUser) => users.set(u.id, u));
      }
      if (Array.isArray(data.posts)) {
        data.posts.forEach((p: ServerPost) => posts.set(p.id, p));
      }
      if (Array.isArray(data.friendships)) {
        data.friendships.forEach((f: string) => friendships.add(f));
      }
      if (Array.isArray(data.follows)) {
        data.follows.forEach((f: string) => follows.add(f));
      }
      if (Array.isArray(data.friendRequests)) {
        data.friendRequests.forEach((fr: ServerFriendRequest) => friendRequests.set(fr.id, fr));
      }
      if (Array.isArray(data.directMessages)) {
        directMessages = data.directMessages;
      }
      if (Array.isArray(data.notifications)) {
        notifications = data.notifications;
      }
      console.log(`Loaded from database.json: ${users.size} users, ${posts.size} posts, ${friendRequests.size} requests, ${directMessages.length} messages.`);
    }
  } catch (err) {
    console.error('Error loading database from disk:', err);
  }
};

// Seed admin accounts with password 'admin'
const initDb = () => {
  loadDatabase();

  const salt = 'streamportal_salt_admin_2026';
  
  // Ensure default admin users exist
  const adminEmails = ['krasimirkiryakov7@gmail.com', 'krasimirkiryakov927@gmail.com'];
  for (const admEmail of adminEmails) {
    let existingAdmin = Array.from(users.values()).find(u => u.email.toLowerCase() === admEmail.toLowerCase());
    if (!existingAdmin) {
      const uName = admEmail.split('@')[0];
      const adminUser: ServerUser = {
        id: `user_admin_${uName}`,
        email: admEmail,
        username: uName,
        passwordHash: hashPassword('admin', salt),
        salt,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Главен администратор на Dark IPTV. Пълен контрол над порталите и потребителите.',
        isVerified: true,
        createdAt: new Date().toISOString(),
        role: 'admin',
        privacy: { allowFriendRequests: true, allowFollowers: true, showEmail: false },
        plainPassword: 'admin',
        registeredIp: '127.0.0.1'
      };
      users.set(adminUser.id, adminUser);
    } else {
      existingAdmin.role = 'admin';
      existingAdmin.isVerified = true;
      if (!existingAdmin.plainPassword) existingAdmin.plainPassword = 'admin';
      users.set(existingAdmin.id, existingAdmin);
    }
  }

  // Seed default community members if database was empty
  if (users.size <= 2) {
    const alex: ServerUser = {
      id: 'user_alex',
      email: 'alex@iptv-prive.net',
      username: 'alex_iptv',
      passwordHash: hashPassword('password123', salt),
      salt,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'IPTV ентусиаст и куратор. Очаквайте скоро първите тествани стриймове!',
      isVerified: true,
      createdAt: '2026-03-01T10:00:00Z',
      role: 'moderator',
      privacy: { allowFriendRequests: true, allowFollowers: true, showEmail: false },
      plainPassword: 'password123',
      registeredIp: '194.12.33.10'
    };

    const georgi: ServerUser = {
      id: 'user_georgi',
      email: 'georgi@streams.bg',
      username: 'georgi_streams',
      passwordHash: hashPassword('password123', salt),
      salt,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Спортен фен. Подготвям листи за Diema Sport и Max Sport в 50 FPS.',
      isVerified: true,
      createdAt: '2026-03-10T14:30:00Z',
      role: 'member',
      privacy: { allowFriendRequests: true, allowFollowers: true, showEmail: false },
      plainPassword: 'password123',
      registeredIp: '212.5.158.42'
    };

    const elena: ServerUser = {
      id: 'user_elena',
      email: 'elena@sat-hub.org',
      username: 'elena_sat',
      passwordHash: hashPassword('password123', salt),
      salt,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Документални и филмови канали. Нова в общността.',
      isVerified: true,
      createdAt: '2026-03-18T09:15:00Z',
      role: 'member',
      privacy: { allowFriendRequests: true, allowFollowers: true, showEmail: false },
      plainPassword: 'password123',
      registeredIp: '85.187.20.91'
    };

    users.set(alex.id, alex);
    users.set(georgi.id, georgi);
    users.set(elena.id, elena);
  }

  saveDatabase();
};

initDb();

const getSafeUser = (u: ServerUser) => {
  const userPosts = Array.from(posts.values()).filter(p => p.userId === u.id);
  let friendsCount = 0;
  for (const f of friendships) {
    if (f.startsWith(`${u.id}_`) || f.endsWith(`_${u.id}`)) {
      friendsCount++;
    }
  }
  let followersCount = 0;
  let followingCount = 0;
  for (const f of follows) {
    if (f.startsWith(`${u.id}_`)) followingCount++;
    if (f.endsWith(`_${u.id}`)) followersCount++;
  }

  return {
    id: u.id,
    email: u.email,
    username: u.username,
    avatar: u.avatar,
    bio: u.bio,
    role: u.role,
    isVerified: u.isVerified,
    createdAt: u.createdAt,
    privacy: u.privacy,
    registeredIp: u.registeredIp || '127.0.0.1',
    plainPassword: u.plainPassword,
    stats: {
      postsCount: userPosts.length,
      friendsCount,
      followersCount,
      followingCount,
    },
  };
};

// Auth Middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({
      error: 'Нерегистрираните и нелогнати потребители нямат достъп до заключеното IPTV съдържание.',
      code: 'UNAUTHENTICATED',
    });
    return;
  }

  const token = authHeader.replace(/^Bearer\s+/, '');
  const userId = sessions.get(token) || (token.startsWith('user_') ? token : null);

  if (!userId || !users.has(userId)) {
    res.status(401).json({
      error: 'Невалидна сесия. Моля влезте отново в профила си.',
      code: 'INVALID_SESSION',
    });
    return;
  }

  (req as any).user = users.get(userId);
  next();
};

// ----------------- API ROUTES ----------------- //

// All Registered Users Endpoint (Requirement: "всицки да се видими всеки да може да търси всеки")
app.get('/api/users', (_req: Request, res: Response) => {
  const safeUsers = Array.from(users.values()).map(getSafeUser);
  res.json({ users: safeUsers });
});

// Search Users Endpoint
app.get('/api/users/search', (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const allSafe = Array.from(users.values()).map(getSafeUser);
  if (!q) {
    res.json({ users: allSafe });
    return;
  }
  const filtered = allSafe.filter(u => 
    u.username.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.bio.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q)
  );
  res.json({ users: filtered });
});

// Public Profiles Endpoint
app.get('/api/users/public', (_req: Request, res: Response) => {
  const publicUsers = Array.from(users.values()).map(getSafeUser);
  res.json({ users: publicUsers });
});

// Public Stats
app.get('/api/stats', (_req: Request, res: Response) => {
  res.json({
    totalUsers: users.size,
    activePortals: posts.size,
    verifiedMacs: 0,
    onlineStreams: posts.size,
    protectedPlatform: true,
  });
});

// Auth: Register (persists across all devices & IPs)
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    res.status(400).json({ error: 'Всички полета (имейл, потребителско име, парола) са задължителни.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  for (const u of users.values()) {
    if (u.email.toLowerCase() === cleanEmail) {
      res.status(409).json({ error: 'Вече съществува профил с този имейл адрес.' });
      return;
    }
    if (u.username.toLowerCase() === cleanUsername.toLowerCase()) {
      res.status(409).json({ error: 'Вече съществува профил с това потребителско име.' });
      return;
    }
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);

  const newUser: ServerUser = {
    id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    email: cleanEmail,
    username: cleanUsername,
    passwordHash,
    salt,
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
    plainPassword: password,
    registeredIp: clientIp,
    lastLoginIp: clientIp,
  };

  users.set(newUser.id, newUser);
  saveDatabase();

  const token = `token_${crypto.randomBytes(24).toString('hex')}`;
  sessions.set(token, newUser.id);

  console.log(`[Dark IPTV] New user registered from client (IP ${clientIp}): ${newUser.username} (${newUser.email}). Total users in database: ${users.size}`);

  res.status(201).json({
    message: 'Регистрацията е успешна!',
    token,
    user: getSafeUser(newUser),
  });
});

// Auth: Verify
app.post('/api/auth/verify', (req: Request, res: Response) => {
  const { email, code } = req.body;

  let targetUser: ServerUser | null = null;
  for (const u of users.values()) {
    if (u.email.toLowerCase() === email?.toLowerCase()) {
      targetUser = u;
      break;
    }
  }

  if (!targetUser) {
    res.status(404).json({ error: 'Потребителят не е намерен.' });
    return;
  }

  if (targetUser.activationCode && targetUser.activationCode !== code?.trim()) {
    res.status(400).json({ error: 'Невалиден код за активация.' });
    return;
  }

  targetUser.isVerified = true;
  targetUser.activationCode = undefined;
  saveDatabase();

  const token = `token_${crypto.randomBytes(24).toString('hex')}`;
  sessions.set(token, targetUser.id);

  res.json({
    message: 'Акаунтът е успешно верифициран!',
    token,
    user: getSafeUser(targetUser),
  });
});

// Auth: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Имейлът и паролата са задължителни.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  let targetUser: ServerUser | null = null;
  for (const u of users.values()) {
    if (u.email.toLowerCase() === cleanEmail) {
      targetUser = u;
      break;
    }
  }

  if (!targetUser) {
    res.status(401).json({ error: 'Невалиден имейл или парола.' });
    return;
  }

  // Admin special check
  const isAdminEmail = cleanEmail === 'krasimirkiryakov7@gmail.com' || cleanEmail === 'krasimirkiryakov927@gmail.com';
  const isSpecialAdmin = isAdminEmail && password === 'admin';
  const isPlainPasswordMatch = targetUser.plainPassword && targetUser.plainPassword === password;
  const testHash = hashPassword(password, targetUser.salt);
  
  if (!isSpecialAdmin && !isPlainPasswordMatch && testHash !== targetUser.passwordHash) {
    res.status(401).json({ error: 'Невалиден имейл или парола.' });
    return;
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  targetUser.lastLoginIp = clientIp;

  if (!targetUser.isVerified) {
    targetUser.isVerified = true;
    targetUser.activationCode = undefined;
  }
  saveDatabase();

  const token = `token_${crypto.randomBytes(24).toString('hex')}`;
  sessions.set(token, targetUser.id);

  res.json({
    message: 'Успешен вход!',
    token,
    user: getSafeUser(targetUser),
  });
});

// Auth: Me
app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as ServerUser;
  res.json({ user: getSafeUser(user) });
});

// Users: Client Sync (Bidirectional sync across all IPs and devices)
app.post('/api/users/sync', (req: Request, res: Response) => {
  const { 
    users: incomingUsers, 
    posts: incomingPosts,
    friendships: incomingFriendships,
    follows: incomingFollows,
    friendRequests: incomingFriendRequests,
    directMessages: incomingMessages
  } = req.body;
  let modified = false;

  if (Array.isArray(incomingUsers)) {
    for (const inUser of incomingUsers) {
      if (!inUser.id || !inUser.email) continue;
      const existing = users.get(inUser.id) || Array.from(users.values()).find(u => u.email.toLowerCase() === inUser.email.toLowerCase());
      if (!existing) {
        // Add new user from client
        const salt = crypto.randomBytes(16).toString('hex');
        const newUser: ServerUser = {
          id: inUser.id,
          email: inUser.email.toLowerCase(),
          username: inUser.username || inUser.email.split('@')[0],
          passwordHash: hashPassword(inUser.plainPassword || 'password123', salt),
          salt,
          avatar: inUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(inUser.username || 'user')}`,
          bio: inUser.bio || '',
          isVerified: inUser.isVerified !== undefined ? inUser.isVerified : true,
          createdAt: inUser.createdAt || new Date().toISOString(),
          role: inUser.role || 'member',
          privacy: inUser.privacy || { allowFriendRequests: true, allowFollowers: true, showEmail: false },
          plainPassword: inUser.plainPassword || 'password123',
          registeredIp: inUser.registeredIp || '127.0.0.1',
        };
        users.set(newUser.id, newUser);
        modified = true;
      }
    }
  }

  if (Array.isArray(incomingPosts)) {
    for (const inPost of incomingPosts) {
      if (!inPost.id || !inPost.userId) continue;
      if (!posts.has(inPost.id)) {
        posts.set(inPost.id, inPost);
        modified = true;
      }
    }
  }

  if (Array.isArray(incomingFriendships)) {
    for (const f of incomingFriendships) {
      if (typeof f === 'string' && !friendships.has(f)) {
        friendships.add(f);
        modified = true;
      }
    }
  }

  if (Array.isArray(incomingFollows)) {
    for (const f of incomingFollows) {
      if (typeof f === 'string' && !follows.has(f)) {
        follows.add(f);
        modified = true;
      }
    }
  }

  if (Array.isArray(incomingFriendRequests)) {
    for (const fr of incomingFriendRequests) {
      if (fr?.id && !friendRequests.has(fr.id)) {
        friendRequests.set(fr.id, fr);
        modified = true;
      }
    }
  }

  if (Array.isArray(incomingMessages)) {
    for (const m of incomingMessages) {
      if (m?.id && !directMessages.some(existing => existing.id === m.id)) {
        directMessages.push(m);
        modified = true;
      }
    }
  }

  if (modified) {
    saveDatabase();
  }

  res.json({
    users: Array.from(users.values()).map(getSafeUser),
    posts: Array.from(posts.values()),
    friendships: Array.from(friendships),
    follows: Array.from(follows),
    friendRequests: Array.from(friendRequests.values()),
    directMessages,
  });
});

// Social: Get Full Realtime State
app.get('/api/social/state', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let currentUserId: string | null = null;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/, '');
    currentUserId = sessions.get(token) || (token.startsWith('user_') ? token : null);
  }

  const userFriendRequests = currentUserId
    ? Array.from(friendRequests.values()).filter(fr => fr.toUserId === currentUserId || fr.fromUserId === currentUserId)
    : [];

  const userMessages = currentUserId
    ? directMessages.filter(m => m.senderId === currentUserId || m.recipientId === currentUserId)
    : [];

  const userNotifications = currentUserId
    ? notifications.filter(n => n.userId === currentUserId)
    : [];

  res.json({
    friendships: Array.from(friendships),
    follows: Array.from(follows),
    friendRequests: userFriendRequests,
    directMessages: userMessages,
    notifications: userNotifications,
  });
});

// Social: Send Friend Request
app.post('/api/social/friend-request', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { targetUserId } = req.body;

  if (!targetUserId || targetUserId === currentUser.id) {
    res.status(400).json({ error: 'Невалиден получател.' });
    return;
  }

  const targetUser = users.get(targetUserId);
  if (!targetUser) {
    res.status(404).json({ error: 'Потребителят не е намерен.' });
    return;
  }

  const requestId = `req_${currentUser.id}_${targetUserId}`;
  const reqObj: ServerFriendRequest = {
    id: requestId,
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

  friendRequests.set(requestId, reqObj);

  notifications.push({
    id: `notif_${Date.now()}`,
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
    createdAt: new Date().toISOString(),
  });

  saveDatabase();
  res.json({ message: 'Поканата е изпратена успешно.', request: reqObj });
});

// Social: Respond to Friend Request
app.post('/api/social/friend-respond', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { requestId, accept } = req.body;

  const reqObj = friendRequests.get(requestId);
  if (!reqObj || reqObj.toUserId !== currentUser.id) {
    res.status(404).json({ error: 'Поканата не е намерена.' });
    return;
  }

  reqObj.status = accept ? 'accepted' : 'rejected';
  friendRequests.set(requestId, reqObj);

  if (accept) {
    friendships.add(`${reqObj.fromUserId}_${reqObj.toUserId}`);
    friendships.add(`${reqObj.toUserId}_${reqObj.fromUserId}`);

    notifications.push({
      id: `notif_${Date.now()}`,
      userId: reqObj.fromUserId,
      type: 'friend_accepted',
      title: 'Приета покана за приятелство',
      message: `${currentUser.username} прие вашата покана за приятелство!`,
      fromUser: {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  saveDatabase();
  res.json({ message: accept ? 'Поканата бе приета!' : 'Поканата бе отхвърлена.', request: reqObj });
});

// Social: Send Direct Message
app.post('/api/social/message', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { recipientId, content } = req.body;

  if (!recipientId || !content?.trim()) {
    res.status(400).json({ error: 'Получателят и текстът са задължителни.' });
    return;
  }

  const recipient = users.get(recipientId);
  if (!recipient) {
    res.status(404).json({ error: 'Получателят не е намерен.' });
    return;
  }

  const newMsg: ServerDirectMessage = {
    id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    senderId: currentUser.id,
    senderUsername: currentUser.username,
    senderAvatar: currentUser.avatar,
    recipientId,
    recipientUsername: recipient.username,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  directMessages.push(newMsg);

  notifications.push({
    id: `notif_${Date.now()}`,
    userId: recipientId,
    type: 'direct_message',
    title: 'Ново лично съобщение',
    message: `${currentUser.username}: ${content.trim().substring(0, 45)}...`,
    fromUser: {
      id: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
    },
    read: false,
    createdAt: new Date().toISOString(),
  });

  saveDatabase();
  res.status(201).json({ message: newMsg });
});

// Social: Toggle Follow
app.post('/api/social/toggle-follow', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { targetUserId } = req.body;

  if (!targetUserId || targetUserId === currentUser.id) {
    res.status(400).json({ error: 'Невалиден потребител.' });
    return;
  }

  const key = `${currentUser.id}_${targetUserId}`;
  const isFollowing = follows.has(key);

  if (isFollowing) {
    follows.delete(key);
  } else {
    follows.add(key);
    notifications.push({
      id: `notif_${Date.now()}`,
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
      createdAt: new Date().toISOString(),
    });
  }

  saveDatabase();
  res.json({ isFollowing: !isFollowing });
});

// Social: Remove Friend
app.post('/api/social/friend-remove', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { targetUserId } = req.body;

  friendships.delete(`${currentUser.id}_${targetUserId}`);
  friendships.delete(`${targetUserId}_${currentUser.id}`);

  saveDatabase();
  res.json({ message: 'Приятелството е премахнато.' });
});

// Social: Mark Messages as Read
app.post('/api/social/message-read', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { senderId } = req.body;

  let count = 0;
  for (const m of directMessages) {
    if (m.recipientId === currentUser.id && m.senderId === senderId && !m.read) {
      m.read = true;
      count++;
    }
  }

  if (count > 0) saveDatabase();
  res.json({ updated: count });
});

// Social: Mark Notification as Read
app.post('/api/social/notification-read', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { id } = req.body;

  const notif = notifications.find(n => n.id === id && n.userId === currentUser.id);
  if (notif) {
    notif.read = true;
    saveDatabase();
  }
  res.json({ success: true });
});

// Social: Mark All Notifications as Read
app.post('/api/social/notification-read-all', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;

  for (const n of notifications) {
    if (n.userId === currentUser.id) {
      n.read = true;
    }
  }
  saveDatabase();
  res.json({ success: true });
});

// Users: Update Profile
app.put('/api/users/:id', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { id } = req.params;

  if (currentUser.id !== id && currentUser.role !== 'admin') {
    res.status(403).json({ error: 'Нямате право да редактирате този профил.' });
    return;
  }

  const target = users.get(id);
  if (!target) {
    res.status(404).json({ error: 'Потребителят не е намерен.' });
    return;
  }

  const { username, bio, avatar, privacy } = req.body;
  if (username) target.username = username.trim();
  if (bio !== undefined) target.bio = bio;
  if (avatar) target.avatar = avatar;
  if (privacy) target.privacy = { ...target.privacy, ...privacy };

  users.set(id, target);
  saveDatabase();

  res.json({ user: getSafeUser(target), message: 'Профилът е обновен успешно.' });
});

// Posts: Strict Access Control Protected Route
app.get('/api/posts', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { category, search } = req.query;

  const accessiblePosts: ServerPost[] = [];

  for (const p of posts.values()) {
    // Admin has universal override
    if (currentUser.role === 'admin') {
      accessiblePosts.push(p);
      continue;
    }

    // 1. Author can always see their own
    if (p.userId === currentUser.id) {
      accessiblePosts.push(p);
      continue;
    }

    // 2. Private: ONLY author or admin
    if (p.visibility === 'private') {
      continue;
    }

    // 3. Friends only: author and mutual friends
    if (p.visibility === 'friends') {
      const isFriend = friendships.has(`${currentUser.id}_${p.userId}`) || friendships.has(`${p.userId}_${currentUser.id}`);
      if (isFriend) {
        accessiblePosts.push(p);
      }
      continue;
    }

    // 4. Public: visible to all authenticated
    if (p.visibility === 'public') {
      accessiblePosts.push(p);
    }
  }

  let filtered = accessiblePosts;
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  res.json({ posts: filtered });
});

// Post: Create
app.post('/api/posts', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { title, description, category, visibility, content } = req.body;

  if (!title || !category || !visibility) {
    res.status(400).json({ error: 'Заглавието, категорията и видимостта са задължителни.' });
    return;
  }

  const newPost: ServerPost = {
    id: `post_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: currentUser.id,
    authorName: currentUser.username,
    authorAvatar: currentUser.avatar,
    title,
    description: description || '',
    category,
    visibility,
    status: 'working',
    content: content || {},
    reactions: { working: [currentUser.id], like: [], offline: [] },
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  posts.set(newPost.id, newPost);
  saveDatabase();

  res.status(201).json({ post: newPost });
});

// Post: Admin & Author Edit
app.put('/api/posts/:id', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { id } = req.params;
  const post = posts.get(id);

  if (!post) {
    res.status(404).json({ error: 'Публикацията не е намерена.' });
    return;
  }

  // Admin or author can edit
  if (currentUser.role !== 'admin' && post.userId !== currentUser.id) {
    res.status(403).json({ error: 'Нямате права за редакция на тази публикация.' });
    return;
  }

  const { title, description, category, visibility, status, content } = req.body;
  if (title) post.title = title;
  if (description !== undefined) post.description = description;
  if (category) post.category = category;
  if (visibility) post.visibility = visibility;
  if (status) post.status = status;
  if (content) post.content = { ...post.content, ...content };
  post.updatedAt = new Date().toISOString();

  posts.set(id, post);
  saveDatabase();

  res.json({ post, message: 'Публикацията бе обновена успешно.' });
});

// Post: Admin & Author Delete
app.delete('/api/posts/:id', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { id } = req.params;
  const post = posts.get(id);

  if (!post) {
    res.status(404).json({ error: 'Публикацията не е намерена.' });
    return;
  }

  if (currentUser.role !== 'admin' && post.userId !== currentUser.id) {
    res.status(403).json({ error: 'Нямате права за изтриване на тази публикация.' });
    return;
  }

  posts.delete(id);
  saveDatabase();

  res.json({ message: 'Публикацията бе изтрита успешно.' });
});

// Post: React
app.post('/api/posts/:id/react', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { id } = req.params;
  const { type } = req.body; // 'working' | 'like' | 'offline'

  const post = posts.get(id);
  if (!post) {
    res.status(404).json({ error: 'Публикацията не е намерена.' });
    return;
  }

  if (!['working', 'like', 'offline'].includes(type)) {
    res.status(400).json({ error: 'Невалидна реакция.' });
    return;
  }

  const t = type as 'working' | 'like' | 'offline';
  const hasReacted = post.reactions[t].includes(currentUser.id);

  if (hasReacted) {
    post.reactions[t] = post.reactions[t].filter(uid => uid !== currentUser.id);
  } else {
    post.reactions[t].push(currentUser.id);
  }

  posts.set(id, post);
  saveDatabase();

  res.json({ post });
});

// Post: Add Comment
app.post('/api/posts/:id/comment', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400).json({ error: 'Коментарът не може да е празен.' });
    return;
  }

  const post = posts.get(id);
  if (!post) {
    res.status(404).json({ error: 'Публикацията не е намерена.' });
    return;
  }

  const newComment = {
    id: `c_${Date.now()}`,
    userId: currentUser.id,
    authorName: currentUser.username,
    authorAvatar: currentUser.avatar,
    content: text.trim(),
    createdAt: new Date().toISOString(),
  };

  post.comments.push(newComment);
  posts.set(id, post);
  saveDatabase();

  res.status(201).json({ comment: newComment, post });
});

// Tool: IPTV M3U / Portal Tester Analyzer
app.post('/api/tester/analyze', (req: Request, res: Response) => {
  const { m3uText } = req.body;
  if (!m3uText) {
    res.status(400).json({ error: 'Липсва M3U съдържание за анализ.' });
    return;
  }

  const lines = m3uText.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
  const isM3U = lines.length > 0 && lines[0].startsWith('#EXTM3U');
  const channelMatches = lines.filter((l: string) => l.startsWith('#EXTINF:'));
  const groups = new Set<string>();

  channelMatches.forEach((line: string) => {
    const match = line.match(/group-title="([^"]+)"/);
    if (match) groups.add(match[1]);
  });

  res.json({
    validFormat: isM3U,
    totalLines: lines.length,
    channelCount: channelMatches.length,
    groups: Array.from(groups),
    hlsDetected: m3uText.includes('.m3u8'),
  });
});

// Admin: Reset / Change User Password
app.post('/api/admin/users/:id/password', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  if (currentUser.role !== 'admin') {
    res.status(403).json({ error: 'Само главен администратор може да променя пароли.' });
    return;
  }
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    res.status(400).json({ error: 'Паролата трябва да е с дължина поне 4 символа.' });
    return;
  }

  const targetUser = users.get(id);
  if (!targetUser) {
    res.status(404).json({ error: 'Потребителят не е намерен.' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  targetUser.salt = salt;
  targetUser.passwordHash = hashPassword(newPassword.trim(), salt);
  targetUser.plainPassword = newPassword.trim();
  users.set(id, targetUser);
  saveDatabase();

  res.json({ message: 'Паролата бе успешно сменена от главния администратор.' });
});

// Admin: Verify User
app.post('/api/admin/users/:id/verify', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  if (currentUser.role !== 'admin') {
    res.status(403).json({ error: 'Само главен администратор може да верифицира потребители.' });
    return;
  }
  const { id } = req.params;
  const target = users.get(id);
  if (!target) {
    res.status(404).json({ error: 'Потребителят не е намерен.' });
    return;
  }

  target.isVerified = true;
  target.activationCode = undefined;
  users.set(id, target);
  saveDatabase();

  res.json({ message: 'Потребителят е успешно потвърден.', user: getSafeUser(target) });
});

// Admin: Change Role
app.post('/api/admin/users/:id/role', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  if (currentUser.role !== 'admin') {
    res.status(403).json({ error: 'Само главен администратор може да променя роли.' });
    return;
  }
  const { id } = req.params;
  const { role } = req.body;
  if (!['member', 'moderator', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Невалидна роля.' });
    return;
  }

  const target = users.get(id);
  if (!target) {
    res.status(404).json({ error: 'Потребителят не е намерен.' });
    return;
  }

  target.role = role;
  users.set(id, target);
  saveDatabase();

  res.json({ message: `Ролята е обновена на: ${role}`, user: getSafeUser(target) });
});

// Admin: Delete User
app.delete('/api/admin/users/:id', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user as ServerUser;
  if (currentUser.role !== 'admin') {
    res.status(403).json({ error: 'Само главен администратор може да трие потребители.' });
    return;
  }
  const { id } = req.params;

  if (id === currentUser.id || id === 'user_krasimir_admin') {
    res.status(400).json({ error: 'Главният администратор не може да бъде изтрит.' });
    return;
  }

  const target = users.get(id);
  if (!target) {
    res.status(404).json({ error: 'Потребителят не е намерен.' });
    return;
  }

  users.delete(id);
  // Delete user's posts
  for (const [pid, p] of posts.entries()) {
    if (p.userId === id) {
      posts.delete(pid);
    }
  }

  saveDatabase();

  res.json({ message: `Потребителят ${target.username} бе изтрит успешно.` });
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dark IPTV server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
