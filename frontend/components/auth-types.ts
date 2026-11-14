export interface AuthUser {
  name: string;
  email: string;
}

export interface AuthAdapter {
  user: AuthUser | null;
  login?: () => Promise<AuthUser>;
  logout?: () => Promise<void>;
}
