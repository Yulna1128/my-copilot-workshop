# 待辦清單 Web App

依 GitHub Copilot 實戰工作坊規格完成的純前端待辦清單，採用教材 Step 2 解答為基礎，補上篩選保存、操作提示與批次清除功能。

## 線上展示

[開啟待辦清單](https://yulna1128.github.io/my-copilot-workshop/)

已啟用 GitHub Pages，由 `main` 根目錄部署。
本機直接用瀏覽器開啟根目錄的 `index.html`，不需要安裝套件。

## 功能

- 新增、勾選完成、刪除待辦事項，拒絕空白輸入。
- 顯示整體未完成數量，以及各篩選條件的空清單提示。
- localStorage 保存事項、主題與篩選偏好。
- 淺色／深色切換；沒有手動設定時跟隨系統主題。
- 全部／未完成／已完成篩選；切換完成狀態造成項目隱藏時給予提示。
- 在已完成篩選中新增事項時切回全部，立即顯示新增結果。
- 清除所有已完成事項前要求確認；沒有已完成事項時停用按鈕。
- 手機版面、鍵盤操作與螢幕閱讀器狀態提示。

## 技術

純 HTML、CSS、原生 JavaScript，無框架、無套件、無 CDN，可離線開啟。
CSS 變數管理配色；使用 DOM API 與 textContent 顯示使用者輸入。

## 開發方式與目前進度

本機實作由 AI 協助完成，包含教材提供的參考程式與後續功能修改。
已備妥 `.vscode/mcp.json`（Microsoft Learn 與 GitHub）、
`.github/copilot-instructions.md` 與 `.github/prompts/fix-issue.prompt.md`。
這些是供 VS Code Copilot Agent Mode 使用的設定與工作劇本；
尚未在 VS Code 驗證 MCP 連線或執行 `/fix-issue` 建立 PR。

GitHub Actions Step 1–4 已通過，Step 5 由本作品集提交觸發。
[PR #5](https://github.com/Yulna1128/my-copilot-workshop/pull/5) 已合併，
處理篩選偏好、操作提示與清除已完成三個 issue；GitHub Pages 已啟用。
本次使用 GitHub API 完成 PR 流程，並非宣稱已在 Copilot 執行劇本。
完成登記與個人學習回饋仍需本人填寫，此文件不代表已取得官方徽章。

## 學習重點

- 以清楚的功能與技術限制描述需求，並檢查 AI 產出。
- 把資料狀態、篩選與畫面更新分開處理。
- 將 MCP 外部工具設定與重複工作流程納入版本控制。
- 修改前建立 checkpoint；push 前先 `git pull --rebase`。

## 驗證方式

執行 `node --test scripts/app.test.cjs` 驗證核心互動與儲存行為。
瀏覽器手動檢查：新增兩筆、完成一筆、逐一切換篩選、重新整理，
確認資料及偏好保留；切換深色模式，並測試清除已完成的取消與確認。
最後縮窄視窗確認手機版面，使用 Tab 與 Enter 檢查鍵盤操作。

## 教材與答案

- [各關程式解答](solutions/README.md)
- [五題測驗與答案解析](docs/quiz.md)
- [徽章與成果指南](docs/badges.md)
- [卡關與手動推進方式](docs/troubleshooting.md)
