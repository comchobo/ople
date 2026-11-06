/* OPLE: open index.html directly. No build, server, microphone or AI API required. */
'use strict';
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy = value => JSON.parse(JSON.stringify(value));
  const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const CATEGORIES = ['일','여가','관계','건강','배움','삶'];
  const RATINGS = ['자원','매력','자신감','가치 일치도'];
  const RATING_HELP = ['시간·돈·도움을 얼마나 확보할 수 있나요?','이 삶에 얼마나 마음이 끌리나요?','이 삶을 시도할 수 있다고 믿나요?','내가 중요하게 여기는 것과 맞나요?'];
  const LABELS = ['현재 경로를 이어가는 삶','현재 일이 사라졌을 때의 삶','생계 걱정이 없는 삶'];
  // Demo content is independent from rendering and from the two agent adapters.
  const DEMO_QUESTIONS = [
    ['최근 일상생활에서 가장 나답다고 느끼는 순간은 언제인가요?', ['사람들의 이야기를 듣고 아이디어로 정리할 때요.','혼자 산책하며 새로운 것을 발견할 때요.']],
    ['지금 하고 있는 일에서 계속 가져가고 싶은 것은 무엇인가요?', ['사람을 이해하고 문제를 풀어가는 과정이 좋아요.','동료들과 함께 하나의 결과를 만드는 일이 좋아요.']],
    ['조금 덜어내고 싶은 일상의 모습도 있나요?', ['성과에 쫓기기보다 제 속도로 일하고 싶어요.','일과 쉼의 경계를 더 분명하게 만들고 싶어요.']],
    ['시간 가는 줄 모르고 몰입했던 경험을 들려주세요.', ['작은 모임을 기획하고 사람들을 초대했어요.','새로운 주제를 배우고 기록을 남겼어요.']],
    ['지금의 일을 할 수 없게 된다면 무엇을 해보고 싶나요?', ['배움을 나누는 작은 커뮤니티를 만들고 싶어요.','손으로 무언가를 만드는 일을 배우고 싶어요.']],
    ['생계 걱정이 없다면 하루를 어떻게 보내고 싶나요?', ['책과 식물이 있는 공간에서 사람들을 만나고 싶어요.','여행하고 글을 쓰며 느긋하게 지내고 싶어요.']],
    ['앞으로의 삶에서 꼭 지키고 싶은 가치는 무엇인가요?', ['자율성과 사람들과의 연결을 지키고 싶어요.','건강하고 꾸준히 성장하는 삶을 원해요.']],
    ['새로운 시도를 위해 지금 활용할 수 있는 자원이 있나요?', ['주말 시간과 함께 고민해 줄 친구들이 있어요.','지금까지 쌓은 경험과 조금의 저축이 있어요.']],
    ['5년 뒤 평범한 하루는 어떤 모습이면 좋을까요?', ['좋아하는 일을 하고 저녁에는 소중한 사람들과 쉬어요.','작은 공간을 운영하며 저만의 리듬으로 살아요.']],
    ['이번 주에 부담 없이 시작할 수 있는 작은 시도는 무엇인가요?', ['관심 있는 일을 하는 사람에게 이야기를 청해볼래요.','한 시간 동안 미래의 하루를 적어볼래요.']]
  ];
  const DEMO_PLANS = [
    {title:'사람을 이해하는\n브랜드 기획자', summary:'지금의 마케팅 경험에 리서치를 더해, 사람들의 선택을 돕는 브랜드를 만들어봐요. 일 밖의 작은 즐거움도 놓치지 않으면서요.', firstAction:'이번 주, 동료 한 명에게 최근 기억에 남은 고객 이야기를 물어보고 세 줄로 기록해보세요.', years:[['경청과 마주침','고객 인터뷰 3건 해보기','주말마다 작은 산 오르기'],['나만의 시선','작은 브랜드 프로젝트 이끌기','월 1회 친구들과 저녁'],['경험을 연결하기','리서치 포트폴리오 만들기','꾸준히 달리는 습관 들이기'],['영향력을 넓히기','후배와 기획 경험 나누기','분기마다 짧은 여행'],['나의 속도로','사람 중심의 브랜드 팀 만들기','일과 쉼의 리듬 지키기']]},
    {title:'함께 배우는\n커뮤니티 메이커', summary:'지금의 일이 사라져도 사람을 연결하는 감각은 남아 있어요. 서로의 경험을 나누고 배우는 작은 모임에서 새로운 일을 시작해봐요.', firstAction:'친구 두 명에게 요즘 배우고 싶은 것을 물어보고, 한 시간짜리 작은 모임을 제안해보세요.', years:[['작은 모임의 시작','관심사 모임 한 번 열기','매주 새로운 책 읽기'],['함께 만드는 배움','월간 워크숍 기획하기','산책 모임에 참여하기'],['지속 가능한 실험','유료 프로그램 작게 시험하기','동료 운영자 만나기'],['연결의 확장','지역 공간과 협업하기','쉬는 날 온전히 비우기'],['우리만의 커뮤니티','함께 운영할 팀 만들기','매년 새로운 배움 시작하기']]},
    {title:'책과 초록 사이,\n작은 공간의 주인', summary:'생계를 잠시 내려놓는다면, 책과 식물로 채운 공간을 상상해봐요. 좋아하는 것을 돌보고, 찾아오는 사람들과 느린 시간을 나누는 삶이에요.', firstAction:'좋아하는 동네 책방에 들러 공간에서 마음에 드는 점 세 가지를 적어보세요.', years:[['좋아하는 것 수집','동네 책방 10곳 방문하기','식물 한 그루 돌보기'],['공간을 상상하기','나의 작은 책방 지도 그리기','계절마다 여행 기록하기'],['작게 열어보기','주말 팝업 책방 열기','친구들과 독서 모임'],['머무는 곳 만들기','책과 식물이 있는 공간 열기','매일 아침 가볍게 걷기'],['느리게 깊어지기','동네와 함께 전시 열기','충분히 쉬는 한 달 보내기']]}
  ];
  /** Integration contracts. Replace either method on window.OPLEAgents.
   * interviewAgent.next({messages: Array<{role:'assistant'|'user',content:string}>})
   *   -> Promise<{question:string|null, options:string[], done:boolean}>
   * planAgent.generate({messages}) -> Promise<{id:string,createdAt:string,demo:boolean,plans:Plan[]}>
   * Plan: {id,title,summary,firstAction,ratings:(number|null)[4],years:Year[5]}
   * Year: {label,height,notes:[{id,text,category,x,y}],strokes:[{points:[[x,y],...]}]}
   * Canvas x coordinates use a 300-unit width; y is in local CSS pixels.
   * UI enforces a maximum of 10 answers. No credentials belong in this file.
   */
  const interviewAgent = {async next({messages}) {
    await sleep(500);
    const index = messages.filter(m => m.role === 'user').length;
    return index >= 10 ? {question:null,options:[],done:true} : {question:DEMO_QUESTIONS[index][0],options:DEMO_QUESTIONS[index][1],done:false};
  }};
  const planAgent = {async generate({messages}) {
    await sleep(1100);
    return {id:uid(),createdAt:new Date().toISOString(),demo:true,plans:DEMO_PLANS.map(p => ({id:uid(),title:p.title,summary:p.summary,firstAction:p.firstAction,ratings:[null,null,null,null],years:p.years.map((y,j) => ({label:y[0],height:340,strokes:[],notes:[{id:uid(),text:y[1],category:'일',x:8,y:15},{id:uid(),text:y[2],category:['여가','관계','건강','배움','삶'][j],x:125,y:160}]}))}))};
  }};
  window.OPLEAgents = {interviewAgent,planAgent};

  const fresh = () => ({version:1,interview:null,bundles:[],draft:null});
  let state = fresh(), view = 'home', bundleId = null, planIndex = 0, phase = 'listening', busy = false;
  let undo = [], redo = [], tool = 'explore', selected = null, generationError = false;
  let db = null, storageFailed = false, writeQueue = Promise.resolve(), toastTimer;
  const app = $('#app'), modal = $('#modal');
  const bundle = () => state.bundles.find(b => b.id === bundleId);
  const plan = () => bundle()?.plans[planIndex];
  const draft = () => state.draft?.plan;
  const date = iso => new Date(iso).toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});
  async function database() {
    if (db) return db;
    db = await new Promise((resolve,reject) => {
      const request = indexedDB.open('ople-mobile-prototype-v1',1);
      request.onupgradeneeded = () => request.result.createObjectStore('workspace');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database blocked'));
    });
    db.onversionchange = () => {db.close();db = null;};
    return db;
  }
  function storageBanner(failed) {storageFailed = failed;$('#storage-error').hidden = !failed;}
  function persist() {
    const snapshot = copy(state);
    const task = writeQueue.then(async () => {
      try {
        const handle = await database();
        await new Promise((resolve,reject) => {
          const tx = handle.transaction('workspace','readwrite');
          tx.objectStore('workspace').put(snapshot,'state');
          tx.oncomplete = resolve;tx.onerror = () => reject(tx.error);tx.onabort = () => reject(tx.error);
        });
        storageBanner(false);return true;
      } catch(error) {storageBanner(true);return false;}
    });
    writeQueue = task.catch(() => false);
    return task;
  }
  async function load() {
    try {
      const handle = await database();
      const saved = await new Promise((resolve,reject) => {const request=handle.transaction('workspace').objectStore('workspace').get('state');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
      if(saved?.version === 1) state = saved;
    } catch(error) {storageBanner(true);}
    render();
  }
  function toast(message) {clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
  function nav(next) {view=next;selected=null;render();window.scrollTo({top:0});app.focus({preventScroll:true});}
  function btn(action,label,cls='',attrs='') {return `<button type="button" data-action="${action}" class="${cls}" ${attrs}>${label}</button>`;}
  function header(title,back='home',right='') {$('#header').className=title?'inner':'';$('#header').innerHTML=title?`<div class="header-left">${btn(back,'←','icon','aria-label="뒤로가기"')}<span class="header-title">${title}</span></div>${right}`:`<div class="logo">OPLE<span>오플</span></div><span class="badge demo">PROTOTYPE</span>`;}
  function routeArt(){return `<svg class="route-art" viewBox="0 0 330 205" fill="none" aria-hidden="true"><path d="M162 188C155 147 175 135 160 113" stroke="#202020" stroke-width="2.4" stroke-linecap="round"/><path d="M160 115C129 99 78 125 62 62L57 38M47 49L57 36L67 48" stroke="#2455D6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M161 114C176 84 147 70 169 25M157 31L170 22L177 37" stroke="#C9362B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M163 115C198 139 277 101 271 55M261 66L271 52L282 63" stroke="#CFAC22" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="162" cy="187" r="6" fill="#202020"/><text x="25" y="28" fill="#2455D6" font-size="21" font-family="Ownglyph,sans-serif">이어가도</text><text x="130" y="17" fill="#C9362B" font-size="21" font-family="Ownglyph,sans-serif">달라져도</text><text x="241" y="40" fill="#94700D" font-size="21" font-family="Ownglyph,sans-serif">자유롭게</text><path d="M217 151l4 8 9 1-7 6 2 9-8-4-8 4 2-9-6-6 9-1z" stroke="#C9362B" stroke-width="1.4"/><text x="84" y="184" fill="#706c61" font-size="17" font-family="Ownglyph,sans-serif">지금의 나</text></svg>`;}
  function home(){header();return `<section class="home"><p class="eyebrow">A little room for possibility</p><h1>앞으로의 5년,<br>나에게 가능한<br><span class="underline">세 가지 삶.</span></h1><p class="home-lead">정답을 찾기보다, 가능성을 펼쳐봐요.<br>나의 이야기에서 시작하는 미래 탐색.</p>${routeArt()}<div class="path-list">${LABELS.map((l,i)=>`<div class="path-row future-${i+1}"><span class="number">${i+1}</span>${l}</div>`).join('')}</div><div class="stack">${state.interview?btn('resume','이어서 이야기하기 ↗','primary wide')+btn('new','새 인터뷰 시작','wide'):btn('new','내 미래 탐색하기 ↗','primary wide')}${btn('archive','내 플랜','link wide')}</div>${state.draft?`<div class="note-box spaced"><p>아직 저장하지 않은 워크시트가 있어요.</p>${btn('recover','편집 이어가기','wide')}</div>`:''}${state.bundles.length?`<section class="home-latest"><p class="caption">최근 그려본 미래 · ${date(state.bundles[0].createdAt)}</p>${btn('latest',`${esc(state.bundles[0].plans[0].title.replace('\n',' '))} 외 두 가지 →`,'wide')}</section>`:''}<p class="caption footnote">하나를 고르지 않아도 괜찮아요.</p></section>`;}
  function intro(){header('시작하기');return `<p class="eyebrow">Before we begin</p><h1>잠깐 멈추고,<br>내 이야기를 들어봐요.</h1><p class="muted">작은 대화가 세 가지 미래의<br>첫 페이지가 될 거예요.</p><ol class="intro-list"><li><span class="number">1</span><div><b>한 번에 하나의 질문</b><span class="muted">최대 10개의 질문을 따라가요.<br>중간에 마무리해도 괜찮아요.</span></div></li><li><span class="number">2</span><div><b>이번에는 예시로 체험해요</b><span class="muted">예시 답변을 선택하면 대화가 이어져요. 마이크는 사용하지 않아요.</span></div></li><li><span class="number">3</span><div><b>나만의 속도로 이어가기</b><span class="muted">진행 내용은 이 브라우저에 저장돼요.</span></div></li></ol><div class="stack">${btn('start','이야기 시작하기','primary wide')}${btn('generate','예시 플랜 바로 보기','link wide')}</div>`;}
  function interview(){header('나의 이야기','exit','<span class="badge demo">예시 대화</span>');const s=state.interview;const count=s.messages.filter(m=>m.role==='user').length;
    if(count>=10||s.done)return `<p class="eyebrow">A new beginning</p><h1>이야기를<br>차곡차곡 모았어요.</h1><p class="muted">${count}개의 답변을 남겼어요.<br>이제 세 가지 예시 미래를 만나볼까요?</p>${routeArt()}${btn('generate','예시 플랜 보기','primary wide')}`;
    return `<div class="row"><span class="caption">질문 ${count+1} / 최대 10개</span><span class="caption">나의 속도로, 천천히</span></div><h1 class="interview-question">${esc(s.question)}</h1><div class="voice-orb"><div class="wave" aria-hidden="true">${'<i></i>'.repeat(7)}</div></div><p class="voice-label" role="status">${phase==='processing'?'답변을 정리하고 있어요':phase==='speaking'?'오플이 질문을 전하고 있어요':'이야기를 듣고 있어요'}</p><p class="caption center">음성을 사용하지 않는 시연 화면이에요.</p>${phase==='processing'?`<div class="transcript spaced">${esc(s.messages.at(-1)?.content)}</div>`:`<section class="spaced"><p class="caption">내 마음에 가까운 예시 답변을 골라보세요.</p><div class="stack">${(s.options||[]).map((a,i)=>btn('answer',esc(a),'answer-option',`data-index="${i}" ${busy?'disabled':''}`)).join('')}</div></section>`}${count>=3?`<div class="note-box spaced"><p>여기서 미래를 살펴봐도 좋아요.<br>원하면 위 질문에 계속 답해주세요.</p>${btn('generate','이만 마무리하고 플랜 보기','wide',busy?'disabled':'')}</div>`:''}<div class="page-end">${btn('generate',count?'지금까지 이야기로 예시 플랜 보기':'예시 플랜 바로 보기','link wide',busy?'disabled':'')}</div>`;
  }
  function generating(){header('미래 펼쳐보기','home');return `<section class="generating">${generationError?'<div class="empty-art">…</div><h1>잠시 멈췄어요.</h1><p>예시 플랜을 불러오지 못했어요.<br>대화 내용은 그대로 남아 있어요.</p>'+btn('generate','다시 시도','primary wide'):'<span class="hand accent" style="font-size:28px">세 갈래의 가능성</span><div class="spinner"></div><h1>미래의 페이지를<br>펼치고 있어요.</h1><p class="muted">서로 다른 세 가지 삶을<br>천천히 만나보세요.</p><p class="caption">체험용 예시 플랜을 준비하고 있어요.</p>'}</section>`;}
  function miniRatings(p){return `<div class="mini-ratings">${RATINGS.map((r,i)=>`<div>${r}<b>${p.ratings[i]===null?'미평가':p.ratings[i]}</b></div>`).join('')}</div>`;}
  function comparison(){header('세 가지 미래','home',btn('archive','내 플랜','link'));return `<p class="eyebrow">Three possible lives</p><h1>모두 나일 수 있는,<br>세 가지 미래.</h1><p class="muted">어떤 삶이 마음에 닿나요?<br>하나씩 펼쳐보고 나의 생각을 더해봐요.</p><span class="badge demo">예시 플랜</span><p class="caption spaced">답변으로 생성한 결과가 아닌, 체험용 예시예요.</p>${bundle().plans.map((p,i)=>`<article class="plan-card future-${i+1}"><div class="row"><span class="number">${i+1}</span><span class="caption">${LABELS[i]}</span></div><h2 class="plan-name hand">${esc(p.title).replace('\n','<br>')}</h2><p class="description">${esc(p.summary)}</p>${miniRatings(p)}${btn('detail','이 미래 펼쳐보기 ↗','plan-open wide',`data-index="${i}"`)}</article>`).join('')}<p class="hand center" style="font-size:23px">마음은 언제든 달라져도 괜찮아요.</p>`;}
  function worksheet(p,editable){return `<div class="worksheet">${p.years.map((year,i)=>`<section class="year"><div class="year-header"><h3>${i+1}년차</h3><span>${esc(year.label)}</span></div><div class="board ${editable&&tool==='draw'?'drawing':''} ${editable&&tool!=='draw'?'draggable':''}" data-year="${i}" style="height:${year.height}px"><svg viewBox="0 0 300 ${year.height}" preserveAspectRatio="none" aria-label="${i+1}년차 손그림">${year.strokes.map(s=>`<polyline points="${s.points.map(pt=>pt.join(',')).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>${year.notes.map(n=>`<${editable?'button':'div'} ${editable?'type="button"':''} class="memo" data-note="${n.id}" data-year="${i}" data-category="${esc(n.category)}" style="left:${n.x/3}%;top:${n.y}px"><span class="category">${esc(n.category)}</span>${esc(n.text)}</${editable?'button':'div'}>`).join('')}</div>${editable?`<div class="year-actions">${btn('add-note','＋ 메모 추가','',`data-year="${i}"`)}${btn('extend','공간 늘리기 ↓','',`data-year="${i}"`)}</div>`:''}</section>`).join('')}</div>`;}
  function ratings(p){return `<section class="spaced"><h2>이 미래, 나와 얼마나 맞나요?</h2><p class="muted">정답 없는 나만의 감각이에요.<br>원하는 항목만 남겨도 괜찮아요.</p><p class="caption">변경하면 자동으로 저장돼요. 0점도 유효한 평가예요.</p>${RATINGS.map((name,i)=>`<div class="rating"><div class="row"><label for="rating-${i}">${name}</label><output id="rating-value-${i}">${p.ratings[i]===null?'미평가':p.ratings[i]+'점'}</output></div><p class="rating-help">${RATING_HELP[i]}</p><input id="rating-${i}" type="range" min="0" max="100" value="${p.ratings[i]??0}" data-rating="${i}" aria-valuetext="${p.ratings[i]===null?'미평가':p.ratings[i]+'점'}"><div class="row"><span class="caption">0 — 100</span><div class="rating-buttons"><input type="number" min="0" max="100" value="${p.ratings[i]??''}" placeholder="—" data-score="${i}" aria-label="${name} 점수 직접 입력">${btn('clear-rating','평가 지우기','clear-rating',`data-index="${i}"`)}</div></div></div>`).join('')}</section>`;}
  function detail(){header('미래 펼쳐보기','compare',btn('edit','플랜 수정','link'));const p=plan();return `<section class="future-${planIndex+1}"><div class="row"><span class="number">${planIndex+1}</span><span class="caption">${LABELS[planIndex]}</span></div><h1 class="detail-title hand">${esc(p.title).replace('\n','<br>')}</h1><p class="muted">${esc(p.summary)}</p><span class="badge demo">예시 플랜 · 자유롭게 바꿔보세요</span><h2 class="section-heading">나의 5년 워크시트</h2>${worksheet(p,false)}<div class="first-action"><h2 class="hand">작게 시도할 첫 행동 ↗</h2><p>${esc(p.firstAction)}</p></div>${ratings(p)}<div class="stack spaced">${btn('edit','이 미래에 내 생각 더하기','primary wide')}${btn('compare','세 미래 함께 보기','link wide')}</div></section>`;}
  function editor(){header('플랜 수정','leave-editor',`<span class="badge">미래 ${planIndex+1}</span>`);const p=draft();return `<section class="future-${planIndex+1}"><div class="note-box"><p>저장을 눌러야 플랜에 반영돼요.</p><span class="caption">편집 중인 내용은 임시 보관해요.</span></div><div class="editor-fields"><label>미래 플랜 제목<input id="edit-title" maxlength="80" value="${esc(p.title.replace('\n',' '))}" required></label><label>삶의 모습 요약<textarea id="edit-summary" maxlength="600">${esc(p.summary)}</textarea></label></div><div class="toolbar"><div class="tools">${[['explore','✥','탐색'],['note','＋','메모'],['draw','〰','그리기']].map(([t,icon,label])=>btn('tool',`<span aria-hidden="true">${icon}</span>${label}`,tool===t?'active':'',`data-tool="${t}" aria-pressed="${tool===t}"`)).join('')}</div><div class="tool-sub"><p>${tool==='draw'?'종이 위를 드래그해 그려보세요.':tool==='note'?'연차의 빈 곳을 눌러 메모를 더해요.':'메모는 끌어서 이동, 가볍게 눌러 수정해요.'}</p>${btn('undo','↶','',`aria-label="실행 취소" ${undo.length?'':'disabled'}`)}${btn('redo','↷','',`aria-label="다시 실행" ${redo.length?'':'disabled'}`)}</div></div><h2>나의 5년 자유 워크시트</h2>${worksheet(p,true)}<label class="spaced">작게 시도할 첫 행동<textarea id="edit-action" maxlength="400">${esc(p.firstAction)}</textarea></label><div class="edit-footer">${btn('leave-editor','취소')}${btn('save-edit','플랜 저장','primary',busy?'disabled':'')}</div></section>`;}
  function archive(){header('내 플랜');return `<p class="eyebrow">My possibilities</p><h1>차곡차곡 모아둔<br>나의 가능성.</h1><p class="muted">그때의 나를 다시 만나보세요.</p>${state.bundles.length?state.bundles.map((b,i)=>`<button type="button" class="archive-item" data-action="open-bundle" data-id="${b.id}"><span class="caption">${date(b.createdAt)} · 예시 플랜</span><div class="archive-title">${state.bundles.length-i}번째 미래 탐색 ↗</div>${b.plans.map((p,j)=>`<div class="mini-title future-${j+1}"><span class="number">${j+1}</span>${esc(p.title.replace('\n',' '))}</div>`).join('')}</button>`).join(''):`<section class="empty"><div class="empty-art">⌁</div><h2>아직 그려본 미래가 없어요.</h2><p class="muted">작은 이야기부터 시작해볼까요?</p></section>`}<div class="stack spaced">${btn('new',state.bundles.length?'새 인터뷰 시작':'내 미래 탐색하기','primary wide')}${btn('generate','예시 플랜 바로 보기','link wide')}</div><div class="page-end"><p class="caption">플랜은 이 기기의 브라우저에 저장돼요. 브라우저 데이터를 삭제하면 사라질 수 있어요.</p>${btn('reset','데모 데이터 초기화','link danger wide')}</div>`;}
  function render(){
    if(['compare','detail'].includes(view)&&!bundle())view='home';
    if(view==='edit'&&!draft())view='home';
    if(view==='interview'&&!state.interview)view='home';
    app.setAttribute('aria-busy',String(busy));
    app.innerHTML=({home,intro,interview,generating,compare:comparison,detail,edit:editor,archive}[view]||home)();
    fitBoards();
  }
  // Long user notes must remain inside their year, including at narrow widths.
  function fitBoards(){
    if(!['edit','detail'].includes(view))return;
    let grew=false;
    document.querySelectorAll('.board').forEach(board=>{
      const notes=[...board.querySelectorAll('.memo')];
      const height=Math.max(parseFloat(board.style.height),...notes.map(n=>n.offsetTop+n.offsetHeight+20));
      board.style.height=height+'px';
      $('svg',board).setAttribute('viewBox',`0 0 300 ${height}`);
      if(view==='edit'){const year=draft().years[Number(board.dataset.year)];if(height>year.height){year.height=height;grew=true;}}
    });
    if(grew)persist();
  }
  function confirmDialog(title,message,yes,onYes){
    modal.innerHTML=`<h2 id="modal-title">${title}</h2><p class="muted">${message}</p><div class="dialog-actions">${btn('modal-close','계속 머무르기')}${btn('modal-confirm',yes,'primary')}</div>`;
    modal.showModal();$('[data-action="modal-confirm"]',modal).onclick=()=>{modal.close();onYes();};
  }
  function newInterview(){
    if(state.interview)confirmDialog('새로 이야기할까요?','진행 중인 인터뷰는 지워져요. 저장한 플랜은 그대로 남아요.','새로 시작',()=>{state.interview=null;persist();nav('intro');});
    else nav('intro');
  }
  async function start(){
    if(busy)return;busy=true;app.setAttribute('aria-busy','true');
    try{const result=await window.OPLEAgents.interviewAgent.next({messages:[]});state.interview={id:uid(),messages:[],...result};await persist();phase='listening';nav('interview');}
    catch{toast('질문을 불러오지 못했어요. 다시 시작해주세요.');}
    finally{busy=false;render();}
  }
  async function answer(index){
    if(busy||!state.interview)return;
    const s=state.interview,a=s.options[index];if(!a)return;
    busy=true;phase='processing';s.messages.push({role:'assistant',content:s.question},{role:'user',content:a});s.pending=true;render();await persist();
    try{
      const result=s.messages.filter(m=>m.role==='user').length>=10?{done:true,question:null,options:[]}:await window.OPLEAgents.interviewAgent.next({messages:copy(s.messages)});
      Object.assign(s,result,{pending:false});await persist();phase='speaking';render();await sleep(400);
    }catch{s.pending=true;toast('다음 질문을 준비하지 못했어요. 이어서 다시 시도해주세요.');nav('home');}
    finally{busy=false;phase='listening';render();}
  }
  async function resume(){
    if(busy)return;busy=true;app.setAttribute('aria-busy','true');
    try{if(state.interview.pending){Object.assign(state.interview,await window.OPLEAgents.interviewAgent.next({messages:copy(state.interview.messages)}),{pending:false});await persist();}nav('interview');}
    catch{toast('질문을 불러오지 못했어요. 다시 시도해주세요.');}
    finally{busy=false;render();}
  }
  async function generate(){
    if(busy)return;busy=true;generationError=false;nav('generating');
    try{
      const result=await window.OPLEAgents.planAgent.generate({messages:copy(state.interview?.messages||[])});
      if(!Array.isArray(result.plans)||result.plans.length!==3)throw new Error('Expected three plans');
      state.bundles.unshift(result);state.interview=null;bundleId=result.id;await persist();nav('compare');
    }catch{generationError=true;}
    finally{busy=false;render();}
  }
  function beginEdit(){
    if(state.draft){
      if(state.draft.bundleId===bundleId&&state.draft.planIndex===planIndex){recover();return;}
      confirmDialog('다른 편집 초안이 있어요','기존 임시 편집을 버리고 이 미래를 수정할까요? 저장한 원본은 유지돼요.','새 편집 시작',()=>{state.draft=null;beginEdit();});return;
    }
    state.draft={bundleId,planIndex,plan:copy(plan())};undo=[];redo=[];tool='explore';persist();nav('edit');
  }
  function recover(){bundleId=state.draft.bundleId;planIndex=state.draft.planIndex;undo=[];redo=[];tool='explore';nav('edit');}
  function checkpoint(){undo.push(copy(draft()));if(undo.length>60)undo.shift();redo=[];}
  function changed(){persist();render();}
  function leaveEditor(){
    const discard=()=>{state.draft=null;undo=[];redo=[];persist();nav('detail');};
    if(JSON.stringify(draft())!==JSON.stringify(plan()))confirmDialog('수정한 내용을 버릴까요?','저장하지 않은 변경은 사라져요. 기존 플랜은 그대로 남아요.','변경 버리기',discard);
    else discard();
  }
  async function saveEdit(){
    if(busy)return;if(!draft().title.trim()){toast('플랜 제목을 적어주세요.');$('#edit-title').focus();return;}
    busy=true;app.setAttribute('aria-busy','true');const old=copy(plan()),backup=copy(state.draft);
    bundle().plans[planIndex]=copy(draft());state.draft=null;
    const success=await persist();
    if(success){busy=false;undo=[];redo=[];nav('detail');toast('나의 미래를 저장했어요.');}
    else{bundle().plans[planIndex]=old;state.draft=backup;busy=false;render();toast('초안을 유지했어요. 플랜 저장을 다시 눌러주세요.');}
  }
  function noteDialog(yearIndex,noteId=null,position=null){
    const y=draft().years[yearIndex],note=y.notes.find(n=>n.id===noteId);
    modal.innerHTML=`<h2 id="modal-title">${note?'메모 수정':'작은 생각 더하기'}</h2><p class="caption">${yearIndex+1}년차 · 나의 워크시트</p><form id="note-form"><label>메모<textarea name="text" maxlength="160" required placeholder="어떤 경험을 해보고 싶나요?">${esc(note?.text||'')}</textarea></label><label>분류<select name="category">${CATEGORIES.map(c=>`<option ${note?.category===c?'selected':''}>${c}</option>`).join('')}</select></label><div class="dialog-actions">${note?btn('delete-dialog-note','삭제','danger'):''}${btn('modal-close','취소')}<button type="submit" class="primary">${note?'수정 완료':'메모 추가'}</button></div></form>`;
    modal.showModal();
    $('#note-form').onsubmit=e=>{
      e.preventDefault();const form=new FormData(e.target),text=form.get('text').trim();
      if(!text){$('textarea',modal).setCustomValidity('내용을 적어주세요.');$('textarea',modal).reportValidity();return;}
      checkpoint();
      // Notes render in array order: the last edited note is painted on top.
      // Keeping the order in the draft also preserves it across undo and reload.
      if(note){note.text=text;note.category=form.get('category');y.notes=y.notes.filter(n=>n.id!==note.id);y.notes.push(note);selected=null;}
      else{const top=position?.y??Math.max(15,...y.notes.map(n=>n.y+180));y.height=Math.max(y.height,top+200);const n={id:uid(),text,category:form.get('category'),x:Math.min(130,Math.max(0,position?.x??12)),y:top};y.notes.push(n);selected={year:yearIndex,id:n.id};}
      modal.close();changed();
    };
    const remove=$('[data-action="delete-dialog-note"]',modal);
    if(remove)remove.onclick=()=>{checkpoint();y.notes=y.notes.filter(n=>n.id!==noteId);selected=null;modal.close();changed();toast('메모를 지웠어요. 실행 취소로 되돌릴 수 있어요.');};
    $('textarea',modal).oninput=e=>e.target.setCustomValidity('');
  }
  const actions={
    home:()=>nav('home'),new:newInterview,start,resume,archive:()=>nav('archive'),generate,compare:()=>nav('compare'),
    detail:el=>{planIndex=Number(el.dataset.index);nav('detail');},latest:()=>{bundleId=state.bundles[0].id;nav('compare');},
    'open-bundle':el=>{bundleId=el.dataset.id;nav('compare');},answer:el=>answer(Number(el.dataset.index)),
    exit:()=>confirmDialog('잠시 쉬어갈까요?','완료한 답변은 저장돼요. 나중에 이어서 이야기할 수 있어요.','저장하고 나가기',()=>nav('home')),
    edit:beginEdit,recover,'leave-editor':leaveEditor,'save-edit':saveEdit,'modal-close':()=>modal.close(),
    tool:el=>{tool=el.dataset.tool;selected=null;render();},'add-note':el=>noteDialog(Number(el.dataset.year)),
    extend:el=>{checkpoint();draft().years[Number(el.dataset.year)].height+=180;changed();},
    undo:()=>{if(!undo.length)return;redo.push(copy(draft()));state.draft.plan=undo.pop();selected=null;changed();},
    redo:()=>{if(!redo.length)return;undo.push(copy(draft()));state.draft.plan=redo.pop();selected=null;changed();},
    'clear-rating':el=>{plan().ratings[Number(el.dataset.index)]=null;persist();render();},
    reset:()=>confirmDialog('처음부터 다시 볼까요?','이 프로토타입의 인터뷰, 플랜, 편집 초안을 모두 지워요. 이전 버전의 데이터는 건드리지 않아요.','초기화',async()=>{state=fresh();await persist();nav('home');toast('데모를 초기화했어요.');})
  };
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-action]');
    if(action){if(action.disabled||busy&&action.dataset.action!=='modal-close')return;actions[action.dataset.action]?.(action);return;}
    if(view==='edit'){
      const note=event.target.closest('[data-note]');
      if(note&&tool!=='draw'){if(dragMoved){dragMoved=false;return;}noteDialog(Number(note.dataset.year),note.dataset.note);}
      else if(tool==='note'){const board=event.target.closest('.board');if(board){const rect=board.getBoundingClientRect();noteDialog(Number(board.dataset.year),null,{x:(event.clientX-rect.left)/rect.width*300,y:Math.max(0,event.clientY-rect.top)});}}
    }
  });
  $('#retry-storage').onclick=async()=>{if(await persist())toast('브라우저에 저장했어요.');};
  app.addEventListener('input',event=>{
    const el=event.target;
    if(el.matches('[data-rating],[data-score]')){
      const i=Number(el.dataset.rating??el.dataset.score),value=el.value===''?null:Number(el.value);
      if(value!==null&&(!Number.isInteger(value)||value<0||value>100))return;
      plan().ratings[i]=value;$(`#rating-value-${i}`).textContent=value===null?'미평가':value+'점';$(`#rating-${i}`).value=value??0;
      $(`#rating-${i}`).setAttribute('aria-valuetext',value===null?'미평가':value+'점');$(`[data-score="${i}"]`).value=value??'';persist();
    }
    if(view==='edit'&&['edit-title','edit-summary','edit-action'].includes(el.id)){
      const key={'edit-title':'title','edit-summary':'summary','edit-action':'firstAction'}[el.id];
      if(!el.dataset.history){checkpoint();el.dataset.history='true';}
      draft()[key]=el.value;persist();
      const undoButton=$('[data-action="undo"]');if(undoButton)undoButton.disabled=false;
      const redoButton=$('[data-action="redo"]');if(redoButton)redoButton.disabled=true;
    }
  });
  app.addEventListener('focusout',event=>{
    if(event.target.dataset.history){delete event.target.dataset.history;persist();}
    if(event.target.matches('[data-score]')&&!event.target.validity.valid){event.target.value=plan().ratings[Number(event.target.dataset.score)]??'';toast('점수는 0부터 100까지 입력해주세요.');}
  });
  let gesture=null,dragMoved=false;
  function locateDrop(g){
    const boards=[...app.querySelectorAll('.board')];
    const board=boards.reduce((best,b)=>{
      const r=b.getBoundingClientRect(),distance=Math.max(r.top-g.clientY,0,g.clientY-r.bottom);
      return !best||distance<best.distance?{board:b,distance}:best;
    },null).board;
    const rect=board.getBoundingClientRect();
    return {year:Number(board.dataset.year),x:Math.max(0,Math.min(135,(g.clientX-rect.left-g.grabX)*300/rect.width)),y:Math.max(0,g.clientY-rect.top-g.grabY)};
  }
  function dragFrame(){
    const g=gesture;if(!g||g.type!=='move'||!g.committed)return;
    const top=document.querySelector('.toolbar').getBoundingClientRect().bottom+40;
    const bottom=innerHeight-100;
    if(g.clientY<top)window.scrollBy(0,-Math.min(14,(top-g.clientY)/5));
    else if(g.clientY>bottom)window.scrollBy(0,Math.min(14,(g.clientY-bottom)/5));
    g.el.style.left=(g.clientX-g.grabX)+'px';g.el.style.top=(g.clientY-g.grabY)+'px';
    app.querySelectorAll('.board.drop-target').forEach(b=>b.classList.remove('drop-target'));
    app.querySelector('.board[data-year="'+locateDrop(g).year+'"]').classList.add('drop-target');
    g.frame=requestAnimationFrame(dragFrame);
  }
  app.addEventListener('pointerdown',event=>{
    if(view!=='edit'||event.button!==0)return;const board=event.target.closest('.board');if(!board)return;
    const year=Number(board.dataset.year),rect=board.getBoundingClientRect();
    const point=[Math.max(0,Math.min(300,(event.clientX-rect.left)*300/rect.width)),Math.max(0,Math.min(rect.height,event.clientY-rect.top))];
    if(tool==='draw'){
      event.preventDefault();checkpoint();const stroke={points:[point,point]};draft().years[year].strokes.push(stroke);
      const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      for(const [k,v] of Object.entries({fill:'none',stroke:'var(--accent)','stroke-width':'2.5','stroke-linecap':'round','stroke-linejoin':'round',points:point.join(',')+' '+point.join(',')}))line.setAttribute(k,v);
      $('svg',board).append(line);gesture={type:'draw',year,stroke,line,rect,board,pointer:event.pointerId};board.setPointerCapture(event.pointerId);
    }else{
      const el=event.target.closest('[data-note]');if(!el)return;
      const n=draft().years[year].notes.find(n=>n.id===el.dataset.note),r=el.getBoundingClientRect();
      gesture={type:'move',year,n,el,rect,board,start:[event.clientX,event.clientY],clientX:event.clientX,clientY:event.clientY,grabX:event.clientX-r.left,grabY:event.clientY-r.top,width:r.width,pointer:event.pointerId,committed:false};
      el.setPointerCapture(event.pointerId);
    }
  });
  app.addEventListener('pointermove',event=>{
    if(!gesture||event.pointerId!==gesture.pointer)return;const g=gesture;
    if(g.type==='draw'){
      g.stroke.points.push([Math.max(0,Math.min(300,(event.clientX-g.rect.left)*300/g.rect.width)),Math.max(0,Math.min(g.rect.height,event.clientY-g.rect.top))]);
      g.line.setAttribute('points',g.stroke.points.map(p=>p.join(',')).join(' '));
    }else{
      g.clientX=event.clientX;g.clientY=event.clientY;
      if(!g.committed&&Math.hypot(g.clientX-g.start[0],g.clientY-g.start[1])>6){
        g.committed=true;g.el.classList.add('dragging');g.el.style.width=g.width+'px';g.el.style.position='fixed';dragFrame();
      }
    }
  });
  function finishGesture(event){
    if(!gesture||event.pointerId!==gesture.pointer)return;const g=gesture;
    if(g.type==='move'){
      cancelAnimationFrame(g.frame);
      if(g.committed&&event.type!=='pointercancel'){
        const target=locateDrop(g);checkpoint();
        draft().years[g.year].notes=draft().years[g.year].notes.filter(n=>n.id!==g.n.id);
        g.n.x=target.x;g.n.y=target.y;const year=draft().years[target.year];year.notes.push(g.n);year.height=Math.max(year.height,g.n.y+g.el.offsetHeight+20);
        persist();
      }
      dragMoved=g.committed;
      if(g.el.hasPointerCapture(event.pointerId))g.el.releasePointerCapture(event.pointerId);
      gesture=null;
      if(g.committed){setTimeout(render,0);setTimeout(()=>{dragMoved=false;},250);}
    }else{
      gesture=null;if(g.board.hasPointerCapture(event.pointerId))g.board.releasePointerCapture(event.pointerId);
      persist();setTimeout(render,0);
    }
  }
  app.addEventListener('pointerup',finishGesture);app.addEventListener('pointercancel',finishGesture);
  window.addEventListener('beforeunload',event=>{if(storageFailed){event.preventDefault();event.returnValue='';}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persist();});
  window.addEventListener('resize',fitBoards);
  document.fonts.ready.then(fitBoards);
  load();
})();
