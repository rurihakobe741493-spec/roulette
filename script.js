// グローバル変数
let customWeightedItems = [];
let currentMode = '';
let currentItems = []; // ✅ 修正③: スピン中もitemsを参照できるようグローバルで保持

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

function backToCustomMode() {
  // ✅ ここで result を hidden に戻す（次回開いたとき確実にきれいな状態にする）
  document.getElementById('result').classList.add('hidden');
  
  // カスタム画面に戻るだけでリセットはしない
  // （項目を編集してまたルーレットを回せるようにするため）
  showPage('custom-mode');
}

function backToModeSelect() {
  // カスタムルーレット画面からの遷移かつ未保存の項目がある場合だけ確認する
  const isFromCustomMode = !document.getElementById('custom-mode').classList.contains('hidden');
  
  if (isFromCustomMode && customWeightedItems.length > 0) {
    // confirm()はOKでtrue、キャンセルでfalseを返す
    const userConfirmed = confirm('保存していない内容がありますが、戻りますか？');
    
    if (!userConfirmed) {
      return; // キャンセルされたら何もせずここで処理を終える
    }
  }

  // OKが押された場合、または確認不要な場合はここまで進み、全モード共通のリセット処理を行う
  showPage('mode-select');
  // JavaScriptのデータをリセット（既存）
  customWeightedItems = [];
  currentItems = [];
  document.getElementById('result').classList.add('hidden');

  // ✅ 追加：画面の表示もリセットしてデータと見た目を一致させる
  document.getElementById('custom-title').value = '';
  document.getElementById('item-name').value = '';
  document.getElementById('item-weight').value = '10';
  document.getElementById('custom-items-list').innerHTML = '<p>まだ項目がありません</p>';
  document.getElementById('total-weight').textContent = '合計: 0';
}

