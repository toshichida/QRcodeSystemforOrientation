/**
 * QRコード受付システム - メイン処理・メニュー
 * 要件定義書に基づく
 */

/**
 * スプレッドシートを開いたときにカスタムメニューを追加
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('オリエンテーション受付')
    .addItem('スプレッドシート初期設定', 'setupSpreadsheet')
    .addSeparator()
    .addItem('メール設定', 'showMailSettings')
    .addItem('下書き一括作成', 'createDraftsBulk')
    .addItem('一斉送信', 'sendAllDrafts')
    .addToUi();
}

/**
 * メール設定ダイアログを表示
 * 簡易版: メール設定シートをアクティブにする
 */
function showMailSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_MAIL_SETTINGS);
  if (sheet) {
    ss.setActiveSheet(sheet);
    SpreadsheetApp.getUi().alert('メール設定シートを開きました。各項目を入力してください。');
  } else {
    SpreadsheetApp.getUi().alert('メール設定シートが存在しません。「スプレッドシート初期設定」を先に実行してください。');
  }
}
