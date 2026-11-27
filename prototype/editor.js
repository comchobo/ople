import { names, colors, assessments, escape as e, icon } from "./data.js";
import { inkLine, wrap } from "./ink.js";
const rangeLabel = (i, v) =>
  v == null
    ? "미평가"
    : i === 1
      ? ["차가움", "서늘함", "따뜻함", "뜨거움"][
          Math.min(3, Math.floor(v / 25))
        ]
      : i === 2
        ? ["비어 있음", "조금 채움", "반쯤 채움", "거의 가득", "가득 참"][
            Math.round(v / 25)
          ]
        : String(v);
function sheet(p, i) {
  let y = 43;
  let contents = "";
  const label = (s, x = 20, dy = 0) => {
    contents += `<text class="sheet-label" x="${x}" y="${y + dy}">${e(s)}</text>`;
  };
  const line = (s, x, step, id, limit) => {
    wrap(s, limit).forEach((v, n) => {
      contents += inkLine(v, x, y, step, id + "-" + n);
      y += step * 1.55;
    });
  };
  label(names[i]);
  y += 14;
  line(p.title, 20, 21, "title", 15);
  y += 12;
  label("5년 타임라인");
  y += 13;
  p.years.forEach((r, n) => {
    contents += `<path class="rule" d="M20 ${y}H342"/>`;
    y += 22;
    label(n === 0 ? "오늘" : `${n}년 뒤`);
    y += 13;
    label("일", 20, 13);
    line(r.work, 56, 16, "work" + n, 17);
    y += 5;
    label("생활", 20, 13);
    line(r.life, 56, 16, "life" + n, 17);
    y += 12;
  });
  y += 19;
  label("탐색 질문");
  y += 14;
  p.questions.forEach((q, n) => {
    label(`Q${n + 1}`, 20, 15);
    line(q, 56, 16, "q" + n, 17);
    y += 8;
  });
  y += 6;
  let hidden = new Set(p.erased || []);
  let svg = `<svg class="sheet" role="img" aria-label="${e(p.title)} 편집지" viewBox="0 0 362 ${y}" xmlns="http://www.w3.org/2000/svg"><g class="written">${contents}</g><g class="hand">${(p.strokes || []).map(strokeMarkup).join("")}</g></svg>`;
  // IDs are generated locally; remove only the hidden stroke nodes after parsing.
  const t = document.createElement("template");
  t.innerHTML = svg;
  for (const node of t.content.querySelectorAll("[data-ink]"))
    if (hidden.has(node.dataset.ink)) node.remove();
  return t.innerHTML;
}
function strokeMarkup(s) {
  return `<g data-ink="${e(s.id)}" fill="${s.color}" stroke="${s.color}" stroke-linecap="round">${s.pts.map(([x, y, w], i, a) => (i ? `<path d="M${a[i - 1][0]} ${a[i - 1][1]}L${x} ${y}" stroke-width="${w}"/>` : `<circle cx="${x}" cy="${y}" r="${w / 2}"/>`)).join("")}</g>`;
}
function ratingRows(p, preview = false) {
  return assessments
    .map((s, i) => {
      const v = p.ratings?.[i];
      return `<div class="rating"><div><label for="r${i}">${s}</label><strong id="value${i}">${rangeLabel(i, v)}</strong></div>${preview ? `<meter min="0" max="100" value="${v ?? 0}"></meter>` : `<input id="r${i}" type="range" min="0" max="100" value="${v ?? 50}" aria-valuetext="${rangeLabel(i, v)}" class="${v == null ? "unrated" : ""}">`}<small>${[
        ["0", "100"],
        ["차가움", "뜨거움"],
        ["비어 있음", "가득 참"],
        ["0", "100"],
      ][i].join("</small><small>")}</small></div>`;
    })
    .join("");
}
export function openEditor({
  root,
  dialog,
  planner,
  i,
  onBack,
  save,
  open,
  notice,
}) {
  const p = planner.plans[i];
  p.strokes ??= [];
  p.erased ??= [];
  p.ratings ??= [null, null, null, null];
  const history = [];
  root.innerHTML = `<section class="editor wrap" style="--accent:${colors[i]}"><button class="textbtn" id="all">${icon("back")} 세 플랜 보기</button><div class="editor-head"><div><h1>${e(p.title)}</h1><p>${e(planner.name)} · ${names[i]}</p></div><button class="primary" id="png">${icon("save")} PNG로 저장</button></div><nav class="tabs" aria-label="플랜 선택">${names.map((s, n) => `<button data-plan="${n}" aria-current="${n === i ? "page" : "false"}">${s}</button>`).join("")}</nav><div class="desk"><div><div class="tools"><button id="pen" aria-pressed="false">${icon("pen")} 필기</button><button id="eraser" aria-pressed="false">${icon("erase")} 지우개</button><button id="undo" disabled>${icon("undo")} 되돌리기</button><label class="finger"><input type="checkbox" id="finger"> 손가락으로 그리기</label></div><div id="paper">${sheet(p, i)}</div></div><aside class="assessment"><h2>자기평가</h2><p>이 삶은 지금 나와 얼마나 맞나요?</p>${ratingRows(p)}</aside></div></section>`;
  const $ = (s) => root.querySelector(s);
  $("#all").onclick = onBack;
  root
    .querySelectorAll("[data-plan]")
    .forEach((b) => (b.onclick = () => open(+b.dataset.plan)));
  $("#paper").insertAdjacentHTML(
    "afterend",
    `<section class="sr-only"><h2>5년 타임라인</h2>${p.years.map((r, n) => `<h3>${n ? `${n}년 뒤` : "오늘"}</h3><dl><dt>일</dt><dd>${e(r.work)}</dd><dt>생활</dt><dd>${e(r.life)}</dd></dl>`).join("")}<h2>탐색 질문</h2><ol>${p.questions.map((q) => `<li>${e(q)}</li>`).join("")}</ol></section>`,
  );
  function rating(input, idx) {
    const v = input.valueAsNumber;
    p.ratings[idx] = v;
    input.classList.remove("unrated");
    $("#value" + idx).textContent = rangeLabel(idx, v);
    input.setAttribute("aria-valuetext", rangeLabel(idx, v));
    save();
  }
  root.querySelectorAll("input[type=range]").forEach((input, j) => {
    input.oninput = () => rating(input, j);
    input.onpointerup = () => {
      if (p.ratings[j] == null) rating(input, j);
    };
  });
  let mode = "",
    active = null,
    inputType = "",
    stroke,
    erased,
    backup;
  const svg = $(".sheet");
  const hand = svg.querySelector(".hand");
  function setMode(m) {
    mode = m;
    $("#pen").setAttribute("aria-pressed", String(m === "pen"));
    $("#eraser").setAttribute("aria-pressed", String(m === "eraser"));
    svg.classList.toggle("writing", !!m);
    svg.classList.toggle("touch-writing", !!m && $("#finger").checked);
  }
  $("#pen").onclick = () => setMode(mode === "pen" ? "" : "pen");
  $("#eraser").onclick = () => setMode(mode === "eraser" ? "" : "eraser");
  $("#finger").onchange = () => setMode(mode || "pen");
  function point(ev) {
    const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(
      svg.getScreenCTM().inverse(),
    );
    return [
      +pt.x.toFixed(1),
      +pt.y.toFixed(1),
      +(ev.pointerType === "pen" ? 1 + 3 * ev.pressure : 2.3).toFixed(2),
    ];
  }
  function move(ev) {
    if (active !== ev.pointerId) return;
    if (mode === "eraser") {
      const el = document
        .elementFromPoint(ev.clientX, ev.clientY)
        ?.closest("[data-ink]");
      if (el && svg.contains(el)) {
        erased.push(el.dataset.ink);
        el.style.display = "none";
      }
    } else {
      const pt = point(ev),
        prev = stroke.pts.at(-1);
      if (prev && Math.hypot(prev[0] - pt[0], prev[1] - pt[1]) < 1) return;
      stroke.pts.push(pt);
      const path = document.createElementNS(svg.namespaceURI, "path");
      path.setAttribute(
        "d",
        `M${(prev || pt).slice(0, 2).join(" ")}L${pt[0] + 0.01} ${pt[1]}`,
      );
      path.setAttribute("stroke-width", pt[2]);
      backup.append(path);
    }
  }
  svg.onpointerdown = (ev) => {
    if (ev.pointerType === "pen" && mode) {
      if (inputType === "touch" && active !== null)
        end({ pointerId: active }, true);
      $("#finger").checked = false;
      setMode(mode);
    }
    if (
      !mode ||
      active !== null ||
      ev.button !== 0 ||
      (ev.pointerType === "touch" && !$("#finger").checked)
    )
      return;
    ev.preventDefault();
    active = ev.pointerId;
    inputType = ev.pointerType;
    svg.setPointerCapture(active);
    erased = [];
    if (mode === "pen") {
      stroke = { id: "u" + crypto.randomUUID(), color: colors[i], pts: [] };
      hand.insertAdjacentHTML("beforeend", strokeMarkup(stroke));
      backup = hand.lastElementChild;
    }
    move(ev);
  };
  svg.onpointermove = move;
  function end(ev, cancel) {
    if (ev.pointerId !== active) return;
    active = null;
    if (mode === "pen") {
      if (cancel) {
        backup.remove();
        return;
      }
      p.strokes.push(stroke);
      history.push({ draw: stroke.id });
    } else if (erased.length) {
      if (cancel) {
        erased.forEach(
          (id) => (svg.querySelector(`[data-ink="${id}"]`).style.display = ""),
        );
        return;
      }
      p.erased.push(...erased);
      history.push({ erased });
    }
    $("#undo").disabled = !history.length;
    save();
  }
  svg.onpointerup = (ev) => end(ev, false);
  svg.onpointercancel = (ev) => end(ev, true);
  $("#undo").onclick = () => {
    const h = history.pop();
    if (h.draw) {
      p.strokes = p.strokes.filter((s) => s.id !== h.draw);
      svg.querySelector(`[data-ink="${h.draw}"]`)?.remove();
    } else {
      p.erased = p.erased.filter((id) => !h.erased.includes(id));
      h.erased.forEach(
        (id) => (svg.querySelector(`[data-ink="${id}"]`).style.display = ""),
      );
    }
    $("#undo").disabled = !history.length;
    save();
  };
  $("#png").onclick = () => {
    dialog.innerHTML = `<div class="modal preview"><div class="modal-heading"><h2>PNG 미리보기</h2><button class="square" aria-label="닫기">${icon("close")}</button></div><div class="preview-scroll"><div class="preview-page" style="--accent:${colors[i]}">${sheet(p, i)}<h3>자기평가</h3>${ratingRows(p, true)}</div></div><button class="primary wide" id="download">${icon("save")} PNG 다운로드</button></div>`;
    dialog.querySelector(".square").onclick = () => dialog.close();
    dialog.querySelector("#download").onclick = (ev) => {
      const b = ev.currentTarget;
      b.disabled = true;
      b.textContent = "PNG 만드는 중…";
      setTimeout(() => {
        if (!dialog.open || !b.isConnected) return;
        dialog.close();
        notice("플랜을 PNG로 저장했어요.");
      }, 650);
    };
    dialog.showModal();
  };
}
