import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | Ople",
};

export default function PrivacyPage() {
  return (
    <main>
      <article className="mx-auto max-w-[760px] pb-6 wrap-anywhere [&>section]:mt-8 [&_h1]:mb-2! [&_h2]:mb-3! [&_li+li]:mt-2 [&_p+p]:mt-4! [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6">
        <h1>개인정보처리방침</h1>
        <p className="text-(--muted)">시행일: 2026년 11월 19일</p>
        <p>
          Ople 운영자 이홍주(이하 “운영자”)는 오디세이 플래너 서비스 제공을 위해
          아래와 같이 개인정보를 처리합니다.
        </p>
        <section aria-labelledby="privacy-data">
          <h2 id="privacy-data">1. 처리하는 개인정보와 이용 목적</h2>
          <ul>
            <li>
              회원 가입·로그인: 이메일, 이름, 비밀번호 해시, 이메일 인증 정보와
              로그인 세션을 회원 확인 및 계정 보안에 이용합니다.
            </li>
            <li>
              Google 로그인: Google 계정 식별자, 이메일, 이름을 계정 연결과
              로그인에 이용합니다.
            </li>
            <li>
              인터뷰: 녹음한 음성, 음성에서 변환된 텍스트, 질문과 답변, 요약을
              인터뷰 진행과 플래너 생성에 이용합니다.
            </li>
            <li>
              플래너: 생성·수정한 계획, 평가, 제목 및 생성 작업 정보를 플래너
              저장과 조회에 이용합니다.
            </li>
            <li>
              문의: 문의자가 제공한 이메일과 문의 내용을 답변 및 권리 요청
              처리에 이용합니다.
            </li>
          </ul>
          <p>
            마이크 권한은 음성 인터뷰에 사용합니다. 녹음을 제출하면 음성 파일이
            서버에 저장됩니다. 답변에 주민등록번호, 금융 정보 등 불필요한 민감
            정보를 포함하지 마세요.
          </p>
        </section>
        <section aria-labelledby="privacy-providers">
          <h2 id="privacy-providers">2. 외부 서비스 이용</h2>
          <p>
            서비스 제공 과정에서 다음 외부 서비스를 이용하며, 기능 수행에 필요한
            정보가 해당 업체에 전달됩니다.
          </p>
          <ul>
            <li>Google: Google 로그인을 선택한 경우 계정 인증을 처리합니다.</li>
            <li>
              Amazon Web Services(SES): 수신 이메일 주소와 인증 메일 내용을
              처리하여 가입 인증 메일을 발송합니다.
            </li>
            <li>
              Cloudflare(Workers AI): 제출한 음성 데이터를 처리하여 텍스트로
              변환합니다.
            </li>
            <li>
              Ollama: 인터뷰 답변·요약 등 생성에 필요한 텍스트를 처리하여 질문,
              요약 및 플래너를 생성합니다.
            </li>
          </ul>
          <p>
            외부 서비스는 해외 사업자가 운영하므로 처리 과정에서 국외 전송이
            발생할 수 있습니다. 관련 처리에 대한 문의는 아래 개인정보 문의처로
            보내주세요.
          </p>
        </section>
        <section aria-labelledby="privacy-retention">
          <h2 id="privacy-retention">3. 보관 기간과 파기</h2>
          <p>
            계정 정보, 인터뷰 녹음 및 플래너는 이용자의 삭제 요청 시까지
            보관합니다. 녹음은 음성 변환 후에도 자동으로 삭제되지 않습니다.
          </p>
          <p>
            삭제 요청을 받으면 본인 확인 후 해당 정보를 지체 없이 삭제합니다.
            법령에 따라 보관이 필요한 정보는 해당 법령의 기간 동안 보관한 후
            삭제합니다. 전자 파일은 복구할 수 없는 방법으로 파기합니다.
          </p>
        </section>
        <section aria-labelledby="privacy-rights">
          <h2 id="privacy-rights">4. 이용자의 권리와 행사 방법</h2>
          <p>
            이용자는 자신의 개인정보에 대한 열람, 정정, 삭제, 처리 정지 및 계정
            탈퇴를 요청할 수 있습니다. 계정 이메일에서{" "}
            <a href="mailto:help@ople.ink">help@ople.ink</a>로 요청 내용을
            보내주세요. 대리인 요청의 경우 권한 확인에 필요한 자료를 요청할 수
            있습니다.
          </p>
          <p>
            플래너는 내 플래너 화면에서도 삭제할 수 있습니다. 플래너 삭제와
            별개로 계정 또는 인터뷰 녹음 삭제를 원하면 이메일로 요청해 주세요.
            처리 정지나 삭제 범위에 따라 로그인 또는 플래너 이용이 제한될 수
            있습니다.
          </p>
        </section>
        <section aria-labelledby="privacy-cookies">
          <h2 id="privacy-cookies">5. 쿠키의 사용</h2>
          <p>
            로그인 상태 유지와 Google 인증 과정에 쿠키를 사용합니다. 브라우저
            설정에서 쿠키를 차단하거나 삭제할 수 있지만, 차단 시 로그인 기능을
            이용하지 못할 수 있습니다.
          </p>
        </section>
        <section aria-labelledby="privacy-security">
          <h2 id="privacy-security">6. 개인정보 보호 조치</h2>
          <p>
            비밀번호는 원문 대신 해시 형태로 저장하고, 인증된 이용자가 자신의
            플래너에 접근하도록 권한을 확인합니다. 녹음 파일의 접근 권한을
            제한하여 보관합니다.
          </p>
        </section>
        <section aria-labelledby="privacy-contact">
          <h2 id="privacy-contact">7. 개인정보 보호책임자 및 문의</h2>
          <p>
            책임자: 이홍주
            <br />
            이메일: <a href="mailto:help@ople.ink">help@ople.ink</a>
          </p>
          <p>
            개인정보 침해에 대한 상담은 개인정보침해신고센터(국번 없이 118),
            분쟁 조정은 개인정보분쟁조정위원회(1833-6972)에 요청할 수 있습니다.
          </p>
        </section>
        <section aria-labelledby="privacy-changes">
          <h2 id="privacy-changes">8. 방침 변경</h2>
          <p>
            이 방침을 변경할 때에는 변경 내용과 시행일을 서비스 내에 안내합니다.
            이용자의 권리에 중요한 변경은 시행 전에 충분히 안내합니다.
          </p>
        </section>
      </article>
    </main>
  );
}
