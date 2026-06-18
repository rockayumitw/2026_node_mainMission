const http = require('node:http');
const fs = require('node:fs');
const { formidable } = require('formidable');  // formidable v3 用 named import


// ========== 任務一：讀取上傳設定 ==========
/**
 * 從 process.env 讀取上傳相關設定，回傳設定物件。
 *
 * 規則：
 *   - UPLOAD_DIR 未設定 → 預設 '/tmp'
 *   - MAX_FILE_SIZE_MB 未設定 → 預設 5（MB）
 *   - GYM_NAME 未設定 → 預設 '未命名健身房'
 *
 * 回傳物件：
 *   - uploadDir: 上傳目錄（字串）
 *   - maxFileSize: 最大檔案大小（bytes，= MB * 1024 * 1024）
 *   - gymName: 健身房名稱（字串）
 *
 * @returns {{uploadDir: string, maxFileSize: number, gymName: string}}
 *
 * @example
 *   process.env.UPLOAD_DIR = '/tmp/uploads';
 *   process.env.MAX_FILE_SIZE_MB = '10';
 *   process.env.GYM_NAME = 'FitClub';
 *   getUploadConfig();
 *   // { uploadDir: '/tmp/uploads', maxFileSize: 10485760, gymName: 'FitClub' }
 */
function getUploadConfig() {
  // TODO: 實作此函式
  // 提示：用 || 給預設值；MAX_FILE_SIZE_MB 是字串，記得先 Number() 轉型再換算 bytes
  const MB = Number(process.env.MAX_FILE_SIZE_MB || 5)
  return {
    uploadDir: process.env.UPLOAD_DIR || '/tmp',
    maxFileSize: MB * 1024 * 1024,
    gymName: process.env.GYM_NAME || '未命名健身房',
  };
}

// ========== 任務二：取副檔名 ==========
/**
 * 從檔名取副檔名，一律回小寫帶 `.`。
 *
 * 規則：
 *   - 'cat.jpg' → '.jpg'
 *   - 'PHOTO.JPG' → '.jpg'（一律小寫）
 *   - 'README' → ''（沒有副檔名）
 *   - 'archive.tar.gz' → '.gz'（只取最後一個）
 *
 * @param {string} filename
 * @returns {string}
 *
 * @example
 *   getFileExtension('cat.jpg');     // '.jpg'
 *   getFileExtension('PHOTO.JPG');   // '.jpg'
 *   getFileExtension('README');      // ''
 */
function getFileExtension(filename) {
  // TODO: 實作此函式
  // 提示：用 lastIndexOf('.') 找最後一個 .，toLowerCase() 轉小寫
  const ext = filename.lastIndexOf('.')
  if (ext === -1) return ''
  return filename.slice(ext).toLowerCase();
}

// ========== 任務三：解析檔案 metadata ==========
/**
 * 吃 formidable 解析後的 file 物件，回傳整理好的 metadata。
 *
 * formidable 的 file 物件至少有：
 *   - originalFilename: 原始檔名
 *   - size: 檔案 byte 數
 *
 * 回傳：
 *   - filename: 原始檔名
 *   - sizeKB: 檔案大小換成 KB（四捨五入，用 Math.round）
 *   - ext: 副檔名（用任務二的 getFileExtension）
 *
 * @param {{originalFilename: string, size: number}} file
 * @returns {{filename: string, sizeKB: number, ext: string}}
 *
 * @example
 *   parseFileMetadata({ originalFilename: 'leo.jpg', size: 250000 });
 *   // { filename: 'leo.jpg', sizeKB: 244, ext: '.jpg' }
 */
function parseFileMetadata(file) {
  // TODO: 實作此函式
  // 提示：呼叫 getFileExtension 取副檔名，Math.round(size / 1024) 算 KB
  const { originalFilename, size} = file
  // 2. 換算成 KB 並四捨五入
  const sizeKB = Math.round(size / 1024);
  
  // 3. 呼叫任務二的函式取得小寫副檔名
  const ext = getFileExtension(originalFilename);
  
  return {
    filename: originalFilename,
    sizeKB,
    ext
  };
}

// ========== 任務四：產出 upload log 字串 ==========
/**
 * 吃 metadata + config，產出一行 log 字串。
 *
 * 格式：`[{gymName}] Uploaded {filename} ({sizeKB} KB) → {uploadDir}`
 *
 * @param {{filename: string, sizeKB: number}} meta
 * @param {{uploadDir: string, gymName: string}} config
 * @returns {string}
 *
 * @example
 *   formatUploadLog(
 *     { filename: 'leo.jpg', sizeKB: 245, ext: '.jpg' },
 *     { uploadDir: '/tmp/uploads', gymName: 'FitClub' }
 *   );
 *   // '[FitClub] Uploaded leo.jpg (245 KB) → /tmp/uploads'
 */
