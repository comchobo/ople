---
name: Ople
description: 컬러 면 위에 세 가지 삶의 가능성을 그리는 개인 플래너
colors:
  ink: "#312c42"
  muted: "#70697b"
  line: "#d8d3ca"
  paper: "#faf8f2"
  soft: "#f0ede5"
  accent: "#da5736"
  accent-dark: "#a83e24"
  butter: "#f5e5a8"
  plan-a: "#e2ed99"
  plan-b: "#e1d8f0"
  plan-c: "#f3d0be"
  danger: "#963d32"
  ink-hover: "#4c435e"
  field-paper: "#fffefa"
  hero-ink: "#1c1622"
typography:
  display:
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(38px, 4vw, 58px)"
    fontWeight: 650
    lineHeight: 1.28
    letterSpacing: "-0.035em"
  headline:
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(30px, 3.5vw, 42px)"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  title:
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "24px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    fontWeight: 550
    lineHeight: 1.65
rounded:
  timeline-inner: "3px"
  timeline: "4px"
  field: "5px"
  control: "6px"
  dialog-mobile: "10px"
  dialog: "12px"
  sample-label: "20px"
  circle: "50%"
spacing:
  gap-6: "6px"
  gap-8: "8px"
  gap-10: "10px"
  gap-12: "12px"
  gap-16: "16px"
  gap-18: "18px"
  gap-20: "20px"
  gap-24: "24px"
  gap-28: "28px"
  gap-32: "32px"
  gap-40: "40px"
  gap-48: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  button-hero:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "18px 24px"
    width: "100%"
  input-field:
    backgroundColor: "{colors.field-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
    width: "100%"
  header-navigation:
    textColor: "{colors.ink}"
  sample-label:
    textColor: "{colors.ink}"
    rounded: "{rounded.sample-label}"
    padding: "3px 12px"
  plan-details-a:
    backgroundColor: "{colors.plan-a}"
    textColor: "{colors.ink}"
    padding: "26px"
  plan-tab-a-selected:
    backgroundColor: "{colors.plan-a}"
    textColor: "{colors.ink}"
    padding: "18px"
---

# Design System: Ople

## Overview

**Creative North Star: "컬러 스튜디오"**

삶의 여러 가능성을 밝은 종이와 컬러 면 위에 구체적으로 그린다. SNS에 익숙한 젊은 사용자에게 감성적인 개인 플래너로 다가가되, 긴 생각과 실제 편집을 받치는 또렷한 한글과 익숙한 웹 컨트롤을 유지한다. 넓은 제목, 얇은 경계, 평평한 색면과 밀도 있는 작업 영역이 같은 세계를 만든다.

주홍은 소개와 녹음의 활력, 버터는 질문과 안내, 라임·연보라·살구는 세 계획의 식별을 맡는다. 로그인·계정·편집 폼도 종이 바탕, 잉크 텍스트, 같은 필드와 버튼을 사용한다. 기존 흑백 정체성을 교체한다는 확인된 방향을 기록하며, 제품 사실과 한국어 콘텐츠·정책의 진실은 PRODUCT.md가 맡는다.

근거와 신뢰도: 토큰·상태·경계값은 frontend/app/globals.css에서 직접 추출해 신뢰도 높음. 동작과 적용 범위는 frontend/components/home/{intro,plan-preview}.tsx, frontend/components/navigation/site-header.tsx, frontend/components/planner/{board,planner-list,piece-editor}.tsx, frontend/components/auth/auth.tsx, frontend/components/modal.tsx 및 frontend/hooks/planner/use-timeline-export.ts로 확인했다. 정성 언어는 PRODUCT.md와 .impeccable/surfaces/redesign.md 및 사용자가 선택한 .impeccable/mocks/decision/round2-color-studio.html에 근거한다. .impeccable/review/final-home/{desktop,mobile}.png와 .impeccable/review/{board-desktop,list-mobile,interview-mobile}.png는 시각 교차 확인 자료이며 수치의 출처는 코드다. 보지 않은 화면이나 배포 환경까지 검증했다는 뜻은 아니다.

**Key Characteristics:**
- 밝은 종이, 어두운 잉크, 역할이 분리된 컬러 면.
- A/B/C 식별색이 결과 예시·보드·PNG까지 이어지는 연속성.
- Pretendard Variable의 한글 위계와 얇은 경계.
- 평평한 작업 면, 작은 컨트롤 곡률, 모달에 한정된 부드러운 그림자.

## Colors

선명한 주홍과 부드러운 계획색을 따뜻한 종이·보라 기운의 잉크가 연결한다. 위 frontmatter가 실제 사용값의 기준이다.

