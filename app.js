// ==========================================
// Supabase初期化
// ==========================================
const SUPABASE_URL = 'https://nnvdldmdupsxgefiywar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udmRsZG1kdXBzeGdlZml5d2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDM4MzMsImV4cCI6MjA4MzI3OTgzM30.4xphygeAUxnfYiR6ixFIbFaUZPPKJyLAuZndQMYJPUc';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// グローバル変数
// ==========================================
let currentUser = null;
let currentWorkLog = null;

// 名言リスト
const motivationalQuotes = [
    "限界を超えろ。昨日の自分を倒せ。",
    "休息も戦いの一部だ。回復せよ、そして立ち上がれ。",
    "時間は敵ではない。味方だ。使いこなせ。",
    "疲れたと言う前に、もう一歩進め。",
    "勝者は言い訳をしない。ただ戦うだけだ。",
    "今日を全力で生きろ。明日はまた新しい戦場だ。",
    "痛みは成長の証。苦しみを楽しめ。",
    "諦めるな。お前はまだ終わっていない。"
];

// ==========================================
// 初期化
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 FIGHTING 24H アプリ起動');
    
    // イベントリスナー設定
    setupEventListeners();
    
    // データベース初期化
    await initializeDatabase();
    
    // ユーザーリスト読み込み
    await loadUsers();
    
    // ダッシュボードの名言を表示
    displayRandomQuote();
    
    console.log('✅ 初期化完了');
});

// ==========================================
// データベース初期化
// ==========================================
async function initializeDatabase() {
    try {
        // usersテーブルの存在確認
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(1);
        
        if (usersError) {
            console.error('❌ usersテーブルエラー:', usersError.message);
            alert('データベース接続エラー: usersテーブルが見つかりません。\nSupabaseで "users" テーブルを作成してください。');
            return;
        }
        
        // work_logsテーブルの存在確認
        const { data: logs, error: logsError } = await supabase
            .from('work_logs')
            .select('*')
            .limit(1);
        
        if (logsError) {
            console.error('❌ work_logsテーブルエラー:', logsError.message);
            alert('データベース接続エラー: work_logsテーブルが見つかりません。\nSupabaseで "work_logs" テーブルを作成してください。');
            return;
        }
        
        console.log('✅ データベース接続成功');
    } catch (error) {
        console.error('❌ データベース初期化エラー:', error);
        alert('データベース接続に失敗しました: ' + error.message);
    }
}

// ==========================================
// イベントリスナー設定
// ==========================================
function setupEventListeners() {
    // ナビゲーション
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });
    
    // データ記録ページ
    document.getElementById('clock-in-btn').addEventListener('click', clockIn);
    document.getElementById('clock-out-btn').addEventListener('click', clockOut);
    document.getElementById('add-user-btn').addEventListener('click', openAddUserModal);
    document.getElementById('user-select').addEventListener('change', onUserSelect);
    
    // モーダル
    document.getElementById('cancel-add-user').addEventListener('click', closeAddUserModal);
    document.getElementById('confirm-add-user').addEventListener('click', addNewUser);
    
    // ダッシュボード
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    
    // 期間切り替え
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTimeFrame(btn.dataset.frame));
    });
}

// ==========================================
// ページ切り替え
// ==========================================
function switchPage(pageName) {
    // すべてのページとナビボタンを非アクティブ化
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // 指定ページとボタンをアクティブ化
    document.getElementById(`${pageName}-page`).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    // ダッシュボードの場合は統計を更新
    if (pageName === 'dashboard' && currentUser) {
        updateDashboard();
    }
}

// ==========================================
// ユーザー管理
// ==========================================
async function loadUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById('user-select');
        select.innerHTML = '<option value="">選択してください...</option>';
        
        data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });
        
        console.log(`✅ ${data.length}人のユーザーを読み込みました`);
    } catch (error) {
        console.error('❌ ユーザー読み込みエラー:', error);
        alert('ユーザー情報の読み込みに失敗しました: ' + error.message);
    }
}

