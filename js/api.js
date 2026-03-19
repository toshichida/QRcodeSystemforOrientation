/**
 * QRコード受付システム - API 連携
 * API設計書に基づく
 */

const API = {
  /**
   * 参加者情報を取得
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
   * 受付登録
   * @param {string} id - 参加者ID
   * @param {string} staff - 受付担当者
   * @returns {Promise<{success: boolean, data?: object, error?: object}>}
   */
  async registerReception(id, staff) {
    try {
      const res = await fetch(CONFIG.GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'registerReception', id, staff })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'ネットワークエラーが発生しました。' } };
    }
  }
};
