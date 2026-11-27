import { sample, names, lenses, colors, escape as e, icon } from "./data.js";
import { plate } from "./plates.js";
import { openEditor } from "./editor.js";
import { interview } from "./voice.js";
const root = document.querySelector("#main"),
  nav = document.querySelector("#nav"),
  dialog = document.querySelector("#dialog");
let store;
try {
  store = window.localStorage;
  store.getItem("ople.notebook.user");
} catch {
  store = null;
}
let user = store?.getItem("ople.notebook.user") || "",
  clean,
  books = [],
  active,
  example,
  toastTimer;
function notice(text) {
  const n = document.querySelector("#notice");
  n.textContent = text;
  n.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => n.classList.remove("show"), 2700);
}
const bookPrefix = () => `ople.book.${encodeURIComponent(user)}:`;
function load() {
  try {
    books = Object.keys(store || {})
      .filter((k) => k.startsWith(bookPrefix()))
      .map((k) => JSON.parse(store.getItem(k)))
      .sort((a, b) => b.date.localeCompare(a.date));
    example = JSON.parse(store?.getItem("ople.example." + user) || "null");
  } catch {
    books = [];
    example = null;
  }
  example ??= {
    name: "서윤의 오디세이 플래너",
    plans: structuredClone(sample),
    id: "sample",
  };
}
function save() {
  try {
    if (!store) throw Error();
    let key =
      active.id === "sample"
        ? "ople.example." + user
        : bookPrefix() + active.id;
    const last = JSON.parse(store.getItem(key) || "null");
    if (last && last.rev !== active.rev && active.id !== "sample") {
      active.id = crypto.randomUUID();
      active.date = new Date().toISOString();
      key = bookPrefix() + active.id;
      notice("다른 탭의 변경을 유지하고 이 편집본을 따로 저장했어요.");
    }
    active.rev = crypto.randomUUID();
    store.setItem(key, JSON.stringify(active));
  } catch {
    notice(
      "이 브라우저에 저장할 수 없어요. 저장 권한과 남은 공간을 확인해 주세요.",
    );
  }
}
load();
function shell(page) {
  clean?.();
  clean = null;
  root.innerHTML = "";
  window.scrollTo(0, 0);
  root.focus({ preventScroll: true });
  nav.hidden = page === "voice";
  nav.innerHTML = `<div class="nav-inner"><button class="brand" aria-label="Ople 홈"><img src="/ople-logo.svg" alt="Ople"></button><span class="brand-type">오디세이 플래너</span><div class="nav-end"><button id="library" class="textbtn">${icon("book")} 내 플래너</button>${user ? `<button id="exit" class="square" aria-label="로그아웃" title="로그아웃">${icon("exit")}</button>` : ""}</div></div>`;
  nav.querySelector(".brand").onclick = () => overview(example);
  nav.querySelector("#library").onclick = () =>
    user ? library() : auth(library);
  if (user)
    nav.querySelector("#exit").onclick = () => {
      localStorage.removeItem("ople.notebook.user");
      user = "";
      load();
      overview(example);
      notice("로그아웃했어요.");
    };
  document.title = `${page === "voice" ? "음성 인터뷰" : page === "editor" ? "플랜 편집" : page === "library" ? "내 플래너" : "오디세이 플래너"} · Ople`;
}
function auth(next) {
  if (!store) {
    notice("내 플래너를 만들려면 브라우저의 사이트 저장 권한을 켜 주세요.");
    return;
  }
  let email = "";
  function step(code) {
    dialog.innerHTML = `<form class="modal auth"><div class="modal-heading"><h2>${code ? "로그인 코드 입력" : "이메일로 시작하기"}</h2><button type="button" class="square" aria-label="닫기">${icon("close")}</button></div><p>${code ? e(email) + " · 이메일 발송 없이 원하는 숫자 6자리를 입력하세요." : "이 기기에 저장한 내 플래너를 다시 열 수 있어요."}</p><label for="field">${code ? "숫자 6자리 코드" : "이메일 주소"}</label><input id="field" required ${code ? 'type="text" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" autocomplete="one-time-code" placeholder="000000"' : 'type="email" autocomplete="email" placeholder="name@example.com"'}><button class="primary wide">${code ? "로그인" : "계속하기"} ${icon("arrow")}</button>${code ? '<button type="button" class="textbtn" id="emailback">이메일 변경</button>' : ""}</form>`;
    dialog.querySelector(".square").onclick = () => dialog.close();
    const field = dialog.querySelector("#field");
    if (!code) field.value = email;
    else dialog.querySelector("#emailback").onclick = () => step(false);
    dialog.querySelector("form").onsubmit = (ev) => {
      ev.preventDefault();
      if (!code) {
        email = field.value.trim().toLowerCase();
        step(true);
      } else {
        try {
          store.setItem("ople.notebook.user", email);
        } catch {
          notice(
            "로그인을 저장할 수 없어요. 브라우저의 저장 공간을 확인해 주세요.",
          );
          return;
        }
        user = email;
        load();
        dialog.close();
        next();
      }
    };
    field.focus();
  }
  step(false);
  dialog.showModal();
  dialog.querySelector("#field").focus();
}
function newBook() {
  if (!user) return auth(newBook);
  active = {
    id: crypto.randomUUID(),
    name: "진행 중인 인터뷰",
    date: new Date().toISOString(),
    turns: [],
  };
  books.unshift(active);
  save();
  voice(active);
}
function voice(p) {
  shell("voice");
  active = p;
  clean = interview({
    root,
    planner: p,
    save,
    leave: library,
    complete: () => overview(p),
  });
}
function library() {
  shell("library");
  root.innerHTML = `<section class="wrap library"><div class="lead"><div><h1>내 플래너</h1><p>${e(user)} · 이 기기에 저장한 플래너</p></div><button class="primary" id="new">${icon("add")} 새 플래너</button></div>${books.length ? `<div class="booklist">${books.map((p, i) => `<button data-book="${i}"><span>${e(new Date(p.date).toLocaleDateString("ko-KR"))}</span><strong>${e(p.plans ? p.plans[0].title : p.name)}</strong><span>${p.plans ? "세 플랜 보기" : `${Math.min(10, (p.turns?.length || 0) + 1)} / 10 · 이어가기`} ${icon("arrow")}</span></button>`).join("")}</div>` : `<div class="empty">${icon("book")}<h2>첫 플래너를 펼쳐 보세요.</h2><p>열 번의 음성 대화가 끝나면 세 가지 5년이 한 권에 담겨요.</p></div>`}</section>`;
  root.querySelector("#new").onclick = newBook;
  root.querySelectorAll("[data-book]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = books[+b.dataset.book];
        p.plans ? overview(p) : voice(p);
      }),
  );
}
function overview(p) {
  shell("home");
  active = p;
  const ex = p.id === "sample";
  root.innerHTML = `<section class="wrap overview"><div class="lead"><div><h1>${ex ? "한 사람의 오늘, <em>세 가지 5년.</em>" : "나의 세 가지 5년."}</h1><p>${ex ? "편집자 서윤이 그린 세 가지 삶을 펼쳐 보세요." : "같은 오늘에서 출발한 세 플랜을 펼쳐 보세요."}</p></div><button class="primary" id="start">${ex ? "내 플래너 시작하기" : "내 플래너 보기"} ${icon("arrow")}</button></div><section class="folio" aria-labelledby="folio-title"><div class="binding" aria-hidden="true"></div><div class="folio-top"><h2 id="folio-title">${e(p.name)}</h2><span>${ex ? "완성 예시" : "내 플래너"} <b> / </b> 5년 타임라인</span></div><div class="leaves">${p.plans.map((plan, i) => `<article class="leaf" style="--accent:${colors[i]}"><div class="leaf-caption"><i aria-hidden="true"></i>${names[i]}</div>${ex ? plate(i) : ""}<h3>${e(plan.title)}</h3><p>${lenses[i]}</p><div class="timeline-mini"><span>오늘</span><span>5년 뒤</span></div><div class="event-mini"><span>${e(plan.years[0].work)}</span><span>${e(plan.years[5].work)}</span></div><button data-open="${i}" class="open-plan" aria-label="${names[i]} 펼치기">플랜 펼치기 ${icon("open")}</button></article>`).join("")}</div><div class="folio-foot"><span>Ople</span><span>오디세이 플래너</span></div></section></section>`;
  root.querySelector("#start").onclick = ex ? newBook : library;
  root
    .querySelectorAll("[data-open]")
    .forEach((b) => (b.onclick = () => editor(p, +b.dataset.open)));
}
function editor(p, i) {
  shell("editor");
  active = p;
  openEditor({
    root,
    dialog,
    planner: p,
    i,
    save,
    open: (n) => editor(p, n),
    onBack: () => overview(p),
    notice,
  });
  if (p.id === "sample") {
    const button = document.createElement("button");
    button.className = "primary wide";
    button.textContent = "내 플래너 시작하기";
    button.onclick = newBook;
    root.querySelector(".assessment").append(button);
  }
}
overview(example);
window.addEventListener("storage", (ev) => {
  if (ev.key === "ople.notebook.user" || ev.key === null) {
    dialog.close();
    user = store?.getItem("ople.notebook.user") || "";
    load();
    overview(example);
  } else if (
    ev.key.startsWith(bookPrefix()) &&
    document.querySelector(".library")
  ) {
    load();
    library();
  }
});
