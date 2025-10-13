# Anki Card Chrome Plugin 開發計畫 (v2)

本文件根據使用者回饋更新，旨在規劃一個 Chrome 擴充功能，讓使用者能方便地從網頁擷取內容並建立 Anki 卡片。

## 1. 設計決策 (Design Decisions)

根據討論，我們將採用以下設計：

1.  **觸發方式**:
    *   使用者點擊 Chrome 工具列上的擴充功能圖示。
    *   點擊後，在當前頁面的右下角會出現一個浮動的編輯視窗（類似新增郵件的介面）。

2.  **編輯介面**:
    *   浮動視窗包含「問題」（對應 Anki 正面）、「解答」（對應 Anki 背面）的文字輸入區域，以及一個「送出」按鈕。
    *   輸入區域接受 Markdown 格式。

3.  **內容擷取**:
    *   當浮動視窗開啟時，使用者在網頁上選取任何文字，選取範圍旁會出現兩個小圖示按鈕。
    *   **圖示一**: 將選取內容新增至「問題」欄位 (可搭配 hotkey)。
    *   **圖示二**: 將選取內容新增至「解答」欄位 (可搭配 hotkey)。

4.  **圖片處理**:
    *   如果選取範圍包含圖片 (`<img>` 標籤)，則自動擷取**第一張**符合格式 (`.webp`, `.jpg`, `.png`) 的圖片。
    *   一張卡片只允許附加一張圖片，新的圖片會覆蓋舊的。
    *   圖片在上傳前會進行等比壓縮，確保最長邊不超過 1024 像素。
    *   最終圖片將以 Base64 格式透過 AnkiConnect API 上傳。

5.  **Anki 設定**:
    *   **牌組 (`deckName`)**: 固定使用 `"Default"`。
    *   **卡片類型 (`modelName`)**: 固定使用 `"Basic"`。
    *   **標籤 (`tags`)**: 第一版不支援。

## 2. 技術細節 (Technical Details)

### 2.1. Chrome Extension 架構

*   **`manifest.json`**:
    *   `"manifest_version": 3`
    *   `"permissions": ["activeTab", "scripting", "storage"]`
    *   `"host_permissions": ["http://127.0.0.1:8765/"]`
    *   `"background": {"service_worker": "background.js"}`
    *   `"action": {}` (無 `default_popup`，點擊圖示將觸發 background script)
    *   `"web_accessible_resources"`: 需宣告要注入的 CSS/HTML 檔案。

*   **`background.js`**:
    *   監聽擴充功能圖示的點擊事件 (`chrome.action.onClicked`)。
    *   點擊後，向當前分頁的 `content.js` 發送訊息，命令其顯示或隱藏浮動視窗。
    *   接收 `content.js` 傳來的最終卡片資料，並負責呼叫 AnkiConnect API。

*   **`content.js`**:
    *   **核心腳本**，負責大部分的 DOM 操作。
    *   接收 `background.js` 的訊息，動態地將浮動視窗的 HTML/CSS 注入到頁面中。
    *   監聽頁面上的 `mouseup` 事件以偵測文字選取。
    *   當偵測到選取時，計算位置並顯示兩個「新增至...」的圖示按鈕。
    *   處理圖示按鈕的點擊事件，將選取的 HTML (包含文字與圖片標籤) 傳送至浮動視窗的對應欄位。

### 2.2. 圖片壓縮與轉換

在 `content.js` 或 `background.js` 中實現。

```javascript
async function processImage(imageUrl) {
  const MAX_SIZE = 1024;
  const image = new Image();
  image.crossOrigin = "anonymous"; // Handle CORS
  image.src = imageUrl;
  await image.decode();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let { width, height } = image;
  if (width > height) {
    if (width > MAX_SIZE) {
      height = Math.round((height * MAX_SIZE) / width);
      width = MAX_SIZE;
    }
  } else {
    if (height > MAX_SIZE) {
      width = Math.round((width * MAX_SIZE) / height);
      height = MAX_SIZE;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  // 返回 Base64 字串 (不含 data URL 前綴)
  return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
}
```

