/*
 * engcon DC2 アラームデータ（Id 0〜172）
 * engcon MicroConf DC2 トラブルシューティング資料（英語）を日本語訳したものです。
 * 表示側ロジックは app.js を参照。
 */
"use strict";

/* ---------- カテゴリ定義 ---------- */
const CATEGORIES = [
  { id: "pwm",      name: "PWM出力（キャビンモジュール）", icon: "⚡" },
  { id: "joystick", name: "ジョイスティック",             icon: "🕹️" },
  { id: "dio",      name: "デジタル入出力（DO／DI）",      icon: "🔌" },
  { id: "toollock", name: "ツールロック",                 icon: "🔒" },
  { id: "tm",       name: "チルトローテーターモジュール",  icon: "⚙️" },
  { id: "em",       name: "拡張モジュール",               icon: "📦" },
  { id: "safety",   name: "安全機能・圧力監視",           icon: "🛡️" },
  { id: "comm",     name: "通信（CAN・EML・C2C）",        icon: "📡" },
  { id: "other",    name: "その他・予約番号",             icon: "📄" },
];

/* ---------- 種別・対象者ラベル ---------- */
const TYPE_LABEL = {
  short:    "短絡（ショート）",
  open:     "断線（オープン）",
  calib:    "較正エラー",
  signal:   "信号異常",
  block:    "ブロック（安全機能）",
  comm:     "通信異常",
  internal: "内部エラー",
  config:   "設定・バージョン",
  none:     "情報なし",
};

const AUDIENCE_LABEL = {
  user:    "まずお客様で確認できます",
  service: "点検が必要（販売店・サービス推奨）",
  support: "サポートへ連絡",
};

/* ---------- 共通文（複数のアラームで共用される定型文） ---------- */
const TXT = {
  checkCMX1: "キャビンモジュールからコネクタ CM-X1 を外し、ピンとケーブルが正しく取り付けられているか、他のピンとの短絡がないかを確認します。",
  pwmShortCauses: [
    "バルブケーブルが損傷している可能性があります。",
    "コネクタ CM-X1 内での短絡。",
    "バルブコイル内での短絡。",
    "キャビンモジュールのコネクタ CM-X1 の出力不良。",
  ],
  pwmShortSteps: [
    "キャビンモジュールからコネクタ CM-X1 を外し、ピンとケーブルが正しく取り付けられているか、他のピンとの短絡がないかを確認します。",
    "バルブからバルブコネクタを外してシステムを試運転します。それでも短絡アラームが出る場合、原因はケーブル・コネクタ・キャビンモジュール出力のいずれかにある可能性が高いです。逆に断線アラーム（PWM X OPEN CIRCUIT CM-X1:x）が出る場合は、コイル内の短絡が原因と考えられます。",
    "コネクタ CM-X1 からピンを抜きます。それでも短絡アラームが出る場合、キャビンモジュールの出力不良の可能性が高いです。確認のため、バルブコネクタをフィーダーコイルに接続した状態で、ケーブルの2本のピン間の抵抗を測定してください。コイルの抵抗は約 5Ω が正常値です。",
  ],
  pwmOpenCauses: [
    "バルブケーブルが損傷している可能性があります。",
    "CM-X1 とバルブコイルの間の接触不良やガタ。",
  ],
  pwmOpenStep: "バルブケーブルが CM-X1 側とバルブコイル側の両方に正しく接続されているか確認します。",
  jsShortDesc: "プロポーショナルローラーからのアナログ信号の短絡（ショート）です（対象のローラーはアラーム文に表示されます）。",
  jsShortCauses: [
    "取付作業中に発生した場合は、ジョイスティック配線の接続ミスの可能性が高いです。",
    "ジョイスティック配線の損傷。",
    "プロポーショナルローラー本体、またはジョイスティック内部配線の故障の可能性。",
  ],
  jsShortSteps: [
    "新規取付の場合は、ジョイスティックの接続を確認します。",
    "Microconf の IO 画面（IOオーバービュー）で信号レベルを確認します。",
    "可能であれば2つのローラーを入れ替えてみます。入力側でローラーの入れ替わりが確認できれば、故障はローラー側にある可能性が高いです。そうでなければ、配線・接続・キャビンモジュールのいずれかが原因と考えられます。",
  ],
  jsOpenDesc: "プロポーショナルローラーからのアナログ信号の断線（オープン）です（対象のローラーはアラーム文に表示されます）。",
  jsOpenCauses: [
    "取付作業中に発生した場合は、ジョイスティック配線の接続ミスの可能性が高いです。",
    "システムに存在しないローラーに対するアラームの場合（例：各ジョイスティックにローラーが1〜2個しかないシステムで LA3／RA3 のアラームが出る場合）、存在しないローラーに機能が割り当てられていることが原因です。",
    "ジョイスティック配線の損傷。",
    "プロポーショナルローラー本体、またはジョイスティック内部配線の故障の可能性。",
  ],
  jsOpenSteps: [
    "新規取付の場合は、ジョイスティックの接続を確認します。",
    "Microconf で有効になっているすべてのユーザーバンクを確認し、接続されていないローラーはすべて「使用しない」に設定します。",
    "Microconf の IO 画面（IOオーバービュー）で信号レベルを確認します。",
    "可能であれば2つのローラーを入れ替えてみます。入力側でローラーの入れ替わりが確認できれば、故障はローラー側にある可能性が高いです。そうでなければ、配線・接続・キャビンモジュールのいずれかが原因と考えられます。",
  ],
  jsMinDesc: "プロポーショナルローラーのアナログ信号が、較正（キャリブレーション）された最小値を下回っています。対象のローラーはアラーム文に表示されます。",
  jsMaxDesc: "プロポーショナルローラーのアナログ信号が、較正（キャリブレーション）された最大値を上回っています。対象のローラーはアラーム文に表示されます。",
  jsCalibCauses: ["プロポーショナルローラーが正しく較正されていません。"],
  jsCalibSteps: ["プロポーショナルローラーの較正（キャリブレーション）を実施します。"],
  jsDbDesc: "システム起動時にプロポーショナルローラーが操作されている、とシステムが判断しました（対象のローラーはアラーム文に表示されます）。",
  jsDbCauses: [
    "起動時にプロポーショナルローラーが操作されていた。",
    "プロポーショナルローラーが正しく較正されていない。",
    "ローラーが引っかかっていて、中立位置に戻れない。",
  ],
  jsDbSteps: [
    "プロポーショナルローラーの較正（キャリブレーション）を実施します。",
    "ローラーに引っかかりがないか確認します。",
    "Microconf でローラーのデッドバンド（不感帯）を広げます。",
  ],
  jsSigDesc: "プロポーショナルローラーからの信号の異常です（対象のローラーはアラーム文に表示されます）。",
  jsSigCauses: ["アラームが繰り返し発生する場合、故障はプロポーショナルローラー側にある可能性が高いです。"],
  jsSigSteps: [
    "可能であれば2つのローラーを入れ替えてみます。入力側でローラーの入れ替わりが確認できれば、故障はローラー側にある可能性が高いです。そうでなければ、配線・接続・キャビンモジュールのいずれかが原因と考えられます。",
  ],
  btnShortDesc: "ジョイスティックの安全ボタンの短絡です（対象のボタンはアラーム文に表示されます）。安全ボタンは交互信号方式で、ボタンを押している間は一方の信号が High、離している間はもう一方の信号が High になります。ボタンを操作すると両方の信号が同時に切り替わります。両方の信号が同時に High になったとき、短絡アラームが作動します。",
  btnShortCauses: [
    "取付作業中に発生した場合は、ジョイスティック配線の接続ミスの可能性が高いです。",
    "ジョイスティック配線の損傷。",
    "ボタン本体、またはジョイスティック内部配線の故障の可能性。",
  ],
  btnShortSteps: [
    "新規取付の場合は、ジョイスティックの接続を確認します。",
    "テスター（マルチメーター）で、ボタンの2つの信号間に短絡がないか確認します。ボタンの交互出力信号の間に電流が流れることは本来ありません。",
  ],
  btnOpenDesc: "ジョイスティックの安全ボタンの断線です（対象のボタンはアラーム文に表示されます）。安全ボタンは交互信号方式で、ボタンを押している間は一方の信号が High、離している間はもう一方の信号が High になります。ボタンを操作すると両方の信号が同時に切り替わります。両方の信号が同時に Low になったとき、断線アラームが作動します。",
  btnOpenCauses: [
    "取付作業中に発生した場合は、ジョイスティック配線の接続ミスの可能性が高いです。",
    "通常ボタン（安全ボタンでないボタン）に ON/OFF 機能が割り当てられている。入力側が安全ボタンに対応していても、ジョイスティック側が通常ボタンの場合があります。その場合、そのボタンで ON/OFF 機能（例：Extra1）を操作することはできません。",
    "ジョイスティック配線の損傷。",
  ],
  btnOpenSteps: [
    "新規取付の場合は、ジョイスティックの接続を確認します。",
    "そのボタンが安全ボタンかどうかを確認します。安全ボタンでない場合は、すべてのユーザーバンクを確認し、ON/OFF 機能が割り当てられていないことを確認します。設定を保存し、システムを再起動しないと新しい設定は反映されません。",
  ],
  btnStartDesc: "ON/OFF 機能の操作に使用されるジョイスティックのボタンが、システム起動時に押された状態でした。アラームのリセットにはシステムの再起動が必要です。",
  btnStartCauses: [
    "起動時にボタンが押し込まれていた。",
    "取付作業中に発生した場合は、ジョイスティック配線の接続ミスの可能性が高いです。",
  ],
  btnStartSteps: ["新規取付の場合は、ジョイスティックの接続を確認します。"],
  tmOpenDesc: "チルトローテーターモジュールの出力の断線です（対象の出力はアラーム文に表示されます）。",
  tmOpenCauses: [
    "バルブコネクタのガタ、またはバルブコネクタの未接続。",
    "バルブケーブルの損傷の可能性。",
    "チルトローテーターモジュールの不良。",
  ],
  tmOpenSteps: ["すべてのケーブルが無傷であること、すべてのバルブコネクタが確実に接続されていることを確認します。"],
  emOpenDesc: "拡張モジュールの出力の断線です（対象の出力はアラーム文に表示されます）。",
  emOpenCauses: [
    "バルブコネクタのガタ、またはバルブコネクタの未接続。",
    "バルブケーブルの損傷の可能性。",
    "拡張モジュールの不良。",
  ],
  emOpenSteps: ["すべてのケーブルが無傷であること、すべてのバルブコネクタが確実に接続されていることを確認します。"],
  tmInternalCauses: ["チルトモジュール（チルトローテーターモジュール）の内部エラー。"],
  tmInternalSteps: ["イグニッションを入れ直してシステムを再起動します。問題が解消しない場合はサポートにご連絡ください。"],
  emlConnDesc: "AGW モジュールとキャビンモジュールの間で通信障害が発生するとこのアラームが作動します。",
  emlConnCauses: ["キャビンモジュールと AGW モジュールの間でデータが送られていない、または不正なデータが送られている。"],
  emlConnSteps: [
    "AGW モジュールとショベル制御システムの CAN 接続を確認します。この接続は AGW 経由でキャビンモジュールに送られる内容に影響します。",
    "Microconf の EML タブの設定を確認します。",
    "内部 CAN バス上に他のモジュール（例：センサー）がある場合は、1台ずつ切り離して、CAN バスを妨害しているものがないか確認します。",
    "MSU プログラムを使って AGW モジュールを最新のソフトウェアに更新してみます。",
  ],
  noInfoDesc: "この番号の詳細情報はありません。アラームが継続する場合は、販売店またはサポートにご連絡ください。",
  reservedDesc: "この番号は予約（RESERVED）されており、現在は使用されていません。",
};

