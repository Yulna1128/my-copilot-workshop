// 使用 Node 內建測試工具驗證互動狀態，不依賴外部套件。
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

function setup(saved = {}, denied = false) {
  const storage = new Map(Object.entries(saved));
  const makeElement = () => ({
    dataset: {}, children: [], handlers: {}, attributes: {}, value: '',
    classList: { toggle() {} },
    setAttribute(key, value) { this.attributes[key] = value; },
    addEventListener(event, handler) { this.handlers[event] = handler; },
    append(...children) { this.children.push(...children); },
    replaceChildren() { this.children = []; }, focus() {},
  });
  const elements = new Map();
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, makeElement());
    return elements.get(id);
  };
  const filters = ['all', 'active', 'completed'].map((filter) => {
    const element = makeElement(); element.dataset.filter = filter; return element;
  });
  const media = { matches: false, addEventListener(event, fn) { this.change = fn; } };
  const context = vm.createContext({
    console, document: {
      documentElement: makeElement(), getElementById: get,
      querySelectorAll: () => filters, createElement: makeElement,
    },
    localStorage: {
      getItem(key) { if (denied) throw Error('blocked'); return storage.get(key) ?? null; },
      setItem(key, value) { if (denied) throw Error('blocked'); storage.set(key, value); },
    },
    window: { matchMedia: () => media, confirm: () => true },
  });
  vm.runInContext(source, context);
  const run = (code) => vm.runInContext(code, context);
  const submit = (value) => {
    get('todo-input').value = value;
    get('todo-form').handlers.submit({ preventDefault() {} });
  };
  return { get, filters, storage, run, submit, context, media };
}

test('新增、空白拒絕、完成、刪除與重新載入', () => {
  const app = setup();
  app.submit('   '); assert.equal(app.get('todo-list').children.length, 0);
  app.submit(' 買牛奶 '); app.submit('<script>alert(1)</script>');
  assert.equal(app.get('todo-list').children[1].children[1].textContent, '<script>alert(1)</script>');
  app.run('toggleTodo(todos[0].id)');
  assert.equal(app.get('remaining-count').textContent, '未完成:1 項');
  const reloaded = setup(Object.fromEntries(app.storage));
  assert.equal(reloaded.get('todo-list').children.length, 2);
  assert.equal(reloaded.get('todo-list').children[0].children[0].checked, true);
  reloaded.run('deleteTodo(todos[0].id)');
  assert.equal(JSON.parse(reloaded.storage.get('workshop-todos')).length, 1);
});

test('篩選持久化、按鈕狀態、全域計數與隱藏提示', () => {
  const app = setup(); app.submit('A'); app.submit('B');
  app.run('toggleTodo(todos[0].id); setFilter("completed")');
  const reloaded = setup(Object.fromEntries(app.storage));
  assert.equal(reloaded.get('todo-list').children.length, 1);
  assert.equal(reloaded.filters[2].attributes['aria-pressed'], 'true');
  assert.equal(reloaded.get('remaining-count').textContent, '未完成:1 項');
  reloaded.run('toggleTodo(todos[0].id)');
  assert.equal(reloaded.get('empty-state').hidden, false);
  assert.match(reloaded.get('status-message').textContent, /並未刪除/);
  assert.equal(JSON.parse(reloaded.storage.get('workshop-todos')).length, 2);
  reloaded.submit('C');
  assert.equal(reloaded.get('todo-list').children.length, 3);
  assert.equal(setup({ 'workshop-filter': 'invalid' }).filters[0].attributes['aria-pressed'], 'true');
});

test('清除已完成必須確認，取消時保留資料', () => {
  const app = setup(); assert.equal(app.get('clear-completed').disabled, true);
  app.submit('A'); app.submit('B'); app.run('toggleTodo(todos[0].id)');
  app.context.window.confirm = () => false;
  app.get('clear-completed').handlers.click();
  assert.equal(app.get('todo-list').children.length, 2);
  app.context.window.confirm = () => true;
  app.get('clear-completed').handlers.click();
  assert.equal(app.get('todo-list').children.length, 1);
  assert.equal(app.get('clear-completed').disabled, true);
  assert.equal(JSON.parse(app.storage.get('workshop-todos')).length, 1);
});

test('主題跟隨系統，手動偏好優先且可保存', () => {
  const app = setup(); app.media.matches = true; app.media.change();
  assert.equal(app.context.document.documentElement.dataset.theme, 'dark');
  app.get('theme-toggle').handlers.click();
  assert.equal(app.storage.get('workshop-theme'), 'light');
  app.media.change(); assert.equal(app.context.document.documentElement.dataset.theme, 'light');
  assert.equal(setup(Object.fromEntries(app.storage)).context.document.documentElement.dataset.theme, 'light');
});

test('損壞資料與停用儲存時仍可操作', () => {
  assert.equal(setup({ 'workshop-todos': '[null,{}]' }).get('todo-list').children.length, 0);
  const app = setup({}, true); app.submit('A');
  assert.equal(app.get('todo-list').children.length, 1);
  assert.match(app.get('status-message').textContent, /無法儲存/);
});
