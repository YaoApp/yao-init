/**
 * YaoAgent Global Type Definitions
 * Theme, Locale, and User management API for Agent SUI pages
 */

export type Theme = "light" | "dark";
export type Locale = "zh-CN" | "en-US";

export interface User {
  id?: string | number;
  user_id?: string | number;
  name?: string;
  username?: string;
  email?: string;
  avatar?: string;
  avatar_url?: string;
  [key: string]: any;
}

export interface ThemeChangeEvent {
  theme: Theme;
}

export interface LocaleChangeEvent {
  locale: Locale;
}

export interface AuthResult {
  authenticated: boolean;
  user: User | null;
}

export interface YaoAgentAPI {
  // Theme
  getTheme(): Theme;
  setTheme(theme: Theme): void;
  toggleTheme(): Theme;
  isDarkTheme(): boolean;

  // Locale
  getLocale(): Locale;
  setLocale(locale: string, reload?: boolean): void;
  toggleLocale(reload?: boolean): Locale;
  isChineseLocale(): boolean;

  // User
  /** @deprecated Use checkAuth() for reliable auth checking with HttpOnly cookies */
  getUser(): User | null;
  /** @deprecated Use checkAuth() for reliable auth checking with HttpOnly cookies */
  isLoggedIn(): boolean;
  getUserId(): string | number | null;
  getUserName(): string | null;
  getUserAvatar(): string | null;

  // Authentication (API-based, reliable with HttpOnly cookies)
  checkAuth(): Promise<AuthResult>;
  requireAuth(redirectUrl?: string): Promise<User | null>;

  // Event Listeners
  onThemeChange(callback: (data: ThemeChangeEvent) => void): () => void;
  onLocaleChange(callback: (data: LocaleChangeEvent) => void): () => void;
  onUserChange(callback: (user: User | null) => void): () => void;

  // CUI Integration
  isEmbeddedInCUI(): boolean;
  sendAction(action: string, payload?: Record<string, any>): void;
  notifySuccess(message: string): void;
  notifyError(message: string): void;
  notifyWarning(message: string): void;
  notifyInfo(message: string): void;
  navigate(route: string, title?: string): void;
  navigateBack(): void;
}

declare global {
  interface Window {
    YaoAgent: YaoAgentAPI;
    YaoGlobal: YaoAgentAPI;
  }
}

export {};
