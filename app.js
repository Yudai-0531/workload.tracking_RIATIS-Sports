// ==========================================
// Supabase初期化
// ==========================================
const SUPABASE_URL = 'https://nnvdldmdupsxgefiywar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udmRsZG1kdXBzeGdlZml5d2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDM4MzMsImV4cCI6MjA4MzI3OTgzM30.4xphygeAUxnfYiR6ixFIbFaUZPPKJyLAuZndQMYJPUc';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// グローバル変数
// ==========================================
let currentUser = null;
let currentWorkLog = null;
let workHoursChart = null;
let currentChartType = 'daily';
const LOGIN_EXPIRY_DAYS = 30; // ログイン有効期限（日数）

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
    
    // ユーザーリスト読み込み（ログインページ用）
    await loadLoginUsers();
    
    // ダッシュボードの名言を表示
    displayRandomQuote();
    
    // ログイン状態チェック
    checkLoginState();
    
    console.log('✅ 初期化完了');
});

// ==========================================
// データベース初期化
// ==========================================
async function initializeDatabase() {
    try {
        // usersテーブルの存在確認
        const { data: users, error: usersError } = await supabaseClient
            .from('users')
            .select('*')
            .limit(1);
        
        if (usersError) {
            console.error('❌ usersテーブルエラー:', usersError.message);
            alert('データベース接続エラー: usersテーブルが見つかりません。\nSupabaseで "users" テーブルを作成してください。');
            return;
        }
        
        // work_logsテーブルの存在確認
        const { data: logs, error: logsError } = await supabaseClient
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
    // ログインページ
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('show-register-btn').addEventListener('click', openAddUserModal);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
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
    
    // グラフ切り替え
    document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => switchChartType(btn.dataset.chartType));
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
        updateWorkHoursChart();
    }
}

// ==========================================
// ログイン管理
// ==========================================
async function loadLoginUsers() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('id, name')
            .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById('login-user-select');
        select.innerHTML = '<option value="">選択してください...</option>';
        
        data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });
        
        console.log(`✅ ${data.length}人のユーザーを読み込みました（ログイン用）`);
    } catch (error) {
        console.error('❌ ユーザー読み込みエラー:', error);
        alert('ユーザー情報の読み込みに失敗しました: ' + error.message);
    }
}

