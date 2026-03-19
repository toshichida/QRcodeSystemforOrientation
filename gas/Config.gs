/**
 * QRコード受付システム - 定数・設定
 * 要件定義書・API設計書に基づく
 */

// シート名
var SHEET_PARTICIPANTS = '参加者データ';
var SHEET_MAIL_SETTINGS = 'メール設定';
var SHEET_STAFF = '担当者';

// 担当者シートの列インデックス
var COL_STAFF_NAME = 1; // A: 担当者名

// 参加者データの列インデックス（A=1, B=2, ...）
var COL_ID = 1;                    // A: ID
var COL_EMAIL = 2;                 // B: メールアドレス
var COL_NAME = 3;                  // C: 氏名
var COL_STUDENT_NUMBER = 4;        // D: 学籍番号
var COL_DEPARTMENT = 5;           // E: 所属課程
var COL_RESIDENCE = 6;             // F: 住まい
var COL_DRAFT_CREATED = 7;         // G: 下書き作成日時
var COL_SENT_DATETIME = 8;         // H: 送信日時
var COL_SENT_STATUS = 9;           // I: 送信ステータス
var COL_RECEPTION_STATUS = 10;     // J: 受付ステータス
var COL_RECEPTION_DATETIME = 11;   // K: 受付日時
var COL_RECEPTION_STAFF = 12;      // L: 受付担当者
var COL_ASSEMBLY_ROOM = 13;        // M: 集合教室
var COL_COE_APPLICATION = 14;      // N: COE申請
var COL_CHECKBOX = 15;             // O: チェックボックス

// 参加者データのヘッダー行
var PARTICIPANT_HEADERS = [
  'ID', 'メールアドレス', '氏名', '学籍番号', '所属課程', '住まい',
  '下書き作成日時', '送信日時', '送信ステータス', '受付ステータス',
  '受付日時', '受付担当者', '集合教室', 'COE申請', 'チェックボックス'
];

// メール設定の項目（行: 項目名, 行+1: 値）
var MAIL_SETTING_ITEMS = [
  '送信者名', '返信先アドレス', '返信先名', 'CCアドレス', '件名', '一斉送信メール本文'
];