### 2.3. AnkiConnect API 呼叫 (無標籤)

```json
{
  "action": "addNote",
  "version": 6,
  "params": {
    "note": {
      "deckName": "Default",
      "modelName": "Basic",
      "fields": {
        "Front": "問題的 Markdown 內容",
        "Back": "解答的 Markdown 內容"
      },
      "picture": [
        // 如果有圖片，則加入此物件
        {
          "data": "COMPRESSED_BASE64_STRING",
          "filename": "anki-web-clipper-image.jpg"
        }
      ]
    }
  }
}
```
*注意：`picture` 中的 `fields` 欄位可以省略，AnkiConnect 會自動將圖片附加到第一個合適的欄位。我們仍需在 `Back` 欄位手動插入 `<img>` 標籤。*

## 3. 任務切分 (Task Breakdown)

### 階段一：浮動視窗的顯示與隱藏
*   **任務**:
    1.  建立基本的 `manifest.json` 與 `background.js`。
    2.  建立浮動視窗的 `floating-ui.html` 和 `floating-ui.css`。
    3.  實作 `background.js` 監聽圖示點擊，並通知 `content.js` 注入/移除 UI。
*   **可驗證性**:
    *   點擊擴充功能圖示，頁面右下角出現浮動視窗。
    *   再次點擊圖示，視窗消失。

### 階段二：文字擷取與填充
*   **任務**:
    1.  在 `content.js` 中監聽文字選取事件。
    2.  建立並顯示兩個「新增」小圖示在選取範圍旁。
    3.  當點擊圖示時，將選取的文字附加到浮動視窗中對應的（問題/解答）`textarea`。
*   **可驗證性**:
    *   在網頁上選取文字，旁邊會出現兩個小圖示。
    *   點擊「新增至問題」圖示，文字出現在浮動視窗的「問題」區塊。
    *   點擊「新增至解答」圖示，文字出現在浮動視窗的「解答」區塊。

### 階段三：純文字 Anki 卡片提交
*   **任務**:
    1.  在浮動視窗中實現「送出」按鈕的功能。
    2.  點擊送出時，`content.js` 將問題和解答的內容傳給 `background.js`。
    3.  `background.js` 呼叫 AnkiConnect API，建立純文字卡片。
    4.  提供基本的成功/失敗回饋。
*   **可驗證性**:
    *   在浮動視窗中手動輸入內容並送出，Anki 中會出現對應的新卡片。
    *   若 AnkiConnect 未啟動，UI 會提示錯誤。

### 階段四：圖片擷取、壓縮與預覽
*   **任務**:
    1.  修改 `content.js` 的選取邏輯，使其能從選取內容的 HTML 中解析出 `<img>` 標籤。
    2.  擷取第一張符合格式的圖片 URL。
    3.  在浮動視窗中新增一個區域來預覽圖片。
    4.  實現 `processImage` 函式進行圖片壓縮，並將結果（或預覽）顯示在 UI 中。
*   **可驗證性**:
    *   選取一段包含圖片的網頁內容，浮動視窗中會顯示該圖片的預覽。
    *   新的選取會替換掉舊的圖片。

### 階段五：完整圖文卡片提交
*   **任務**:
    1.  整合送出邏輯，使其能同時處理文字與圖片資料。
    2.  在 `background.js` 中，根據有無圖片來建構不同的 API請求 Body。
    3.  在解答欄位中正確插入 `<img>` 標籤，使其能引用上傳的圖片檔案。
*   **可驗證性**:
    *   擷取文字和圖片後送出，Anki 中會出現包含文字和正確顯示的壓縮圖片的新卡片。

### 階段六：Hotkeys 與優化
*   **任務**:
    1.  為「新增至問題」和「新增至解答」的圖示綁定鍵盤快速鍵 (hotkey)。
    2.  優化 UI/UX，例如加入讀取中的狀態提示。
*   **可驗證性**:
    *   選取文字後，使用快速鍵可以將文字加入對應欄位。
