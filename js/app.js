/*
 * engcon DC2 アラーム トラブルシューティング — 表示ロジック
 * ルーティングは URL ハッシュで行う:
 *   #home / #all / #cat/<カテゴリID> / #alarm/<Id> / #search/<キーワード>
 */
"use strict";

const $app = document.getElementById("app");
const $search = document.getElementById("search-input");

const ALARM_BY_ID = new Map(ALARMS.map((a) => [a.id, a]));
const CAT_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));
const MODULE_BY_ID = new Map(MODULE_PAGES.map((m) => [m.id, m]));

// モジュールページの全エントリを検索用にフラット化
const MODULE_INDEX = MODULE_PAGES.flatMap((page) =>
  page.groups.flatMap((g) =>
    g.entries.map((e) => ({ page, group: g.heading, entry: e }))
  )
);

/* ---------- ユーティリティ ---------- */

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

// 全角数字・全角英字を半角に直し、小文字化して検索用に正規化する
function normalize(s) {
  return String(s)
    .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toLowerCase()
    .trim();
}

function typeBadge(a) {
  return `<span class="badge type-${a.type}">${esc(TYPE_LABEL[a.type])}</span>`;
}
function audienceBadge(a) {
  return `<span class="badge aud-${a.audience}">${esc(AUDIENCE_LABEL[a.audience])}</span>`;
}

/* ---------- チェックリストの保存（localStorage） ---------- */

function loadChecks(id, len) {
  try {
    const raw = localStorage.getItem(`dc2check-${id}`);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.from({ length: len }, (_, i) => !!arr[i]);
  } catch {
    return Array.from({ length: len }, () => false);
  }
}
function saveChecks(id, checks) {
  try {
    localStorage.setItem(`dc2check-${id}`, JSON.stringify(checks));
  } catch { /* プライベートモード等では保存しない */ }
}

/* ---------- 検索 ---------- */

function searchAlarms(query) {
  const q = normalize(query);
  if (!q) return [];
  // 数字のみ → Id 検索（前方一致も含める）
  if (/^\d+$/.test(q)) {
    const n = parseInt(q, 10);
    const exact = ALARM_BY_ID.get(n);
    const partial = ALARMS.filter((a) => a.id !== n && String(a.id).startsWith(q));
    return exact ? [exact, ...partial] : partial;
  }
  const words = q.split(/\s+/);
  return ALARMS.filter((a) => {
    const hay = normalize(`${a.id} ${a.code} ${a.title} ${a.desc} ${(a.causes || []).join(" ")}`);
    return words.every((w) => hay.includes(w));
  });
}

// モジュールページ（セーフステート・QSC・LED）内の検索
function searchModules(query) {
  const q = normalize(query);
  if (!q || /^\d+$/.test(q)) return [];
  const words = q.split(/\s+/);
  return MODULE_INDEX.filter((m) => {
    const hay = normalize(`${m.page.name} ${m.group} ${m.entry.badge} ${m.entry.title} ${m.entry.desc} ${m.entry.action || ""}`);
    return words.every((w) => hay.includes(w));
  });
}

/* ---------- 描画：ホーム ---------- */

