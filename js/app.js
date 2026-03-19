/**
 * QRコード受付システム - メインアプリ
 */

const MODE_MORNING = 'morning';
const MODE_AFTERNOON = 'afternoon';

let currentMode = MODE_MORNING;
let isProcessing = false;
let scanCooldownTimer = null;

// DOM
const btnMorning = document.getElementById('btn-morning');
const btnAfternoon = document.getElementById('btn-afternoon');
const staffSelect = document.getElementById('staff');
const errorArea = document.getElementById('error-area');
const participantArea = document.getElementById('participant-area');

/**
 * Web Audio API でビープ音を再生
 */
function playBeep(frequency = 800, duration = 0.15) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('音声再生エラー:', e);
  }
}

function playSuccessSound() {
  playBeep(880, 0.15);
}

function playErrorSound() {
  playBeep(200, 0.3);
}

/**
 * 担当者リストをスプレッドシートから取得して設定
 * 取得失敗時は config.js のフォールバックリストを使用
 */
async function initStaffList() {
  staffSelect.innerHTML = '<option value="">読み込み中...</option>';
  staffSelect.disabled = true;

  const result = await API.getStaffList();

  staffSelect.innerHTML = '<option value="">選択してください</option>';
  staffSelect.disabled = false;

  let nameList = [];
  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    nameList = result.data;
  } else {
    // スプレッドシート取得失敗時はconfig.jsのリストを使用
    nameList = CONFIG.staffList || [];
    console.warn('担当者リストの取得に失敗しました。フォールバックリストを使用します。', result.error);
  }

  nameList.forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    staffSelect.appendChild(opt);
  });

  const saved = localStorage.getItem('receptionStaff');
  if (saved) staffSelect.value = saved;

  staffSelect.addEventListener('change', () => {
    localStorage.setItem('receptionStaff', staffSelect.value);
  });
}

/**
 * 表示項目を取得（localStorage でカスタマイズ可能）
 */
function getDisplayFields() {
  const key = currentMode === MODE_MORNING ? 'morningDisplayFields' : 'afternoonDisplayFields';
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return currentMode === MODE_MORNING ? [...CONFIG.morningDisplayFields] : [...CONFIG.afternoonDisplayFields];
}

/**
 * 表示項目設定モーダル
 */
function initSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const btnSettings = document.getElementById('btn-settings');
  const btnClose = document.getElementById('btn-settings-close');

  const allFields = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '氏名' },
    { key: 'department', label: '所属課程' },
    { key: 'assemblyRoom', label: '集合教室' },
    { key: 'studentNumber', label: '学籍番号' },
    { key: 'email', label: 'メールアドレス' }
  ];

  function renderCheckboxes(containerId, storageKey, defaultFields) {
    const container = document.getElementById(containerId);
    const saved = localStorage.getItem(storageKey);
    let selected = defaultFields;
    if (saved) {
      try {
        selected = JSON.parse(saved);
      } catch (e) {}
    }
    container.innerHTML = '';
    allFields.forEach(({ key, label }) => {
      const labelEl = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = key;
      cb.checked = selected.includes(key);
      cb.addEventListener('change', () => {
        const checked = [...container.querySelectorAll('input:checked')].map((x) => x.value);
        localStorage.setItem(storageKey, JSON.stringify(checked));
      });
      labelEl.appendChild(cb);
      labelEl.appendChild(document.createTextNode(label));
      container.appendChild(labelEl);
    });
  }

  btnSettings.addEventListener('click', () => {
    renderCheckboxes('morning-fields', 'morningDisplayFields', CONFIG.morningDisplayFields);
    renderCheckboxes('afternoon-fields', 'afternoonDisplayFields', CONFIG.afternoonDisplayFields);
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
  });

  btnClose.addEventListener('click', () => {
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('visible');
      modal.setAttribute('aria-hidden', 'true');
    }
  });
}

const FIELD_LABELS = {
  id: 'ID',
  name: '氏名',
  department: '所属課程',
  assemblyRoom: '集合教室',
  studentNumber: '学籍番号',
  email: 'メールアドレス'
};

