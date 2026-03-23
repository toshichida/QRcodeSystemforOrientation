/**
 * QRコード受付システム - 設定
 * デプロイ後に GAS_WEB_APP_URL を更新してください
 */

const CONFIG = {
  // GAS Web アプリ URL（GAS エディタで「デプロイ」→「ウェブアプリ」でデプロイ後、表示される URL に更新）
  GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbyUeWSSrQyBwQGqhQYgUDW2OItJzmN15dV-ZmoHwY3hTxCk92TRXAYsyBm5cuN4PoTJug/exec',

  // 午前モードのデフォルト表示項目（ID, 氏名, 所属課程, 住まい）
  morningDisplayFields: ['id', 'name', 'department', 'residence'],

  // 午後モードのデフォルト表示項目（氏名, 集合教室）
  afternoonDisplayFields: ['name', 'assemblyRoom'],

  // 担当者リスト（必要に応じて編集）
  staffList: ['担当者A', '担当者B', '担当者C', '佐藤', '田中', '鈴木']
};
