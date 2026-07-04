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

/* ---------- 描画：モジュールページ（セーフステート・QSC・LED） ---------- */

function renderModulePage(page) {
  const groups = page.groups.map((g) => `
    <div class="detail-section">
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
      ${groups}
    </div>
  `;
  document.getElementById("back-btn").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.hash = "#home";
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