function backToTop() {
  showPage('top-page');
  // リセット
  customWeightedItems = [];
  currentItems = [];
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
    id: Date.now(), // ← 追加：ミリ秒単位の時刻を一意なIDとして使う
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
      <button onclick="removeItem(${item.id})">削除</button>
      <!-- ↑ index → item.id に変更 -->
    `;
    list.appendChild(itemDiv);
  });

  document.getElementById('total-weight').textContent = `合計: ${totalWeight}`;
}

// 項目削除
function removeItem(id) {
  // filterは「条件に合う要素だけ残した新しい配列」を返す
  // つまり「IDが一致しない要素だけ残す」＝「IDが一致する1つを取り除く」
  customWeightedItems = customWeightedItems.filter(item => item.id !== id);
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
  
  return items[items.length - 1].item;
}

// カスタムルーレット開始
function startCustomWeightedRoulette() {
  if (customWeightedItems.length === 0) {
    alert('項目を追加してください');
    return;
  }
  
  currentMode = 'custom-weighted';
  currentItems = customWeightedItems; // ✅ 修正③
  const title = document.getElementById('custom-title').value || 'カスタムルーレット';
  document.getElementById('roulette-title').textContent = title;
  
  // ✅ 追加：カスタムモードのときだけボタンを表示する
  document.getElementById('back-to-custom-button').classList.remove('hidden');

  // ✅ 追加：前回の結果表示をリセット
  document.getElementById('result').classList.add('hidden');
  
  showPage('roulette-page');
  drawRouletteWheel(currentItems, 0);
}

// ✅ 修正④: angle引数を追加して、回転状態を描画できるようにした
function drawRouletteWheel(items, angle) {
  const canvas = document.getElementById('roulette-canvas');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 180;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
  ];
  
  // ✅ 修正⑤: angle分だけ回転させてから描画
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.translate(-centerX, -centerY);

  let currentAngle = 0;

  items.forEach((item, index) => {
    const sliceAngle = (item.weight / totalWeight) * 2 * Math.PI;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // ✅ 修正⑥: テキストを放射状に配置（中心から外向きに回転）
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 3;
    ctx.font = 'bold 15px Arial';
    // テキストを縁取りして読みやすくする
    ctx.strokeText(item.item, radius - 10, 5);
    ctx.fillText(item.item, radius - 10, 5);
    ctx.restore();

    currentAngle += sliceAngle;
  });

  ctx.restore();
  
  // 中心の円
  ctx.beginPath();
  ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ✅ 修正⑦: アニメーション付きのルーレット回転
let isSpinning = false;

function spinRoulette() {
  if (isSpinning) return;
  
  isSpinning = true;
  document.getElementById('spin-button').disabled = true;
  document.getElementById('result').classList.add('hidden');

  // ✅ 修正③: currentItemsを使うことでどのモードでも動く
  const items = currentItems;

  if (!items || items.length === 0) {
    alert('項目がありません');
    isSpinning = false;
    document.getElementById('spin-button').disabled = false;
    return;
  }

  // ✅ 修正⑧: 重みに基づいて結果を先に決定し、その角度に止まるようにアニメーション
  const result = spinWeightedRoulette(items);

  // 結果のアイテムが全体のどの角度範囲にあるか計算
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let targetAngleStart = 0;
  let targetAngleEnd = 0;
  let accumulated = 0;

  for (let item of items) {
    const sliceAngle = (item.weight / totalWeight) * 2 * Math.PI;
    if (item.item === result) {
      targetAngleStart = accumulated;
      targetAngleEnd = accumulated + sliceAngle;
      break;
    }
    accumulated += sliceAngle;
  }

  // ポインタ（▼）は上（-Math.PI/2）を指しているので、
  // その位置に結果のスライス中央が来るようにホイールを回転させる
  const targetSliceCenter = (targetAngleStart + targetAngleEnd) / 2;
  const stopAngle = -targetSliceCenter - Math.PI / 2;

  // 数回転分を加えてから止まるようにする
  const totalRotation = stopAngle + 2 * Math.PI * (5 + Math.floor(Math.random() * 3));

  // アニメーション
  const duration = 4000; // 4秒
  const startTime = performance.now();
  const startAngle = 0;

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // イーズアウト（だんだん遅くなる）
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentAngle = startAngle + totalRotation * eased;

    drawRouletteWheel(items, currentAngle);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // アニメーション終了
      showResult(result);
      isSpinning = false;
      document.getElementById('spin-button').disabled = false;
    }
  }

  requestAnimationFrame(animate);
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
  currentItems = getOmikujiItems(); // ✅ 修正③
  document.getElementById('roulette-title').textContent = 'おみくじ';
  
  // ✅ 追加：カスタム以外ではボタンを隠す
  document.getElementById('back-to-custom-button').classList.add('hidden');

  showPage('roulette-page');
  drawRouletteWheel(currentItems, 0);
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

// ✅ 修正⑨: ベーシックモードも currentItems に代入するよう修正
function startBasicMode() {
  currentMode = 'basic';
  currentItems = [
    { item: '1', weight: 1 },
    { item: '2', weight: 1 },
    { item: '3', weight: 1 },
    { item: '4', weight: 1 },
    { item: '5', weight: 1 },
    { item: '6', weight: 1 }
  ];
  
  document.getElementById('roulette-title').textContent = 'ベーシックルーレット';

  // ✅ 追加：カスタム以外ではボタンを隠す
  document.getElementById('back-to-custom-button').classList.add('hidden');

  showPage('roulette-page');
  drawRouletteWheel(currentItems, 0);
}

// ローカルストレージに保存
function saveCustomRoulette() {
  if (customWeightedItems.length === 0) {
    alert('保存する項目がありません');
    return;
  }
  
  const title = document.getElementById('custom-title').value.trim() || '無題のルーレット';
  const savedRoulettes = getSavedRoulettes();
  
  // 同じタイトルが既に存在するか探す
  const existing = savedRoulettes.find(r => r.title === title);

    if (existing) {
    // 同じタイトルが見つかった場合、上書きするか確認
    if (confirm(`「${title}」は既に存在します。上書きしますか？`)) {
      // 上書き：IDはそのままにitemsだけ更新する
      existing.items = [...customWeightedItems];
      localStorage.setItem('savedRoulettes', JSON.stringify(savedRoulettes));
      alert(`「${title}」を上書き保存しました`);

    } else if (confirm(`「${title}」を新規作成しますか？`)) {
      // 新規作成：pushで末尾に追加（従来通り）
      savedRoulettes.push({
        id: Date.now(),
        title: title,
        items: [...customWeightedItems]
      });
      localStorage.setItem('savedRoulettes', JSON.stringify(savedRoulettes));
      alert(`「${title}」を新規作成しました`);
    }
    // どちらもキャンセルした場合は何もしない
    } else {
    // 同じタイトルが存在しない場合はそのまま新規保存
    savedRoulettes.push({
      id: Date.now(),
      title: title,
      items: [...customWeightedItems]
    });
    localStorage.setItem('savedRoulettes', JSON.stringify(savedRoulettes));
    alert(`「${title}」を保存しました`);
  }

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
    // Date.now()で保存したidは「ミリ秒単位の数値」なのでnew Date()に渡すと日時オブジェクトに変換できる
    const createdAt = new Date(roulette.id).toLocaleString('ja-JP');
    // ✅ roulette が使えるようになった後で計算すること！
    // → 例：「2025/1/15 14:30:25」という文字列になる
    const rouletteDiv = document.createElement('div');
    rouletteDiv.className = 'saved-roulette-item';
    rouletteDiv.innerHTML = `
      <span class="roulette-title">${roulette.title}</span>
      <span class="roulette-created">（保存日時: ${createdAt}）</span>
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
  showPage('top-page');
});

