-- ==========================================
-- FIGHTING 24H Database Schema
-- ==========================================

-- usersテーブル: 戦士（ユーザー）情報
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    weekly_goal_hours INTEGER DEFAULT 40,
    weekly_vacation_days INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- work_logsテーブル: 勤怠ログ
CREATE TABLE IF NOT EXISTS work_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    break_time_minutes INTEGER DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_work_logs_user_id ON work_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_date ON work_logs(date);
CREATE INDEX IF NOT EXISTS idx_work_logs_user_date ON work_logs(user_id, date);

-- Row Level Security (RLS) を有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- すべてのユーザーが読み書きできるポリシー（開発用）
-- 本番環境では適切な認証ポリシーを設定してください
CREATE POLICY "Enable all access for users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all access for work_logs" ON work_logs FOR ALL USING (true);

-- サンプルデータ挿入（テスト用）
INSERT INTO users (name, weekly_goal_hours, weekly_vacation_days) VALUES
('山田太郎', 40, 2),
('佐藤花子', 35, 2)
ON CONFLICT DO NOTHING;