function onUserSelect(e) {
    const userId = e.target.value;
    if (userId) {
        currentUser = userId;
        updateStatus('戦士選択完了。さあ、戦いを始めよう。');
        console.log('👤 ユーザー選択:', userId);
    } else {
        currentUser = null;
    }
}

function openAddUserModal() {
    const modal = document.getElementById('add-user-modal');
    modal.classList.add('show');
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-name').focus();
}

function closeAddUserModal() {
    document.getElementById('add-user-modal').classList.remove('show');
}

// モーダル外クリックで閉じる
document.addEventListener('click', (e) => {
    const modal = document.getElementById('add-user-modal');
    if (e.target === modal) {
        closeAddUserModal();
    }
});

async function addNewUser() {
    const name = document.getElementById('new-user-name').value.trim();
    
    if (!name) {
        alert('名前を入力してください');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([
                { 
                    name: name,
                    weekly_goal_hours: 40,
                    weekly_vacation_days: 2
                }
            ])
            .select();
        
        if (error) throw error;
        
        console.log('✅ 新規ユーザー登録:', name);
        alert(`戦士「${name}」を登録しました！`);
        
        closeAddUserModal();
        await loadUsers();
        
        // 登録したユーザーを自動選択
        document.getElementById('user-select').value = data[0].id;
        currentUser = data[0].id;
        
    } catch (error) {
        console.error('❌ ユーザー登録エラー:', error);
        alert('ユーザー登録に失敗しました: ' + error.message);
    }
}

// ==========================================
// 打刻機能
// ==========================================
async function clockIn() {
    if (!currentUser) {
        alert('先に戦士を選択してください！');
        return;
    }
    
    try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // 今日の未完了ログがあるか確認
        const { data: existingLogs, error: checkError } = await supabase
            .from('work_logs')
            .select('*')
            .eq('user_id', currentUser)
            .eq('date', dateStr)
            .is('end_time', null);
        
        if (checkError) throw checkError;
        
        if (existingLogs && existingLogs.length > 0) {
            alert('既に戦闘中です！先に「FIGHT END」を押してください。');
            return;
        }
        
        // 新規ログ作成
        const { data, error } = await supabase
            .from('work_logs')
            .insert([
                {
                    user_id: currentUser,
                    start_time: now.toISOString(),
                    date: dateStr,
                    break_time_minutes: 0
                }
            ])
            .select();
        
        if (error) throw error;
        
        currentWorkLog = data[0];
        
        // UI更新
        document.getElementById('clock-in-btn').disabled = true;
        document.getElementById('clock-out-btn').disabled = false;
        updateStatus(`🔥 戦闘開始！ 開始時刻: ${now.toLocaleTimeString('ja-JP')}`);
        
        console.log('✅ FIGHT START:', now.toLocaleTimeString('ja-JP'));
        
    } catch (error) {
        console.error('❌ 打刻エラー:', error);
        alert('打刻に失敗しました: ' + error.message);
    }
}

async function clockOut() {
    if (!currentUser || !currentWorkLog) {
        alert('先に「FIGHT START」を押してください！');
        return;
    }
    
    try {
        const now = new Date();
        const breakTime = parseInt(document.getElementById('break-time').value) || 0;
        
        // ログ更新
        const { data, error } = await supabase
            .from('work_logs')
            .update({
                end_time: now.toISOString(),
                break_time_minutes: breakTime
            })
            .eq('id', currentWorkLog.id)
            .select();
        
        if (error) throw error;
        
        // 労働時間計算
        const start = new Date(currentWorkLog.start_time);
        const totalMinutes = Math.floor((now - start) / 1000 / 60);
        const workMinutes = totalMinutes - breakTime;
        const workHours = (workMinutes / 60).toFixed(2);
        
        // UI更新
        document.getElementById('clock-in-btn').disabled = false;
        document.getElementById('clock-out-btn').disabled = true;
        document.getElementById('break-time').value = 0;
        updateStatus(`🏁 戦闘終了！ 本日の戦闘時間: ${workHours}時間`);
        
        console.log('✅ FIGHT END:', now.toLocaleTimeString('ja-JP'), `(${workHours}h)`);
        
        currentWorkLog = null;
        
    } catch (error) {
        console.error('❌ 打刻エラー:', error);
        alert('打刻に失敗しました: ' + error.message);
    }
}

