import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 animate-fade-in">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-600 transition-colors mb-8">
        <ChevronLeft size={16} /> 돌아가기
      </Link>

      <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">이용약관</h1>
      <p className="text-sm text-slate-400 mb-10">시행일: 2024년 1월 1일 | 최종 수정일: 2025년 1월 1일</p>

      <div className="space-y-10 text-sm leading-relaxed text-slate-600">

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제1조 (목적)</h2>
          <p>이 약관은 주식회사 퍼블릭스카이(이하 '회사')가 운영하는 Edumemo 서비스(이하 '서비스')의 이용 조건 및 절차, 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제2조 (정의)</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li><span className="font-bold text-slate-700">'서비스'</span>란 회사가 제공하는 교사용 학생 관찰 기록 및 생활기록부 관리 플랫폼 Edumemo를 의미합니다.</li>
            <li><span className="font-bold text-slate-700">'회원'</span>이란 이 약관에 동의하고 서비스를 이용하는 자를 의미합니다.</li>
            <li><span className="font-bold text-slate-700">'유료 서비스'</span>란 회원이 별도 요금을 결제하고 이용하는 플랜(Pro, Plus, School 등)을 의미합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제3조 (약관의 효력과 변경)</h2>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>이 약관은 서비스 내 공지 또는 이메일 통지로 효력이 발생합니다.</li>
            <li>회사는 합리적인 사유가 있을 경우 약관을 변경할 수 있으며, 변경 시 시행 7일 전에 서비스 내 공지합니다.</li>
            <li>변경된 약관에 동의하지 않는 회원은 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제4조 (서비스 이용)</h2>
          <p className="mb-3">서비스는 교사의 학생 관찰 기록 작성, 생활기록부 문구 생성, 학급 관리 등을 제공합니다.</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>회원은 이메일 또는 Google 계정으로 회원가입 후 서비스를 이용할 수 있습니다.</li>
            <li>무료 플랜은 제한된 기능을 제공하며, 유료 플랜 구독 시 추가 기능을 이용할 수 있습니다.</li>
            <li>회사는 서비스 운영을 위해 점검 또는 업데이트를 실시할 수 있으며, 사전 공지를 원칙으로 합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제5조 (회원의 의무)</h2>
          <p className="mb-3">회원은 다음 행위를 해서는 안 됩니다.</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
            <li>서비스를 이용하여 타인의 개인정보를 무단 수집하는 행위</li>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
            <li>저작권 등 지식재산권을 침해하는 행위</li>
            <li>관련 법령을 위반하는 행위</li>
            <li>학생의 개인정보를 서비스 외부로 무단 유출하는 행위</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제6조 (유료 서비스 및 결제)</h2>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>유료 서비스 이용 요금은 서비스 내 요금 안내 페이지에서 확인할 수 있습니다.</li>
            <li>결제는 토스페이먼츠를 통해 처리되며, 신용카드·체크카드 등을 이용할 수 있습니다.</li>
            <li>결제 완료 후 크레딧이 지급되며, 크레딧은 서비스 내 AI 기능 이용에 사용됩니다.</li>
            <li>크레딧은 환불되지 않으며, 이미 사용된 크레딧은 반환되지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제7조 (환불 정책)</h2>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>결제 후 크레딧을 사용하지 않은 경우, 결제일로부터 7일 이내 전액 환불 가능합니다.</li>
            <li>크레딧을 일부 사용한 경우, 미사용 크레딧에 비례하여 환불합니다.</li>
            <li>환불 요청은 고객센터(publicsky7@gmail.com)로 이메일 문의하시기 바랍니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제8조 (데이터 소유권 및 보호)</h2>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>회원이 서비스에 입력한 학급 정보, 학생 기록 등 모든 데이터의 소유권은 회원에게 있습니다.</li>
            <li>회사는 회원의 데이터를 서비스 제공 목적 외에 사용하지 않습니다.</li>
            <li>회원 탈퇴 시 회원의 데이터는 즉시 삭제됩니다. (법령에서 보존을 요구하는 경우 제외)</li>
            <li>회사는 데이터 보호를 위해 암호화 저장 및 접근 제어를 적용합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제9조 (서비스 중단 및 계약 해지)</h2>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>회원은 언제든지 서비스 내에서 탈퇴(해지)를 신청할 수 있습니다.</li>
            <li>회사는 회원이 이 약관을 위반하거나 서비스 운영을 방해한 경우 사전 통지 후 이용을 제한하거나 계약을 해지할 수 있습니다.</li>
            <li>회사 사정으로 서비스를 종료하는 경우, 30일 전에 서비스 내 공지합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제10조 (면책 조항)</h2>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>회사는 천재지변, 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>회원이 입력한 데이터의 정확성 및 적법성에 대한 책임은 회원에게 있습니다.</li>
            <li>회원 간 또는 회원과 제3자 간의 분쟁에 대해 회사는 개입하지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">제11조 (분쟁 해결)</h2>
          <p>서비스 이용과 관련한 분쟁은 대한민국 법률을 적용하며, 분쟁 발생 시 회사의 소재지를 관할하는 법원을 제1심 관할 법원으로 합니다.</p>
        </section>

        <section className="bg-slate-50 rounded-2xl p-6">
          <h2 className="text-base font-black text-slate-800 mb-3">사업자 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
            <p><span className="font-bold text-slate-700">상호:</span> 주식회사 퍼블릭스카이</p>
            <p><span className="font-bold text-slate-700">대표자:</span> 하상욱</p>
            <p><span className="font-bold text-slate-700">사업자등록번호:</span> 618-81-37189</p>
            <p><span className="font-bold text-slate-700">통신판매업:</span> 2023-세종아름-0260</p>
            <p className="sm:col-span-2"><span className="font-bold text-slate-700">주소:</span> 세종특별자치시 도움3로 105-5 806호</p>
            <p><span className="font-bold text-slate-700">전화:</span> 010-2314-4577</p>
            <p><span className="font-bold text-slate-700">이메일:</span> publicsky7@gmail.com</p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default TermsPage;
