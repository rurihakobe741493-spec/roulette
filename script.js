// グローバル変数
let customWeightedItems = [];
let currentMode = '';

// ページ遷移
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.add('hidden');
  });
  document.getElementById(pageId).classList.remove('hidden');
}

function showModeSelect() {
  showPage('mode-select');
}

function showCustomMode() {
  showPage('custom-mode');
  displaySavedRoulettes();
}

function backToModeSelect() {
  showPage('mode-select');
  // リセット
  customWeightedItems = [];
  document.getElementById('result').classList.add('hidden');
}

// カスタムモード：項目追加
function addCustomItemWeighted() {
  const itemName = document.getElementById('item-name').value.trim();
  const itemWeight = parseInt(document.getElementById('item-weight').value);
  
  if (!itemName) {
    alert('項目名を入力してください');
    return;
  }
  
  if (!itemWeight || itemWeight <= 0) {
    alert('重みは1以上の数値を入力してください');
    return;
  }
  
  customWeightedItems.push({
    item: itemName,
    weight: itemWeight
  });

  displayCustomItems();
  
  // 入力欄をクリア
  document.getElementById('item-name').value = '';
  document.getElementById('item-weight').value = '10';
}

// 項目表示
function displayCustomItems() {
  const list = document.getElementById('custom-items-list');
  const totalWeight = getTotalWeight();
  
  if (customWeightedItems.length === 0) {
    list.innerHTML = '<p>まだ項目がありません</p>';
    document.getElementById('total-weight').textContent = '合計: 0';
    return;
  }
  
  list.innerHTML = '';
  customWeightedItems.forEach((item, index) => {
    const percentage = totalWeight > 0 ? (item.weight / totalWeight * 100).toFixed(1) : 0;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-row';
    itemDiv.innerHTML = `
      <span class="item-name">${item.item}</span>
      <span class="item-weight">- ${item.weight} (${percentage}%)</span>
      <button onclick="removeItem(${index})">削除</button>
    `;
    list.appendChild(itemDiv);
  });

  document.getElementById('total-weight').textContent = `合計: ${totalWeight}`;
}

// 項目削除
function removeItem(index) {
  customWeightedItems.splice(index, 1);
  displayCustomItems();
}

// 合計 weight を計算
function getTotalWeight() {
  return customWeightedItems.reduce((sum, item) => sum + item.weight, 0);
}

// 重み付きルーレット実行（累積確率方式）
function spinWeightedRoulette(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  if (totalWeight === 0) {
    alert('項目を追加してください');
    return null;
  }
  
  let random = Math.random() * totalWeight;
  
  for (let item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.item;
    }
  }
  
  // 念のため（通常ここには到達しない）
  return items[items.length - 1].item;
}

// カスタムルーレット開始
function startCustomWeightedRoulette() {
  if (customWeightedItems.length === 0) {
    alert('項目を追加してください');
    return;
  }
  
  currentMode = 'custom-weighted';
  const title = document.getElementById('custom-title').value || 'カスタムルーレット';
  document.getElementById('roulette-title').textContent = title;
  
  showPage('roulette-page');
  drawRouletteWheel(customWeightedItems);
}

// ルーレットホイール描画（重み付け対応）
function drawRouletteWheel(items) {
  const canvas = document.getElementById('roulette-canvas');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 180;
  
  // キャンバスをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 合計 weight を計算
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  // 色の配列
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
  ];
  
  let currentAngle = 0;

  // 各セクションを描画
  items.forEach((item, index) => {
    const sliceAngle = (item.weight / totalWeight) * 2 * Math.PI;
    
    // セクションを描画
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // テキストを描画
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle + sliceAngle / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(item.item, radius / 2, 5);
    ctx.restore();

    currentAngle += sliceAngle;
  });
  
  // 中心の円を描画
  ctx.beginPath();
  ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ルーレットを回す
let isSpinning = false;

function spinRoulette() {
  if (isSpinning) return;
  
  isSpinning = true;
  document.getElementById('spin-button').disabled = true;
  document.getElementById('result').classList.add('hidden');
  
  let items;
  if (currentMode === 'custom-weighted') {
    items = customWeightedItems;
  } else if (currentMode === 'omikuji') {
    items = getOmikujiItems();
  }

  // アニメーション（簡易版）
  let spinCount = 0;
  const maxSpins = 20;
  
  const spinInterval = setInterval(() => {
    spinCount++;
    
    if (spinCount >= maxSpins) {
      clearInterval(spinInterval);
      
      // 最終結果を決定
      const result = spinWeightedRoulette(items);
      showResult(result);
      
      isSpinning = false;
      document.getElementById('spin-button').disabled = false;
    }
  }, 100);
}