function formatUploadLog(meta, config) {
  // TODO: 實作此函式
  // 提示：用 template literal 組字串
  return `[${config.gymName}] Uploaded ${meta.filename} (${meta.sizeKB} KB) → ${config.uploadDir}`;
}

// ========== 任務五：路由分派 ==========
/**
 * 吃 HTTP request / response / config，依 method + url 分派到對應處理邏輯。
 *
 * 規格：
 *   - POST /coaches/avatar：
 *     * 用 formidable 解析 multipart/form-data
 *     * 成功 → 回 200 + JSON { filename, sizeKB, ext, savedPath }
 *     * formidable 解析錯誤（含超過 maxFileSize）→ 回 500 + JSON { error }
 *     * 沒 file 欄位 → 回 400 + JSON { error: 'No file uploaded' }
 *   - 其他路徑 → 回 404 + JSON { error: 'Not Found' }
 *
 * formidable 設定：
 *   - uploadDir / maxFileSize 從 config 取
 *   - keepExtensions: true
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {{uploadDir: string, maxFileSize: number, gymName: string}} config
 * @returns {void} 直接操作 res 回寫、不 return 值
 *
 * @example
 *   // 在 createUploadServer 裡：
 *   http.createServer((req, res) => router(req, res, config))
 */

// 輔助函式：處理 404 邏輯
function handleNotFound(req, res) {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}

// 輔助函式：處理上傳與 formidable 邏輯
function handleUpload(req, res, config) {
  // 引入 formidable (請確保專案頂端有 require('formidable') 或 formidable 已載入)
  // const formidable = require('formidable');
  
  // 初始化 formidable 設定
  const form = formidable({
    uploadDir: config.uploadDir,
    maxFileSize: config.maxFileSize,
    keepExtensions: true
  });

  // 錯誤處理：formidable v3 超過 maxFileSize 會觸發 'error' 事件
  form.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  // 解析 request
  form.parse(req, (err, fields, files) => {
    // 如果已經觸發過 'error' 事件，或重複回應，就不要再處理
    if (res.headersSent) return;

    // 處理 parse 過程中的其他錯誤
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }

    // 依常見問題提示：formidable v3 會將同名欄位包成陣列，取得 file 欄位的第一個檔案
    const file = files.file && files.file[0];

    // 如果沒有上傳檔案欄位
    if (!file) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'No file uploaded' }));
    }

    // 呼叫任務三解析 metadata
    const meta = parseFileMetadata(file);

    // 呼叫任務四印出 log
    console.log(formatUploadLog(meta, config));

    // 回傳成功狀態 200 與規定的 JSON 格式 (包含新存檔的 filepath)
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      filename: meta.filename,
      sizeKB: meta.sizeKB,
      ext: meta.ext,
      savedPath: file.filepath // formidable 存檔後的路徑
    }));
  });
}

function router(req, res, config) {
  // TODO: 實作此函式
  // 建議（非強制）：
  //   - 拆出 handleUpload(req, res, config)：formidable 解析邏輯
  //   - 拆出 handleNotFound(req, res)：404 邏輯
  //   - router 只看 method + url、呼叫對應 handler
  // formidable 錯誤處理要點：
  //   - 超過 maxFileSize 時 formidable v3 發 'error' event，要用 form.on('error', ...) 接
  //   - 同時 form.parse 的 callback err 也要處理
  //   - 避免重複 res.writeHead（檢查 res.headersSent）
  const { method, url } = req;

  // 路由分派
  if (method === 'POST' && url === '/coaches/avatar') {
    handleUpload(req, res, config);
  } else {
    handleNotFound(req, res);
  }
}

// ========== 任務六：建立上傳 server ==========
/**
 * 建 http.Server、把每個 request 交給 router。
 *
 * 規格：
 *   - 如果 config.uploadDir 不存在，用 fs.mkdirSync(uploadDir, { recursive: true }) 自動建
 *   - http.createServer(...) 把 request 交給 router(req, res, config)
 *   - 回傳 server instance（不要 server.listen()，那是 app.js 的責任）
 *
 * @param {{uploadDir: string, maxFileSize: number}} config
 * @returns {http.Server}
 *
 * @example
 *   const server = createUploadServer({ uploadDir: '/tmp', maxFileSize: 5 * 1024 * 1024 });
 *   server.listen(3000);  // ← 這行由 app.js 呼叫
 */
function createUploadServer(config) {
  // TODO: 實作此函式
  if (config.uploadDir && !fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }
  
  // 提示：主邏輯都在 router 裡，這邊函式內容不多
  const server = http.createServer((req, res) => {
    router(req, res, config);
  });
  return server
}

module.exports = {
  getUploadConfig,
  getFileExtension,
  parseFileMetadata,
  formatUploadLog,
  router,
  createUploadServer,
};
