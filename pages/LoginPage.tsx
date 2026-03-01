
import React, { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Logo } from '../App';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, signInWithKakao } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(err);
      setIsLoading(false);
    }
  };

  const handleKakaoSignIn = async () => {
    setError('');
    setIsLoading(true);
    const { error: err } = await signInWithKakao();
    if (err) {
      setError(err);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail    = email.trim();
    const cleanPassword = password.trim();

    const { error: err } = isLogin
      ? await signIn(cleanEmail, cleanPassword)
      : await signUp(cleanEmail, cleanPassword);

    if (err) {
      setError(err);
      setIsLoading(false);
    }
    // 성공 시 App.tsx의 onAuthStateChange가 감지해서 자동으로 리다이렉트
  };

  return (
    <div className="max-w-md mx-auto mt-4 p-8 sm:p-10 glass rounded-lg animate-fade-in shadow-lg border border-white/40">
      <div className="text-center mb-10">
        <div className="inline-flex mb-4">
          <Logo size={80} className="drop-shadow-lg" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-4">Edumemo</h1>
        <p className="text-slate-500 font-medium text-[15px] leading-relaxed px-2">
          선생님의 세심한 눈길이<br />
          아이들의 내일을 만듭니다
        </p>
      </div>

      <div className="mb-10 p-6 bg-indigo-50/50 border border-indigo-100 rounded-lg text-center">
        <div className="flex justify-center mb-3">
          <ShieldCheck size={20} className="text-indigo-500" />
        </div>
        <p className="text-indigo-900/80 text-[13px] font-medium leading-relaxed">
          모든 기기에서 같은 계정으로 로그인하면<br />
          데이터가 자동으로 동기화됩니다.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 text-[13px] font-bold flex gap-3 animate-fade-in">
          <AlertCircle size={18} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
            교사 계정 (이메일)
          </label>
          <input
            type="email"
            required
            className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 font-medium text-sm transition-all"
            placeholder="teacher@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
            비밀번호
          </label>
          <input
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 font-medium text-sm transition-all"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-slate-800 text-white py-4 rounded-lg font-bold shadow-md hover:bg-black transition-all disabled:bg-slate-300 flex items-center justify-center gap-2.5 text-base active:scale-95"
        >
          {isLoading
            ? <RefreshCw className="animate-spin" size={20} />
            : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
          {isLogin ? '업무 시작' : '계정 생성'}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex-grow h-px bg-slate-100"></div>
        <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">또는</span>
        <div className="flex-grow h-px bg-slate-100"></div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="mt-4 w-full bg-white text-slate-700 py-3.5 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-all disabled:bg-slate-100 disabled:text-slate-300 flex items-center justify-center gap-3 text-sm active:scale-95 border border-slate-200"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google로 시작하기
      </button>

      <button
        type="button"
        onClick={handleKakaoSignIn}
        disabled={isLoading}
        className="mt-3 w-full py-3.5 rounded-lg font-bold shadow-sm hover:brightness-95 transition-all disabled:opacity-40 flex items-center justify-center gap-3 text-sm active:scale-95 border-0"
        style={{ backgroundColor: '#FEE500', color: '#191919' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.16c-.1.36.32.65.64.44l4.84-3.2c.41.04.83.06 1.26.06 5.52 0 10-3.36 10-7.7S17.52 3 12 3z" fill="#191919"/>
        </svg>
        카카오로 시작하기
      </button>

      <div className="mt-6 text-center">
        <button
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="text-indigo-600 font-bold text-[12px] border-b border-indigo-100 hover:border-indigo-600 pb-0.5 transition-all"
        >
          {isLogin ? '처음 방문하셨나요? 계정 만들기' : '이미 계정이 있나요? 로그인하기'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