/* ---------- エントリ生成ヘルパー ---------- */

// PWM 短絡（Id 0〜5）
function pwmShort(id, num, pin, target, related) {
  return {
    id, code: `PWM ${num} SHORT CIRCUIT CM-X1.${pin}`,
    title: `PWM${num} 出力の短絡`,
    cat: "pwm", type: "short", audience: "service",
    desc: `${target}出力 PWM${num}（CM-X1.${pin}）の短絡（ショート）です。`,
    causes: TXT.pwmShortCauses, steps: TXT.pwmShortSteps, related,
  };
}

// PWM 断線（Id 8〜13）
function pwmOpen(id, num, pin, target, related, extraStep) {
  const steps = [TXT.pwmOpenStep];
  if (extraStep) steps.push(extraStep);
  return {
    id, code: `PWM ${num} OPEN CIRCUIT CM-X1.${pin}`,
    title: `PWM${num} 出力の断線`,
    cat: "pwm", type: "open", audience: "service",
    desc: `${target}出力 PWM${num}（CM-X1.${pin}）の断線（オープン）です。`,
    causes: TXT.pwmOpenCauses, steps, related,
  };
}

// ジョイスティック ローラー1系統分（短絡・断線・最小・最大・[中立外]）
function jsGroup(startId, roller, pin, sigId, hasDb) {
  const codeBase = `JOYSTICK ${roller}`;
  const group = [];
  const ids = [];
  for (let i = 0; i < (hasDb ? 5 : 4); i++) ids.push(startId + i);
  const rel = (self) => ids.filter((x) => x !== self).concat([sigId]);
  group.push({
    id: startId, code: `${codeBase} SHORT CIRCUIT CM-X2.${pin}`,
    title: `ジョイスティック ${roller} 短絡`, cat: "joystick", type: "short", audience: "service",
    desc: TXT.jsShortDesc, causes: TXT.jsShortCauses, steps: TXT.jsShortSteps, related: rel(startId),
  });
  group.push({
    id: startId + 1, code: `${codeBase} OPEN CIRCUIT CM-X2.${pin}`,
    title: `ジョイスティック ${roller} 断線`, cat: "joystick", type: "open", audience: "service",
    desc: TXT.jsOpenDesc, causes: TXT.jsOpenCauses, steps: TXT.jsOpenSteps, related: rel(startId + 1),
  });
  group.push({
    id: startId + 2, code: `${codeBase} BELOW MIN CM-X2.${pin}`,
    title: `ジョイスティック ${roller} 最小値未満`, cat: "joystick", type: "calib", audience: "user",
    desc: TXT.jsMinDesc, causes: TXT.jsCalibCauses, steps: TXT.jsCalibSteps, related: rel(startId + 2),
  });
  group.push({
    id: startId + 3, code: `${codeBase} ABOVE MAX CM-X2.${pin}`,
    title: `ジョイスティック ${roller} 最大値超過`, cat: "joystick", type: "calib", audience: "user",
    desc: TXT.jsMaxDesc, causes: TXT.jsCalibCauses, steps: TXT.jsCalibSteps, related: rel(startId + 3),
  });
  if (hasDb) {
    group.push({
      id: startId + 4, code: `${codeBase} START:OUTSIDE DB CM-X2.${pin}`,
      title: `ジョイスティック ${roller} 起動時に中立位置外`, cat: "joystick", type: "calib", audience: "user",
      desc: TXT.jsDbDesc, causes: TXT.jsDbCauses, steps: TXT.jsDbSteps, related: rel(startId + 4),
    });
  }
  return group;
}