function renderHome() {
  const tiles = CATEGORIES.map((c) => {
    const count = ALARMS.filter((a) => a.cat === c.id).length;
    return `
      <button class="cat-tile" data-nav="#cat/${c.id}">
        <span class="cat-icon">${c.icon}</span>
        <span>
          <span class="cat-name">${esc(c.name)}</span><br>
          <span class="cat-count">${count} 件</span>
        </span>
      </button>`;
  }).join("");

  $app.innerHTML = `
    <div class="hero">
      <h1>エラー番号から調べる</h1>
      <p>MicroConf の「Alarms」画面に表示されている <strong>Id（0〜172）</strong> を入力してください。</p>
      <form class="id-form" id="id-form">
        <input id="id-input" type="text" inputmode="numeric" pattern="[0-9０-９]*"
               placeholder="例: 92" autocomplete="off" aria-label="エラー番号">
        <button type="submit">表示</button>
      </form>
      <div class="id-error" id="id-error"></div>
    </div>
    <h2 class="section-title">カテゴリから探す</h2>
    <div class="cat-grid">${tiles}</div>
    <button class="all-link" data-nav="#all">全アラーム一覧を見る（${ALARMS.length} 件）</button>
    <h2 class="section-title">QSC・その他モジュールのアラーム</h2>
    <div class="cat-grid">
      ${MODULE_PAGES.map((m) => `
        <button class="cat-tile" data-nav="#mod/${m.id}">
          <span class="cat-icon">${m.icon}</span>
          <span>
            <span class="cat-name">${esc(m.name)}</span><br>
            <span class="cat-count">${esc(m.short)}</span>
          </span>
        </button>`).join("")}
    </div>
  `;

  const form = document.getElementById("id-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = normalize(document.getElementById("id-input").value);
    const err = document.getElementById("id-error");
    if (!/^\d+$/.test(raw)) {
      err.textContent = "数字で入力してください（0〜172）。";
      return;
    }
    const n = parseInt(raw, 10);
    if (!ALARM_BY_ID.has(n)) {
      err.textContent = `Id ${n} は存在しません（0〜172 の範囲で入力してください）。`;
      return;
    }
    location.hash = `#alarm/${n}`;
  });
}

/* ---------- 描画：一覧 ---------- */

function alarmRow(a) {
  return `
    <button class="alarm-row${a.noInfo ? " is-noinfo" : ""}" data-nav="#alarm/${a.id}">
      <span class="row-id">${a.id}</span>
      <span class="row-main">
        <span class="row-title">${esc(a.title)}</span><br>
        <span class="row-code">${esc(a.code)}</span>
      </span>
      <span class="row-badges">${typeBadge(a)}${audienceBadge(a)}</span>
    </button>`;
}

function renderList(items, title, moduleHits) {
  const rows = items.map(alarmRow).join("");
  let moduleHtml = "";
  if (moduleHits && moduleHits.length) {
    moduleHtml = `
      <h2 class="section-title" style="margin-top:24px">QSC・その他モジュールでの該当（${moduleHits.length} 件）</h2>
      <div class="alarm-list">
        ${moduleHits.map((m) => `
          <button class="alarm-row" data-nav="#mod/${m.page.id}">
            <span class="row-id mod-id">${esc(m.entry.badge)}</span>
            <span class="row-main">
              <span class="row-title">${esc(m.entry.title)}</span><br>
              <span class="row-code">${m.page.icon} ${esc(m.page.name)} ─ ${esc(m.group)}</span>
            </span>
          </button>`).join("")}
      </div>`;
  }
  const total = items.length + (moduleHits ? moduleHits.length : 0);
  $app.innerHTML = `
    <div class="list-head">
      <h1>${esc(title)}</h1>
      <span class="result-count">${total} 件</span>
    </div>
    ${rows ? `<div class="alarm-list">${rows}</div>` : ""}
    ${!total ? `<div class="empty-note">該当するアラームが見つかりませんでした。<br>エラー番号（0〜172）またはキーワードを変えてお試しください。</div>` : ""}
    ${moduleHtml}
  `;
  $app.querySelectorAll(".alarm-row").forEach((el) => {
    el.addEventListener("click", () => { location.hash = el.dataset.nav; });
  });
}

/* ---------- QPM パネル図（実機を模した SVG） ---------- */