function updateStatus(message) {
    document.querySelector('.status-text').textContent = message;
}

// ==========================================
// ダッシュボード
// ==========================================
function displayRandomQuote() {
    const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    document.getElementById('motivational-quote').textContent = `"${quote}"`;
}

async function updateDashboard() {
    if (!currentUser) return;
    
    try {
        // ユーザー設定取得
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser)
            .single();
        
        if (userError) throw userError;
        
        // 設定を入力欄に反映
        document.getElementById('weekly-goal').value = userData.weekly_goal_hours || 40;
        document.getElementById('weekly-vacation').value = userData.weekly_vacation_days || 2;
        
        // 今日のデータ取得
        const today = new Date().toISOString().split('T')[0];
        const { data: todayLogs, error: todayError } = await supabase
            .from('work_logs')
            .select('*')
            .eq('user_id', currentUser)
            .eq('date', today)
            .not('end_time', 'is', null);
        
        if (todayError) throw todayError;
        
        // 今週のデータ取得
        const weekStart = getWeekStart();
        const { data: weekLogs, error: weekError } = await supabase
            .from('work_logs')
            .select('*')
            .eq('user_id', currentUser)
            .gte('date', weekStart)
            .not('end_time', 'is', null);
        
        if (weekError) throw weekError;
        
        // 今日の労働時間計算
        const dailyHours = calculateTotalHours(todayLogs);
        document.getElementById('daily-hours').textContent = `${dailyHours.toFixed(1)}h`;
        
        // 今週の労働時間計算（休日ボーナス含む）
        const weeklyWorkHours = calculateTotalHours(weekLogs);
        const vacationBonus = (userData.weekly_vacation_days || 0) * 24;
        const totalWeeklyHours = weeklyWorkHours + vacationBonus;
        document.getElementById('weekly-hours').textContent = `${totalWeeklyHours.toFixed(1)}h`;
        
        // 目標達成率計算
        const goalHours = userData.weekly_goal_hours || 40;
        const progress = Math.min(100, (totalWeeklyHours / goalHours * 100));
        document.getElementById('goal-progress').textContent = `${progress.toFixed(0)}%`;
        
        console.log('✅ ダッシュボード更新完了');
        
    } catch (error) {
        console.error('❌ ダッシュボード更新エラー:', error);
    }
}

function calculateTotalHours(logs) {
    let totalMinutes = 0;
    
    logs.forEach(log => {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        const minutes = Math.floor((end - start) / 1000 / 60) - (log.break_time_minutes || 0);
        totalMinutes += Math.max(0, minutes);
    });
    
    return totalMinutes / 60;
}

function getWeekStart() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = 日曜日
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 月曜日を週の始まりとする
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - diff);
    return weekStart.toISOString().split('T')[0];
}

async function saveSettings() {
    if (!currentUser) {
        alert('先にユーザーを選択してください');
        return;
    }
    
    try {
        const weeklyGoal = parseInt(document.getElementById('weekly-goal').value);
        const weeklyVacation = parseInt(document.getElementById('weekly-vacation').value);
        
        const { error } = await supabase
            .from('users')
            .update({
                weekly_goal_hours: weeklyGoal,
                weekly_vacation_days: weeklyVacation
            })
            .eq('id', currentUser);
        
        if (error) throw error;
        
        alert('設定を保存しました！');
        updateDashboard();
        
        console.log('✅ 設定保存:', { weeklyGoal, weeklyVacation });
        
    } catch (error) {
        console.error('❌ 設定保存エラー:', error);
        alert('設定の保存に失敗しました: ' + error.message);
    }
}

function switchTimeFrame(frame) {
    // ボタンのアクティブ状態切り替え
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-frame="${frame}"]`).classList.add('active');
    
    // TODO: グラフの表示期間を変更する処理（Phase 2で実装）
    console.log('📊 期間切り替え:', frame);
}
