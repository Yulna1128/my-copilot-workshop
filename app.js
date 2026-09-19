// ===== 我的待辦清單 =====
// 純前端實作,不使用任何框架或套件。資料與偏好設定都存在瀏覽器的 localStorage。

const STORAGE_KEY = 'workshop-todos';
const THEME_KEY = 'workshop-theme';
const filterKey = 'workshop-filter';
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

// 取得畫面上會用到的元素
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const filterButtons = document.querySelectorAll('.btn-filter');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');
const statusMessage = document.getElementById('status-message');
const clearCompleted = document.getElementById('clear-completed');

// 所有待辦事項都放在這個陣列裡
// 每一筆的格式:{ id: '169...', text: '買牛奶', completed: false }
let todos = loadTodos();

// 目前的篩選條件:'all' | 'active' | 'completed'
const savedFilter = readPreference(filterKey);
let currentFilter = ['all', 'active', 'completed'].includes(savedFilter) ? savedFilter : 'all';

// 瀏覽器停用儲存時仍可操作，並明確告知使用者。
function readPreference(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    statusMessage.textContent = '瀏覽器無法儲存資料，重新整理後可能遺失本次變更。';
  }
}

// ---------- 資料存取 ----------

/** 從 localStorage 讀回待辦清單,讀不到或格式壞掉就回傳空陣列 */
function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter((todo) => todo &&
      typeof todo.id === 'string' && typeof todo.text === 'string' &&
      typeof todo.completed === 'boolean') : [];
  } catch (error) {
    console.warn('讀取待辦清單失敗,將以空清單開始。', error);
    return [];
  }
}

/** 把目前的待辦清單寫回 localStorage */
function saveTodos() {
  writePreference(STORAGE_KEY, JSON.stringify(todos));
}

// ---------- 深色模式 ----------

/**
 * 套用主題。
 * @param {'light' | 'dark'} theme
 */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  const isDark = theme === 'dark';
  themeIcon.textContent = isDark ? '☀️' : '🌙';
  themeLabel.textContent = isDark ? '淺色模式' : '深色模式';
  themeToggle.setAttribute('aria-pressed', String(isDark));
}

/**
 * 決定一開始要用哪個主題:
 * 使用者選過就聽使用者的,沒選過就跟隨作業系統設定。
 */
function initTheme() {
  const savedTheme = readPreference(THEME_KEY);

  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme);
    return;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

// ---------- 畫面繪製 ----------

/** 依照目前的篩選條件,回傳要顯示的待辦事項 */
function getVisibleTodos() {
  if (currentFilter === 'active') {
    return todos.filter((todo) => !todo.completed);
  }
  if (currentFilter === 'completed') {
    return todos.filter((todo) => todo.completed);
  }
  return todos;
}

/** 清單為空時,依篩選條件給不同的提示文字 */
function getEmptyMessage() {
  if (todos.length === 0) {
    return '還沒有任何待辦事項,新增一個吧!';
  }
  if (currentFilter === 'active') {
    return '太棒了,沒有未完成的事項!';
  }
  return '還沒有已完成的事項。';
}

/** 依照目前的 todos 陣列與篩選條件,重新畫出整份清單 */
function render() {
  const visibleTodos = getVisibleTodos();

  list.replaceChildren();

  visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = todo.completed ? 'todo-item completed' : 'todo-item';
    item.dataset.id = todo.id;

    // 完成勾選框
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `標記「${todo.text}」為完成`);

    // 待辦文字
    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    // 刪除按鈕
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn-delete';
    deleteButton.textContent = '✕';
    deleteButton.setAttribute('aria-label', `刪除「${todo.text}」`);

    item.append(checkbox, text, deleteButton);
    list.append(item);
  });

  // 目前篩選結果是空的時候顯示提示文字
  emptyState.hidden = visibleTodos.length > 0;
  emptyState.textContent = getEmptyMessage();

  // 更新未完成數量(不受篩選影響,永遠是整體數量)
  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `未完成:${remaining} 項`;
  clearCompleted.disabled = !todos.some((todo) => todo.completed);
}

// ---------- 操作行為 ----------

/** 產生一組不會重複的 id(時間戳 + 隨機碼) */
function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 新增一筆待辦 */
function addTodo(text) {
  // 新增的事項未完成，切回全部以便立即看見。
  if (currentFilter === 'completed') setFilter('all');
  todos.push({
    id: createId(),
    text,
    completed: false,
  });
  saveTodos();
  render();
}

/** 切換某一筆待辦的完成狀態 */
function toggleTodo(id) {
  statusMessage.textContent = currentFilter === 'all' ? '' :
    '完成狀態已更新；項目只是被目前篩選條件隱藏，並未刪除。切換「全部」即可查看。';
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  saveTodos();
  render();
}

/** 刪除某一筆待辦 */
function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

/** 切換篩選條件 */
function setFilter(filter) {
  currentFilter = filter;
  writePreference(filterKey, filter);

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  render();
}

// ---------- 事件綁定 ----------

// 送出表單 = 新增待辦
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return; // 空白內容不新增

  addTodo(text);
  input.value = '';
  input.focus();
});

// 用事件委派處理清單內的點擊(勾選完成 / 刪除)
list.addEventListener('click', (event) => {
  const item = event.target.closest('.todo-item');
  if (!item) return;

  const id = item.dataset.id;

  if (event.target.matches('input[type="checkbox"]')) {
    toggleTodo(id);
  } else if (event.target.matches('.btn-delete')) {
    deleteTodo(id);
  }
});

// 篩選按鈕
filterButtons.forEach((button) => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});

// 深色模式切換,並把選擇記在 localStorage
themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  writePreference(THEME_KEY, nextTheme);
});

systemTheme.addEventListener('change', () => initTheme());

clearCompleted.addEventListener('click', () => {
  if (!todos.some((todo) => todo.completed)) return;
  if (!window.confirm('確定要清除所有已完成事項嗎？此操作無法復原。')) return;
  todos = todos.filter((todo) => !todo.completed);
  statusMessage.textContent = '已清除所有已完成事項。';
  saveTodos();
  render();
});

// 頁面載入時先套用主題並畫一次清單
initTheme();
setFilter(currentFilter);