function qpmPanelHtml() {
  // 南京錠アイコン（cx, cy 中心）閉＝シャックルが本体の真上、開＝右にずれる
  const lock = (cx, cy, open) => `
    <rect x="${cx - 13}" y="${cy - 2}" width="26" height="17" rx="3" fill="#fff"/>
    <path d="M ${open ? cx - 2 : cx - 8},${cy - 2} v-6 a8,8 0 0 1 16,0 v6"
          fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`;
  // ヒッチアイコン（バー＋ピン2本）。rot=true でローテータ円を追加
  const hitch = (cx, cy, rot) => `
    <rect x="${cx - 14}" y="${cy - 10}" width="28" height="8" rx="2" fill="#e6e6e6"/>
    <circle cx="${cx - 8}" cy="${cy + 4}" r="5" fill="#e6e6e6"/>
    <circle cx="${cx + 8}" cy="${cy + 4}" r="5" fill="#e6e6e6"/>
    ${rot ? `<circle cx="${cx}" cy="${cy + 16}" r="6" fill="none" stroke="#e6e6e6" stroke-width="2.5"/>` : ""}`;
  const led = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="6" fill="#222" stroke="#9a9a9a" stroke-width="2"/>`;
  const badge = (cx, cy, n) => `
    <circle cx="${cx}" cy="${cy}" r="11" fill="#ffd500"/>
    <text x="${cx}" y="${cy + 4.5}" text-anchor="middle" font-size="13" font-weight="800" fill="#111">${n}</text>`;

  const svg = `
  <svg viewBox="0 0 360 700" xmlns="http://www.w3.org/2000/svg" role="img"
       aria-label="QPM パネルの配置図">
    <!-- 本体 -->
    <rect x="40" y="8" width="280" height="684" rx="38" fill="#262626" stroke="#141414" stroke-width="3"/>
    <rect x="58" y="70" width="244" height="440" rx="12" fill="#0d0d0d"/>
    <!-- engcon ロゴ -->
    <rect x="72" y="20" width="216" height="38" rx="8" fill="#ffd500"/>
    <text x="180" y="46" text-anchor="middle" font-size="24" font-weight="800" font-style="italic" fill="#111" font-family="Arial, sans-serif">engcon</text>

    <!-- ① マシンヒッチ 開／閉ボタン（左列） -->
    <rect x="80" y="100" width="76" height="62" rx="12" fill="#1a1a1a" stroke="#b5b5b5" stroke-width="3"/>
    ${lock(118, 131, true)}
    <rect x="80" y="180" width="76" height="62" rx="12" fill="#1a1a1a" stroke="#b5b5b5" stroke-width="3"/>
    ${lock(118, 211, false)}
    <!-- ② チルトローテータヒッチ 開／閉ボタン（右列・少し下にずれる） -->
    <rect x="196" y="114" width="76" height="62" rx="12" fill="#1a1a1a" stroke="#b5b5b5" stroke-width="3"/>
    ${lock(234, 145, true)}
    <rect x="196" y="194" width="76" height="62" rx="12" fill="#1a1a1a" stroke="#b5b5b5" stroke-width="3"/>
    ${lock(234, 225, false)}

    <!-- ③ マシンヒッチ アイコン＋左右LED（バケット軸位置インジケータ） -->
    ${led(84, 292)}${hitch(118, 288, false)}${led(152, 292)}

    <!-- ④ 接地圧ボタン（丸に下向き矢印＋地面） -->
    <circle cx="236" cy="292" r="30" fill="none" stroke="#fff" stroke-width="3"/>
    <line x1="236" y1="274" x2="236" y2="296" stroke="#fff" stroke-width="4"/>
    <polygon points="236,306 227,294 245,294" fill="#fff"/>
    <line x1="221" y1="312" x2="251" y2="312" stroke="#fff" stroke-width="3.5"/>

    <!-- ⑤ 十字矢印ボタン（スイング／高さ制限） -->
    <circle cx="118" cy="390" r="32" fill="none" stroke="#fff" stroke-width="3"/>
    <line x1="107" y1="379" x2="129" y2="401" stroke="#fff" stroke-width="4"/>
    <line x1="129" y1="379" x2="107" y2="401" stroke="#fff" stroke-width="4"/>
    <polygon points="101,373 112,376 104,384" fill="#fff"/>
    <polygon points="135,373 132,384 124,376" fill="#fff"/>
    <polygon points="101,407 104,396 112,404" fill="#fff"/>
    <polygon points="135,407 124,404 132,396" fill="#fff"/>

    <!-- ⑥ 警告三角（アラームインジケータ） -->
    <path d="M196,398 L176,432 L216,432 Z" fill="none" stroke="#e03131" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="194.4" y="408" width="3.2" height="12" rx="1.5" fill="#e03131"/>
    <circle cx="196" cy="426" r="2.2" fill="#e03131"/>

    <!-- ③' チルトローテータヒッチ アイコン＋左右LED -->
    ${led(202, 462)}${hitch(236, 456, true)}${led(270, 462)}

    <!-- ⑦ スライドカバー -->
    <rect x="54" y="500" width="252" height="176" rx="22" fill="#2f2f2f" stroke="#191919" stroke-width="3"/>
    <rect x="120" y="524" width="120" height="10" rx="5" fill="#242424"/>
    <rect x="120" y="548" width="120" height="10" rx="5" fill="#242424"/>
    <text x="180" y="640" text-anchor="middle" font-size="17" font-weight="700" fill="#4a4a4a" font-family="Arial, sans-serif">QSC</text>

    <!-- 番号バッジ -->
    ${badge(62, 131, "1")}
    ${badge(298, 250, "2")}
    ${badge(62, 292, "3")}
    ${badge(298, 292, "4")}
    ${badge(62, 390, "5")}
    ${badge(240, 415, "6")}
    ${badge(298, 462, "3")}
    ${badge(298, 540, "7")}

    <!-- クリック領域（ホットスポット） -->
    <rect class="qpm-hot" data-jump="g2" x="76" y="96" width="84" height="150" rx="12"><title>マシンヒッチ 開／閉ボタン</title></rect>
    <rect class="qpm-hot" data-jump="g2" x="192" y="110" width="84" height="150" rx="12"><title>チルトローテータヒッチ 開／閉ボタン</title></rect>
    <rect class="qpm-hot" data-jump="g3" x="74" y="272" width="90" height="40" rx="8"><title>ヒッチ状態インジケータ（左右LED）</title></rect>
    <circle class="qpm-hot" data-jump="g1" cx="236" cy="292" r="35"><title>接地圧ボタン</title></circle>
    <circle class="qpm-hot" data-jump="g0" cx="118" cy="390" r="37"><title>十字矢印（スイング／高さ制限）ボタン</title></circle>
    <rect class="qpm-hot" data-jump="codes" x="170" y="392" width="52" height="46" rx="8"><title>警告三角（エラーコード表示）</title></rect>
    <rect class="qpm-hot" data-jump="g3" x="192" y="440" width="90" height="42" rx="8"><title>ヒッチ状態インジケータ（左右LED）</title></rect>
    <rect class="qpm-hot" data-jump="cover" x="54" y="500" width="252" height="130" rx="22"><title>スライドカバー</title></rect>
  </svg>`;

  const legend = [
    { n: "1", jump: "g2", title: "マシンヒッチ 開🔓／閉🔒 ボタン（左列）", desc: "マシン側クイックヒッチロックの開閉。ランプの点滅は下の「選択ランプ」を参照。" },
    { n: "2", jump: "g2", title: "チルトローテータヒッチ 開🔓／閉🔒 ボタン（右列）", desc: "チルトローテータ側クイックヒッチロックの開閉。" },
    { n: "3", jump: "g3", title: "ヒッチ状態インジケータ（アイコン両脇の左右LED）", desc: "バケット軸位置（フックセンサー／イジェクタセンサー）の連結状態を表示。上＝マシン側、下＝チルトローテータ側。" },
    { n: "4", jump: "g1", title: "接地圧ボタン（丸に下向き矢印）", desc: "接地圧（グラウンドコンタクト）の状態表示とテスト。" },
    { n: "5", jump: "g0", title: "十字矢印ボタン（スイング／高さ制限）", desc: "マシン抑制（旋回・リフトのブロック）の表示と解除。設定モードの開始にも使用。" },
    { n: "6", jump: "codes", title: "警告三角（アラームインジケータ）", desc: "点滅回数（1〜21回）でエラーコードを表示 → タップでコード表へ。" },
    { n: "7", jump: "cover", title: "スライドカバー", desc: "使わない側のロックボタンを覆い、誤ったヒッチの開放を防ぎます。" },
  ].map((l) => `
    <button class="qpm-leg" data-jump="${l.jump}">
      <span class="qpm-num">${l.n}</span>
      <span><strong>${esc(l.title)}</strong><br><span class="qpm-leg-desc">${esc(l.desc)}</span></span>
    </button>`).join("");

  return `
    <div class="detail-section">
      <h2>パネルの配置図（タップで説明へジャンプ）</h2>
      <p class="qpm-note">実機の QSC パネル（QPM）を模した配置図です。図の各部または下の凡例をタップすると、該当する説明にジャンプします。</p>
      <div class="qpm-fig">
        ${svg}
        <div class="qpm-legend">${legend}</div>
      </div>
    </div>`;
}

/* ---------- 描画：モジュールページ（セーフステート・QSC・LED） ---------- */

function renderModulePage(page) {
  const groups = page.groups.map((g, gi) => `
    <div class="detail-section" id="mg-${page.id}-${gi}">
      <h2>${esc(g.heading)}</h2>
      <div class="mod-list">
        ${g.entries.map((e) => `
          <div class="mod-entry">
            <div class="mod-head">
              <span class="mod-badge">${esc(e.badge)}</span>
              <span class="mod-title">${esc(e.title)}</span>
            </div>
            <p class="mod-desc">${esc(e.desc)}</p>
            ${e.action ? `<div class="mod-action"><strong>対処：</strong>${esc(e.action)}</div>` : ""}
          </div>`).join("")}
      </div>
    </div>`).join("");

  $app.innerHTML = `
    <button class="back-btn" id="back-btn">← 戻る</button>
    <div class="detail-header">
      <div class="detail-id"><small>モジュール</small><span style="font-size:20px">${page.icon}</span></div>
      <div class="detail-titles">
        <h1>${esc(page.name)}</h1>
        <div class="detail-code">${esc(page.short)}</div>
      </div>
    </div>
    <div class="detail-body">
      <div class="detail-section"><h2>概要</h2><p>${esc(page.intro)}</p></div>
      ${page.id === "qpm-lamps" ? qpmPanelHtml() : ""}
      ${groups}
    </div>
  `;
  document.getElementById("back-btn").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.hash = "#home";
  });

  // パネル図のホットスポット・凡例クリック → 該当セクションへスクロール
  $app.querySelectorAll("[data-jump]").forEach((el) => {
    el.addEventListener("click", () => {
      const jump = el.dataset.jump;
      if (jump === "codes") { location.hash = "#mod/qpm-codes"; return; }
      if (jump === "cover") return; // カバーは凡例の説明のみ
      const target = document.getElementById(`mg-${page.id}-${jump.slice(1)}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.classList.remove("flash-target");
        void target.offsetWidth; // アニメーションを再トリガー
        target.classList.add("flash-target");
      }
    });
  });
}

