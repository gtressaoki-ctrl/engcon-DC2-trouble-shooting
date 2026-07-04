/*
 * 図解 SVG（engcon 取付説明書 9000876／9000752 の図面を再現）
 *  - qpm    : QSC 制御パネル（QPM）の実機配置図
 *  - cm     : CM 運転室モジュールの画面表示の見かた＋コネクタ位置
 *  - qcm    : QCM 電子モジュール前面（LED・コネクタ X1〜X8）
 *  - system : システム構成図（マシン電気キット 8001118）
 * renderModulePage() が page.figure のキーで FIGURES[key]() を呼び出す。
 */
"use strict";

const FIGURES = {};

/* ---------- 共通部品 ---------- */

function figBadge(cx, cy, n) {
  return `<circle cx="${cx}" cy="${cy}" r="11" fill="#ffd500" stroke="#222" stroke-width="1"/>
    <text x="${cx}" y="${cy + 4.5}" text-anchor="middle" font-size="13" font-weight="800" fill="#111">${n}</text>`;
}

// engcon図面風の黄色ラベルタグ
function figTag(cx, cy, label) {
  const w = label.length * 8.2 + 14;
  return `<rect x="${cx - w / 2}" y="${cy - 10}" width="${w}" height="20" rx="3" fill="#ffd500" stroke="#c9a800" stroke-width="1"/>
    <text x="${cx}" y="${cy + 4.5}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#111">${label}</text>`;
}

/* ================================================================
 * QPM パネル（実機配置: 上クラスタ=マシンヒッチ、下クラスタ=チルトローテータ）
 * ================================================================ */

