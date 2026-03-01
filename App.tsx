import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LogOut, LayoutDashboard, ShieldCheck, Wifi, WifiOff, Settings, CreditCard, Grid3X3 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { ToastContext, useToastState } from './hooks/useToast';
import { ConfirmContext, useConfirmState, useConfirm } from './hooks/useConfirm';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ClassroomDetail from './pages/ClassroomDetail';
import StudentDetail from './pages/StudentDetail';
import BatchGenerator from './pages/BatchGenerator';
import AdminPage from './pages/AdminPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailPage from './pages/PaymentFailPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import SeatingPage from './pages/SeatingPage';

const ADMIN_EMAIL = 'admin@edumemo.com';

export const Logo = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <div
    className={`flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`}
    style={{ width: size, height: size }}
  >
    <img
      src="https://docs.google.com/drawings/d/e/2PACX-1vT1bcY13j-n8oEp2AxJhNVUKtXdwIOuJw7bNdylK342n_XvtatS40Ax5YazL5Uf5Q5_XGOxejHDJmDE/pub?w=960&h=720"
      alt="Edumemo Logo"
      className="w-full h-full object-contain"
    />
  </div>
);

// ── 인증이 필요한 라우트 wrapper ─────────────────────────────
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// ── 관리자 전용 라우트 wrapper ────────────────────────────────
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.email !== ADMIN_EMAIL) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ── Pro 구독 전용 라우트 wrapper ──────────────────────────────
const ProRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [plan, setPlan] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setPlan(data?.plan || 'free');
        setChecking(false);
      });
  }, [user]);

  if (loading || checking) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (plan === 'free' || !plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 sm:p-12 max-w-md text-center">
          <Grid3X3 className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-800 mb-3">Pro 플랜 전용 기능</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            자리배치 도우미는 Pro, Plus, School 플랜 구독 시 이용할 수 있습니다.
          </p>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md">
            <CreditCard size={16} /> 구독 플랜 보기
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// ── 네비게이션 바 ────────────────────────────────────────────
const Navbar: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  const { user, signOut } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const confirm = useConfirm();

  const handleLogout = async () => {
    if (await confirm('로그아웃 하시겠습니까?')) {
      await signOut();
    }
  };

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm min-h-[48px]">
        <Link to="/" className="flex items-center gap-1.5 md:gap-2 group shrink-0">
          <Logo size={28} className="group-hover:scale-110 md:!w-9 md:!h-9" />
          <span className="text-xl font-black tracking-tighter text-slate-800">Edumemo</span>
        </Link>

        {user && (
          <div className="flex items-center gap-1.5 md:gap-4">
            <Link to="/" className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              <LayoutDashboard size={16} /> Dashboard
            </Link>

            <Link to="/seating" className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-1.5 md:px-2.5 py-1 rounded-lg">
              <Grid3X3 size={15} /> <span className="hidden md:inline md:font-extrabold">자리배치</span>
            </Link>

            <Link to="/pricing" className="flex items-center gap-1 md:gap-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors px-2 md:px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
              <CreditCard size={14} className="md:w-[15px] md:h-[15px] shrink-0" /> 구독
            </Link>

            {isAdmin && (
              <Link to="/admin" className="hidden md:flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors bg-rose-50 px-2.5 py-1 rounded-lg">
                <Settings size={16} /> Admin
              </Link>
            )}

            {/* 모바일: 아이디만 */}
            <div className="flex md:hidden items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
              <span className="text-[9px] font-bold text-slate-500 uppercase truncate max-w-[60px]">
                {user.email.split('@')[0]}
              </span>
            </div>
            {/* PC: 전체 이메일 */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {user.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-slate-300 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-lg"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </nav>

      {user && (
        <div className={`transition-all duration-700 py-1.5 px-4 flex items-center justify-center gap-6 text-[9px] font-bold uppercase tracking-[0.2em] ${isOnline ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white shadow-md'}`}>
          <div className="flex items-center gap-1.5">
            {isOnline
              ? <Wifi size={11} className="text-emerald-400" />
              : <WifiOff size={11} className="animate-pulse" />}
            {isOnline ? 'Live Protection On' : 'Offline Mode'}
          </div>
          <div className="flex items-center gap-1.5 opacity-70">
            <ShieldCheck size={11} /> Security Mode Active
          </div>
        </div>
      )}
    </>
  );
};

// ── 앱 내부 (AuthProvider 아래) ──────────────────────────────
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600 border-r-2 border-indigo-100"></div>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-[8px] animate-pulse">
            Initializing Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-medium text-slate-600">
        <Navbar isOnline={isOnline} />

        <main className="flex-grow container mx-auto px-4 py-6">
          <Routes>
            {/* 공개 라우트 */}
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />

            {/* 결제 콜백 (로그인 없이도 접근 가능하나 실제 처리는 인증 필요) */}
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/fail"    element={<PaymentFailPage />} />

            {/* 공개 정책 페이지 */}
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms"   element={<TermsPage />} />

            {/* 인증 필요 라우트 */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/classroom/:classroomId" element={<PrivateRoute><ClassroomDetail /></PrivateRoute>} />
            <Route path="/student/:studentId"     element={<PrivateRoute><StudentDetail /></PrivateRoute>} />
            <Route path="/batch"                  element={<PrivateRoute><BatchGenerator /></PrivateRoute>} />
            <Route path="/pricing"                element={<PrivateRoute><PricingPage /></PrivateRoute>} />
            <Route path="/seating"                element={<PrivateRoute><ProRoute><SeatingPage /></ProRoute></PrivateRoute>} />

            {/* 관리자 전용 */}
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="py-8 border-t border-slate-100 bg-white">
          <div className="container mx-auto px-4 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">

              {/* PC: 파이프 구분 2줄 */}
              <div className="hidden md:block text-xs text-slate-400 leading-relaxed space-y-0.5 shrink-0">
                <p className="font-bold text-slate-500">주식회사 퍼블릭스카이</p>
                <p>대표자: 하상욱 | 사업자등록번호: 618-81-37189 | 통신판매업 신고번호: 2023-세종아름-0260</p>
                <p>주소: 세종특별자치시 도움3로 105-5 806호 | 이메일: publicsky7@gmail.com | 운영시간: 10:00 ~ 17:00</p>
              </div>

              {/* 모바일: 항목별 줄바꿈, 중앙정렬 */}
              <div className="block md:hidden text-[11px] text-slate-400 leading-relaxed space-y-0.5 text-center">
                <p className="font-bold text-slate-500">주식회사 퍼블릭스카이</p>
                <p>대표자: 하상욱</p>
                <p>사업자등록번호: 618-81-37189</p>
                <p>통신판매업 신고번호: 2023-세종아름-0260</p>
                <p>주소: 세종특별자치시 도움3로 105-5 806호</p>
                <p>이메일: publicsky7@gmail.com</p>
                <p>운영시간: 10:00 ~ 17:00</p>
              </div>

              <div className="hidden md:flex items-center gap-4 shrink-0">
                <Link to="/privacy" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">개인정보 처리방침</Link>
                <span className="text-slate-200 text-xs">|</span>
                <Link to="/terms" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">이용약관</Link>
              </div>
            </div>
            <div className="flex md:hidden items-center justify-center gap-4 pt-2 border-t border-slate-50">
              <Link to="/privacy" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">개인정보 처리방침</Link>
              <span className="text-slate-200 text-xs">|</span>
              <Link to="/terms" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">이용약관</Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  const toastValue = useToastState();
  const confirmValue = useConfirmState();
  return (
    <AuthProvider>
      <ToastContext.Provider value={toastValue}>
        <ConfirmContext.Provider value={confirmValue}>
          <AppContent />
          <Toast />
          <ConfirmModal />
        </ConfirmContext.Provider>
      </ToastContext.Provider>
    </AuthProvider>
  );
};

export default App;