// 結果表示
function showResult(result) {
  const resultDiv = document.getElementById('result');
  const resultText = document.getElementById('result-text');
  
  resultText.textContent = result;
  resultDiv.classList.remove('hidden');
}

// おみくじモード開始
function startOmikujiMode() {
  currentMode = 'omikuji';
  document.getElementById('roulette-title').textContent = 'おみくじ';
  
  showPage('roulette-page');
  drawRouletteWheel(getOmikujiItems());
}
// おみくじ項目取得（重み付けプリセット）
function getOmikujiItems() {
  return [
    { item: '大吉', weight: 20 },
    { item: '中吉', weight: 20 },
    { item: '吉', weight: 20 },
    { item: '小吉', weight: 15 },
    { item: '末吉', weight: 10 },
    { item: '凶', weight: 10 },
    { item: '大凶', weight: 5 }
  ];
}

// ベーシックモード開始（重み付けなし）
function startBasicMode() {
  currentMode = 'basic';
  document.getElementById('roulette-title').textContent = 'ベーシックルーレット';
  
  // デフォルト項目（均等確率）
  const basicItems = [
    { item: '1', weight: 1 },
    { item: '20', weight: 1 },
    { item: '3', weight: 1 },
    { item: '4', weight: 1 },
    { item: '6', weight: 1 }
  ];
  
  showPage('roulette-page');
  drawRouletteWheel(basicItems);
}

// 順番決めモード開始
function showOrderMode() {
  alert('順番決めモードは別途実装予定です');
}

// ローカルストレージに保存
function saveCustomRoulette() {
  if (customWeightedItems.length === 0) {
    alert('保存する項目がありません');
    return;
  }
  
  const title = document.getElementById('custom-title').value.trim() || '無題のルーレット';
  
  // 既存の保存データを取得
  const savedRoulettes = getSavedRoulettes();
  
  // 新しいルーレットを追加
  savedRoulettes.push({
    id: Date.now(),
    title: title,
    items: [...customWeightedItems]
  });
  
  // ローカルストレージに保存
  localStorage.setItem('savedRoulettes', JSON.stringify(savedRoulettes));
  
  alert(`「${title}」を保存しました`);
  displaySavedRoulettes();
}

// 保存済みルーレット取得
function getSavedRoulettes() {
  const saved = localStorage.getItem('savedRoulettes');
  return saved ? JSON.parse(saved) : [];
}

// 保存済みルーレット表示
function displaySavedRoulettes() {
  const savedList = document.getElementById('saved-list');
  const savedRoulettes = getSavedRoulettes();
  
  if (savedRoulettes.length === 0) {
    savedList.innerHTML = '<p>保存済みのルーレットはありません</p>';
    return;
  }
  
  savedList.innerHTML = '';
  savedRoulettes.forEach(roulette => {
    const rouletteDiv = document.createElement('div');
    rouletteDiv.className = 'saved-roulette-item';
    rouletteDiv.innerHTML = `
      <span class="roulette-title">${roulette.title}</span>
      <button onclick="loadRoulette(${roulette.id})">読込</button>
      <button onclick="deleteSavedRoulette(${roulette.id})">削除</button>
    `;
    savedList.appendChild(rouletteDiv);
  });
}

// 保存済みルーレット読込
function loadRoulette(id) {
  const savedRoulettes = getSavedRoulettes();
  const roulette = savedRoulettes.find(r => r.id === id);
  
  if (!roulette) {
    alert('ルーレットが見つかりません');
    return;
  }
  
  // データを復元
  document.getElementById('custom-title').value = roulette.title;
  customWeightedItems = [...roulette.items];
  displayCustomItems();
  
  alert(`「${roulette.title}」を読み込みました`);
}

// 保存済みルーレット削除
function deleteSavedRoulette(id) {
  if (!confirm('本当に削除しますか？')) {
    return;
  }
  
  let savedRoulettes = getSavedRoulettes();
  savedRoulettes = savedRoulettes.filter(r => r.id !== id);
  
  localStorage.setItem('savedRoulettes', JSON.stringify(savedRoulettes));
  displaySavedRoulettes();
  
  alert('削除しました');
}

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  // 初期表示
  showPage('top-page');
});
