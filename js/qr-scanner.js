/**
 * QRコード受付システム - QR 読み取り
 * html5-qrcode 使用、スマホ: 固定枠 / PC: 広めの枠
 */

const READER_ELEMENT_ID = 'reader';
let html5QrCode = null;

/**
 * スマホかどうか（画面幅で判定）
 */
function isMobile() {
  return window.innerWidth < 768;
}

/**
 * QR スキャナーを開始
 * @param {string} mode - 'morning' | 'afternoon'
 * @param {function(string)} onScan - スキャン成功時のコールバック（参加者IDを渡す）
 */
function startQrScanner(mode, onScan) {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().then(() => initAndStart(mode, onScan)).catch(() => initAndStart(mode, onScan));
  } else {
    initAndStart(mode, onScan);
  }
}

function initAndStart(mode, onScan) {
  if (html5QrCode) {
    html5QrCode.clear();
  }
  html5QrCode = new Html5Qrcode(READER_ELEMENT_ID);

  // 午前モード: スマホ背面カメラ / 午後モード: PC ウェブカメラ
  const facingMode = (mode === 'morning' && isMobile()) ? 'environment' : 'user';

  // 読み取り枠: スマホは固定サイズ、PCは適度なサイズ（最大400px）
  const qrboxConfig = isMobile()
    ? { width: 250, height: 250 }
    : (viewfinderWidth, viewfinderHeight) => {
        const maxSize = 400;
        const size = Math.min(
          Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.8),
          maxSize
        );
        return { width: size, height: size };
      };

  html5QrCode.start(
    { facingMode },
    {
      fps: 30,          // 10→30fpsに引き上げてQR検知速度を最大化
      qrbox: qrboxConfig,
      disableFlip: false
    },
    (decodedText) => {
      onScan(decodedText);
    },
    () => { /* スキャン失敗時は無視して継続 */ }
  ).catch((err) => {
    console.error('カメラ起動エラー:', err);
    if (typeof window.onCameraError === 'function') {
      window.onCameraError(err);
    }
  });
}

/**
 * QR スキャナーを停止
 */
function stopQrScanner() {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().catch(() => {});
  }
}