// ===========================
// 順番決めモード
// ===========================

// 登壇者データ（名前・希望枠）を格納する配列
let orderMembers = [];
// 希望なし組がルーレットで決める残り枠番号
let remainingSlots = [];
// 希望なし組のうちまだ回していない人のインデックス
let currentOrderIndex = 0;
// 確定した登壇順（枠番号 → 名前）
let finalOrder = {};

// メンバー入力画面を表示
function showOrderMode() {
  orderMembers = [];
  remainingSlots = [];
  currentOrderIndex = 0;
  finalOrder = {};
  showPage('order-input-page');
  displayOrderMembers();
}

// モード選択に戻る（順番決めモード専用：未入力でも確認不要）
function backToModeSelectFromOrder() {
  orderMembers = [];
  // 修正③：ルーレット途中から戻る場合も含めて全データをリセットする
  remainingSlots = [];
  currentOrderIndex = 0;
  finalOrder = {};
  isOrderSpinning = false;
  showPage('mode-select');
}

// 登壇者を追加する
function addOrderMember() {
  const nameInput = document.getElementById('order-member-name');
  const name = nameInput.value.trim();

  if (!name) {
    alert('名前を入力してください');
    return;
  }

  // 同じ名前の重複を防ぐ
  if (orderMembers.some(m => m.name === name)) {
    alert('同じ名前がすでに追加されています');
    return;
  }

  orderMembers.push({
    id: Date.now(),
    name: name,
    hasPreference: false, // 希望あり = true
    preferredSlot: null   // 希望する枠番号
  });

  nameInput.value = '';
  displayOrderMembers();
}

// 登壇者一覧を画面に表示する
function displayOrderMembers() {
  const list = document.getElementById('order-members-list');

  if (orderMembers.length === 0) {
    list.innerHTML = '<p>まだ登壇者がいません</p>';
    return;
  }

  list.innerHTML = '';
  orderMembers.forEach(member => {
    const div = document.createElement('div');
    div.className = 'item-row';

    // 希望ありチェックを入れたときだけ枠番号入力欄を表示する
    div.innerHTML = `
      <span class="item-name">${member.name}</span>
      <label style="margin: 0 10px; font-size:0.9rem;">
        <input type="checkbox"
          ${member.hasPreference ? 'checked' : ''}
          onchange="togglePreference(${member.id}, this.checked)">
        希望あり
      </label>
      <input type="number" min="1" max="${orderMembers.length}" // 修正①：最大値は現在の登壇者数に合わせる
        placeholder="枠番号"
        value="${member.preferredSlot || ''}"
        style="width:70px; padding:5px; border:2px solid #ddd; border-radius:5px; ${member.hasPreference ? '' : 'display:none;'}"
        id="slot-input-${member.id}"
        onchange="setPreferredSlot(${member.id}, this.value)">
      <button onclick="removeOrderMember(${member.id})" style="background:#e74c3c;">削除</button>
    `;
    list.appendChild(div);
  });
}

