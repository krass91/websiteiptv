export type PostCategory = 'm3u' | 'portal' | 'mac' | 'bundle' | 'thought';
export type PostVisibility = 'public' | 'friends' | 'private';

export interface User {
  id: string;
  email: string;
  username: string;
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
  stats?: {
    postsCount: number;
    friendsCount: number;
    followersCount: number;
    followingCount: number;
  };
}

export interface IPTVContent {
  portalUrl?: string;
  macAddress?: string;
  m3uUrl?: string;
  rawM3u?: string;
  expiryDate?: string;
  channelsCount?: string;
  regions?: string[];
  serverSpeed?: string;
  notes?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  category: PostCategory;
  visibility: PostVisibility;
  content: IPTVContent;
  status: 'working' | 'testing' | 'offline';
  reactions: {
    working: string[]; // array of userIds
    like: string[];
    offline: string[];
  };
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequest {
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

export interface DirectMessage {
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

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'friend_request' | 'friend_accepted' | 'new_follower' | 'comment' | 'reaction' | 'direct_message' | 'system' | 'password_reset';
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

export interface AuthResponse {
  user: User;
  token: string;
  activationCode?: string;
  message?: string;
}

export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  type: 'activation' | 'reset_password';
  code: string;
  link: string;
  createdAt: string;
}