// ジョイスティック 信号異常（Id 76〜81）
function jsSignal(id, roller, pins, relIds) {
  return {
    id, code: `JOYSTICK ${roller} SIGNAL ERROR CM-X2.${pins}`,
    title: `ジョイスティック ${roller} 信号異常`, cat: "joystick", type: "signal", audience: "service",
    desc: TXT.jsSigDesc, causes: TXT.jsSigCauses, steps: TXT.jsSigSteps, related: relIds,
  };
}

// ジョイスティック 安全ボタン 短絡／断線／起動時作動
function btnShort(id, btn, pins, related) {
  return {
    id, code: `JOYSTICK ${btn} SHORT CIRCUIT CM-X2.${pins}`,
    title: `ジョイスティック ${btn} ボタン短絡`, cat: "joystick", type: "short", audience: "service",
    desc: TXT.btnShortDesc, causes: TXT.btnShortCauses, steps: TXT.btnShortSteps, related,
  };
}
function btnOpen(id, btn, pins, related) {
  return {
    id, code: `JOYSTICK ${btn} OPEN CIRCUIT CM-X2.${pins}`,
    title: `ジョイスティック ${btn} ボタン断線`, cat: "joystick", type: "open", audience: "service",
    desc: TXT.btnOpenDesc, causes: TXT.btnOpenCauses, steps: TXT.btnOpenSteps, related,
  };
}
function btnStart(id, btn, pins, related) {
  return {
    id, code: `JOYSTICK ${btn} START: DI ACTIVE CM-X2.${pins}`,
    title: `ジョイスティック ${btn} 起動時にボタン作動`, cat: "joystick", type: "block", audience: "user",
    desc: TXT.btnStartDesc, causes: TXT.btnStartCauses, steps: TXT.btnStartSteps,
    restart: true, related,
  };
}

// チルトローテーターバルブ 断線（Id 96〜103）
function tmValveOpen(id, valve, port, fn) {
  return {
    id, code: `VALVE ${valve} OPEN CIRCUIT TM-X${port} ${fn.en}`,
    title: `バルブ${valve} 断線（${fn.ja}）`, cat: "tm", type: "open", audience: "service",
    desc: TXT.tmOpenDesc, causes: TXT.tmOpenCauses, steps: TXT.tmOpenSteps, related: [95],
  };
}

// 拡張モジュール 断線（Id 135〜138）
function emValveOpen(id, port, pwm) {
  return {
    id, code: `EXPANSION MODULE OPEN CIRCUIT EM-X${port} (${pwm})`,
    title: `拡張モジュール 断線（${pwm}）`, cat: "em", type: "open", audience: "service",
    desc: TXT.emOpenDesc, causes: TXT.emOpenCauses, steps: TXT.emOpenSteps, related: [133, 134],
  };
}

// TM 内部エラー（Id 140〜144, 146）
function tmInternal(id, codeSuffix, label) {
  return {
    id, code: `TM FAULT SYSTEM ERROR ${codeSuffix}`,
    title: `チルトモジュール内部エラー（${label}）`, cat: "tm", type: "internal", audience: "support",
    desc: "チルトローテーターモジュール内部のシステムエラーです。",
    causes: TXT.tmInternalCauses, steps: TXT.tmInternalSteps, related: [],
  };
}

// 情報なし・予約
function noInfo(id, code, title, cat, reserved) {
  return {
    id, code, title, cat: cat || "other", type: "none", audience: "support",
    desc: reserved ? TXT.reservedDesc : TXT.noInfoDesc,
    causes: [], steps: [], related: [], noInfo: true,
  };
}

