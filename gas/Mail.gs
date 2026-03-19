/**
 * QRコード受付システム - メール送信
 * 要件定義書・技術選定チェック結果に基づく
 */

var GOQR_BASE = 'https://api.qrserver.com/v1/create-qr-code/';

/**
 * GoQR API で QR コード画像 URL を生成する
 */
function getQrCodeUrl(id) {
  var encoded = encodeURIComponent(String(id));
  return GOQR_BASE + '?data=' + encoded + '&size=200x200&format=png';
}

/**
 * メール本文に参加者情報・QRコードを差し込む
 * プレースホルダー: {{name}}, {{studentNumber}}, {{department}}, {{id}}, {{qrCode}}
 */
function buildMailBody(template, participant) {
  var qrUrl = getQrCodeUrl(participant.id);
  var qrImg = '<img src="' + qrUrl + '" alt="QR Code" width="200" height="200" />';

  var body = template
    .replace(/\{\{name\}\}/g, participant.name || '')
    .replace(/\{\{studentNumber\}\}/g, participant.studentNumber || '')
    .replace(/\{\{department\}\}/g, participant.department || '')
    .replace(/\{\{id\}\}/g, participant.id || '')
    .replace(/\{\{qrCode\}\}/g, qrImg);

  return body;
}

/**
 * 下書き一括作成
 */
function createDraftsBulk() {
  var settings = getMailSettings();
  var subject = settings['件名'] || 'オリエンテーションのご案内';
  var bodyTemplate = settings['一斉送信メール本文'] || '<p>{{name}} 様</p><p>QRコード: {{qrCode}}</p>';
  var fromName = settings['送信者名'] || '';
  var replyTo = settings['返信先アドレス'] || '';
  var replyToName = settings['返信先名'] || '';
  var cc = settings['CCアドレス'] || '';

  var participants = getAllParticipantRows();
  if (participants.length === 0) {
    SpreadsheetApp.getUi().alert('メールアドレスが登録された参加者がいません。');
    return;
  }

  var count = 0;
  for (var i = 0; i < participants.length; i++) {
    var p = participants[i];
    var body = buildMailBody(bodyTemplate, p);
    var options = {
      htmlBody: body,
      name: fromName || undefined
    };
    if (replyTo) options.replyTo = replyTo;
    if (cc) options.cc = cc;

    GmailApp.createDraft(p.email, subject, '', options);
    updateDraftCreated(p.row);
    count++;
  }

  SpreadsheetApp.getUi().alert(count + '件の下書きを作成しました。');
}

/**
 * 一斉送信（Gmail の下書きを送信し、送信日時・送信ステータスを更新）
 */
function sendAllDrafts() {
  var drafts = GmailApp.getDrafts();
  if (drafts.length === 0) {
    SpreadsheetApp.getUi().alert('送信する下書きがありません。');
    return;
  }

  var sentCount = 0;
  for (var i = 0; i < drafts.length; i++) {
    var draft = drafts[i];
    var msg = draft.getMessage();
    var to = msg.getTo();
    if (to) {
      draft.send();
      // 参加者データから該当する行を検索して更新
      var participants = getAllParticipantRows();
      for (var j = 0; j < participants.length; j++) {
        if (participants[j].email === to) {
          updateSentStatus(participants[j].row);
          break;
        }
      }
      sentCount++;
    }
  }

  SpreadsheetApp.getUi().alert(sentCount + '件のメールを送信しました。');
}