FIGURES.qpm = function () {
  const lockBtn = (x, y, open) => {
    const cx = x + 28, cy = y + 26;
    return `
    <rect x="${x}" y="${y}" width="56" height="48" rx="10" fill="#1b1b1b" stroke="#e8e8e8" stroke-width="2.5"/>
    <rect x="${cx - 11}" y="${cy - 1}" width="22" height="14" rx="2.5" fill="#fff"/>
    <path d="M ${open ? cx - 1 : cx - 7},${cy - 1} v-5 a7,7 0 0 1 14,0 v5"
          fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  };
  const hitchIcon = (cx, cy, rot) => `
    <rect x="${cx - 13}" y="${cy - 9}" width="26" height="7" rx="2" fill="#f2f2f2"/>
    <circle cx="${cx - 7}" cy="${cy + 3}" r="4.5" fill="#f2f2f2"/>
    <circle cx="${cx + 7}" cy="${cy + 3}" r="4.5" fill="#f2f2f2"/>
    ${rot ? `<circle cx="${cx}" cy="${cy + 13}" r="5" fill="none" stroke="#f2f2f2" stroke-width="2.5"/>` : ""}`;
  const led = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="5.5" fill="#3a3a3a" stroke="#dcdcdc" stroke-width="2"/>`;

  const svg = `
  <svg viewBox="0 0 340 700" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QPM パネルの配置図">
    <!-- 本体（取付説明書の図と同じグレー基調） -->
    <rect x="70" y="8" width="200" height="684" rx="46" fill="#b8b8b6" stroke="#6f6f6d" stroke-width="3"/>
    <rect x="84" y="60" width="172" height="452" rx="14" fill="#4b4b49"/>
    <!-- engcon ロゴ帯 -->
    <rect x="108" y="20" width="124" height="26" rx="6" fill="#ffd500"/>
    <text x="170" y="38" text-anchor="middle" font-size="16" font-weight="800" font-style="italic" fill="#111" font-family="Arial, sans-serif">engcon</text>

    <!-- 上クラスタ: マシンヒッチ（上段=開く2個、下段=閉じる2個） -->
    ${lockBtn(96, 76, true)}${lockBtn(188, 76, true)}
    ${lockBtn(96, 134, false)}${lockBtn(188, 134, false)}

    <!-- マシンヒッチ状態 LED＋アイコン -->
    ${led(108, 208)}${hitchIcon(170, 205, false)}${led(232, 208)}

    <!-- 十字矢印ボタン（左）と接地圧ボタン（右） -->
    <circle cx="128" cy="262" r="26" fill="none" stroke="#fff" stroke-width="3"/>
    <line x1="119" y1="253" x2="137" y2="271" stroke="#fff" stroke-width="3.5"/>
    <line x1="137" y1="253" x2="119" y2="271" stroke="#fff" stroke-width="3.5"/>
    <polygon points="114,248 124,250.5 117.5,257" fill="#fff"/>
    <polygon points="142,248 138.5,257 132,250.5" fill="#fff"/>
    <polygon points="114,276 117.5,267 124,273.5" fill="#fff"/>
    <polygon points="142,276 132,273.5 138.5,267" fill="#fff"/>

    <circle cx="212" cy="262" r="26" fill="none" stroke="#fff" stroke-width="3"/>
    <line x1="212" y1="247" x2="212" y2="266" stroke="#fff" stroke-width="3.5"/>
    <polygon points="212,274 204.5,264 219.5,264" fill="#fff"/>
    <line x1="199" y1="279" x2="225" y2="279" stroke="#fff" stroke-width="3"/>

    <!-- 赤LED（アラーム用）と警告三角 -->
    <circle cx="248" cy="240" r="4.5" fill="#e03131"/>
    <path d="M104,296 L90,320 L118,320 Z" fill="none" stroke="#e03131" stroke-width="3" stroke-linejoin="round"/>
    <rect x="102.8" y="303" width="2.4" height="8.5" rx="1.2" fill="#e03131"/>
    <circle cx="104" cy="316" r="1.7" fill="#e03131"/>

    <!-- チルトローテータヒッチ状態 LED＋アイコン -->
    ${led(108, 342)}${hitchIcon(170, 338, true)}${led(232, 342)}

    <!-- 下クラスタ: チルトローテータヒッチ（上段=開く、下段=閉じる） -->
    ${lockBtn(96, 372, true)}${lockBtn(188, 372, true)}
    ${lockBtn(96, 430, false)}${lockBtn(188, 430, false)}

    <!-- スライドカバー可動範囲（点線）と下部グリップ -->
    <rect x="88" y="366" width="164" height="120" rx="12" fill="none" stroke="#ffd500" stroke-width="2" stroke-dasharray="6 5"/>
    <rect x="86" y="524" width="168" height="146" rx="20" fill="#8f8f8d" stroke="#6f6f6d" stroke-width="2"/>
    <rect x="128" y="548" width="84" height="9" rx="4.5" fill="#7a7a78"/>
    <rect x="128" y="570" width="84" height="9" rx="4.5" fill="#7a7a78"/>
    <text x="170" y="648" text-anchor="middle" font-size="15" font-weight="700" fill="#6a6a68" font-family="Arial, sans-serif">QSC</text>

    <!-- 番号バッジ -->
    ${figBadge(56, 100, "1")}
    ${figBadge(56, 158, "2")}
    ${figBadge(284, 208, "3")}
    ${figBadge(56, 262, "4")}
    ${figBadge(284, 262, "5")}
    ${figBadge(56, 310, "6")}
    ${figBadge(284, 342, "3")}
    ${figBadge(56, 400, "7")}
    ${figBadge(56, 458, "8")}
    ${figBadge(284, 480, "9")}

    <!-- クリック領域 -->
    <rect class="qpm-hot" data-jump="g2" x="92" y="72" width="156" height="56" rx="10"><title>マシンヒッチ「開く」ボタン（2個同時押し）</title></rect>
    <rect class="qpm-hot" data-jump="g2" x="92" y="130" width="156" height="56" rx="10"><title>マシンヒッチ「閉じる」ボタン（2個同時押し）</title></rect>
    <rect class="qpm-hot" data-jump="g3" x="96" y="192" width="148" height="34" rx="8"><title>マシンヒッチ状態インジケータ（左右LED）</title></rect>
    <circle class="qpm-hot" data-jump="g0" cx="128" cy="262" r="30"><title>十字矢印（スイング／高さ制限）ボタン</title></circle>
    <circle class="qpm-hot" data-jump="g1" cx="212" cy="262" r="30"><title>接地圧ボタン</title></circle>
    <rect class="qpm-hot" data-jump="codes" x="84" y="290" width="42" height="38" rx="6"><title>警告三角（点滅回数＝エラーコード）</title></rect>
    <rect class="qpm-hot" data-jump="g3" x="96" y="326" width="148" height="34" rx="8"><title>チルトローテータヒッチ状態インジケータ（左右LED）</title></rect>
    <rect class="qpm-hot" data-jump="g2" x="92" y="368" width="156" height="56" rx="10"><title>チルトローテータヒッチ「開く」ボタン（2個同時押し）</title></rect>
    <rect class="qpm-hot" data-jump="g2" x="92" y="426" width="156" height="56" rx="10"><title>チルトローテータヒッチ「閉じる」ボタン（2個同時押し）</title></rect>
  </svg>`;

  const legend = [
    { n: "1", jump: "g2", title: "マシンヒッチ「開く」ボタン 🔓（上段2個）", desc: "安全のため左右2個を同時に押すと、マシン側クイックヒッチロックが開きます。" },
    { n: "2", jump: "g2", title: "マシンヒッチ「閉じる」ボタン 🔒（下段2個）", desc: "左右2個を同時に押すと、マシン側クイックヒッチロックが閉まります。" },
    { n: "3", jump: "g3", title: "ヒッチ状態インジケータ（アイコン両脇の左右LED）", desc: "バケット軸位置（フックセンサー／イジェクタセンサー）の連結状態を表示。上＝マシン側、下＝チルトローテータ側。" },
    { n: "4", jump: "g0", title: "十字矢印ボタン（スイング／高さ制限）", desc: "マシン抑制（旋回・リフトのブロック）の表示と解除。設定モードの開始にも使用します。" },
    { n: "5", jump: "g1", title: "接地圧ボタン（丸に下向き矢印）", desc: "接地圧（グラウンドコンタクト）の状態表示とテスト。" },
    { n: "6", jump: "codes", title: "警告三角（アラームインジケータ）", desc: "点滅回数（1〜21回）でエラーコードを表示 → タップでコード表へ。右上の赤LEDも警告表示です。" },
    { n: "7", jump: "g2", title: "チルトローテータヒッチ「開く」ボタン 🔓（上段2個）", desc: "左右2個を同時に押すと、チルトローテータ側クイックヒッチロックが開きます。" },
    { n: "8", jump: "g2", title: "チルトローテータヒッチ「閉じる」ボタン 🔒（下段2個）", desc: "左右2個を同時に押すと、チルトローテータ側クイックヒッチロックが閉まります。" },
    { n: "9", jump: "cover", title: "スライドカバー（黄色の点線＝カバー位置の例）", desc: "使用しない側のボタンクラスタを覆い、誤ったヒッチの開放を防ぎます。カバーを上下にスライドして使う側だけを露出させます。" },
  ].map((l) => `
    <button class="qpm-leg" data-jump="${l.jump}">
      <span class="qpm-num">${l.n}</span>
      <span><strong>${l.title}</strong><br><span class="qpm-leg-desc">${l.desc}</span></span>
    </button>`).join("");

  return `
    <div class="detail-section">
      <h2>パネルの配置図（タップで説明へジャンプ）</h2>
      <p class="qpm-note">取付説明書の図に合わせた QPM の配置図です。<strong>上の4ボタン＝マシンヒッチ用、下の4ボタン＝チルトローテータヒッチ用</strong>で、開く／閉じるとも安全のため<strong>左右2個のボタンを同時に押す</strong>方式です。図の各部または凡例をタップすると該当する説明へジャンプします。</p>
      <div class="qpm-fig">
        ${svg}
        <div class="qpm-legend">${legend}</div>
      </div>
    </div>`;
};

/* ================================================================
 * CM 運転室モジュール（画面表示の見かた＋コネクタ位置）
 * ================================================================ */

FIGURES.cm = function () {
  const displaySvg = `
  <svg viewBox="0 0 340 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CM 画面のアラーム表示の見かた">
    <rect x="14" y="16" width="212" height="212" rx="20" fill="#1c1c1c"/>
    <rect x="26" y="28" width="188" height="188" rx="14" fill="#ffd500"/>
    <rect x="46" y="42" width="150" height="100" rx="4" fill="#dfe3d8" stroke="#8a8a8a" stroke-width="1.5"/>
    <!-- 1行目: アラーム名 -->
    <rect x="92" y="50" width="58" height="18" fill="#fff" stroke="#999"/>
    <text x="121" y="63.5" text-anchor="middle" font-size="12.5" font-weight="800" fill="#111">PWM1</text>
    <!-- 2行目: モジュール/コネクタ/ピン -->
    <rect x="70" y="73" width="30" height="16" fill="#fff" stroke="#999"/>
    <text x="85" y="85" text-anchor="middle" font-size="10.5" font-weight="700" fill="#111">CM</text>
    <rect x="103" y="73" width="26" height="16" fill="#fff" stroke="#999"/>
    <text x="116" y="85" text-anchor="middle" font-size="10.5" font-weight="700" fill="#111">X1</text>
    <rect x="132" y="73" width="16" height="16" fill="#fff" stroke="#999"/>
    <text x="140" y="85" text-anchor="middle" font-size="10.5" font-weight="700" fill="#111">1</text>
    <!-- 3行目: 不具合の説明 -->
    <rect x="70" y="94" width="112" height="16" fill="#fff" stroke="#999"/>
    <text x="126" y="106" text-anchor="middle" font-size="9.5" font-weight="700" fill="#111">SHORT CIRCUIT</text>
    <!-- 4行目: COUNT と (1/2) -->
    <rect x="58" y="116" width="62" height="16" fill="#fff" stroke="#999"/>
    <text x="89" y="128" text-anchor="middle" font-size="9.5" font-weight="700" fill="#111">COUNT 2</text>
    <text x="184" y="128" text-anchor="end" font-size="10.5" font-weight="700" fill="#111">(1/2)</text>
    <text x="62" y="196" font-size="26" font-weight="800" fill="#111" font-family="Arial, sans-serif">CM</text>

    <!-- 引出線とバッジ -->
    <line x1="152" y1="59" x2="268" y2="52" stroke="#888" stroke-width="1.5" stroke-dasharray="4 3"/>
    ${figBadge(284, 52, "1")}
    <line x1="150" y1="81" x2="268" y2="88" stroke="#888" stroke-width="1.5" stroke-dasharray="4 3"/>
    ${figBadge(284, 88, "2")}
    <line x1="184" y1="102" x2="268" y2="124" stroke="#888" stroke-width="1.5" stroke-dasharray="4 3"/>
    ${figBadge(284, 124, "3")}
    <line x1="188" y1="126" x2="268" y2="160" stroke="#888" stroke-width="1.5" stroke-dasharray="4 3"/>
    ${figBadge(284, 160, "4")}
    <line x1="94" y1="134" x2="268" y2="196" stroke="#888" stroke-width="1.5" stroke-dasharray="4 3"/>
    ${figBadge(284, 196, "5")}
  </svg>`;

  const pinRow = (x, y, n, gap) => {
    let s = "";
    for (let i = 0; i < n; i++) s += `<circle cx="${x + i * gap}" cy="${y}" r="2.4" fill="#7a7a78"/>`;
    return s;
  };
  const connectorSvg = `
  <svg viewBox="0 0 520 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CM 背面コネクタの位置">
    <rect x="30" y="40" width="460" height="140" rx="14" fill="#c7c7c5" stroke="#7a7a78" stroke-width="2.5"/>
    <rect x="60" y="28" width="120" height="16" rx="6" fill="#b0b0ae" stroke="#7a7a78" stroke-width="1.5"/>
    <!-- CM-X1 (35ピン) -->
    <rect x="58" y="76" width="158" height="70" rx="30" fill="#efefec" stroke="#666" stroke-width="2.5"/>
    ${pinRow(80, 94, 12, 10)}
    ${pinRow(85, 111, 11, 10)}
    ${pinRow(80, 128, 12, 10)}
    <text x="137" y="170" text-anchor="middle" font-size="15" font-weight="800" fill="#111">CM-X1（35ピン）</text>
    <!-- CM-X2 (25ピン) -->
    <rect x="268" y="62" width="176" height="34" rx="15" fill="#efefec" stroke="#666" stroke-width="2.5"/>
    ${pinRow(286, 74, 13, 11)}
    ${pinRow(291, 85, 12, 11)}
    <text x="356" y="56" text-anchor="middle" font-size="14" font-weight="800" fill="#111">CM-X2（25ピン）</text>
    <!-- CM-X3 (25ピン) -->
    <rect x="268" y="124" width="176" height="34" rx="15" fill="#efefec" stroke="#666" stroke-width="2.5"/>
    ${pinRow(286, 136, 13, 11)}
    ${pinRow(291, 147, 12, 11)}
    <text x="356" y="176" text-anchor="middle" font-size="14" font-weight="800" fill="#111">CM-X3（25ピン）</text>
  </svg>`;

  return `
    <div class="detail-section">
      <h2>画面のアラーム表示の見かた（例: PWM1 SHORT CIRCUIT）</h2>
      <p class="qpm-note">CM の画面に表示されるアラームの読み方です。①〜⑤の意味は下の表を参照してください。<strong>このアプリで詳細を調べるには、MicroConf の Alarms 画面の Id を番号検索</strong>してください。</p>
      <div class="fig-wrap">${displaySvg}</div>
    </div>
    <div class="detail-section">
      <h2>背面コネクタの位置</h2>
      <p class="qpm-note">アラーム文の「CM-X1.13」などは、下図のコネクタとピン番号を指しています。</p>
      <div class="fig-wrap">${connectorSvg}</div>
    </div>`;
};

/* ================================================================
 * QCM 電子モジュール前面（LED と X1〜X8）
 * ================================================================ */

FIGURES.qcm = function () {
  const cell = (x, y, t) => `
    <rect x="${x}" y="${y}" width="22" height="22" fill="#fff" stroke="#8a8a88" stroke-width="1.5"/>
    <text x="${x + 11}" y="${y + 15.5}" text-anchor="middle" font-size="11" font-weight="700" fill="#111">${t}</text>`;
  const block = (x, label, top, bottom) => {
    let s = `<text x="${x + (top.length * 22) / 2}" y="76" text-anchor="middle" font-size="15" font-weight="800" fill="#111">${label}</text>`;
    top.forEach((t, i) => { s += cell(x + i * 22, 88, t); });
    bottom.forEach((t, i) => { s += cell(x + i * 22, 110, t); });
    return s;
  };
  const roundConn = (cx, cy, r, pins, label) => {
    let s = `
      <text x="${cx}" y="76" text-anchor="middle" font-size="15" font-weight="800" fill="#111">${label}</text>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#d8d8d6" stroke="#6f6f6d" stroke-width="2.5"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 8}" fill="#efefec" stroke="#8a8a88" stroke-width="1.5"/>`;
    for (let i = 0; i < pins; i++) {
      const a = (Math.PI * 2 * i) / pins - Math.PI / 2;
      s += `<circle cx="${cx + Math.cos(a) * (r - 15)}" cy="${cy + Math.sin(a) * (r - 15)}" r="3" fill="#7a7a78"/>`;
    }
    return s;
  };

  const svg = `
  <svg viewBox="0 0 680 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QCM 前面のLEDとコネクタ">
    <rect x="14" y="40" width="652" height="150" rx="16" fill="#bdbdbb" stroke="#7c7c7a" stroke-width="2.5"/>
    <!-- 左: 緑・赤 LED -->
    <circle cx="46" cy="96" r="8" fill="#37a63e" stroke="#1d6f24" stroke-width="2"/>
    <circle cx="46" cy="128" r="8" fill="#d33434" stroke="#8f1d1d" stroke-width="2"/>
    <text x="46" y="76" text-anchor="middle" font-size="11" font-weight="700" fill="#333">緑／赤</text>
    ${block(76, "X1", ["2"], ["1"])}
    ${block(120, "X2", ["2"], ["1"])}
    ${block(168, "X3", ["8", "7", "6", "5"], ["4", "3", "2", "1"])}
    ${block(280, "X4", ["4", "3"], ["2", "1"])}
    ${block(348, "X5", ["4", "3"], ["2", "1"])}
    ${block(416, "X6", ["2"], ["1"])}
    <!-- 橙 LED 上下 -->
    <circle cx="466" cy="96" r="7" fill="#f59f00" stroke="#a86e00" stroke-width="2"/>
    <circle cx="466" cy="128" r="7" fill="#f59f00" stroke="#a86e00" stroke-width="2"/>
    <text x="466" y="76" text-anchor="middle" font-size="11" font-weight="700" fill="#333">橙</text>
    ${roundConn(530, 118, 28, 4, "X7")}
    ${roundConn(614, 118, 34, 5, "X8")}
  </svg>`;

  return `
    <div class="detail-section">
      <h2>QCM 前面図（LED とコネクタの位置）</h2>
      <p class="qpm-note">左端が緑（上）・赤（下）の LED、X6 の右が橙（上下）の LED です。丸形コネクタは X7＝QPM ケーブル、X8＝CAN バス（DC2／QLM 側）の接続です。各 LED の意味は下の表を参照してください。</p>
      <div class="fig-wrap">${svg}</div>
    </div>`;
};

/* ================================================================
 * システム構成図（マシン電気キット 8001118 の簡略図）
 * ================================================================ */

FIGURES.system = function () {
  const box = (x, y, w, h, lines, fill) => {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill || "#f4f4f2"}" stroke="#444" stroke-width="2"/>`;
    lines.forEach((t, i) => {
      s += `<text x="${x + w / 2}" y="${y + h / 2 + (i - (lines.length - 1) / 2) * 15 + 4.5}"
              text-anchor="middle" font-size="12.5" font-weight="${i === 0 ? 800 : 600}" fill="#111">${t}</text>`;
    });
    return s;
  };
  const wire = (pts) => `<polyline points="${pts}" fill="none" stroke="#222" stroke-width="3" stroke-linejoin="round"/>`;

  const svg = `
  <svg viewBox="0 0 740 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DC2 QSC システム構成図">
    <!-- 配線 -->
    ${wire("110,74 110,140 505,140 505,235")}            <!-- QLM → マシンケーブル → CM X1 -->
    ${wire("620,80 620,140")}                            <!-- チルトローテータ → マシンケーブル -->
    ${wire("255,96 255,190 470,190 470,235")}            <!-- ジョイスティック左 → CM X2 -->
    ${wire("385,96 385,190")}                            <!-- ジョイスティック右 → 同上 -->
    ${wire("255,96 255,120 160,120 160,368")}            <!-- グリップ → QCM（エミュレーション） -->
    ${wire("540,235 540,166 622,166")}                   <!-- ダブルフィーダ → CM X1 -->
    ${wire("505,325 505,420 340,420 340,400")}           <!-- CM X3 ↔ QCM -->
    ${wire("340,440 340,470 540,470 540,505")}           <!-- QCM/CM → 電源 -->
    ${wire("230,440 230,505 120,505 120,296")}           <!-- QCM → 接地圧センサ -->
    ${wire("300,368 300,140")}                           <!-- QCM → ツールロックバルブ（マシンケーブルへ） -->
    ${wire("380,400 380,340 640,340 640,368")}           <!-- QCM X7 → QPM -->

    <!-- ラベルタグ -->
    ${figTag(310, 140, "マシンケーブル 842196")}
    ${figTag(330, 190, "ジョイスティック 841190")}
    ${figTag(160, 240, "エミュレーション 8000593")}
    ${figTag(614, 200, "フィーダ 841108")}
    ${figTag(505, 445, "QCM接続 8001362／8001356")}
    ${figTag(120, 330, "接地圧 8001120")}
    ${figTag(300, 240, "ツールロック 8000101")}
    ${figTag(560, 340, "QPMケーブル（X7）")}
    ${figTag(430, 470, "電源 9〜32V・15A")}

    <!-- モジュール -->
    ${box(50, 30, 120, 44, ["QLM", "Q-Safeライト"], "#fff8d6")}
    ${box(555, 30, 130, 50, ["チルトローテータ", "（TM）"], "#fff8d6")}
    ${box(200, 46, 110, 50, ["ジョイスティック", "左（X21）"])}
    ${box(330, 46, 110, 50, ["ジョイスティック", "右（X22）"])}
    ${box(605, 142, 110, 48, ["ダブルフィーダ", "7001793"])}
    ${box(430, 235, 150, 90, ["CM 運転室モジュール", "841105", "X1｜X2｜X3"], "#ffe98a")}
    ${box(150, 368, 240, 72, ["QCM 電子モジュール", "8000139", "X1〜X8"], "#ffe98a")}
    ${box(590, 368, 110, 64, ["QPM", "操作パネル", "8000138"], "#fff8d6")}
    ${box(60, 252, 120, 44, ["接地圧センサ", "7001528"])}
    ${box(470, 505, 140, 40, ["バッテリー電源"])}
  </svg>`;

  return `
    <div class="detail-section fig-orig">
      <h2>取付説明書の概略図（マシン電気キット 8001118）</h2>
      <p class="qpm-note">engcon 取付説明書 9000876「4.4.2. 概略図」より。実際の配線図はこちらを参照してください。</p>
      <div class="fig-wrap">
        <img src="img/wiring-8001118.png" class="fig-img"
             alt="マシン電気キット 8001118 概略図（取付説明書 9000876 より）"
             onerror="this.closest('.fig-orig').style.display='none'">
      </div>
    </div>
    <div class="detail-section">
      <h2>システム構成図（簡略図）</h2>
      <p class="qpm-note">DC2 QSC システムの各モジュールとケーブルのつながりを整理した簡略図です。黄色のタグはケーブルの部品番号です。アラーム文の「CM-X1」「TM-X○」などは、この図の該当モジュールのコネクタを指します。</p>
      <div class="fig-wrap">${svg}</div>
    </div>`;
};
