import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 animate-fade-in">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-600 transition-colors mb-8">
        <ChevronLeft size={16} /> 돌아가기
      </Link>

      <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">개인정보 처리방침</h1>
      <p className="text-sm text-slate-400 mb-10">시행일: 2024년 1월 1일 | 최종 수정일: 2025년 1월 1일</p>

      <div className="prose prose-slate max-w-none space-y-10 text-sm leading-relaxed text-slate-600">

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제1조 (개인정보의 처리 목적)</h2>
          <p>주식회사 퍼블릭스카이(이하 '회사')가 운영하는 Edumemo(이하 '서비스')는 다음의 목적을 위해 개인정보를 처리합니다. 처리하는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행합니다.</p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside">
            <li>회원 가입 및 관리</li>
            <li>서비스 제공 및 운영</li>
            <li>유료 서비스 결제 및 요금 정산</li>
            <li>고객 문의 및 불만 처리</li>
            <li>서비스 개선 및 신규 서비스 개발</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제2조 (처리하는 개인정보 항목)</h2>
          <p className="font-bold text-slate-700 mb-2">① 필수 수집 항목</p>
          <ul className="mb-4 space-y-1.5 list-disc list-inside">
            <li>이메일 주소 (회원 식별 및 로그인)</li>
            <li>비밀번호 (암호화 저장)</li>
          </ul>
          <p className="font-bold text-slate-700 mb-2">② 서비스 이용 과정에서 자동 수집되는 항목</p>
          <ul className="mb-4 space-y-1.5 list-disc list-inside">
            <li>접속 IP, 서비스 이용 기록</li>
            <li>결제 기록 (결제 수단 정보는 결제 대행사에서 처리하며 회사는 보관하지 않습니다)</li>
          </ul>
          <p className="font-bold text-slate-700 mb-2">③ 서비스 내 입력 데이터</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>교사가 직접 입력한 학급 정보, 학생 이름, 관찰 기록 등</li>
            <li>해당 데이터는 교사 본인만 접근 가능하며 타인에게 공개되지 않습니다</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제3조 (개인정보의 처리 및 보유 기간)</h2>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>회원 정보: 회원 탈퇴 시까지</li>
            <li>결제 기록: 전자상거래법에 따라 5년</li>
            <li>고객 문의 기록: 3년</li>
          </ul>
          <p className="mt-3">단, 관련 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제4조 (개인정보의 제3자 제공)</h2>
          <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 따르거나 수사 목적으로 법령에서 정한 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제5조 (개인정보 처리 위탁)</h2>
          <p className="mb-3">회사는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다.</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200">
              <span>수탁 업체</span>
              <span>위탁 업무</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="font-bold">Supabase Inc.</span>
              <span>데이터베이스 및 인증 시스템 운영</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="font-bold">토스페이먼츠(주)</span>
              <span>결제 처리 및 정산</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="font-bold">Google LLC</span>
              <span>소셜 로그인(OAuth) 서비스</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제6조 (이용자의 권리와 행사 방법)</h2>
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside">
            <li>개인정보 처리 현황 조회 및 열람 요청</li>
            <li>개인정보 정정·삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>회원 탈퇴를 통한 개인정보 삭제</li>
          </ul>
          <p className="mt-3">권리 행사는 고객센터(publicsky7@gmail.com)로 이메일 문의하시면 지체 없이 조치합니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제7조 (개인정보의 안전성 확보 조치)</h2>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>비밀번호 암호화 저장 (복호화 불가)</li>
            <li>모든 데이터 전송 시 HTTPS(TLS) 암호화</li>
            <li>Row Level Security(RLS)를 통한 데이터 접근 제어 — 본인 데이터만 접근 가능</li>
            <li>서비스 접근 권한 최소화 및 정기 점검</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제8조 (개인정보 보호책임자)</h2>
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1.5">
            <p><span className="font-bold text-slate-700">책임자:</span> 하상욱 (대표이사)</p>
            <p><span className="font-bold text-slate-700">이메일:</span> publicsky7@gmail.com</p>
            <p><span className="font-bold text-slate-700">전화:</span> 010-2314-4577</p>
          </div>
          <p className="mt-3">개인정보 침해에 관한 신고나 상담은 아래 기관에 문의하실 수 있습니다.</p>
          <ul className="mt-2 space-y-1.5 list-disc list-inside text-slate-500">
            <li>개인정보 침해신고센터: privacy.kisa.or.kr / 국번 없이 118</li>
            <li>개인정보 분쟁조정위원회: kopico.go.kr / 1833-6972</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제9조 (개인정보 처리방침 변경)</h2>
          <p>이 개인정보 처리방침은 시행일로부터 적용됩니다. 내용이 변경될 경우 시행 7일 전부터 서비스 내 공지사항을 통해 고지합니다.</p>
        </section>

      </div>
    </div>
  );
};

export default PrivacyPage;