/* ---------- アラーム定義（Id 0〜172） ---------- */
const ALARMS = [
  pwmShort(0, "1", "1", "通常フィーダー（給油バルブ）に接続されている", [8]),
  pwmShort(1, "2", "3", "通常フィーダー2に接続されている（フィーダー2はチルトローテーターへの給油には使用されず、ダブルフィーダーモードでのみ使用されます）", [9]),
  pwmShort(2, "3A", "5", "通常、走行制御・ホイール制御・その他の機体制御に使用される", [10]),
  pwmShort(3, "3B", "7", "通常、走行制御・ホイール制御・その他の機体制御に使用される", [11]),
  pwmShort(4, "4A", "9", "通常、走行制御・その他の機体制御に使用される", [12]),
  pwmShort(5, "4B", "11", "通常、走行制御・その他の機体制御に使用される", [13]),
  {
    id: 6, code: "PWM 5 OPEN CIRCUIT CM-X3.9",
    title: "PWM5 出力の断線（ジョイスティックエミュレーション）",
    cat: "pwm", type: "open", audience: "service",
    desc: "ジョイスティックエミュレーションで使用される信号出力 PWM5（CM-X3.9）の断線です。",
    causes: ["CM-X3 と機械側レバー入力の間の接触不良またはガタ。"],
    note: "このアラームは PWM5 が有効になると必ず作動します。設定を保存してシステムを再起動するとアラームがリセットされます。",
    steps: ["PWM アナログ変換器を使用している場合は、変換器のアラーム状態（赤色 LED の点滅）を確認し、該当するマニュアルを参照してください。"],
    related: [7, 14],
  },
  {
    id: 7, code: "PWM 6 OPEN CIRCUIT CM-X3.10",
    title: "PWM6 出力の断線（ジョイスティックエミュレーション）",
    cat: "pwm", type: "open", audience: "service",
    desc: "ジョイスティックエミュレーションで使用される信号出力 PWM6（CM-X3.10）の断線です。",
    causes: ["CM-X3 と機械側レバー入力の間の接触不良またはガタ。"],
    note: "このアラームは PWM5 が有効になると必ず作動します。設定を保存してシステムを再起動するとアラームがリセットされます。",
    steps: ["PWM アナログ変換器を使用している場合は、変換器のアラーム状態（赤色 LED の点滅）を確認し、該当するマニュアルを参照してください。"],
    related: [6, 15],
  },
  pwmOpen(8, "1", "1", "通常フィーダー（給油バルブ）に接続されている", [0],
    "フィーダーの代わりにジョイスティックエミュレーションを使用している場合は、Microconf で PWM5 をフィーダー出力として有効にします。"),
  pwmOpen(9, "2", "3", "通常フィーダー2に接続されている（フィーダー2はチルトローテーターへの給油には使用されず、ダブルフィーダーモードでのみ使用されます）", [1]),
  pwmOpen(10, "3A", "5", "通常、走行制御・ホイール制御・その他の機体制御に使用される", [2]),
  pwmOpen(11, "3B", "7", "通常、走行制御・ホイール制御・その他の機体制御に使用される", [3]),
  pwmOpen(12, "4A", "9", "通常、走行制御・その他の機体制御に使用される", [4]),
  pwmOpen(13, "4B", "11", "通常、走行制御・その他の機体制御に使用される", [5]),
  noInfo(14, "PWM 5 SIGNAL ERROR CM-X3.9", "PWM5 信号異常", "pwm"),
  noInfo(15, "PWM 6 SIGNAL ERROR CM-X3.10", "PWM6 信号異常", "pwm"),
  {
    id: 16, code: "ACT. SWITCH NOT ACTIVE CM-X3.1",
    title: "起動スイッチ未作動（走行／ホイール制御）",
    cat: "safety", type: "block", audience: "user",
    desc: "走行／ホイール制御が有効になっていない状態で、走行／ホイール制御用のローラーが操作されるとアラームが作動します。",
    causes: [],
    steps: ["パネルスイッチで走行／ホイール制御を有効にします。この操作はシステムを再起動するたびに毎回必要です。"],
    related: [],
  },
  // ジョイスティック各ローラー
  ...jsGroup(17, "LA1", "1", 76, true),
  ...jsGroup(22, "RA1", "8", 77, true),
  ...jsGroup(27, "LA1", "2", 76, false),
  ...jsGroup(31, "RA1", "9", 77, false),
  ...jsGroup(35, "LA2", "3", 78, true),
  ...jsGroup(40, "RA2", "10", 79, true),
  ...jsGroup(45, "LA2", "4", 78, false),
  ...jsGroup(49, "RA2", "11", 79, false),
  ...jsGroup(53, "LA3", "5", 80, true),
  ...jsGroup(58, "RA3", "12", 81, true),
  ...jsGroup(63, "LA3", "6", 80, false),
  ...jsGroup(67, "RA3", "13", 81, false),
  noInfo(71, "CV VALVE MISSING INPUT MALFUNCTION", "CVバルブ 入力欠落異常", "safety"),
  {
    id: 72, code: "DO 1 SHORT CIRCUIT CM-X1.13",
    title: "デジタル出力 DO1 の短絡",
    cat: "dio", type: "short", audience: "service",
    desc: "デジタル出力 DO1（CM-X1.13）の短絡です。DO1 はダブルフィーダーや走行制御などの安全ブロック内にある ON/OFF バルブの制御に使用されます。",
    causes: [
      "24V 機に 12V コイルが取り付けられている（コイルが溶けて短絡の原因になります）。",
      "バルブケーブルが損傷している可能性があります。",
      "コネクタ CM-X1 内での短絡。",
    ],
    steps: [
      "機械の電圧が 24V の場合、ON/OFF バルブのコイルが 12V 仕様になっていないか確認します。なお、比例（プロポーショナル）コイルは常に 12V です。",
      TXT.checkCMX1,
    ],
    related: [108],
  },
  {
    id: 73, code: "DO2 SHORT CIRCUIT CM-X1.15",
    title: "デジタル出力 DO2 の短絡",
    cat: "dio", type: "short", audience: "service",
    desc: "デジタル出力 DO2（CM-X1.15）の短絡です。DO2 はホイール制御ブロック内の ON/OFF バルブの制御に使用されます。",
    causes: [
      "24V 機に 12V コイルが取り付けられている（コイルが溶けて短絡の原因になります）。",
      "バルブケーブルが損傷している可能性があります。",
      "コネクタ CM-X1 内での短絡。",
    ],
    steps: [
      "機械の電圧が 24V の場合、ON/OFF バルブのコイルが 12V 仕様になっていないか確認します。なお、比例（プロポーショナル）コイルは常に 12V です。",
      TXT.checkCMX1,
    ],
    related: [109],
  },
  {
    id: 74, code: "DO3 SHORT CIRCUIT CM-X1.17",
    title: "デジタル出力 DO3 の短絡",
    cat: "dio", type: "short", audience: "service",
    desc: "デジタル出力 DO3 または DO4 の短絡です（対象の出力はアラーム文に表示されます）。出力の用途は機械や装備によって異なります。",
    causes: [
      "バルブケーブルが損傷している可能性があります。",
      "コネクタ CM-X1 内での短絡。",
      "バルブコイル内での短絡。",
    ],
    steps: [TXT.checkCMX1, "この出力に何が接続されているかを確認し、短絡箇所を探します。"],
    related: [110],
  },
  {
    id: 75, code: "DO4 SHORT CIRCUIT CM-X1.19",
    title: "デジタル出力 DO4 の短絡",
    cat: "dio", type: "short", audience: "service",
    desc: "デジタル出力 DO3 または DO4 の短絡です（対象の出力はアラーム文に表示されます）。出力の用途は機械や装備によって異なります。",
    causes: [
      "バルブケーブルが損傷している可能性があります。",
      "コネクタ CM-X1 内での短絡。",
      "バルブコイル内での短絡。",
    ],
    steps: [TXT.checkCMX1, "この出力に何が接続されているかを確認し、短絡箇所を探します。"],
    related: [111],
  },
  jsSignal(76, "LA1", "1-2", [17, 18, 27, 28]),
  jsSignal(77, "RA1", "8-9", [22, 23, 31, 32]),
  jsSignal(78, "LA2", "3-4", [35, 36, 45, 46]),
  jsSignal(79, "RA2", "10-11", [40, 41, 49, 50]),
  jsSignal(80, "LA3", "5-6", [53, 54, 63, 64]),
  jsSignal(81, "RA3", "12-13", [58, 59, 67, 68]),
  btnShort(82, "LD1", "14-15", [121, 127]),
  btnShort(83, "LD2", "16-17", [122, 128]),
  btnShort(84, "RD1", "21-22", [119, 124]),
  btnShort(85, "RD2", "23-24", [120, 125]),
  {
    id: 86, code: "DI SUPPLY SHORT CIRCUIT CM-X2.7",
    title: "DI 電源の短絡（ジョイスティックボタン）",
    cat: "joystick", type: "short", audience: "service",
    desc: "ジョイスティックのボタンへの電源供給の短絡です。",
    causes: [
      "取付作業中に発生した場合は、ジョイスティック配線の接続ミスの可能性が高いです。",
      "ジョイスティック配線の損傷。",
      "レバーと CM-X2 をつなぐ D-sub コネクタ内での短絡（可能性は低い）。",
    ],
    steps: [
      "新規取付の場合は、ジョイスティックの接続を確認します。",
      "ジョイスティックを片方ずつ外して、故障箇所を特定します。アラームのリセットにはシステムの再起動が必要です。",
      "CM-X2 に接続されているケーブルユニットを開け、はんだくずなどが他の端子と短絡していないか確認します。D-sub コネクタは側面のロックを小型ドライバーなどで開けて分解します。",
    ],
    restart: true, related: [88],
  },
  {
    id: 87, code: "DI SUPPLY SHORT CIRCUIT CM-X3 CMX1",
    title: "DI 電源の短絡（CM-X1／CM-X3）",
    cat: "dio", type: "short", audience: "service",
    desc: "コネクタ CM-X1 および CM-X3 のデジタル入力用電源の短絡です。デジタル入力への電源はまとめて監視されています。このアラームはジョイスティックやその配線とは関係ありません。デジタル入力の用途は機械や装備によって異なります。電源供給ピンの用途は以下のとおりです。",
    causes: [
      "安全ブロック（ダブルフィーダー／走行制御）の圧力スイッチ（CM-X1:25）",
      "ホイール制御ブロックの圧力スイッチ（CM-X1:27）",
      "走行／ホイール制御の起動スイッチ（CM-X3:14）",
      "ツールロックスイッチ（CM-X3:17）",
      "DI14・DI15 のその他の用途（CM-X3:15-16）",
    ],
    steps: [
      "上記のピンに接続されている機器を確認し、短絡箇所を探します。",
      "アラームのリセットにはシステムの再起動が必要です。修理できたかどうかを確認する際も再起動が必要です。",
    ],
    restart: true, related: [],
  },
  {
    id: 88, code: "AI SUPPLY SHORT CIRCUIT CM-X2.19",
    title: "AI 電源の短絡（プロポーショナルローラー）",
    cat: "joystick", type: "short", audience: "service",
    desc: "ジョイスティック内のプロポーショナルローラーへの電源供給の短絡です。",
    causes: [
      "取付作業中に発生した場合は、ジョイスティック配線の接続ミスの可能性が高いです。",
      "ジョイスティック配線の損傷。",
      "プロポーショナルローラー本体、またはジョイスティック内部配線の故障の可能性。",
      "レバーと CM-X2 をつなぐ D-sub コネクタ内での短絡（可能性は低い）。",
    ],
    steps: [
      "新規取付の場合は、ジョイスティックの接続を確認します。",
      "ジョイスティックを片方ずつ外して、故障箇所を特定します。アラームのリセットにはシステムの再起動が必要です。",
      "CM-X2 からコネクタを外し、ピン 19 と 20 の間の抵抗を測定して短絡の有無を確認します。コネクタはメス型のため、テスターの測定プローブが穴に合いません。細い針金などをプローブに当てて測定してください。",
      "CM-X2 に接続されているケーブルユニットを開け、はんだくずなどが他の端子と短絡していないか確認します。D-sub コネクタは側面のロックを小型ドライバーなどで開けて分解します。",
    ],
    restart: true, related: [86],
  },
  {
    id: 89, code: "TOOL LOCK TL SHORT CIRCUIT CM-X3.18-19",
    title: "ツールロックスイッチ入力の短絡",
    cat: "toollock", type: "short", audience: "service",
    desc: "ツールロックスイッチに使用される入力の短絡アラームです。ツールロックスイッチは2相式で、CM-X3 の2つの入力に接続されています。スイッチを操作すると一方の入力が High、もう一方が Low になります。両方の入力が同時に High、または同時に Low になるとアラームが作動します。",
    causes: ["ツールロックスイッチ・ケーブル・コネクタのいずれかでの短絡。"],
    steps: [
      "システム起動直後にアラームが出る場合は、CM-X3:18 が＋（プラス）側に短絡しているか、CM-X3:19 がグランド（アース）に短絡している可能性が高いです。",
      "ツールロックスイッチを操作したときにだけアラームが出る場合は、2つの入力（CM-X3:18 と CM-X3:19）の間で短絡している可能性が高いです。",
    ],
    related: [90, 130],
  },
  noInfo(90, "TOOL LOCK TL OPEN CIRCUIT CM-X3.18-19", "ツールロックスイッチ入力の断線", "toollock"),
  noInfo(91, "CM SAFE STATE SYSTEM", "キャビンモジュール セーフステート", "safety"),
  {
    id: 92, code: "TILTROTATOR DISCONNECTED",
    title: "チルトローテーター通信断",
    cat: "tm", type: "comm", audience: "service",
    desc: "キャビンモジュールがチルトローテーターモジュールと通信できていません。旧バージョンでは「TM FAULT NO HEARTBEAT CM-X1.28-35」という名称のアラームでした。",
    causes: [
      "チルトローテーターが一時的に取り外されている。",
      "取付作業中に発生した場合は、CM-X1 での機械ケーブルの接続ミスの可能性が非常に高いです。",
      "機械ケーブルの損傷、またはコネクタのガタ。",
      "チルトローテーターモジュールの不良。",
      "キャビンモジュールの不良（可能性は低い）。",
    ],
    steps: [
      "新規取付の場合は、CM-X1 での機械ケーブルの接続を確認します。",
      TXT.checkCMX1,
      "CM-X1 を接続した状態で、ユニットケーブルとチルトローテーターモジュールの間の4極 Deutsch コネクタを外します。ピン1と2の間に機械電圧が来ているか確認します。",
      "CM-X1 から4極 Deutsch コネクタまでの配線全体を確認します。",
      "可能であれば、チルトローテーターモジュールおよび／またはキャビンモジュールを交換してみます。テストではチルトローテーターモジュールの4極 Deutsch コネクタを接続するだけで十分で、バルブ類の接続は不要です。キャビンモジュールが交換したチルトローテーターモジュールと通信できれば、このアラームは解除され、同時にツールロックバルブの断線による新しいアラームが作動します。ユニットが不良の場合は、販売店に連絡して保証請求を行ってください。",
    ],
    related: [94, 145],
  },
  {
    id: 93, code: "CAN SUPPLY SHORT CIRCUIT CM-X1.31",
    title: "CAN 電源の短絡（拡張モジュール）",
    cat: "em", type: "short", audience: "service",
    desc: "拡張モジュールへの電源供給で短絡が検出されました。",
    causes: ["キャビンモジュールから拡張モジュールまでのケーブルの損傷。"],
    steps: ["CM-X1.31 から拡張モジュールまでのケーブルを確認します。"],
    related: [133],
  },
  {
    id: 94, code: "CAN SUPPLY SHORT CIRCUIT CM-X1.35",
    title: "CAN 電源の短絡（チルトローテーターモジュール）",
    cat: "tm", type: "short", audience: "service",
    desc: "チルトローテーターモジュールへの電源供給で短絡が検出されました。",
    causes: ["キャビンモジュールからチルトローテーターモジュールまでの配線の損傷。"],
    steps: ["CM-X1.35 からチルトローテーターまでのケーブルを確認します。"],
    related: [92],
  },
  {
    id: 95, code: "TM VALVES SHORT CIRCUIT TM-X2-X10",
    title: "チルトローテーターバルブの短絡",
    cat: "tm", type: "short", audience: "service",
    desc: "チルトローテーターモジュールのいずれかの出力での短絡です。すべての出力がまとめて監視されているため、どの出力で短絡しているかをシステムは特定できません。アラームのリセットにはシステムの再起動が必要です。",
    causes: [
      "チルトローテーターバルブのコイルの短絡。",
      "バルブケーブルの損傷の可能性。",
      "チルトローテーターモジュールの不良。",
    ],
    steps: [
      "システムを再起動します。すぐに再発しない場合は、各機能を1つずつ両方向に動かして、どの操作でアラームが出るかを確認し、故障箇所を絞り込みます。",
      "すべてのバルブコネクタを外してシステムを再起動します。それでもアラームが続く場合は、モジュール本体またはその配線に問題があります。",
      "バルブを1つずつ接続しては再起動し、アラームが再発するかどうかで故障箇所を特定します。",
      "チルトローテーターのシャーシアース（車体アース）とバルブコイルの両端子との間の抵抗を測定します。どの端子もシャーシアースに導通していてはいけません。",
    ],
    restart: true,
    related: [96, 97, 98, 99, 100, 101, 102, 103],
  },
  tmValveOpen(96, "3", "3", { en: "ROT A", ja: "回転A" }),
  tmValveOpen(97, "2", "2", { en: "ROT B", ja: "回転B" }),
  tmValveOpen(98, "7", "7", { en: "TILT A", ja: "チルトA" }),
  tmValveOpen(99, "6", "6", { en: "TILT B", ja: "チルトB" }),
  tmValveOpen(100, "5", "5", { en: "EXTRA 1A", ja: "エクストラ1A" }),
  tmValveOpen(101, "4", "4", { en: "EXTRA 1B", ja: "エクストラ1B" }),
  tmValveOpen(102, "10", "10", { en: "EXTRA 2A", ja: "エクストラ2A" }),
  tmValveOpen(103, "9", "9", { en: "EXTRA 2B", ja: "エクストラ2B" }),
  {
    id: 104, code: "VALVE 1 OPEN CIRCUIT TM-X1 TOOL LOCK",
    title: "ツールロックバルブの断線",
    cat: "toollock", type: "open", audience: "service",
    desc: "ツールロックバルブ（チルトローテーターモジュール・ケーブル1）の断線アラームです。",
    causes: [
      "バルブコネクタのガタ、またはバルブコネクタの未接続。",
      "バルブケーブルの損傷の可能性。",
    ],
    steps: ["「1」のマークが付いたケーブルが無傷であること、バルブコネクタが確実に接続されていることを確認します。"],
    related: [105],
  },
  {
    id: 105, code: "VALVE 1 SHORT CIRCUIT TM-X1 TOOL LOCK",
    title: "ツールロックバルブの短絡",
    cat: "toollock", type: "short", audience: "service",
    desc: "ツールロックバルブ（チルトローテーターモジュール・ケーブル1）の短絡アラームです。",
    causes: ["バルブケーブルの損傷の可能性。"],
    steps: ["「1」のマークが付いたケーブルが無傷であること、バルブコネクタが確実に接続されていることを確認します。"],
    related: [104, 145],
  },
  noInfo(106, "DI SUPPLY SHORT CIRCUIT TM-X11", "DI 電源の短絡（TM-X11）", "tm"),
  {
    id: 107, code: "MASTER ACTIVE INHIBIT SIGNAL",
    title: "メインブロック信号の作動中に操作",
    cat: "safety", type: "block", audience: "user",
    desc: "メインブロック信号（システム全体のブロック信号）が有効な状態で、オペレーターが機能を操作しようとするとアラームが作動します。ブロック信号は入力信号でシステム全体をブロックするための機能で、通常は機械のセーフティゲート（安全レバー）に接続されています。信号は DI14（CM-X3:2）に接続されています。",
    causes: [
      "セーフティゲートが閉じていない状態で機能を操作した。",
      "ブロック信号の設定が正しくない。",
      "DI14 の短絡または接続ミス。",
    ],
    steps: [
      "Microconf でブロック信号の設定を確認します（マシンコントロール → ロジック にあります）。この機能を使用しない場合は、ブロックが有効になっていないことを確認してください。",
    ],
    related: [148],
  },
  {
    id: 108, code: "DO 1 OPEN CIRCUIT CM-X1.13",
    title: "デジタル出力 DO1 の断線",
    cat: "dio", type: "open", audience: "service",
    desc: "デジタル出力 DO1（CM-X1.13）の断線です。DO1 はダブルフィーダーや走行制御などの安全ブロック内にある ON/OFF バルブの制御に使用されます。",
    causes: [
      "安全ブロックが装着されていないのに、設定が有効になっている。",
      "バルブケーブルの損傷の可能性。",
      "バルブコネクタのガタ、またはバルブコネクタの未接続。",
    ],
    steps: [
      "安全ブロックが装着されていない場合（シングルフィーダーシステム）は、Microconf でダブルフィーダー・走行制御・拡張のいずれも有効になっていないことを確認します。",
      "安全ブロックが装着されている場合は、ON/OFF バルブの接続を確認します。",
    ],
    related: [72],
  },
  {
    id: 109, code: "DO 2 OPEN CIRCUIT CM-X1.15",
    title: "デジタル出力 DO2 の断線",
    cat: "dio", type: "open", audience: "service",
    desc: "デジタル出力 DO2（CM-X1.15）の断線です。DO2 はホイール制御ブロック内の ON/OFF バルブの制御に使用されます。",
    causes: [
      "新規取付の場合は、ホイール制御配線の接続ミスの可能性が非常に高いです。",
      "バルブケーブルの損傷の可能性。",
    ],
    steps: [
      "新規取付の場合は、ホイール制御配線の接続を確認します。",
      TXT.checkCMX1,
    ],
    related: [73],
  },
  {
    id: 110, code: "DO 3 OPEN CIRCUIT CM-X1.17",
    title: "デジタル出力 DO3 の断線",
    cat: "dio", type: "open", audience: "service",
    desc: "デジタル出力 DO3 または DO4 の断線です（対象の出力はアラーム文に表示されます）。出力の用途は機械や装備によって異なります。",
    causes: ["ホイール制御の新規取付の場合、Microconf の設定が原因の可能性があります。"],
    steps: [
      "ホイール制御の新規取付の場合、時速 20km 以上での使用制限の方式としてどれが選択されているかを確認します。DO3 を速度ブロックに使用していない場合は、DO3 を選択しないでください。",
      "この出力に何が接続されているかを確認し、断線箇所を探します。",
    ],
    related: [74],
  },
  {
    id: 111, code: "DO 4 OPEN CIRCUIT CM-X1.19",
    title: "デジタル出力 DO4 の断線",
    cat: "dio", type: "open", audience: "service",
    desc: "デジタル出力 DO3 または DO4 の断線です（対象の出力はアラーム文に表示されます）。出力の用途は機械や装備によって異なります。",
    causes: [],
    steps: ["この出力に何が接続されているかを確認し、断線箇所を探します。"],
    related: [75],
  },
  {
    id: 112, code: "JOYSTICK INVALID AI CALIBRATION",
    title: "ジョイスティック較正エラー",
    cat: "joystick", type: "calib", audience: "user",
    desc: "プロポーショナルローラーの較正（キャリブレーション）に失敗するとアラームが作動します。較正が正常に完了するまでアラームは解除されません。",
    causes: ["プロポーショナルローラーが正しく較正されていません。"],
    steps: ["すべてのプロポーショナルローラーの較正（キャリブレーション）を実施します。"],
    related: [],
  },
  noInfo(113, "RESERVED", "予約番号", "other", true),
  noInfo(114, "RESERVED", "予約番号", "other", true),
  noInfo(115, "RESERVED", "予約番号", "other", true),
  noInfo(116, "RESERVED", "予約番号", "other", true),
  noInfo(117, "RESERVED", "予約番号", "other", true),
  noInfo(118, "RESERVED", "予約番号", "other", true),
  btnOpen(119, "RD1", "21-22", [84, 124]),
  btnOpen(120, "RD2", "23-24", [85, 125]),
  btnOpen(121, "LD1", "14-15", [82, 127]),
  btnOpen(122, "LD2", "16-17", [83, 128]),
  {
    id: 123, code: "WHEEL CTRL. ACTIVE INHIBIT SIGNAL",
    title: "ホイール制御 ブロック信号の作動中に操作",
    cat: "safety", type: "block", audience: "user",
    desc: "デジタル入力 DI15（CM-X1:17）が有効な状態で、オペレーターがホイール制御を作動させようとするとアラームが作動します。DI15 はホイール制御のブロック信号として機能し、高速ギア走行時などにホイール制御を無効化するために使用できます。",
    causes: [
      "時速 20km 以上で走行可能な状態など、ホイール制御を作動させてはいけない状況で作動させようとした。",
      "DI15 の信号異常。",
    ],
    steps: ["DI15 の接続を確認します。"],
    related: [107],
  },
  btnStart(124, "RD1", "21-22", [84, 119]),
  btnStart(125, "RD2", "23-24", [85, 120]),
  btnStart(126, "RD3", "25", []),
  btnStart(127, "LD1", "14-15", [82, 121]),
  btnStart(128, "LD2", "16-17", [83, 122]),
  btnStart(129, "LD3", "18", []),
  {
    id: 130, code: "TOOL LOCK TL START: DI ACTIVE CM-X3.18-19",
    title: "ツールロック 起動時にスイッチ作動",
    cat: "toollock", type: "block", audience: "user",
    desc: "システム起動時にツールロックスイッチが作動状態だったため、ブロックされています。アラームのリセットにはシステムの再起動が必要です。",
    causes: ["起動時にツールロックスイッチが操作された状態になっていた。"],
    steps: ["ツールロックスイッチを戻してから、システムを再起動します。"],
    restart: true, related: [89],
  },
  {
    id: 131, code: "CVP MALFUNCTION NO PRESSURE CM-X1.24",
    title: "CVP 圧力未検出（安全ブロック／シングルフィーダー）",
    cat: "safety", type: "block", audience: "service",
    desc: "機能の作動中に圧力が検出されませんでした。このアラームは、安全ブロック（ダブルフィーダー／走行制御）内、またはシングルフィーダー内にある圧力監視スイッチ（装備により異なります）に関するものです。システムは安全のために圧力を監視し、安全ブロック／シングルフィーダーの機能を保証しています。",
    causes: [
      "機械の油圧が作動していない状態で機能を使用した。",
      "新規取付の場合は、圧力スイッチの接続ミスの可能性が非常に高いです。",
      "シングルフィーダーの場合、その機能のフィーダー最小電流の設定が低すぎることが原因の可能性があります。",
      "圧力スイッチの調整不良。圧力スイッチは出荷時に調整されていますが、機種によっては取付時に調整が必要な場合があります。",
    ],
    steps: [
      "圧力スイッチが CM-X1 に正しく接続されているか確認します。",
      "【シングルフィーダーのみ】チルトローテーター機能の最小電流が低すぎないか確認します。機能を微速で操作しながら、IO 画面で圧力スイッチ（CVP1 と表示）が圧力を検出するか確認します。高速で操作したときは圧力を検出するのに微速では検出しない場合、最小電流を上げる必要があります。微速操作でも圧力スイッチが反応するようになるまで最小電流を上げてください。その結果、最低速度が速くなりすぎる場合は、圧力スイッチの調整が必要な可能性があります。なお、圧力スイッチが安全ブロック内にある場合、機能の最小電流と圧力スイッチの状態に関連はありません。",
      "調整不良が問題を引き起こしている場合を除き、圧力スイッチは調整しないでください。圧力スイッチの設定が低すぎると、本来検出すべきでないときに圧力を検出してしまい、安全のためにシステムがブロックされる原因になります。圧力スイッチにはピンとコネクタの間に小さな調整ネジがあります。コネクタを外し、調整ネジを緩める（外す方向に回す）と限界値が下がります。少しずつ調整し、Microconf の IO 画面で、どの程度の速度で圧力スイッチが圧力を検出するかを確認します。必要な微速操作の速度で圧力が検出されるまで繰り返します。調整しすぎないでください。",
    ],
    related: [132],
  },
  {
    id: 132, code: "CVP MALFUNCTION NO PRESSURE CM-X1.26",
    title: "CVP 圧力未検出（ホイール制御ブロック）",
    cat: "safety", type: "block", audience: "service",
    desc: "ホイール制御の使用中に圧力が検出されませんでした。このアラームは、ホイール制御ブロック内にある圧力監視スイッチに関するものです。システムは安全のために圧力を監視し、ホイール制御の機能を保証しています。",
    causes: [
      "機械の油圧が作動していない状態で機能を使用した。",
      "新規取付の場合は、圧力スイッチの接続ミスの可能性が非常に高いです。",
      "ホイール制御の最小電流の設定が低すぎる。",
      "圧力スイッチの調整不良。圧力スイッチは出荷時に調整されていますが、機種によっては取付時に調整が必要な場合があります。",
    ],
    steps: [
      "圧力スイッチが CM-X1 に正しく接続されているか確認します。",
      "ホイール制御の最小電流が低すぎないか確認します。ホイール制御を微速で操作しながら、IO 画面で圧力スイッチ（CVP2 と表示）が圧力を検出するか確認します。ホイールが速く回るときは圧力を検出するのに、非常にゆっくり回るときは検出しない場合、最小電流を上げる必要があります。微速操作でも圧力スイッチが反応するようになるまで最小電流を上げてください。その結果、最低速度が速くなりすぎる場合は、圧力スイッチの調整が必要な可能性があります。テストは両方向で行ってください。",
      "調整不良が問題を引き起こしている場合を除き、圧力スイッチは調整しないでください。圧力スイッチの設定が低すぎると、本来検出すべきでないときに圧力を検出してしまい、安全のためにシステムがブロックされる原因になります。圧力スイッチにはピンとコネクタの間に小さな調整ネジがあります。コネクタを外し、調整ネジを緩める（外す方向に回す）と限界値が下がります。少しずつ調整し、Microconf の IO 画面で、どの程度の速度で圧力スイッチが圧力を検出するかを確認します。必要な微速操作の速度で圧力が検出されるまで繰り返します。調整しすぎないでください。",
    ],
    related: [131],
  },
  {
    id: 133, code: "EXPANSION MODULE DISCONNECTED",
    title: "拡張モジュール通信断",
    cat: "em", type: "comm", audience: "service",
    desc: "キャビンモジュールが拡張モジュールと通信できていません。旧バージョンでは「EXPM FAULT NO HEARTBEAT CM-X1.28-35」という名称のアラームでした。",
    causes: [
      "取付作業中に発生した場合は、CM-X1 での拡張モジュールケーブルの接続ミスの可能性が高いです。",
      "キャビンモジュールと拡張モジュールをつなぐケーブルの損傷の可能性。",
      "拡張モジュールの不良。",
      "キャビンモジュールの不良（可能性は低い）。",
    ],
    steps: [
      "取付作業中に発生した場合は、CM-X1 での拡張モジュールの接続を確認します。",
      TXT.checkCMX1,
      "CM-X1 を接続した状態で、キャビンモジュールと拡張モジュールの間の4極 Deutsch コネクタを外します。ピン1と2の間に機械電圧が来ているか確認します。",
      "CM-X1 から4極 Deutsch コネクタまでの配線全体を確認します。",
      "可能であれば、拡張モジュールおよび／またはキャビンモジュールを交換してみます。",
    ],
    related: [93, 134],
  },
  {
    id: 134, code: "EXPANSION MODULE VALVES SHORT CIRCUIT PWM7-8",
    title: "拡張モジュールバルブの短絡",
    cat: "em", type: "short", audience: "service",
    desc: "拡張モジュールのいずれかの出力での短絡です。すべての出力がまとめて監視されているため、どの出力で短絡しているかをシステムは特定できません。アラームのリセットにはシステムの再起動が必要です。",
    causes: [
      "拡張モジュールに接続されたバルブのコイルの短絡。",
      "バルブケーブルの損傷の可能性。",
      "拡張モジュールの不良。",
    ],
    steps: [
      "システムを再起動します。すぐに再発しない場合は、各機能を1つずつ両方向に動かして、どの操作でアラームが出るかを確認し、故障箇所を絞り込みます。",
      "すべてのバルブコネクタを外してシステムを再起動します。それでもアラームが続く場合は、モジュール本体またはその配線に問題があります。",
      "バルブを1つずつ接続しては再起動し、アラームが再発するかどうかで故障箇所を特定します。",
    ],
    restart: true,
    related: [133, 135, 136, 137, 138],
  },
  emValveOpen(135, "3", "PWM7-A"),
  emValveOpen(136, "2", "PWM7-B"),
  emValveOpen(137, "7", "PWM8-A"),
  emValveOpen(138, "6", "PWM8-B"),
  {
    id: 139, code: "TM FAULT SOFTWARE TO OLD UPDATETM",
    title: "チルトローテーターモジュールのソフトウェアが古い",
    cat: "tm", type: "config", audience: "service",
    desc: "チルトローテーターモジュールのソフトウェアバージョンに互換性がありません。チルトローテーターモジュールを更新してください。",
    causes: ["チルトローテーターモジュールのソフトウェアが古い。"],
    steps: ["チルトローテーターモジュールのソフトウェアを更新します。"],
    related: [171],
  },
  tmInternal(140, "WDT RESET APP", "WDTリセット"),
  tmInternal(141, "RAM 1", "RAM 1"),
  tmInternal(142, "RAM 2", "RAM 2"),
  tmInternal(143, "LWD 1", "LWD 1"),
  tmInternal(144, "PROGRAM_MEMORY", "プログラムメモリ"),
  {
    id: 145, code: "TM FAULT SYSTEM ERROR TOOL_LOCK SHORT",
    title: "チルトモジュール ツールロック短絡",
    cat: "toollock", type: "short", audience: "service",
    desc: "ツールロックで短絡が検出されました。",
    causes: [
      "ツールロックの配線のいずれかが、外部電源（＋）またはグランド（GND）に接触している。",
      "ツールロック用マグネットコイルの故障。",
    ],
    note: "このエラーが発生すると、必ず「TILTROTATOR DISCONNECTED（チルトローテーター通信断）」も併発します。",
    steps: ["配線を確認し、テスターでコイルと GND 間の抵抗を測定します。"],
    related: [92, 105],
  },
  tmInternal(146, "WDT_COUNT_ERROR", "WDTカウントエラー"),
  {
    id: 147, code: "AUTO CONTROL COMMUNICATION ERROR",
    title: "オートコントロール通信エラー",
    cat: "comm", type: "comm", audience: "service",
    desc: "サードパーティ製システムからデータを受信していない状態でオートコントロールボタンが押されると、このアラームが作動します。",
    causes: [
      "取付作業中に発生した場合は、16ピン FCI コネクタ CM-X3:7/8 での C2C モジュールケーブルの接続ミスの可能性が高いです。",
      "取付作業中に発生した場合は、C2C モジュールとサードパーティ製システムが正しく接続されていない可能性が高いです。",
      "サードパーティ製システムがデータを送信していない。",
      "キャビンモジュールと C2C モジュールをつなぐケーブルの損傷の可能性。",
      "C2C モジュールの不良。",
      "キャビンモジュールの不良（可能性は低い）。",
    ],
    steps: [
      "取付作業中に発生した場合は、CM-X3:7/8 での C2C モジュールの接続を確認します。",
      "キャビンモジュールからコネクタ CM-X3 を外し、ピンとケーブルが正しく取り付けられているか、他のピンとの短絡がないかを確認します。",
    ],
    related: [170],
  },
  {
    id: 148, code: "CONSTANT FLOW BLOCKED BY SAFETY GATE",
    title: "コンスタントフロー セーフティゲートによるブロック",
    cat: "safety", type: "block", audience: "user",
    desc: "セーフティゲート（安全レバー）によってコンスタントフロー（定流量機能）がブロックされています。",
    causes: ["セーフティゲートが閉じていない、または「システムインヒビット（system inhibit）」の設定が正しくない。"],
    steps: [
      "セーフティゲートを閉じて、アラームが消えるか確認します。",
      "マシン設定 → ロジック → システムインヒビット の設定を確認します。",
    ],
    related: [107, 149],
  },
  {
    id: 149, code: "CONSTANT FLOW BLOCKED BY PARAMETER ERROR",
    title: "コンスタントフロー パラメーターエラーによるブロック",
    cat: "safety", type: "config", audience: "user",
    desc: "設定エラーによってコンスタントフロー（定流量機能）がブロックされています。",
    causes: ["「システムインヒビット（system inhibit）」が有効になっていない。"],
    steps: ["マシン設定で「ロジック」のロックを解除し、「システムインヒビット」を有効にします。"],
    related: [148],
  },
  noInfo(150, "FIELD TEST VERSION OF SOFTWARE", "フィールドテスト版ソフトウェア", "other"),
  {
    id: 151, code: "EML FAULT 1 CONNECTION",
    title: "EML 通信エラー 1（AGW）",
    cat: "comm", type: "comm", audience: "service",
    desc: TXT.emlConnDesc, causes: TXT.emlConnCauses, steps: TXT.emlConnSteps,
    related: [161],
  },
  noInfo(152, "RESERVED", "予約番号", "other", true),
  noInfo(153, "RESERVED", "予約番号", "other", true),
  noInfo(154, "RESERVED", "予約番号", "other", true),
  noInfo(155, "RESERVED", "予約番号", "other", true),
  {
    id: 156, code: "EML LEFT JOYSTICK FAULTY ROLLER OR BUTTON",
    title: "EML 左ジョイスティック ローラー／ボタン異常",
    cat: "comm", type: "signal", audience: "support",
    desc: "左ジョイスティックのローラーおよび／またはボタンの信号異常です。",
    causes: ["1つ以上のローラー／ボタン、またはジョイスティック内部配線の故障の可能性。"],
    steps: ["ジョイスティックを点検するか、サポートにご連絡ください。"],
    related: [166],
  },
  noInfo(157, "RESERVED", "予約番号", "other", true),
  noInfo(158, "RESERVED", "予約番号", "other", true),
  noInfo(159, "RESERVED", "予約番号", "other", true),
  noInfo(160, "RESERVED", "予約番号", "other", true),
  {
    id: 161, code: "EML FAULT 2 CONNECTION",
    title: "EML 通信エラー 2（AGW）",
    cat: "comm", type: "comm", audience: "service",
    desc: TXT.emlConnDesc, causes: TXT.emlConnCauses, steps: TXT.emlConnSteps,
    related: [151],
  },
  noInfo(162, "RESERVED", "予約番号", "other", true),
  noInfo(163, "RESERVED", "予約番号", "other", true),
  noInfo(164, "RESERVED", "予約番号", "other", true),
  noInfo(165, "RESERVED", "予約番号", "other", true),
  {
    id: 166, code: "EML RIGHT JOYSTICK FAULTY ROLLER OR BUTTON",
    title: "EML 右ジョイスティック ローラー／ボタン異常",
    cat: "comm", type: "signal", audience: "support",
    desc: "右ジョイスティックのローラーおよび／またはボタンの信号異常です。",
    causes: ["1つ以上のローラー／ボタン、またはジョイスティック内部配線の故障の可能性。"],
    steps: ["ジョイスティックを点検するか、サポートにご連絡ください。"],
    related: [156],
  },
  noInfo(167, "RESERVED", "予約番号", "other", true),
  noInfo(168, "RESERVED", "予約番号", "other", true),
  noInfo(169, "RESERVED", "予約番号", "other", true),
  {
    id: 170, code: "CAN_BUS HIGH BUS LOAD ERROR",
    title: "CANバス高負荷エラー",
    cat: "comm", type: "comm", audience: "service",
    desc: "キャビンモジュールが異常な量の CAN メッセージを処理しています。",
    causes: [
      "いずれかのモジュールが異常な量の CAN メッセージを送信している。例えば、モジュールが設定の送信に失敗し続ける状態にはまり込んでいることがあります。",
    ],
    steps: [
      "モジュールを1台ずつ外して、どのモジュールが問題を起こしているか確認します。過去の事例では、古いソフトウェアの C2C モジュールが、その古いソフトウェアと互換性のない ePS v2 センサーの設定を繰り返し試みるループにはまり、CAN バスの負荷が過大になったことがあります。",
    ],
    related: [147],
  },
  {
    id: 171, code: "CM TM VERSION MISMATCH",
    title: "キャビンモジュールとチルトモジュールのバージョン不一致",
    cat: "tm", type: "config", audience: "service",
    desc: "キャビンモジュール（CM）とチルトモジュール（TM）は同じバージョン番号にすることが推奨されています。どちらのバージョンが新しいかに応じて、チルトモジュールまたはキャビンモジュールを更新してください。",
    causes: ["キャビンモジュールとチルトモジュールのソフトウェアバージョンが一致していない。"],
    steps: ["両モジュールのバージョンを確認し、古い方のモジュールを更新します。"],
    related: [139],
  },
  noInfo(172, "RESERVED", "予約番号", "other", true),
];
