/**
 * QRコード受付システム - メインアプリ
 */

const MODE_MORNING = 'morning';
const MODE_AFTERNOON = 'afternoon';

let currentMode = MODE_MORNING;
let isProcessing = false;

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
  playBeep(880, 0.2);
}

function playErrorSound() {
  playBeep(200, 0.3);
}

/**
 * 担当者リストを設定
 */
function initStaffList() {
  staffSelect.innerHTML = '<option value="">選択してください</option>';
  CONFIG.staffList.forEach((name) => {
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
  const morningFields = document.getElementById('morning-fields');
  const afternoonFields = document.getElementById('afternoon-fields');

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
 * 参加者情報を表示
 */
function displayParticipant(data, isAlreadyReceived = false) {
  const fields = getDisplayFields();
  let html = '';
  fields.forEach((key) => {
    const label = FIELD_LABELS[key] || key;
    const value = data[key] || '-';
    html += `<dt>${label}</dt><dd>${escapeHtml(value)}</dd>`;
  });
  if (isAlreadyReceived) {
    html += '<dd><span class="reception-badge">受付済み</span></dd>';
  }
  participantArea.innerHTML = `<dl class="participant-info">${html}</dl>`;
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
  participantArea.innerHTML = '<p class="placeholder">QRコードをスキャンしてください</p>';
}

function hideError() {
  errorArea.classList.remove('visible');
  errorArea.textContent = '';
}

/**
 * スキャン成功時の処理
 */
async function handleScan(participantId) {
  if (isProcessing) return;
  const staff = staffSelect.value?.trim();
  if (!staff) {
    showError('担当者を選択してください。');
    playErrorSound();
    return;
  }

  isProcessing = true;
  hideError();

  const participantRes = await API.getParticipant(participantId);
  if (!participantRes.success) {
    showError(participantRes.error?.message || '参加者が見つかりません。');
    playErrorSound();
    isProcessing = false;
    return;
  }

  const registerRes = await API.registerReception(participantId, staff);
  if (!registerRes.success) {
    showError(registerRes.error?.message || '受付登録に失敗しました。');
    playErrorSound();
    isProcessing = false;
    return;
  }

  const isAlreadyReceived = participantRes.data.receptionStatus === '受付済み';
  displayParticipant(participantRes.data, isAlreadyReceived);
  playSuccessSound();
  isProcessing = false;
}

/**
 * モード切替
 */
function setMode(mode) {
  currentMode = mode;
  btnMorning.classList.toggle('active', mode === MODE_MORNING);
  btnAfternoon.classList.toggle('active', mode === MODE_AFTERNOON);
  stopQrScanner();
  participantArea.innerHTML = '<p class="placeholder">QRコードをスキャンしてください</p>';
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
function init() {
  initStaffList();
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
