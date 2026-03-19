# QRコード受付システム API設計書

## 1. 概要

本APIは、Google Apps Script（GAS）Webアプリとして提供される。QRコード読み取りアプリ（フロントエンド）から参加者データの取得および受付登録を行う。

- **ベースURL**: GAS WebアプリのデプロイURL（例: `https://script.google.com/macros/s/xxxxx/exec`）
- **プロトコル**: HTTPS
- **データ形式**: JSON

---

## 2. CORS 対応

GitHub Pages から GAS Webアプリへのクロスオリジンリクエストを許可するため、レスポンスに以下のヘッダを付与する。

```
Access-Control-Allow-Origin: *
```

※ 本システムは課内限定利用のため、`*` で問題ない。より厳格にする場合はフロントエンドのオリジンを指定する。

---

## 3. API 一覧

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/` (クエリ: `id`) | 参加者情報取得 |
| POST | `/` (Body: JSON) | 受付登録 |

※ GAS の `doGet` / `doPost` はパスを区別しないため、リクエストパラメータまたはBodyでエンドポイントを識別する。

---

## 4. 参加者情報取得 API

### 4.1 概要

QRコードから読み取ったIDを元に、参加者データを取得する。

### 4.2 リクエスト

| 項目 | 内容 |
|------|------|
| **メソッド** | GET |
| **URL** | `{GAS_WEB_APP_URL}?action=getParticipant&id={participant_id}` |
| **クエリパラメータ** | 下表参照 |

#### クエリパラメータ

| パラメータ | 必須 | 型 | 説明 |
|------------|------|-----|------|
| action | ○ | string | `getParticipant`（固定） |
| id | ○ | string | 参加者ID（QRコードにエンコードされた値） |

#### リクエスト例

```
GET https://script.google.com/macros/s/xxxxx/exec?action=getParticipant&id=ORI-001
```

### 4.3 レスポンス

#### 成功時（200 OK）

参加者データが存在する場合。

```json
{
  "success": true,
  "data": {
    "id": "ORI-001",
    "email": "student@example.ac.jp",
    "name": "山田 太郎",
    "studentNumber": "2024001",
    "department": "修士課程",
    "residence": "大学寮A",
    "assemblyRoom": "101",
    "amReceptionStatus": "受付済み",
    "amReceptionDatetime": "2025-03-19 09:45:00",
    "amReceptionStaff": "佐藤",
    "pmReceptionStatus": "受付済み",
    "pmReceptionDatetime": "2025-03-19 14:30:00",
    "pmReceptionStaff": "田中"
  }
}
```

| フィールド | 型 | 説明 |
|------------|-----|------|
| success | boolean | 成功時は `true` |
| data | object | 参加者データ |
| data.id | string | 参加者ID |
| data.email | string | メールアドレス |
| data.name | string | 氏名 |
| data.studentNumber | string | 学籍番号 |
| data.department | string | 所属課程 |
| data.residence | string | 住まい |
| data.assemblyRoom | string | 集合教室 |
| data.amReceptionStatus | string | 午前受付ステータス（未受付時は空または「未受付」） |
| data.amReceptionDatetime | string | 午前受付日時 |
| data.amReceptionStaff | string | 午前受付担当者 |
| data.pmReceptionStatus | string | 午後受付ステータス（未受付時は空または「未受付」） |
| data.pmReceptionDatetime | string | 午後受付日時 |
| data.pmReceptionStaff | string | 午後受付担当者 |

※ フロントエンドの表示項目カスタマイズに応じ、必要なフィールドのみ返却する設計も可能。初期は全フィールドを返し、フロントで表示項目をフィルタする。

#### エラー時（200 OK + success: false）

IDが参加者データに存在しない場合。

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "指定されたIDの参加者が見つかりません。"
  }
}
```

| フィールド | 型 | 説明 |
|------------|-----|------|
| success | boolean | 失敗時は `false` |
| error | object | エラー情報 |
| error.code | string | エラーコード |
| error.message | string | エラーメッセージ |

#### エラーコード一覧

| コード | 説明 |
|--------|------|
| NOT_FOUND | 指定されたIDの参加者が存在しない |
| INVALID_REQUEST | 必須パラメータが不足している |
| SERVER_ERROR | サーバー内部エラー |

---

## 5. 受付登録 API

### 5.1 概要

QRスキャン時に、受付ステータス・受付日時・受付担当者をスプレッドシートに記録する。

### 5.2 リクエスト