/**
 * ローディング表示
 */
function showLoading() {
  participantArea.innerHTML = `
    <div class="placeholder-wrapper">
      <div class="loading-spinner"></div>
      <p class="placeholder">受付処理中...</p>
    </div>
  `;
}

/**
 * 参加者情報を表示
 */
function displayParticipant(data, isAlreadyReceived = false) {
  const fields = getDisplayFields();
  let html = '';

  if (isAlreadyReceived) {
    html += '<div class="status-badge-container"><span class="reception-badge warning">⚠️ 既に受付済みです</span></div>';
  } else {
    html += '<div class="status-badge-container"><span class="reception-badge success">✅ 受付完了</span></div>';
  }

  html += '<dl class="participant-info">';
  fields.forEach((key) => {
    const label = FIELD_LABELS[key] || key;
    const value = data[key] || '-';
    html += `<div class="info-row"><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`;
  });
  html += '</dl>';

  participantArea.innerHTML = html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * エラー表示
 */
function showError(message) {
  errorArea.textContent = message;
  errorArea.classList.add('visible');
  participantArea.innerHTML = `
    <div class="placeholder-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="qr-placeholder-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
      <p class="placeholder">QRコードをスキャンしてください</p>
    </div>
  `;
}

function hideError() {
  errorArea.classList.remove('visible');
  errorArea.textContent = '';
}

/**
 * スキャン成功時の処理
 * - QR検知の瞬間にビープ音を鳴らし、APIレスポンスを待たない
 * - APIリクエストを1回（scanAndRegister）に統合して高速化
 * - 3秒間のクールダウンで多重スキャンを防止
 */
async function handleScan(participantId) {
  if (isProcessing) return;

  const staff = staffSelect.value?.trim();
  if (!staff) {
    showError('担当者を選択してください。');
    playErrorSound();
    return;
  }

  // クールダウン開始（多重スキャン防止）
  isProcessing = true;
  clearTimeout(scanCooldownTimer);

  // QR検知の瞬間にビープ音を鳴らす（APIを待たない）
  playSuccessSound();

  hideError();
  showLoading();

  const apiMode = currentMode === MODE_MORNING ? 'am' : 'pm';
  const result = await API.scanAndRegister(participantId, staff, apiMode);

  if (!result.success) {
    showError(result.error?.message || 'エラーが発生しました。');
    playErrorSound();
    isProcessing = false;
    return;
  }

  displayParticipant(result.data, result.wasAlreadyReceived);

  // 3秒後にスキャン再開可能にする
  scanCooldownTimer = setTimeout(() => {
    isProcessing = false;
  }, 3000);
}

/**
 * モード切替
 */
function setMode(mode) {
  currentMode = mode;
  isProcessing = false;
  clearTimeout(scanCooldownTimer);
  btnMorning.classList.toggle('active', mode === MODE_MORNING);
  btnAfternoon.classList.toggle('active', mode === MODE_AFTERNOON);
  stopQrScanner();
  participantArea.innerHTML = `
    <div class="placeholder-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="qr-placeholder-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
      <p class="placeholder">QRコードをスキャンしてください</p>
    </div>
  `;
  hideError();
  startQrScanner(mode, handleScan);
}

/**
 * カメラエラー時のコールバック
 */
window.onCameraError = (err) => {
  showError('カメラにアクセスできません。ブラウザの設定でカメラを許可してください。');
};

/**
 * 初期化
 */
async function init() {
  await initStaffList();
  initSettingsModal();
  btnMorning.addEventListener('click', () => setMode(MODE_MORNING));
  btnAfternoon.addEventListener('click', () => setMode(MODE_AFTERNOON));
  setMode(MODE_MORNING);
}

// ウィンドウサイズ変更時にリスタート（PC/スマホ切り替え対応）
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (html5QrCode && html5QrCode.isScanning) {
      stopQrScanner();
      startQrScanner(currentMode, handleScan);
    }
  }, 300);
});

document.addEventListener('DOMContentLoaded', init);
