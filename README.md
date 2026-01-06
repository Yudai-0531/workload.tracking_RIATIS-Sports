# ⚡ FIGHTING 24H - Are you fighting 24 hours a day?

## 🔥 概要
日々の労働時間と『戦っている時間』を可視化し、モチベーションを極限まで高める勤怠管理Webアプリケーション

**クライアント:** RIATIS Sports Inc.

## 🎨 デザインコンセプト
- **テーマ:** Red Bull × Cyberpunk × Neon
- **カラー:** Neon Red/Pink, Electric Blue, Dark Navy
- **哲学:** 休息も戦いの一部。24時間、命を燃やせ。

---

## 📋 セットアップ手順

### 1. Supabaseデータベース設定

1. Supabaseダッシュボード（https://supabase.com/dashboard）にアクセス
2. プロジェクトを選択
3. 左メニューから **「SQL Editor」** をクリック
4. 「New Query」で新規クエリを作成
5. `database_setup.sql` の内容をコピー＆ペースト
6. **「Run」** ボタンをクリックして実行

これでテーブルが作成され、テストユーザー（山田太郎、佐藤花子）が登録されます。

### 2. アプリケーションの起動

このプロジェクトは **静的HTML** なので、特別なビルドは不要です。

#### ローカルで起動する場合：
```bash
# 簡易HTTPサーバーを起動（Python 3がインストールされている場合）
python3 -m http.server 8000

# ブラウザで開く
# http://localhost:8000
```

#### そのままブラウザで開く場合：
`index.html` をダブルクリックしてブラウザで開くだけでOK！

---

## 🚀 使い方

### データ記録ページ

1. **戦士を選択** - ドロップダウンから自分の名前を選択
   - 新規登録は「➕ 新規登録」ボタンから
2. **FIGHT START** - 労働開始時に押す
3. **FIGHT END** - 業務終了時に押す
4. **休憩時間** - 必要に応じて休憩時間（分）を入力

### My Page (ダッシュボード)

- **名言表示** - ページを開くたびにランダムで表示
- **統計情報** - 今日/今週の戦闘時間、目標達成率
- **設定** - 週間目標時間、週あたりの休日数を設定

#### 重要：休日の扱い
設定した **週あたりの休日数 × 24時間** が自動的に「戦った時間」として合計に加算されます。

例：休日2日 → 48時間が週の合計にボーナスとして追加

---

## 📁 ファイル構成

```
/home/user/webapp/
├── index.html              # メインHTML
├── style.css               # Cyberpunkスタイル
├── app.js                  # アプリケーションロジック（Supabase連携）
├── database_setup.sql      # Supabaseテーブル作成SQL
└── README.md               # このファイル
```

---

## 🗄️ データベース構造

### `users` テーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | ユーザーID（主キー） |
| name | TEXT | 氏名 |
| weekly_goal_hours | INTEGER | 週間目標時間（時間） |
| weekly_vacation_days | INTEGER | 週あたりの休日数 |
| created_at | TIMESTAMP | 作成日時 |

### `work_logs` テーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | ログID（主キー） |
| user_id | UUID | ユーザーID（外部キー） |
| start_time | TIMESTAMP | 開始時刻 |
| end_time | TIMESTAMP | 終了時刻 |
| break_time_minutes | INTEGER | 休憩時間（分） |
| date | DATE | 日付 |
| created_at | TIMESTAMP | 作成日時 |

---

## 🌐 Vercelへのデプロイ

### 方法1: GitHub連携（推奨）

1. このプロジェクトをGitHubにプッシュ
2. Vercel（https://vercel.com）にログイン
3. 「New Project」→ GitHubリポジトリを選択
4. 「Deploy」をクリック

完了！自動的にURLが発行されます。

### 方法2: Vercel CLI

```bash
# Vercel CLIをインストール
npm install -g vercel

# デプロイ
cd /home/user/webapp
vercel

# プロンプトに従って設定
```

---

## 🛠️ 技術スタック

- **フロントエンド:** HTML5, CSS3, Vanilla JavaScript
- **データベース:** Supabase (PostgreSQL)
- **デプロイ:** Vercel
- **外部ライブラリ:** 
  - Supabase JavaScript Client (CDN経由)

---

## 📊 今後の拡張予定（Phase 2）

- [ ] グラフ表示（Chart.js）
- [ ] 日次/週次/年次の詳細レポート
- [ ] CSV/PDFエクスポート
- [ ] プッシュ通知（打刻リマインダー）
- [ ] チーム集計機能

---

## 🐛 トラブルシューティング

### データベース接続エラーが出る

1. Supabase URLとAnon Keyが正しいか確認
2. `database_setup.sql` を実行したか確認
3. Supabaseプロジェクトが有効か確認

### ユーザーが表示されない

1. Supabase SQL Editorで以下を実行：
   ```sql
   SELECT * FROM users;
   ```
2. データが存在しない場合は `database_setup.sql` を再実行

---

## 📞 サポート

問題が発生した場合は、開発者に連絡してください。

---

**命を燃やせ。休息も戦いだ。🔥**
