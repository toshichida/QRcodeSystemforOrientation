/**
 * QRコード受付システム - Web API
 * API設計書に基づく doGet / doPost 実装
 * 注: GAS Web アプリを「全員」でデプロイすると、GitHub Pages 等からのクロスオリジンリクエストが許可されます
 */

/**
 * JSON レスポンスを返す
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
 * GET リクエスト処理
 * action=getParticipant: 参加者情報取得
 * action=getStaffList: 担当者リスト取得
 */
function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action;

    // 担当者リスト取得
    if (action === 'getStaffList') {
      var staffList = getStaffList();
      return createJsonResponse({
        success: true,
        data: staffList
      });
    }

    // 参加者情報取得
    if (action === 'getParticipant') {
      var id = params.id;
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
    }

    return createErrorResponse('INVALID_REQUEST', '無効なリクエストです。');
  } catch (err) {
    Logger.log(err);
    return createErrorResponse('SERVER_ERROR', 'サーバーエラーが発生しました。');
  }
}

/**
 * POST リクエスト処理
 * action=scanAndRegister: 参加者情報取得 + 受付登録を1回で実行（高速化）
 * action=registerReception: 受付登録のみ（後方互換用）
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
    var mode = (json.mode === 'pm') ? 'pm' : 'am'; // 'am'（午前）または 'pm'（午後）、デフォルトは午前

    if (!id || String(id).trim() === '') {
      return createErrorResponse('INVALID_REQUEST', '参加者IDが指定されていません。');
    }

    // スキャン＋受付登録を1リクエストで完結（フロントエンドのAPI呼び出しを半減）
    if (action === 'scanAndRegister') {
      if (!staff || String(staff).trim() === '') {
        return createErrorResponse('INVALID_REQUEST', '受付担当者が指定されていません。');
      }

      var participant = getParticipantData(id);
      if (!participant) {
        return createErrorResponse('NOT_FOUND', '指定されたIDの参加者が見つかりません。');
      }

      // 登録前の受付状態を現在のモードで判定
      var receptionStatusKey = (mode === 'pm') ? 'pmReceptionStatus' : 'amReceptionStatus';
      var wasAlreadyReceived = participant[receptionStatusKey] === '受付済み';

      // 受付ステータスを更新（既に受付済みでも上書き記録）
      updateReceptionStatus(id, staff, mode);

      return createJsonResponse({
        success: true,
        data: participant,
        wasAlreadyReceived: wasAlreadyReceived
      });
    }

    // 後方互換: 受付登録のみ
    if (action === 'registerReception') {
      if (!staff || String(staff).trim() === '') {
        return createErrorResponse('INVALID_REQUEST', '受付担当者が指定されていません。');
      }
      var success = updateReceptionStatus(id, staff, mode);
      if (!success) {
        return createErrorResponse('NOT_FOUND', '指定されたIDの参加者が見つかりません。');
      }
      var updatedParticipant = getParticipantData(id);
      return createJsonResponse({
        success: true,
        data: {
          id: updatedParticipant.id,
          mode: mode,
          amReceptionStatus: updatedParticipant.amReceptionStatus,
          amReceptionDatetime: updatedParticipant.amReceptionDatetime,
          amReceptionStaff: updatedParticipant.amReceptionStaff,
          pmReceptionStatus: updatedParticipant.pmReceptionStatus,
          pmReceptionDatetime: updatedParticipant.pmReceptionDatetime,
          pmReceptionStaff: updatedParticipant.pmReceptionStaff
        }
      });
    }

    return createErrorResponse('INVALID_REQUEST', '無効なリクエストです。');
  } catch (err) {
    Logger.log(err);
    return createErrorResponse('SERVER_ERROR', 'サーバーエラーが発生しました。');
  }
}
