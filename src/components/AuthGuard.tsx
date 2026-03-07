/** 認証ガード：未ログイン時はLoginPageを表示 */
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { LoginPage } from './LoginPage';

interface AuthGuardProps {
  user: User | null;
  loading: boolean;
  onSignIn: () => Promise<void>;
  children: ReactNode;
}

/**
 * 認証済みユーザーのみchildrenを表示するガードコンポーネント
 */
export function AuthGuard({ user, loading, onSignIn, children }: AuthGuardProps) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-sm">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSignIn={onSignIn} />;
  }

  return <>{children}</>;
}
