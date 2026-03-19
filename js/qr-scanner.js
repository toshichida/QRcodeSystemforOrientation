/**
 * QRコード受付システム - QR 読み取り
 * html5-qrcode 使用、スマホ・PC 両対応
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

  const isSmartphone = isMobile();

  // 午前モード（スマホ）: 背面カメラを優先 / それ以外: 前面カメラを優先
  // ideal を使用してカメラが存在しない場合でもフォールバックできるようにする
  const useBackCamera = mode === 'morning' && isSmartphone;
  const cameraConstraint = useBackCamera
    ? { facingMode: { ideal: 'environment' } }
    : { facingMode: { ideal: 'user' } };

  // 読み取り枠: スマホ・PC ともに動的関数で計算
  // 【修正】固定値 250x250 はビューファインダーより大きくなるケースがあり
  // html5-qrcode がエラーを投げてスキャンを停止してしまうため、
  // 常にビューファインダーのサイズに合わせた動的計算に変更する
  const maxQrboxSize = isSmartphone ? 280 : 400;
  const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
    const size = Math.min(
      Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.8),
      maxQrboxSize
    );
    return { width: size, height: size };
  };

  // fps: スマホは主スレッドの処理負荷を抑えるため低めに設定
  // 【修正】30fps はスマホ CPU を圧迫してフレーム処理が止まる原因になる
  const fps = isSmartphone ? 10 : 30;

  html5QrCode.start(
    cameraConstraint,
    {
      fps,
      qrbox: qrboxFunction,
      aspectRatio: 4 / 3,   // コンテナのアスペクト比に合わせてカメラ映像の歪みを防ぐ
      disableFlip: false,
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
