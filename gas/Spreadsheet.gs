/**
 * QRコード受付システム - スプレッドシート操作・初期設定
 * 要件定義書・API設計書に基づく
 */

/**
 * スプレッドシート初期設定
 * 参加者データシート・メール設定シートを自動作成し、ヘッダー行・項目構成を設定する
 */
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 既存シートを削除して新規作成
  var participantsSheet = ss.getSheetByName(SHEET_PARTICIPANTS);
  if (participantsSheet) {
    ss.deleteSheet(participantsSheet);
  }
  var mailSheet = ss.getSheetByName(SHEET_MAIL_SETTINGS);
  if (mailSheet) {
    ss.deleteSheet(mailSheet);
  }
  var staffSheet = ss.getSheetByName(SHEET_STAFF);
  if (staffSheet) {
    ss.deleteSheet(staffSheet);
  }

  // 参加者データシート作成
  participantsSheet = ss.insertSheet(SHEET_PARTICIPANTS);
  participantsSheet.getRange(1, 1, 1, PARTICIPANT_HEADERS.length).setValues([PARTICIPANT_HEADERS]);
  participantsSheet.getRange(1, 1, 1, PARTICIPANT_HEADERS.length).setFontWeight('bold');

  // メール設定シート作成
  mailSheet = ss.insertSheet(SHEET_MAIL_SETTINGS);
  var mailData = [];
  for (var i = 0; i < MAIL_SETTING_ITEMS.length; i++) {
    mailData.push([MAIL_SETTING_ITEMS[i], '']);
  }
  mailSheet.getRange(1, 1, MAIL_SETTING_ITEMS.length, 2).setValues(mailData);
  mailSheet.getRange(1, 1, MAIL_SETTING_ITEMS.length, 1).setFontWeight('bold');

  // 担当者シート作成
  staffSheet = ss.insertSheet(SHEET_STAFF);
  staffSheet.getRange(1, 1).setValue('担当者名');
  staffSheet.getRange(1, 1).setFontWeight('bold');

  SpreadsheetApp.getUi().alert('スプレッドシートの初期設定が完了しました。\n「担当者」シートのA列（2行目以降）に担当者名を入力してください。');
}

/**
 * IDで参加者を検索し、行番号を返す（見つからない場合は -1）
 */
function findParticipantRowById(id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PARTICIPANTS);
  if (!sheet) return -1;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][COL_ID - 1]).trim() === String(id).trim()) {
      return i + 1; // 1-based row number
    }
  }
  return -1;
}

/**
 * 参加者データをオブジェクトとして取得（API用）
 */
function getParticipantData(id) {
  var row = findParticipantRowById(id);
  if (row === -1) return null;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PARTICIPANTS);
  var rowData = sheet.getRange(row, 1, 1, COL_CHECKBOX).getValues()[0];

  return {
    id: String(rowData[COL_ID - 1] || '').trim(),
    email: String(rowData[COL_EMAIL - 1] || '').trim(),
    name: String(rowData[COL_NAME - 1] || '').trim(),
    studentNumber: String(rowData[COL_STUDENT_NUMBER - 1] || '').trim(),
    department: String(rowData[COL_DEPARTMENT - 1] || '').trim(),
    residence: String(rowData[COL_RESIDENCE - 1] || '').trim(),
    assemblyRoom: String(rowData[COL_ASSEMBLY_ROOM - 1] || '').trim(),
    amReceptionStatus: String(rowData[COL_AM_RECEPTION_STATUS - 1] || '').trim(),
    amReceptionDatetime: String(rowData[COL_AM_RECEPTION_DATETIME - 1] || '').trim(),
    amReceptionStaff: String(rowData[COL_AM_RECEPTION_STAFF - 1] || '').trim(),
    pmReceptionStatus: String(rowData[COL_PM_RECEPTION_STATUS - 1] || '').trim(),
    pmReceptionDatetime: String(rowData[COL_PM_RECEPTION_DATETIME - 1] || '').trim(),
    pmReceptionStaff: String(rowData[COL_PM_RECEPTION_STAFF - 1] || '').trim()
  };
}

/**
 * 受付ステータス・受付日時・受付担当者を更新する
 * @param {string} id - 参加者ID
 * @param {string} staff - 受付担当者名
 * @param {string} mode - 'am'（午前）または 'pm'（午後）
 */
function updateReceptionStatus(id, staff, mode) {
  var row = findParticipantRowById(id);
  if (row === -1) return false;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PARTICIPANTS);
  var now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');

  if (mode === 'pm') {
    sheet.getRange(row, COL_PM_RECEPTION_STATUS).setValue('受付済み');
    sheet.getRange(row, COL_PM_RECEPTION_DATETIME).setValue(now);
    sheet.getRange(row, COL_PM_RECEPTION_STAFF).setValue(staff);
  } else {
    // デフォルトは午前（'am'）
    sheet.getRange(row, COL_AM_RECEPTION_STATUS).setValue('受付済み');
    sheet.getRange(row, COL_AM_RECEPTION_DATETIME).setValue(now);
    sheet.getRange(row, COL_AM_RECEPTION_STAFF).setValue(staff);
  }

  return true;
}

/**
 * 送信日時・送信ステータスを更新する
 */
function updateSentStatus(row) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PARTICIPANTS);
  var now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
  sheet.getRange(row, COL_SENT_DATETIME).setValue(now);
  sheet.getRange(row, COL_SENT_STATUS).setValue('送信済み');
}

/**
 * 下書き作成日時を更新する
 */
function updateDraftCreated(row) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PARTICIPANTS);
  var now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
  sheet.getRange(row, COL_DRAFT_CREATED).setValue(now);
}

/**
 * 担当者リストを取得する（API用）
 * 「担当者」シートのA列（2行目以降）から担当者名を読み取る
 */
function getStaffList() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_STAFF);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var names = [];
  for (var i = 1; i < data.length; i++) {
    var name = String(data[i][COL_STAFF_NAME - 1] || '').trim();
    if (name) {
      names.push(name);
    }
  }
  return names;
}

/**
 * メール設定を読み取る
 */
function getMailSettings() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MAIL_SETTINGS);
  if (!sheet) return {};

  var data = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 0; i < MAIL_SETTING_ITEMS.length; i++) {
    var key = MAIL_SETTING_ITEMS[i];
    var value = (i < data.length && data[i][1] !== undefined) ? String(data[i][1] || '').trim() : '';
    settings[key] = value;
  }
  return settings;
}

/**
 * 参加者データの全行を取得（メール送信用）
 */
function getAllParticipantRows() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PARTICIPANTS);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var email = String(data[i][COL_EMAIL - 1] || '').trim();
    if (email) {
      rows.push({
        row: i + 1,
        id: String(data[i][COL_ID - 1] || '').trim(),
        email: email,
        name: String(data[i][COL_NAME - 1] || '').trim(),
        studentNumber: String(data[i][COL_STUDENT_NUMBER - 1] || '').trim(),
        department: String(data[i][COL_DEPARTMENT - 1] || '').trim()
      });
    }
  }
  return rows;
}