| 項目 | 内容 |
|------|------|
| **メソッド** | POST |
| **URL** | `{GAS_WEB_APP_URL}` |
| **Content-Type** | `application/json` |
| **Body** | JSON形式 |

#### リクエストボディ

```json
{
  "action": "registerReception",
  "id": "ORI-001",
  "staff": "佐藤",
  "mode": "am"
}
```

| フィールド | 必須 | 型 | 説明 |
|------------|------|-----|------|
| action | ○ | string | `registerReception`（固定） |
| id | ○ | string | 参加者ID |
| staff | ○ | string | 受付担当者名 |
| mode | ○ | string | `am`（午前）または `pm`（午後） |

#### リクエスト例（fetch）

```javascript
fetch(GAS_WEB_APP_URL, {
  method: 'POST',
  mode: 'cors',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'registerReception',
    id: 'ORI-001',
    staff: '佐藤',
    mode: 'am'  // 'am'（午前）または 'pm'（午後）
  })
});
```

### 5.3 レスポンス

#### 成功時（200 OK）

```json
{
  "success": true,
  "data": {
    "id": "ORI-001",
    "mode": "am",
    "amReceptionStatus": "受付済み",
    "amReceptionDatetime": "2025-03-19 09:45:00",
    "amReceptionStaff": "佐藤"
  }
}
```

| フィールド | 型 | 説明 |
|------------|-----|------|
| success | boolean | 成功時は `true` |
| data | object | 登録結果 |
| data.id | string | 参加者ID |
| data.mode | string | 更新したモード（`am` または `pm`） |
| data.amReceptionStatus | string | 更新後の午前受付ステータス（mode が am の場合のみ更新） |
| data.amReceptionDatetime | string | 更新後の午前受付日時 |
| data.amReceptionStaff | string | 午前受付担当者 |
| data.pmReceptionStatus | string | 更新後の午後受付ステータス（mode が pm の場合のみ更新） |
| data.pmReceptionDatetime | string | 更新後の午後受付日時 |
| data.pmReceptionStaff | string | 午後受付担当者 |

※ 重複スキャン時も成功として扱い、該当モード（午前/午後）の受付日時・担当者を上書き更新する。午前と午後は独立して管理される。

#### エラー時（200 OK + success: false）

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "指定されたIDの参加者が見つかりません。"
  }
}
```

| コード | 説明 |
|--------|------|
| NOT_FOUND | 指定されたIDの参加者が存在しない |
| INVALID_REQUEST | 必須パラメータ（id, staff）が不足している |
| SERVER_ERROR | サーバー内部エラー |

---

## 6. GAS 実装上のルーティング

GAS は `doGet` / `doPost` のみのため、パラメータでエンドポイントを識別する。

### 6.1 doGet の処理フロー

```
doGet(e)
  │
  ├─ e.parameter.action === 'getParticipant' ?
  │      └─ Yes → 参加者情報取得処理
  │
  └─ No → INVALID_REQUEST を返却
```

### 6.2 doPost の処理フロー

```
doPost(e)
  │
  ├─ JSON.parse(e.postData.contents)
  │
  ├─ action === 'registerReception' ?
  │      └─ Yes → 受付登録処理
  │
  └─ No → INVALID_REQUEST を返却
```

---

## 7. スプレッドシート列とAPIフィールドのマッピング

| スプレッドシート列名 | API フィールド名 |
|---------------------|------------------|
| ID | id |
| メールアドレス | email |
| 氏名 | name |
| 学籍番号 | studentNumber |
| 所属課程 | department |
| 住まい | residence |
| 集合教室 | assemblyRoom |
| 午前受付ステータス | amReceptionStatus |
| 午前受付日時 | amReceptionDatetime |
| 午前受付担当者 | amReceptionStaff |
| 午後受付ステータス | pmReceptionStatus |
| 午後受付日時 | pmReceptionDatetime |
| 午後受付担当者 | pmReceptionStaff |

---

## 8. フロントエンドからの利用フロー

```
1. QRスキャン → ID 取得
2. GET ?action=getParticipant&id={id}
   - success: false → エラー表示・エラー音
   - success: true → 参加者情報表示
3. success: true の場合、POST { action, id, staff, mode }
   - 受付登録（スプレッドシートの午前/午後対応列を更新）
4. スキャン成功音
5. 現在のモードで既に受付済み（amReceptionStatus または pmReceptionStatus が「受付済み」）なら「受付済み」表示
```

---

*要件定義書・アーキテクチャ設計書に基づく。最終更新: 2025年3月*
