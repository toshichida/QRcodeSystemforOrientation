/**
 * QRコード受付システム - API 連携
 * API設計書に基づく
 */

const API = {
  /**
   * 担当者リストをスプレッドシートから取得
   * @returns {Promise<{success: boolean, data?: string[], error?: object}>}
   */
  async getStaffList() {
    const url = `${CONFIG.GAS_WEB_APP_URL}?action=getStaffList`;
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      return await res.json();
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'ネットワークエラーが発生しました。' } };
    }
  },

  /**
   * スキャン＋受付登録を1リクエストで実行（高速化）
   * getParticipant + registerReception を統合し、APIリクエストを1回に削減
   * @param {string} id - 参加者ID
   * @param {string} staff - 受付担当者
   * @param {string} mode - 'am'（午前）または 'pm'（午後）
   * @returns {Promise<{success: boolean, data?: object, wasAlreadyReceived?: boolean, error?: object}>}
   */
  async scanAndRegister(id, staff, mode) {
    try {
      const res = await fetch(CONFIG.GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'scanAndRegister', id, staff, mode })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'ネットワークエラーが発生しました。' } };
    }
  },

  /**
   * 参加者情報を取得（後方互換用）
   * @param {string} id - 参加者ID
   * @returns {Promise<{success: boolean, data?: object, error?: object}>}
   */
  async getParticipant(id) {
    const url = `${CONFIG.GAS_WEB_APP_URL}?action=getParticipant&id=${encodeURIComponent(id)}`;
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      return await res.json();
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'ネットワークエラーが発生しました。' } };
    }
  },

  /**
   * 受付登録（後方互換用）
   * @param {string} id - 参加者ID
   * @param {string} staff - 受付担当者
   * @param {string} mode - 'am'（午前）または 'pm'（午後）
   * @returns {Promise<{success: boolean, data?: object, error?: object}>}
   */
  async registerReception(id, staff, mode) {
    try {
      const res = await fetch(CONFIG.GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'registerReception', id, staff, mode })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'ネットワークエラーが発生しました。' } };
    }
  }
};
