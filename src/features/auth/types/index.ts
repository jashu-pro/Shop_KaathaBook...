/* auth/types/index.ts */

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthSession {
  user: User | null;
  expiresAt?: number;
}
