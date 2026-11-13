export interface AuthUser {
  name: string;
  email: string;
}

export interface AuthAdapter {
  user: AuthUser | null;
  logout?: () => Promise<void>;
}
