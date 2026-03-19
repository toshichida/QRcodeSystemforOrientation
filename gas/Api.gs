/**
 * QRコード受付システム - Web API
 * API設計書に基づく doGet / doPost 実装
 */

var CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=utf-8'
};

/**
 * JSON レスポンスを返す（CORS ヘッダ付き）
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(CORS_HEADERS);
}

/**
 * エラーレスポンスを返す
 */
function createErrorResponse(code, message) {
  return createJsonResponse({
    success: false,
    error: { code: code, message: message }
  });
}

/**
 * GET リクエスト処理 - 参加者情報取得
 */
function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action;
    var id = params.id;

    if (action !== 'getParticipant') {
      return createErrorResponse('INVALID_REQUEST', '無効なリクエストです。');
    }

    if (!id || String(id).trim() === '') {
      return createErrorResponse('INVALID_REQUEST', '参加者IDが指定されていません。');
    }

    var participant = getParticipantData(id);
    if (!participant) {
      return createErrorResponse('NOT_FOUND', '指定されたIDの参加者が見つかりません。');
    }

    return createJsonResponse({
      success: true,
      data: participant
    });
  } catch (err) {
    Logger.log(err);
    return createErrorResponse('SERVER_ERROR', 'サーバーエラーが発生しました。');
  }
}

/**
 * POST リクエスト処理 - 受付登録
 */
function doPost(e) {
  try {
    var json = {};
    if (e.postData && e.postData.contents) {
      json = JSON.parse(e.postData.contents);
    }

    var action = json.action;
    var id = json.id;
    var staff = json.staff;

    if (action !== 'registerReception') {
      return createErrorResponse('INVALID_REQUEST', '無効なリクエストです。');
    }

    if (!id || String(id).trim() === '') {
      return createErrorResponse('INVALID_REQUEST', '参加者IDが指定されていません。');
    }

    if (!staff || String(staff).trim() === '') {
      return createErrorResponse('INVALID_REQUEST', '受付担当者が指定されていません。');
    }

    var success = updateReceptionStatus(id, staff);
    if (!success) {
      return createErrorResponse('NOT_FOUND', '指定されたIDの参加者が見つかりません。');
    }

    var participant = getParticipantData(id);
    return createJsonResponse({
      success: true,
      data: {
        id: participant.id,
        receptionStatus: participant.receptionStatus,
        receptionDatetime: participant.receptionDatetime,
        receptionStaff: participant.receptionStaff
      }
    });
  } catch (err) {
    Logger.log(err);
    return createErrorResponse('SERVER_ERROR', 'サーバーエラーが発生しました。');
  }
}