### Primary
- **스튜디오 주홍 (`accent`)**: 홈 소개 면, 녹음 주 컨트롤, 진행 상태에 사용한다. 모든 주요 버튼의 배경색이라는 뜻은 아니다.
- **깊은 주홍 (`accent-dark`)**: 키보드 포커스, 입력 커서, 범위 입력의 강조색과 단계 번호.

### Secondary
- **계획 A 라임 (`plan-a`)**, **계획 B 연보라 (`plan-b`)**, **계획 C 살구 (`plan-c`)**: 선택한 계획의 탭·상세 면·타임라인 조각. 홈의 다른 가능성 면도 각자의 식별색을 유지한다.
- 목록의 표지는 순서대로 세 색을 반복한다. 목록 표지색은 특정 계획의 선택 상태가 아니다.

### Tertiary
- **버터 (`butter`)**: 질문 면, 안내, 현재 단계 번호와 텍스트 선택 배경. 오류는 별도의 **오류 적갈색 (`danger`)** 텍스트로 구별한다.

### Neutral
- **잉크 (`ink`)**: 기본 텍스트, 일반 주요 버튼, 타임라인 막대와 선택 경계. **잉크 호버 (`ink-hover`)**는 일반 주요 버튼의 hover.
- **종이 (`paper`)**: 페이지·버튼·모달 바탕. **밝은 필드 종이 (`field-paper`)**: 입력·타임라인 바탕과 Google 로그인 버튼.
- **보조 잉크 (`muted`)**, **경계 (`line`)**, **부드러운 종이 (`soft`)**: 보조 텍스트, 구획선, 일반 버튼 hover·비활성 입력.
- **주홍 위 잉크 (`hero-ink`)**: 홈 소개 면·녹음 주 컨트롤·아이콘의 어두운 도형.

### Named Rules
**The Palette Split Rule.** 주홍은 소개·녹음 강조, 잉크는 일반 주요 동작, A/B/C 색은 계획 식별을 맡는다.

**The Plan Continuity Rule.** A/B/C 식별색을 홈 예시, 선택 탭, 상세 면, 타임라인 조각과 PNG 저장 사이에 유지한다.

사이드카의 tonalRamp는 패널 표시용으로 합성한 8단계 OKLCH 견본이다. 앱에 존재하는 단계별 토큰이나 추가 배색 규칙이 아니며, canonical 값은 실제 CSS와 같다.

## Typography

**Display Font / Body Font / Label Font:** 동일한 Pretendard Variable. 실제 스택은 frontmatter와 같으며, 시스템 글꼴은 fallback이다. 현재 CSS의 jsDelivr Pretendard v1.3.9 variable dynamic-subset import를 그대로 기준으로 한다. 별도의 디스플레이·모노 폰트를 도입하지 않았다.

### Hierarchy
- **Display**: 홈 제목의 유동 크기·자간은 frontmatter 기준. 모바일에서는 (clamp(36px, 7.2vw, 52px)), 최대 폭 (18ch).
- **Headline**: 기본 h1은 frontmatter 기준. 보드 제목은 (32px), 모바일 (28px). 인터뷰 질문은 (clamp(28px, 3.2vw, 42px)), 행간 (1.5), 최대 폭 (24ch); 모바일 크기는 (28px).
- **Title**: 기본 h2는 frontmatter 기준. h3는 (17px / 1.65), 굵기 (650). 홈 예시 제목은 (27px / 1.3), 굵기 (600), 자간 (-0.025em); 모바일 크기는 (26px).
- **Body**: 기본값은 frontmatter 기준. 홈 설명은 (17px / 1.85), 최대 폭 (36ch), 모바일 크기 (16px)·최대 폭 (42ch). 계획 설명은 (14px / 1.9); 정책 본문 행간도 (1.9).
- **Label**: 폼 레이블은 frontmatter 기준. 보조 텍스트는 주로 (13px), 탭은 데스크톱 (14px). 타임라인 활동명은 (12px), 조각 내부 보조 날짜는 (10px / 1.3). 이 조밀한 날짜 크기를 일반 본문에 확장하지 않는다.
- **Numbers / wordmark**: 타이머는 (56px / 1.2), 모바일 (48px), 자간 (-0.025em). 타이머·연차·자가평가 숫자는 tabular-nums. Ople 워드마크는 (38px / 1), 굵기 (800), 자간 (-0.04em), 모바일 (32px).

한글 본문은 keep-all, 제목은 balance와 overflow-wrap:anywhere, 편집한 설명은 pre-wrap과 anywhere를 사용한다. 균등한 배율의 타입 스케일을 가정하지 않는다.