/* ---------- 描画：詳細 ---------- */

function renderDetail(a) {
  const badges = [
    typeBadge(a),
    audienceBadge(a),
    a.restart ? `<span class="badge restart">リセットには再起動が必要</span>` : "",
  ].join("");

  const causesHtml = (a.causes && a.causes.length)
    ? `<div class="detail-section"><h2>考えられる原因</h2>
         <ul class="cause-list">${a.causes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>`
    : "";

  let stepsHtml = "";
  if (a.steps && a.steps.length) {
    const checks = loadChecks(a.id, a.steps.length);
    const items = a.steps.map((s, i) => `
      <label class="step-item${checks[i] ? " done" : ""}">
        <input type="checkbox" data-step="${i}" ${checks[i] ? "checked" : ""}>
        <span class="step-num">${i + 1}</span>
        <span class="step-text">${esc(s)}</span>
      </label>`).join("");
    stepsHtml = `
      <div class="detail-section">
        <h2>対処手順（チェックリスト）</h2>
        <div class="check-progress">
          <span id="progress-label"></span>
          <button class="check-reset" id="check-reset">チェックをリセット</button>
        </div>
        <div class="step-list" id="step-list">${items}</div>
      </div>`;
  }

  const noInfoHtml = a.noInfo
    ? `<div class="noinfo-box">${esc(a.desc)}</div>`
    : `<div class="detail-section"><h2>どんな異常か</h2><p>${esc(a.desc)}</p></div>`;

  const related = (a.related || [])
    .map((id) => ALARM_BY_ID.get(id))
    .filter(Boolean);
  const relatedHtml = related.length
    ? `<div class="detail-section"><h2>関連アラーム</h2>
         <div class="related-chips">${related.map((r) => `
           <button class="rel-chip" data-nav="#alarm/${r.id}">
             <span class="rel-id">${r.id}</span>${esc(r.title)}
           </button>`).join("")}</div></div>`
    : "";

  $app.innerHTML = `
    <button class="back-btn" id="back-btn">← 戻る</button>
    <div class="detail-header">
      <div class="detail-id"><small>アラーム Id</small><span>${a.id}</span></div>
      <div class="detail-titles">
        <h1>${esc(a.title)}</h1>
        <div class="detail-code">${esc(a.code)}</div>
        <div class="detail-badges">${badges}</div>
      </div>
    </div>
    <div class="detail-body">
      ${noInfoHtml}
      ${a.note ? `<div class="note-box">${esc(a.note)}</div>` : ""}
      ${causesHtml}
      ${stepsHtml}
      ${relatedHtml}
    </div>
  `;

  document.getElementById("back-btn").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.hash = "#home";
  });

  $app.querySelectorAll(".rel-chip").forEach((el) => {
    el.addEventListener("click", () => { location.hash = el.dataset.nav; });
  });

  // チェックリストの動作
  const list = document.getElementById("step-list");
  if (list) {
    const label = document.getElementById("progress-label");
    const updateProgress = () => {
      const boxes = [...list.querySelectorAll("input[type=checkbox]")];
      const done = boxes.filter((b) => b.checked).length;
      label.textContent = `進行状況: ${done} / ${boxes.length} 完了`;
      saveChecks(a.id, boxes.map((b) => b.checked));
    };
    list.addEventListener("change", (e) => {
      const box = e.target;
      if (box.matches("input[type=checkbox]")) {
        box.closest(".step-item").classList.toggle("done", box.checked);
        updateProgress();
      }
    });
    document.getElementById("check-reset").addEventListener("click", () => {
      list.querySelectorAll("input[type=checkbox]").forEach((b) => {
        b.checked = false;
        b.closest(".step-item").classList.remove("done");
      });
      updateProgress();
    });
    updateProgress();
  }
}

