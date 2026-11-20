import type { Metadata } from "next";
import { PolicyArticle } from "@/components/policy-article";

export const metadata: Metadata = {
  title: "서비스 약관 | Ople",
};

export default function TermsPage() {
  return (
    <PolicyArticle
      title="서비스 약관"
      effective="2026년 11월 19일"
      sections={[
        { id: "terms-service", label: "서비스의 내용" },
        { id: "terms-account", label: "회원 가입과 계정 관리" },
        { id: "terms-conduct", label: "이용자가 지켜야 할 사항" },
        { id: "terms-content", label: "이용자 콘텐츠와 권리" },
        { id: "terms-ai", label: "AI 결과의 한계" },
        { id: "terms-availability", label: "서비스 변경·중단 및 이용 제한" },
        { id: "terms-termination", label: "이용 종료와 데이터 삭제" },
        { id: "terms-liability", label: "책임과 분쟁 해결" },
        { id: "terms-changes", label: "약관 변경과 문의" },
      ]}
    >
      <p>
        이 약관은 Ople 운영자(이하 “운영자”)가 제공하는 서비스의 이용 조건과
        운영자 및 이용자의 권리·의무를 정합니다.
      </p>
      <section aria-labelledby="terms-service">
        <h2 id="terms-service">1. 서비스의 내용</h2>
        <p>
          Ople은 음성 인터뷰와 AI를 통해 다양한 삶의 가능성을 탐색하고, 오디세이
          플래너를 생성·수정·저장하는 서비스입니다. 이용자는 본 약관과
          개인정보처리방침을 확인한 후 서비스를 이용할 수 있습니다.
        </p>
      </section>
      <section aria-labelledby="terms-account">
        <h2 id="terms-account">2. 회원 가입과 계정 관리</h2>
        <p>
          이메일 인증 또는 Google 로그인으로 가입할 수 있습니다. 이용자는 본인이
          사용할 권한이 있는 정확한 계정 정보를 제공하고, 비밀번호와 로그인
          수단을 안전하게 관리해야 합니다.
        </p>
        <p>
          타인의 계정을 사용하거나 계정을 무단으로 양도해서는 안 됩니다. 계정
          도용이 의심되면 즉시 운영자에게 알려주세요.
        </p>
      </section>
      <section aria-labelledby="terms-conduct">
        <h2 id="terms-conduct">3. 이용자가 지켜야 할 사항</h2>
        <ul>
          <li>
            타인의 개인정보, 저작권 등 권리를 침해하거나 불법적인 내용을
            입력·전송하지 않습니다.
          </li>
          <li>
            타인을 사칭하거나 동의 없이 타인의 음성을 녹음·제출하지 않습니다.
          </li>
          <li>
            서비스에 무단 접근하거나 보안 장치를 우회하고, 과도한 요청으로
            운영을 방해하지 않습니다.
          </li>
          <li>서비스를 법령에 위반되는 목적으로 이용하지 않습니다.</li>
        </ul>
      </section>
      <section aria-labelledby="terms-content">
        <h2 id="terms-content">4. 이용자 콘텐츠와 권리</h2>
        <p>
          이용자가 입력한 답변, 녹음 및 직접 작성한 계획에 대한 권리는 해당
          이용자에게 있습니다. 이용자는 서비스에 제출할 권한이 있는 콘텐츠만
          제공해야 합니다.
        </p>
        <p>
          운영자는 인터뷰 처리, 음성 변환, AI 생성, 저장 및 조회 등 서비스
          제공에 필요한 범위에서 콘텐츠를 처리하며, 이 과정에서 외부 서비스를
          이용합니다. 개인정보 처리에 관한 자세한 내용은{" "}
          <a href="/privacy">개인정보처리방침</a>을 따릅니다.
        </p>
        <p>
          AI 생성 결과의 권리와 이용 범위는 관련 법령 및 제3자의 권리에 영향을
          받을 수 있습니다. 이용자는 결과를 활용하기 전에 내용을 검토해야
          합니다.
        </p>
      </section>
      <section aria-labelledby="terms-ai">
        <h2 id="terms-ai">5. AI 결과의 한계</h2>
        <p>
          AI가 생성한 질문, 요약, 계획에는 오류나 부정확한 내용이 포함될 수
          있습니다. 결과는 삶의 가능성을 탐색하기 위한 참고 자료이며, 전문적인
          진로·의료·법률·재무 상담을 대신하지 않습니다.
        </p>
        <p>
          운영자는 특정 진로, 취업, 소득 또는 계획의 실현을 보장하지 않습니다.
          중요한 결정은 자신의 상황과 필요한 전문가의 조언을 함께 고려하여
          내려주세요.
        </p>
      </section>
      <section aria-labelledby="terms-availability">
        <h2 id="terms-availability">6. 서비스 변경·중단 및 이용 제한</h2>
        <p>
          운영자는 기능 개선, 점검, 장애 또는 외부 서비스 사정으로 서비스의 전부
          또는 일부를 변경하거나 중단할 수 있습니다. 예정된 주요 변경이나 중단은
          사전에 안내하고, 긴급한 경우에는 사후에 안내합니다.
        </p>
        <p>
          법령 또는 약관 위반으로 서비스나 다른 이용자에게 피해를 주는 경우
          이용을 제한할 수 있습니다. 제한 사유와 이의 제기 방법을 안내하며,
          긴급한 보안 조치가 필요한 경우 우선 제한한 후 안내할 수 있습니다.
        </p>
      </section>
      <section aria-labelledby="terms-termination">
        <h2 id="terms-termination">7. 이용 종료와 데이터 삭제</h2>
        <p>
          이용자는 언제든지 서비스 이용을 중단할 수 있으며, 내 플래너 화면에서
          플래너를 삭제할 수 있습니다. 계정 탈퇴, 인터뷰 녹음 또는 개인정보
          삭제는 계정 이메일에서{" "}
          <a href="mailto:help@ople.ink">help@ople.ink</a>로 요청해 주세요.
        </p>
        <p>
          계정 정보, 인터뷰 녹음 및 플래너는 삭제 요청 시까지 보관하며, 본인
          확인 후 지체 없이 삭제합니다. 법령상 보관 의무가 있는 경우에는 해당
          기간 동안 보관합니다. 삭제된 데이터는 복구할 수 없으므로 필요한 내용은
          요청 전에 별도로 보관해 주세요.
        </p>
      </section>
      <section aria-labelledby="terms-liability">
        <h2 id="terms-liability">8. 책임과 분쟁 해결</h2>
        <p>
          운영자와 이용자는 자신의 귀책사유로 상대방에게 발생한 손해에 대해 관련
          법령에 따라 책임을 부담합니다. 이 약관은 운영자의 고의 또는 과실에
          따른 법적 책임이나 이용자의 법정 권리를 배제하지 않습니다.
        </p>
        <p>
          서비스 관련 문의와 이의 제기는{" "}
          <a href="mailto:help@ople.ink">help@ople.ink</a>로 접수합니다. 분쟁은
          우선 협의하여 해결하며, 해결되지 않는 경우 대한민국 법령과 법정 관할에
          따릅니다.
        </p>
      </section>
      <section aria-labelledby="terms-changes">
        <h2 id="terms-changes">9. 약관 변경과 문의</h2>
        <p>
          약관을 변경할 때에는 변경 내용과 시행일을 서비스 내에 사전 안내합니다.
          이용자에게 불리하거나 중요한 변경은 충분한 안내 기간을 두고 필요한
          경우 동의를 받습니다. 이용자는 변경 약관에 동의하지 않으면 이용을
          종료하고 탈퇴를 요청할 수 있습니다.
        </p>
        <p>
          문의: <a href="mailto:help@ople.ink">help@ople.ink</a>
        </p>
      </section>
    </PolicyArticle>
  );
}