## Layout

기본 main은 중앙 정렬·최대 폭 (1440px)·패딩 (48px). 목록 main은 최대 (1200px), 정책은 (880px), 준비·완료 본문은 (680px), 단계 표시는 (760px). 헤더·정책 푸터 좌우 여백은 (max(32px, calc((100vw - 1344px) / 2))). 간격은 frontmatter의 관측값 모음이며 단일 배수 스케일은 아니다.

홈은 기본 main 패딩 없이 최대 (1440px)의 (5fr 7fr) 소개/결과 예시 그리드를 사용한다. 이는 선택된 홈 표현이며 모든 화면에 적용할 전역 분할 규칙은 아니다. 보드는 (minmax(0, 2fr) minmax(280px, 1fr)), 간격 (40px); 인터뷰는 (minmax(0, 3fr) minmax(280px, 2fr)), 간격 (48px). 타임라인은 최소 폭 (600px)을 유지하고 해당 viewport만 가로 스크롤한다.

| 실제 미디어 조건 | 적용 |
| --- | --- |
| min-width: 1441px | 홈 주요 구획에 좌우 경계선 추가. |
| max-width: 1100px | main 패딩 (36px 28px), 홈 여백 축소·이용 방법 구획 단일 열. 보드 (minmax(0, 3fr) minmax(260px, 2fr)), 간격 (24px). 인터뷰 간격 (24px). |
| max-width: 760px | main 패딩 (28px 20px). 홈·보드·인터뷰 단일 열. 소개 다음 결과 예시, 타임라인 다음 상세 면. 헤더 최소 높이 (72px), 패딩 (12px 20px), 데스크톱은 최소 높이 (88px). |

모바일에서도 세 계획 탭은 세 열로 유지한다. 보드 탭 내부는 세로 배치되고 글자는 (12px), 패딩 (14px 10px). 목록은 줄바꿈하며 표지가 (72px × 88px)에서 (56px × 72px)로 줄고, 행 동작은 왼쪽 (72px) 들여쓴다. 폼의 시작 월·기간 두 열은 모바일에서도 유지한다. 모달은 데스크톱 너비 (560px), 최대 폭 (calc(100% - 40px)), 최대 높이 (calc(100dvh - 48px)); 모바일 최대 폭·높이는 각각 (calc(100% - 24px)), (calc(100dvh - 24px)).

## Elevation & Depth

색면과 얇은 선으로 구획한다. 홈 예시·상세 면·목록에는 떠 있는 카드 그림자가 없다. 선택 탭의 inset 선은 선택 표시이며 떠오르는 elevation이 아니다.

### Shadow Vocabulary
- **모달**: `box-shadow: 0 20px 80px rgb(49 44 66 / 0.18)`. 배경은 `rgb(36 29 42 / 0.5)`의 native dialog backdrop.
- **선택 탭**: `box-shadow: inset 0 -3px var(--ink)`.

**The Flat Work Surface Rule.** 작업 면은 색과 경계로 나누고, 부드러운 외부 그림자는 모달의 겹침을 설명한다.

## Shapes

큰 컬러 면·탭은 직각, 기본 컨트롤은 작은 곡률이다. 둥근 값은 frontmatter 기준: 버튼·안내 (control), 입력 (field), 조각과 내부 조작부 (timeline / timeline-inner), 모달 (dialog / dialog-mobile). 원형 단계 번호와 녹음 컨트롤, 결과 예시의 작은 둥근 레이블은 각자의 용도에 한정된다. 일반 경계는 (1px), 선택된 조각은 잉크 (2px) 경계와 양끝 리사이즈 핸들을 가진다.

## Components

### Buttons
또렷하고 익숙한 웹 컨트롤. 기본 최소 높이 (46px), 간격 (10px), 굵기 (550), 행간 (1.4), 경계 (1px). primary·secondary·text의 색과 패딩은 frontmatter 기준이며, icon 버튼 너비는 (46px)이다.

일반 hover는 soft 배경·경계 `#a69b8e`; primary hover는 ink-hover. 홈 주 동작만 종이색 전폭 버튼이며 최소 높이 (64px), 모바일 (58px), 글자 (17px), hover는 butter다. 비활성 버튼은 opacity (0.5)와 not-allowed 커서. 전역 focus-visible은 `2px solid var(--accent-dark)`, offset (4px).

배경색과 경계색은 각각 (160ms ease-out) 전환한다. 홈 예시 막대만 `plan-reveal 650ms cubic-bezier(0.16, 1, 0.3, 1) both`로 clip-path를 `inset(0 100% 0 0)`에서 `inset(0)`까지 드러낸다. reduced-motion에서는 이 애니메이션과 버튼 전환을 끈다. 추가적인 이동·탄성·상시 애니메이션은 기록하지 않는다.