// 希望ありチェックボックスの切り替え
function togglePreference(id, checked) {
  const member = orderMembers.find(m => m.id === id);
  member.hasPreference = checked;

  // チェックを外したら希望枠もリセット
  if (!checked) member.preferredSlot = null;

  // 枠番号入力欄の表示・非表示を切り替える
  const slotInput = document.getElementById(`slot-input-${id}`);
  slotInput.style.display = checked ? 'inline-block' : 'none';
}

// 希望枠番号をメンバーデータに反映する
function setPreferredSlot(id, value) {
  const member = orderMembers.find(m => m.id === id);
  member.preferredSlot = parseInt(value);
}

// 登壇者を削除する
function removeOrderMember(id) {
  orderMembers = orderMembers.filter(m => m.id !== id);
  displayOrderMembers();
}

// 順番決め開始前のバリデーションと初期化
function startOrderRoulette() {
  if (orderMembers.length === 0) {
    alert('登壇者を追加してください');
    return;
  }

  const total = orderMembers.length;

  // 希望ありメンバーのバリデーション
  const preferenceMembers = orderMembers.filter(m => m.hasPreference);
  for (const m of preferenceMembers) {
    if (!m.preferredSlot || m.preferredSlot < 1) { // 修正②：枠番号は上限を超えた入力を弾いてくれるので、アラートメッセージを簡略化
      alert(`「${m.name}」の希望枠番号を入力してください`);
      return;
    }
  }

  // 同じ枠番号を複数人が希望していないかチェック
  const slots = preferenceMembers.map(m => m.preferredSlot);
  const hasDuplicate = slots.some((slot, i) => slots.indexOf(slot) !== i);
  if (hasDuplicate) {
    alert('同じ枠番号を複数人が希望しています。枠番号を修正してください');
    return;
  }

  // 希望ありメンバーを finalOrder に先に確定させる
  finalOrder = {};
  preferenceMembers.forEach(m => {
    finalOrder[m.preferredSlot] = m.name;
  });

  // 残り枠（希望で埋まっていない枠）を計算する
  const allSlots = Array.from({ length: total }, (_, i) => i + 1); // [1, 2, 3, ...]
  remainingSlots = allSlots.filter(slot => !finalOrder[slot]);

  // 希望なし組（ルーレットを回す人たち）を抽出
  currentOrderIndex = 0;

  showOrderRoulettePage();
}

// ルーレット画面を準備して表示する
function showOrderRoulettePage() {
  const noPreferenceMembers = orderMembers.filter(m => !m.hasPreference);

  // 全員の枠が確定していたら（希望なし組が0人）結果画面へ
  if (currentOrderIndex >= noPreferenceMembers.length) {
    showOrderFinalResult();
    return;
  }

  const currentMember = noPreferenceMembers[currentOrderIndex];
  document.getElementById('order-current-member').textContent =
    `${currentMember.name}さんが回します`;

  // 結果表示をリセットしてスピンボタンを有効に戻す
  document.getElementById('order-result').classList.add('hidden');
  document.getElementById('order-next-button').classList.add('hidden');
  document.getElementById('order-spin-button').disabled = false;

  // 残り枠をルーレットの項目として渡す
  const items = remainingSlots.map(slot => ({ item: `${slot}番目`, weight: 1 }));
  showPage('order-roulette-page');
  drawOrderRouletteWheel(items, 0);
}

// 順番決めモード専用のルーレット描画（既存のdrawRouletteWheelと同じロジック）
function drawOrderRouletteWheel(items, angle) {
  const canvas = document.getElementById('order-roulette-canvas');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 180;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
  ];

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.translate(-centerX, -centerY);

  let currentAngle = 0;
  items.forEach((item, index) => {
    const sliceAngle = (item.weight / totalWeight) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 3;
    ctx.font = 'bold 15px Arial';
    ctx.strokeText(item.item, radius - 10, 5);
    ctx.fillText(item.item, radius - 10, 5);
    ctx.restore();

    currentAngle += sliceAngle;
  });

  ctx.restore();

  ctx.beginPath();
  ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// 順番決めモードのルーレットを回す