async function handleLogin() {
    const userId = document.getElementById('login-user-select').value;
    const password = document.getElementById('login-password').value;
    
    if (!userId) {
        alert('ユーザーを選択してください');
        return;
    }
    
    if (!password) {
        alert('パスワードを入力してください');
        return;
    }
    
    try {
        // ユーザー情報取得
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        
        // パスワード確認
        if (data.password !== password) {
            alert('パスワードが正しくありません');
            return;
        }
        
        // ログイン成功
        currentUser = userId;
        
        // ログイン情報をlocalStorageに保存（1ヶ月有効）
        const loginData = {
            userId: userId,
            userName: data.name,
            loginTime: Date.now(),
            expiryTime: Date.now() + (LOGIN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        };
        localStorage.setItem('fighting24h_login', JSON.stringify(loginData));
        
        console.log('✅ ログイン成功:', data.name);
        
        // メインアプリを表示
        showMainApp();
        
        // ユーザーを自動選択
        await loadUsers();
        document.getElementById('user-select').value = userId;
        
        // 記録ボタンの状態を復元
        restoreWorkState();
        
    } catch (error) {
        console.error('❌ ログインエラー:', error);
        alert('ログインに失敗しました: ' + error.message);
    }
}

function handleLogout() {
    if (!confirm('ログアウトしますか？')) {
        return;
    }
    
    // ログイン情報をクリア
    localStorage.removeItem('fighting24h_login');
    currentUser = null;
    currentWorkLog = null;
    
    // ログインページを表示
    showLoginPage();
    
    // 入力欄をクリア
    document.getElementById('login-user-select').value = '';
    document.getElementById('login-password').value = '';
    
    console.log('✅ ログアウトしました');
}

function checkLoginState() {
    const loginDataStr = localStorage.getItem('fighting24h_login');
    
    if (!loginDataStr) {
        // ログインしていない
        showLoginPage();
        return;
    }
    
    try {
        const loginData = JSON.parse(loginDataStr);
        
        // 有効期限チェック
        if (Date.now() > loginData.expiryTime) {
            // 有効期限切れ
            localStorage.removeItem('fighting24h_login');
            alert('ログインの有効期限が切れました。再度ログインしてください。');
            showLoginPage();
            return;
        }
        
        // ログイン状態を復元
        currentUser = loginData.userId;
        console.log('✅ ログイン状態を復元:', loginData.userName);
        
        showMainApp();
        loadUsers().then(() => {
            document.getElementById('user-select').value = currentUser;
            // 記録ボタンの状態を復元
            restoreWorkState();
        });
        
    } catch (error) {
        console.error('❌ ログイン状態復元エラー:', error);
        localStorage.removeItem('fighting24h_login');
        showLoginPage();
    }
}

function showLoginPage() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function showMainApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

// ==========================================
// 記録ボタンの状態保持
// ==========================================
function saveWorkState() {
    if (!currentUser) return;
    
    const workState = {
        userId: currentUser,
        workLog: currentWorkLog,
        timestamp: Date.now()
    };
    
    localStorage.setItem('fighting24h_work_state', JSON.stringify(workState));
    console.log('💾 作業状態を保存しました');
}

async function restoreWorkState() {
    if (!currentUser) return;
    
    const workStateStr = localStorage.getItem('fighting24h_work_state');
    
    if (!workStateStr) {
        console.log('📝 保存された作業状態はありません');
        return;
    }
    
    try {
        const workState = JSON.parse(workStateStr);
        
        // ユーザーが一致する場合のみ復元
        if (workState.userId !== currentUser) {
            console.log('⚠️ 別のユーザーの作業状態のため復元しません');
            return;
        }
        
        // 24時間以上経過している場合は復元しない
        const hoursSinceLastSave = (Date.now() - workState.timestamp) / (1000 * 60 * 60);
        if (hoursSinceLastSave > 24) {
            console.log('⚠️ 保存から24時間以上経過しているため復元しません');
            localStorage.removeItem('fighting24h_work_state');
            return;
        }
        
        if (workState.workLog) {
            // データベースで確認
            const { data, error } = await supabaseClient
                .from('work_logs')
                .select('*')
                .eq('id', workState.workLog.id)
                .single();
            
            if (error || !data || data.end_time) {
                // ログが存在しないか、既に終了している
                console.log('⚠️ 作業ログが見つからないか、既に終了しています');
                localStorage.removeItem('fighting24h_work_state');
                return;
            }
            
            // 状態を復元
            currentWorkLog = data;
            document.getElementById('clock-in-btn').disabled = true;
            document.getElementById('clock-out-btn').disabled = false;
            
            const startTime = new Date(data.start_time);
            updateStatus(`🔥 戦闘中！ 開始時刻: ${startTime.toLocaleTimeString('ja-JP')}`);
            
            console.log('✅ 作業状態を復元しました');
        }
        
    } catch (error) {
        console.error('❌ 作業状態復元エラー:', error);
        localStorage.removeItem('fighting24h_work_state');
    }
}

function clearWorkState() {
    localStorage.removeItem('fighting24h_work_state');
    console.log('🗑️ 作業状態をクリアしました');
}

// ==========================================
// ユーザー管理
// ==========================================
async function loadUsers() {
    try {
        const { data, error } = await supabaseClient
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
    document.getElementById('new-user-password').value = '';
    document.getElementById('new-user-password-confirm').value = '';
    document.getElementById('new-user-name').focus();
}

function closeAddUserModal() {
    document.getElementById('add-user-modal').classList.remove('show');
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-password').value = '';
    document.getElementById('new-user-password-confirm').value = '';
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
    const password = document.getElementById('new-user-password').value;
    const passwordConfirm = document.getElementById('new-user-password-confirm').value;
    
    if (!name) {
        alert('名前を入力してください');
        return;
    }
    
    if (!password) {
        alert('パスワードを入力してください');
        return;
    }
    
    if (password !== passwordConfirm) {
        alert('パスワードが一致しません');
        return;
    }
    
    if (password.length < 4) {
        alert('パスワードは4文字以上で設定してください');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .insert([
                { 
                    name: name,
                    password: password,
                    weekly_goal_hours: 40,
                    weekly_vacation_days: 2
                }
            ])
            .select();
        
        if (error) throw error;
        
        console.log('✅ 新規ユーザー登録:', name);
        alert(`戦士「${name}」を登録しました！ログインしてください。`);
        
        closeAddUserModal();
        
        // 【修正1】ログインページのユーザーリストを常に更新（ログイン前でも更新）
        await loadLoginUsers();
        
        // ログイン中の場合はメインアプリのユーザーリストも更新
        if (currentUser) {
            await loadUsers();
        }
        
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
        const { data: existingLogs, error: checkError } = await supabaseClient
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
        const { data, error } = await supabaseClient
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
        
        // 状態を保存
        saveWorkState();
        
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
        const { data, error } = await supabaseClient
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
        
        // 状態をクリア
        clearWorkState();
        
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
        const { data: userData, error: userError } = await supabaseClient
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
        const { data: todayLogs, error: todayError } = await supabaseClient
            .from('work_logs')
            .select('*')
            .eq('user_id', currentUser)
            .eq('date', today)
            .not('end_time', 'is', null);
        
        if (todayError) throw todayError;
        
        // 今週のデータ取得
        const weekStart = getWeekStart();
        const { data: weekLogs, error: weekError } = await supabaseClient
            .from('work_logs')
            .select('*')
            .eq('user_id', currentUser)
            .gte('date', weekStart)
            .not('end_time', 'is', null);
        
        if (weekError) throw weekError;
        
        // 今日の労働時間計算
        const dailyHours = calculateTotalHours(todayLogs);
        document.getElementById('daily-hours').textContent = `${dailyHours.toFixed(1)}h`;
        
        // 今週の労働時間計算（休日数は含めない）
        const weeklyWorkHours = calculateTotalHours(weekLogs);
        document.getElementById('weekly-hours').textContent = `${weeklyWorkHours.toFixed(1)}h`;
        
        // 目標達成率計算
        const goalHours = userData.weekly_goal_hours || 40;
        const progress = Math.min(100, (weeklyWorkHours / goalHours * 100));
        document.getElementById('goal-progress').textContent = `${progress.toFixed(0)}%`;
        
        // 1日あたりの目標労働時間を計算（休日を考慮）
        const vacationDays = userData.weekly_vacation_days || 0;
        const workingDaysPerWeek = 7 - vacationDays;
        const dailyTargetHours = workingDaysPerWeek > 0 ? (goalHours / workingDaysPerWeek).toFixed(1) : 0;
        document.getElementById('daily-target-hours').textContent = `${dailyTargetHours}h`;
        
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
        
        const { error } = await supabaseClient
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

// ==========================================
// グラフ機能
// ==========================================
function switchChartType(chartType) {
    // ボタンのアクティブ状態切り替え
    document.querySelectorAll('.chart-toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-chart-type="${chartType}"]`).classList.add('active');
    
    currentChartType = chartType;
    updateWorkHoursChart();
    
    console.log('📊 グラフ切り替え:', chartType);
}

async function updateWorkHoursChart() {
    if (!currentUser) return;
    
    try {
        let labels = [];
        let data = [];
        let startDate, endDate;
        
        if (currentChartType === 'daily') {
            // 過去7日間のデータを取得
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 6);
            
            // 日付ラベル作成
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
            }
            
            // データ取得
            const { data: logs, error } = await supabaseClient
                .from('work_logs')
                .select('*')
                .eq('user_id', currentUser)
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0])
                .not('end_time', 'is', null);
            
            if (error) throw error;
            
            // 日付ごとに集計
            const dailyHours = {};
            logs.forEach(log => {
                const date = log.date;
                if (!dailyHours[date]) {
                    dailyHours[date] = 0;
                }
                const start = new Date(log.start_time);
                const end = new Date(log.end_time);
                const minutes = Math.floor((end - start) / 1000 / 60) - (log.break_time_minutes || 0);
                dailyHours[date] += Math.max(0, minutes) / 60;
            });
            
            // データ配列作成
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                data.push(dailyHours[dateStr] || 0);
            }
            
        } else if (currentChartType === 'weekly') {
            // 過去4週間のデータを取得
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 27); // 4週間前
            
            // 週のラベル作成
            for (let i = 0; i < 4; i++) {
                const weekStart = new Date(startDate);
                weekStart.setDate(startDate.getDate() + (i * 7));
                labels.push(`${weekStart.getMonth() + 1}/${weekStart.getDate()}週`);
            }
            
            // データ取得
            const { data: logs, error } = await supabaseClient
                .from('work_logs')
                .select('*')
                .eq('user_id', currentUser)
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0])
                .not('end_time', 'is', null);
            
            if (error) throw error;
            
            // 週ごとに集計
            const weeklyHours = {};
            logs.forEach(log => {
                const logDate = new Date(log.date);
                const weekIndex = Math.floor((logDate - startDate) / (7 * 24 * 60 * 60 * 1000));
                
                if (!weeklyHours[weekIndex]) {
                    weeklyHours[weekIndex] = 0;
                }
                const start = new Date(log.start_time);
                const end = new Date(log.end_time);
                const minutes = Math.floor((end - start) / 1000 / 60) - (log.break_time_minutes || 0);
                weeklyHours[weekIndex] += Math.max(0, minutes) / 60;
            });
            
            // データ配列作成
            for (let i = 0; i < 4; i++) {
                data.push(weeklyHours[i] || 0);
            }
        }
        
        // グラフ描画
        renderWorkHoursChart(labels, data);
        
        console.log('✅ グラフ更新完了:', currentChartType);
        
    } catch (error) {
        console.error('❌ グラフ更新エラー:', error);
    }
}

function renderWorkHoursChart(labels, data) {
    const ctx = document.getElementById('work-hours-chart');
    
    // 既存のグラフを破棄
    if (workHoursChart) {
        workHoursChart.destroy();
    }
    
    // 新しいグラフを作成
    workHoursChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: currentChartType === 'daily' ? '労働時間 (時間/日)' : '労働時間 (時間/週)',
                data: data,
                borderColor: '#ff0055',
                backgroundColor: 'rgba(255, 0, 85, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ff0055',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 39, 0.9)',
                    titleColor: '#00d9ff',
                    bodyColor: '#ffffff',
                    borderColor: '#00d9ff',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y.toFixed(1)}時間`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#c0c0c0',
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return value + 'h';
                        }
                    },
                    grid: {
                        color: 'rgba(192, 192, 192, 0.1)',
                        borderColor: '#666666'
                    }
                },
                x: {
                    ticks: {
                        color: '#c0c0c0',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(192, 192, 192, 0.1)',
                        borderColor: '#666666'
                    }
                }
            }
        }
    });
}