### Chips
결과 예시 레이블은 행동 칩이 아닌 정적 표시다. 글자 (12px), 경계 `1px solid #b1a896`, 패딩·곡률은 frontmatter 기준. 선택·삭제 상태를 갖는 칩 컴포넌트는 구현되지 않았다.

### Cards / Containers
계획 상세 면은 선택색을 배경으로 하는 평평한 컨테이너이며 패딩은 데스크톱 (26px), 모바일 (24px). 홈 예시는 데스크톱 (24px), 모바일 (22px 18px). 연보라는 준비 안내 목록·빈 목록·계정 정보에도 사용된다. 이 보조 사용은 계획 B 선택 상태를 뜻하지 않는다.

### Inputs / Fields
로그인·회원가입·인증·활동/계획/평가/이름 편집은 같은 모달·필드 언어를 공유한다. 일반 필드는 `1px solid #aaa091`, 최소 높이 (48px), 나머지는 frontmatter 기준. 포커스는 `2px solid var(--accent-dark)`, offset (2px), caret도 accent-dark. 비활성 input은 soft와 muted를 사용한다. 오류 메시지는 danger 텍스트·`#faeae5` 배경·`#deb3a8` 경계, 안내는 butter·`#5d4b21` 텍스트·`#d6c484` 경계다. 별도의 오류 필드 외곽선 스타일은 정의되어 있지 않다.

### Navigation
헤더는 Ople 워드마크와 계정 동작으로 구성한다. 데스크톱에는 선택적으로 홈 구획 링크(세 가지 삶의 가능성, 이용 방법)를 둘 수 있고, 현재 SiteHeader는 이를 렌더링한다. 모바일 경계 이하에서는 그 두 직접 링크만 숨기며 로그인 또는 내 플래너·계정 버튼은 유지한다. 링크는 hover에서 밑줄, 계정 동작은 기존 버튼 상태를 따른다. 정책 푸터는 같은 종이·경계·보조 텍스트로 개인정보처리방침과 서비스 약관을 제공하며 링크의 최소 높이는 (44px)다.

### Plan tabs / Timeline / Export
탭은 세 열, 기본 투명 배경, 선택 시 계획색과 inset 잉크 선. 보드 탭 hover는 soft, 키보드는 좌우 화살표·Home·End로 전환한다. A/B/C 문자와 텍스트가 색 외에도 식별을 제공한다.

타임라인 조각은 높이 (50px), 행 (66px), 경계 `#aaa08a`. 선택 시 잉크 경계와 핸들, 편집 아이콘을 유지한다. PNG는 현재 계획색과 computed body font를 받아 종이·잉크·경계 토큰으로 그린다. 논리 너비 (1200px), 배율 (2), 제목 영역 (96px), 연차 영역 (42px), 행 (66px); 화면의 모든 컨트롤을 캡처하는 방식은 아니다.

현재 앱 아이콘 frontend/app/icon.svg는 기존 도형의 주홍/어두운 잉크 배색을 바꾼 SVG다. 새 배포용 raster asset은 만들지 않았다. .impeccable/review의 PNG는 리뷰 자료이며 앱 자산이 아니다. 사용자가 저장하는 타임라인 PNG는 런타임 산출물이다.

## Do's and Don'ts

### Do:
- **Do** 주홍·잉크·계획색의 역할 분리를 유지한다.
- **Do** A/B/C 문자와 텍스트를 색과 함께 표시한다.
- **Do** 폼에도 동일한 종이 바탕, 필드와 포커스 처리를 사용한다.
- **Do** 실제 모바일 경계에서 단일 열과 타임라인 내부 가로 스크롤을 유지한다.
- **Do** 결과 예시 표시와 기존 정책·제품 사실을 보존한다.

### Don't:
- **Don't** 선택한 컬러 세계를 기존 흑백 정체성으로 되돌린다.
- **Don't** 미리보기용 tonalRamp를 구현된 앱 토큰으로 취급한다.
- **Don't** 리뷰 스크린샷을 배포용 이미지나 새로운 공유 기능의 증거로 취급한다.

문서화하지 않은 결함·드리프트: 제공된 코드와 지정 스크린샷 대조에서 확정한 디자인 시스템 드리프트는 없다. 패널용 합성 램프와 스니펫은 실제 자산·기능의 추가로 정당화하지 않았으며, 이 문서는 전면 접근성·배포 검증을 주장하지 않는다.
