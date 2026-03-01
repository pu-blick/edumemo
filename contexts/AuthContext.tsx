import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithKakao: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 로드
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((err) => {
        console.error('[Auth] getSession error:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // 인증 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { error: null };
    console.error('[Auth] signIn error:', error.message, error);
    if (error.message.includes('Invalid login credentials')) {
      return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: '이메일 인증이 필요합니다. 받은편지함을 확인하거나 Supabase 대시보드에서 이메일 확인을 비활성화하세요.' };
    }
    if (error.message.includes('User not found')) {
      return { error: '등록되지 않은 계정입니다. 먼저 계정을 만들어 주세요.' };
    }
    return { error: `로그인 오류: ${error.message}` };
  };

  const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error) {
      // 이메일 확인이 비활성화된 경우 바로 로그인됨; 활성화된 경우 확인 이메일 발송
      if (data.user && !data.session) {
        return { error: '가입 확인 이메일을 발송했습니다. 이메일을 확인하거나, Supabase 대시보드에서 이메일 확인을 비활성화하면 바로 사용할 수 있습니다.' };
      }
      return { error: null };
    }
    console.error('[Auth] signUp error:', error.message, error);
    if (error.message.includes('already registered') || error.message.includes('User already registered')) {
      return { error: '이미 등록된 이메일 계정입니다.' };
    }
    if (error.message.includes('Password should be at least')) {
      return { error: '비밀번호는 6자 이상이어야 합니다.' };
    }
    return { error: `계정 생성 오류: ${error.message}` };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });
    if (error) return { error: '재설정 이메일 발송에 실패했습니다.' };
    return { error: null };
  };

  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // /#/ 없이 origin만 — HashRouter 충돌 방지
      },
    });
    if (error) {
      console.error('[Auth] Google OAuth error:', error.message);
      return { error: `Google 로그인 오류: ${error.message}` };
    }
    return { error: null };
  };

  const signInWithKakao = async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('[Auth] Kakao OAuth error:', error.message);
      return { error: `카카오 로그인 오류: ${error.message}` };
    }
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPassword, signInWithGoogle, signInWithKakao }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
};