/* ---------- ルーター ---------- */

function route() {
  const hash = decodeURIComponent(location.hash || "#home");
  window.scrollTo(0, 0);

  if (hash.startsWith("#alarm/")) {
    const id = parseInt(hash.slice(7), 10);
    const a = ALARM_BY_ID.get(id);
    if (a) { renderDetail(a); return; }
  }
  if (hash.startsWith("#cat/")) {
    const cat = CAT_BY_ID.get(hash.slice(5));
    if (cat) {
      renderList(ALARMS.filter((a) => a.cat === cat.id), `${cat.icon} ${cat.name}`);
      return;
    }
  }
  if (hash.startsWith("#mod/")) {
    const page = MODULE_BY_ID.get(hash.slice(5));
    if (page) { renderModulePage(page); return; }
  }
  if (hash.startsWith("#search/")) {
    const q = hash.slice(8);
    if ($search.value !== q) $search.value = q;
    renderList(searchAlarms(q), `「${q}」の検索結果`, searchModules(q));
    return;
  }
  if (hash === "#all") {
    renderList(ALARMS, "全アラーム一覧");
    return;
  }
  renderHome();
}

// ヘッダー検索：入力のたびに結果を表示（空になったらホームへ戻る）
let searchTimer = null;
$search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = $search.value.trim();
    if (q) {
      location.hash = `#search/${encodeURIComponent(q)}`;
    } else if (location.hash.startsWith("#search/")) {
      location.hash = "#home";
    }
  }, 200);
});

// カテゴリタイル・全一覧ボタンなどの data-nav 共通ハンドラ
document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-nav]");
  if (nav && !nav.classList.contains("alarm-row") && !nav.classList.contains("rel-chip")) {
    location.hash = nav.dataset.nav;
  }
});

window.addEventListener("hashchange", route);
route();