let isOrderSpinning = false;

function spinOrderRoulette() {
  if (isOrderSpinning) return;

  isOrderSpinning = true;
  document.getElementById('order-spin-button').disabled = true;
  document.getElementById('order-result').classList.add('hidden');

  const items = remainingSlots.map(slot => ({ item: `${slot}番目`, weight: 1 }));

  // ランダムに結果を決定する
  const randomIndex = Math.floor(Math.random() * items.length);
  const result = items[randomIndex].item;
  const resultSlot = remainingSlots[randomIndex];

  // 結果のスライスが上のポインタに来るようアニメーションさせる
  const totalWeight = items.length;
  let accumulated = 0;
  let targetAngleStart = 0;
  let targetAngleEnd = 0;

  for (let i = 0; i < items.length; i++) {
    const sliceAngle = (1 / totalWeight) * 2 * Math.PI;
    if (i === randomIndex) {
      targetAngleStart = accumulated;
      targetAngleEnd = accumulated + sliceAngle;
      break;
    }
    accumulated += sliceAngle;
  }

  const targetSliceCenter = (targetAngleStart + targetAngleEnd) / 2;
  const stopAngle = -targetSliceCenter - Math.PI / 2;
  const totalRotation = stopAngle + 2 * Math.PI * (5 + Math.floor(Math.random() * 3));

  const duration = 4000;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentAngle = totalRotation * eased;

    drawOrderRouletteWheel(items, currentAngle);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // アニメーション終了：結果を確定して表示する
      document.getElementById('order-result-text').textContent = result;
      document.getElementById('order-result').classList.remove('hidden');

      // 決まった枠を残り枠から除く
      remainingSlots = remainingSlots.filter(s => s !== resultSlot);

      // 現在のメンバーの結果を finalOrder に記録する
      const noPreferenceMembers = orderMembers.filter(m => !m.hasPreference);
      finalOrder[resultSlot] = noPreferenceMembers[currentOrderIndex].name;

      currentOrderIndex++;
      isOrderSpinning = false;

      // 修正②：残り枠が1つになった場合、次の人の枠を消去法で自動確定する
      if (remainingSlots.length === 1 && currentOrderIndex < noPreferenceMembers.length) {
        // 残り1枠を次の人に自動割り当てする
        finalOrder[remainingSlots[0]] = noPreferenceMembers[currentOrderIndex].name;
        remainingSlots = [];
        currentOrderIndex++;
      }

      // 次の人がいれば「次の人へ」ボタンを表示、いなければ結果画面へ
      if (currentOrderIndex < noPreferenceMembers.length) {
        document.getElementById('order-next-button').classList.remove('hidden');
      } else {
        // 少し間を置いてから結果画面へ遷移する
        setTimeout(showOrderFinalResult, 1500);
      }
    }
  }

  requestAnimationFrame(animate);
}

// 次の人のルーレット画面へ進む
function nextOrderMember() {
  showOrderRoulettePage();
}

// 全員分の結果を一覧表示する
function showOrderFinalResult() {
  const total = orderMembers.length;
  const resultDiv = document.getElementById('order-final-result');

  let html = '';
  for (let i = 1; i <= total; i++) {
    html += `
      <div class="item-row">
        <span class="item-weight" style="min-width:60px;">${i}番目</span>
        <span class="item-name">${finalOrder[i]}</span>
      </div>
    `;
  }
  resultDiv.innerHTML = html;
  showPage('order-result-page');
}

// やり直し：メンバー入力画面に戻る（データは保持する）
function retryOrderMode() {
  remainingSlots = [];
  currentOrderIndex = 0;
  finalOrder = {};
  showPage('order-input-page');
  displayOrderMembers(); // 入力済みメンバーはそのまま残す
}

function backToOrderInput() {
  // 進行状態だけリセットし、メンバー情報（名前・希望）は保持する
  remainingSlots = [];
  currentOrderIndex = 0;
  finalOrder = {};
  isOrderSpinning = false;
  showPage('order-input-page');
  displayOrderMembers(); // 保持したメンバー情報を再描画する
}