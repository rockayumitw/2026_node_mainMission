const express = require('express');
const initialMembers = require('../fixtures/members.json');

// ⚠️ 寫作業前先 `npm start` 打開 http://localhost:3000/docs 看 Swagger UI 的規格。
// 💡 /* 作答區 ... */ 是答題提示區，取消註解後填入你的程式碼。

// ───────────────────────────────────────────────────────────
// TODO 任務一：初始化 state + 內部 helpers
// ───────────────────────────────────────────────────────────

// 1. 複製 initialMembers，不直接改外部陣列
/* 作答區
let members = ...;
*/
const members = [...initialMembers]


// 2. 下一個新增會員要使用的 id
/* 作答區
let nextId = ...;
*/
let nextId = initialMembers.length + 1

// 3. 兩個內部 helper 函式

// 函式一：filterByQuery(list, query)：
// - 依據 query.level 篩選，沒帶就回全部
// - 任務二的 GET / 會使用到這個函式
/* 作答區
function filterByQuery(list, query) { ... }
*/
const filterByQuery = (list, query) => {
    if (!query?.level) return list
    return list.filter(a => a.level === query.level)
}

// 函式二：validateBody(body)
// - 驗證 body 有沒有 name、level 欄位，要擋 null / undefined / {}
// - 驗證通過 → { valid: true }
// - 驗證失敗 → { valid: false, error: '缺 name 或 level' }
// - 任務三的 POST / 會使用到這個函式
/* 作答區
function validateBody(body) { ... }
*/
const validateBody = (body) => {
    // 檢查 body 是否不存在 或者是否空物件 {}
    if (!body || Object.keys(body).length === 0) {
        return { valid: false, error: '缺 name 或 level' };
    }
    // 檢查是否缺少 name 或 level 欄位
    if (body.name === undefined || body.name === null || body.level === undefined || body.level === null) {
        return { valid: false, error: '缺 name 或 level' };
    }

    // 驗證通過
    return { valid: true };
}

const router = express.Router();
// 此 router 掛在 app.js 的 '/members'，以下路由皆帶此前綴。舉例來說：
// - router.get('/') → GET /members
// - router.get('/:id') → GET /members/:id

// ───────────────────────────────────────────────────────────
// TODO 任務二：GET / 和 GET /:id
// ───────────────────────────────────────────────────────────

// GET /
// - 輸入：req.query.level 可帶 'VIP' | 'normal'（選填）
// - 輸出：200 + [{ id, name, level }, ...]
// - 提示：filterByQuery(members, req.query)
/* 作答區
router.METHOD('PATH', (req, res) => { ... });
*/
router.get('/', (req, res) => {
    const r = filterByQuery(members, req.query)
    return res.status(200).json(r)
})

// GET /:id
// - 輸入：req.params.id（string，需使用 Number() 轉換）
// - 輸出：200 + { id, name, level }，或 404 + { error: '會員不存在' }（找不到時）
// - 提示：members.find，找不到時結果是 undefined
/* 作答區
router.METHOD('PATH', (req, res) => { ... });
*/
router.get('/:id', (req, res) => {
    const id = Number(req.params.id)
    const member = members.find(item => item.id === id)
    if (!member) {
        return res.status(404).json({
            error: '會員不存在'
        })
    }
    return res.status(200).json(member)
})

// ───────────────────────────────────────────────────────────
// TODO 任務三：POST /
// ───────────────────────────────────────────────────────────

// POST /
// - 輸入：body = { name: string, level: 'VIP' | 'normal' }
// - 輸出：201 + 新會員物件（id 自動配），或 400 + { error: '缺 name 或 level' }（驗證失敗）
// - 提示：validateBody(req.body) 驗證；通過後用 spread 將 req.body 的欄位與 nextId 自動遞增的 id 合為新物件，push 進 members
// - 範例：POST /members body { name: '阿文', level: 'VIP' } → 201 { id: 5, name: '阿文', level: 'VIP' }
/* 作答區
router.METHOD('PATH', (req, res) => { ... });
*/

router.post('/', (req, res) => {
    const validation = validateBody(req.body);
    // 如果失敗就回應 400 + 錯誤訊息
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    // 通過後將 id 與 body 合併為新物件（注意 nextId 的使用與遞增）
    const newMember = {
        id: nextId,
        ...req.body
    };

    // push 進 members，並將 nextId 遞增
    members.push(newMember);
    nextId++;

    // 回應 201 + 新會員物件
    return res.status(201).json(newMember);
})

// ───────────────────────────────────────────────────────────
// TODO 任務四：PUT /:id 和 DELETE /:id
// ───────────────────────────────────────────────────────────

// PUT /:id
// - 輸入：req.params.id（string，需 Number() 轉換）、body（部分欄位，例如只傳 { level: 'normal' }）
// - 輸出：200 + merge 後的會員，或 404 + { error: '會員不存在' }（找不到時）
// - 提示：members.findIndex 找索引，-1 回應 404；找到索引則使用 spread 合併 members[idx] 與 req.body（req.body 需注意順序來覆蓋舊欄位），最後將結果存回 members[idx]
// - 範例：PUT /members/1 body { level: 'normal' } → 200 { id: 1, name: '小華', level: 'normal' }（name 被保留）
/* 作答區
router.METHOD('PATH', (req, res) => { ... });
*/
router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    // 提示：members.findIndex 找索引
    const idx = members.findIndex(item => item.id === id);

    // -1 回應 404
    if (idx === -1) {
        return res.status(404).json({ error: '會員不存在' });
    }

    // 找到索引則使用 spread 合併（req.body 放在後面以覆蓋舊欄位）
    const updatedMember = {
        ...members[idx],
        ...req.body
    };

    // 將結果存回 members[idx]
    members[idx] = updatedMember;

    // 回應 200 + merge 後的會員
    return res.status(200).json(updatedMember);
});

// DELETE /:id
// - 輸入：req.params.id（string，需 Number() 轉換）
// - 輸出：204（無 body），或 404 + { error: '會員不存在' }（找不到時）
// - 提示：members.findIndex 找索引，-1 回應 404；找到索引則 splice 移除，再設定 status 204 並以 .end() 結束回應（204 不帶 body）
/* 作答區
router.METHOD('PATH', (req, res) => { ... });
*/
router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    const idx = members.findIndex(item => item.id === id);

    // -1 回應 404
    if (idx === -1) {
        return res.status(404).json({ error: '會員不存在' });
    }

    // 找到索引則 splice 移除
    members.splice(idx, 1);

    // 設定 status 204 並以 .end() 結束回應（204 不帶 body）
    return res.status(204).end();
});

module.exports = router;
