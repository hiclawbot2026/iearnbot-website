/* ============================================================
   iEarnBot Mobile PWA — app.js
   Dashboard + Positions + Logs + Settings
   API base: http://localhost:7799 (Mac mini proxy)
   ============================================================ */

'use strict';

// ── Config ──────────────────────────────────────────────────
// Dynamic API base from localStorage (set via Settings page)
function getApiBase() {
  return (localStorage.getItem('server_url') || 'http://localhost:7799').replace(/\/$/, '');
}
const API_BASE = 'http://localhost:7799'; // legacy fallback
const REFRESH_INTERVAL = 30000; // 30s auto-refresh

// ── i18n ──────────────────────────────────────────────────────────────────
const LANGS = {
  en: {
    flag:'🇺🇸', name:'EN',
    tab_dashboard:'Dashboard', tab_strategy:'Strategy',
    tab_positions:'Positions', tab_logs:'Logs', tab_settings:'Settings',
    dash_connecting:'Connecting…', dash_unknown:'Unknown',
    dash_today_pnl:'TODAY P&L', dash_open_pos:'OPEN POSITIONS',
    dash_win_rate:'WIN RATE', dash_total_pnl:'TOTAL P&L',
    dash_active:'Active Strategies', dash_no_strategy:'No active strategies',
    dash_kill:'🔴 Kill Switch', dash_refresh:'🔄 Refresh',
    strat_url_label:'📎 Article / Post URL',
    strat_url_placeholder:'Paste X, YouTube, or any link...',
    strat_fetch:'Fetch Content',
    strat_or:'or paste text directly',
    strat_text_placeholder:'Paste article, strategy idea, or describe what you want...',
    strat_market_label:'🌍 Target Market',
    strat_generate:'✨ Generate Strategy',
    strat_examples:'Quick Examples:',
    strat_key_params:'⚙️ Key Parameters',
    strat_risk:'🛡️ Risk Controls',
    strat_deploy:'▶ Deploy to Mac',
    strat_share:'📤 Share',
    pos_empty:'📭 No open positions',
    log_all:'All', log_info:'INFO', log_warn:'WARN', log_error:'ERROR',
    log_empty:'No logs yet...',
    set_server_label:'🖥️ Mac Mini Server',
    set_server_placeholder:'http://192.168.1.xxx:7799',
    set_server_hint:"Your Mac mini's local IP. Find in System Settings → Network.",
    set_test_conn:'Test Connection',
    set_skillpay_label:'💳 SkillPay User ID',
    set_skillpay_placeholder:'Your Telegram ID or wallet address',
    set_skillpay_hint:'For AI strategy generation billing.',
    set_notif_label:'🔔 Notifications',
    set_notif_stoploss:'Alert on stop-loss trigger',
    set_notif_tp:'Alert on take-profit',
    set_notif_daily:'Daily P&L summary',
    set_save:'💾 Save Settings',
    set_danger:'🔴 Danger Zone',
    set_kill:'Kill Switch — Stop All Trading',
  },
  zh: {
    flag:'🇨🇳', name:'中文',
    tab_dashboard:'概览', tab_strategy:'策略', tab_positions:'持仓',
    tab_logs:'日志', tab_settings:'设置',
    dash_connecting:'连接中...', dash_unknown:'未知',
    dash_today_pnl:'今日盈亏', dash_open_pos:'持仓数量',
    dash_win_rate:'胜率', dash_total_pnl:'累计盈亏',
    dash_active:'运行中策略', dash_no_strategy:'暂无运行中的策略',
    dash_kill:'🔴 急停开关', dash_refresh:'🔄 刷新',
    strat_url_label:'📎 文章 / 帖子链接',
    strat_url_placeholder:'粘贴 X、YouTube 或任意链接...',
    strat_fetch:'获取内容',
    strat_or:'或直接粘贴文本',
    strat_text_placeholder:'粘贴文章、策略想法，或描述你想要什么...',
    strat_market_label:'🌍 目标市场',
    strat_generate:'✨ 生成策略',
    strat_examples:'快速示例：',
    strat_key_params:'⚙️ 核心参数',
    strat_risk:'🛡️ 风控设置',
    strat_deploy:'▶ 部署到 Mac',
    strat_share:'📤 分享',
    pos_empty:'📭 暂无持仓',
    log_all:'全部', log_info:'信息', log_warn:'警告', log_error:'错误',
    log_empty:'暂无日志...',
    set_server_label:'🖥️ Mac Mini 服务器',
    set_server_placeholder:'http://192.168.1.xxx:7799',
    set_server_hint:'你的 Mac mini 本地 IP，在系统设置 → 网络中查看。',
    set_test_conn:'测试连接',
    set_skillpay_label:'💳 SkillPay 用户 ID',
    set_skillpay_placeholder:'你的 Telegram ID 或钱包地址',
    set_skillpay_hint:'AI 策略生成计费用。',
    set_notif_label:'🔔 通知设置',
    set_notif_stoploss:'止损触发时提醒',
    set_notif_tp:'止盈触发时提醒',
    set_notif_daily:'每日盈亏汇总',
    set_save:'💾 保存设置',
    set_danger:'🔴 危险操作',
    set_kill:'急停开关 — 停止所有交易',
  },
  ja: {
    flag:'🇯🇵', name:'日本語',
    tab_dashboard:'概要', tab_strategy:'戦略', tab_positions:'ポジション',
    tab_logs:'ログ', tab_settings:'設定',
    dash_connecting:'接続中...', dash_unknown:'不明',
    dash_today_pnl:'本日損益', dash_open_pos:'オープン建玉',
    dash_win_rate:'勝率', dash_total_pnl:'累計損益',
    dash_active:'稼働中の戦略', dash_no_strategy:'稼働中の戦略なし',
    dash_kill:'🔴 緊急停止', dash_refresh:'🔄 更新',
    strat_url_label:'📎 記事 / 投稿URL',
    strat_url_placeholder:'X、YouTube、任意のリンクを貼り付け...',
    strat_fetch:'コンテンツを取得',
    strat_or:'またはテキストを直接貼り付け',
    strat_text_placeholder:'記事、戦略のアイデア、またはご要望を入力...',
    strat_market_label:'🌍 対象マーケット',
    strat_generate:'✨ 戦略を生成',
    strat_examples:'クイック例：',
    strat_key_params:'⚙️ 主要パラメータ',
    strat_risk:'🛡️ リスク管理',
    strat_deploy:'▶ Macにデプロイ',
    strat_share:'📤 シェア',
    pos_empty:'📭 オープンポジションなし',
    log_all:'すべて', log_info:'情報', log_warn:'警告', log_error:'エラー',
    log_empty:'ログなし...',
    set_server_label:'🖥️ Mac Mini サーバー',
    set_server_placeholder:'http://192.168.1.xxx:7799',
    set_server_hint:'Mac miniのローカルIPアドレス。システム設定 → ネットワークで確認。',
    set_test_conn:'接続テスト',
    set_skillpay_label:'💳 SkillPay ユーザーID',
    set_skillpay_placeholder:'TelegramのIDまたはウォレットアドレス',
    set_skillpay_hint:'AI戦略生成の課金用。',
    set_notif_label:'🔔 通知設定',
    set_notif_stoploss:'ストップロス発動時に通知',
    set_notif_tp:'利確発動時に通知',
    set_notif_daily:'毎日の損益サマリー',
    set_save:'💾 設定を保存',
    set_danger:'🔴 危険な操作',
    set_kill:'緊急停止 — 全取引を停止',
  }
};

let currentLang = localStorage.getItem('app_lang') || 'en';

function t(key) {
  return LANGS[currentLang]?.[key] || LANGS.en[key] || key;
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  // Update tab labels
  document.querySelectorAll('.tab-item').forEach(tab => {
    const key = tab.dataset.i18nTab;
    if (key) {
      const lbl = tab.querySelector('.tab-label');
      if (lbl) lbl.textContent = t(key);
    }
  });
  // Update lang button
  const meta = LANGS[currentLang];
  const btn = document.getElementById('langBtn');
  if (btn) btn.innerHTML = `${meta.flag} ${meta.name} <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style="margin-left:4px"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}

function setAppLang(lang) {
  currentLang = lang;
  localStorage.setItem('app_lang', lang);
  applyLang();
  document.getElementById('langMenu')?.classList.remove('open');
  // Reload current page to re-render translated content
  navigate(currentPage);
}

function toggleLangMenu() {
  document.getElementById('langMenu')?.classList.toggle('open');
}

document.addEventListener('click', e => {
  if (!document.getElementById('langSelector')?.contains(e.target)) {
    document.getElementById('langMenu')?.classList.remove('open');
  }
});

// ── State ───────────────────────────────────────────────────
let currentPage = 'dashboard';
let refreshTimer = null;
let logRefreshTimer = null;
let currentLogLevel = 'all';

// ── API Helper ──────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const url = `${getApiBase()}${path}`;
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'info', durationMs = 3000) {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => t.classList.add('show'));
  });
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 250);
  }, durationMs);
}

// ── Global Status Update ─────────────────────────────────────
async function updateGlobalStatus() {
  try {
    const [status, balance] = await Promise.all([
      apiFetch('/api/status'),
      apiFetch('/api/balance')
    ]);
    const dot = document.getElementById('status-dot') || document.getElementById('global-status-dot');
    const txt = document.getElementById('status-label') || document.getElementById('global-status-text');
    const bal = document.getElementById('balance-display') || document.getElementById('global-balance');

    const running = status.running ?? status.status === 'running';
    if (dot) dot.className = `status-dot ${running ? 'running' : 'stopped'}`;
    if (txt) txt.textContent = running ? 'Running' : 'Stopped';

    if (bal) {
      const amt = parseFloat(balance.balance ?? balance.amount ?? 0).toFixed(2);
      bal.innerHTML = `<span>Balance</span> $${amt}`;
    }
  } catch {
    const dot = document.getElementById('status-dot') || document.getElementById('global-status-dot');
    if (dot) dot.className = 'status-dot stopped';
  }
}

// ── Router ───────────────────────────────────────────────────
function navigate(page) {
  currentPage = page;

  // Update tab bar
  document.querySelectorAll('.tab-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Clear timers
  clearTimeout(refreshTimer);
  clearInterval(logRefreshTimer);

  // Render
  switch (page) {
    case 'dashboard':  renderDashboard(); break;
    case 'positions':  renderPositions(); break;
    case 'logs':       renderLogs(); break;
    case 'settings':   loadHtmlPage('/app/pages/settings.html'); break;
    case 'strategy':   loadHtmlPage('/app/pages/strategy.html'); break;
    default:           renderDashboard(); break;
  }
}

// ── Load HTML Page Fragment ──────────────────────────────────
async function loadHtmlPage(url) {
  const content = document.getElementById('page-content');
  if (!content) return;
  content.innerHTML = '<div style="padding:40px;text-align:center"><div class="spinner"></div></div>';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Not found');
    const html = await res.text();
    content.innerHTML = html;
    // Execute inline scripts in the loaded fragment
    content.querySelectorAll('script').forEach(s => {
      const ns = document.createElement('script');
      ns.textContent = s.textContent;
      document.head.appendChild(ns).remove();
    });
    // Apply i18n translations after page is in DOM
    setTimeout(() => applyLang(), 50);
  } catch (e) {
    content.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Failed to load page</p></div>`;
  }
}

// ── Alias toast for pages that use it ───────────────────────
function toast(msg, type = 'info', durationMs = 3000) {
  showToast(msg, type, durationMs);
}

// ════════════════════════════════════════════════════════════
//  PAGE: DASHBOARD
// ════════════════════════════════════════════════════════════

function renderDashboard() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <!-- Status Bar -->
    <div class="status-bar card" style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;margin-bottom:12px;">
      <div class="status-item" style="display:flex;align-items:center;gap:8px;">
        <div class="status-dot connecting" id="dash-status-dot"></div>
        <span id="dash-status-text" style="font-size:13px;font-weight:600;" data-i18n="dash_connecting">${t('dash_connecting')}</span>
      </div>
      <div class="balance" style="font-size:1.1rem;font-weight:700;" id="dash-balance">
        $<span id="dash-balance-amt">—</span> <span class="unit" style="color:var(--text-muted);font-size:.75rem;font-weight:400;">USDC.e</span>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label" data-i18n="dash_today_pnl">${t('dash_today_pnl')}</div>
        <div class="kpi-value green" id="kpi-today-pnl">+$0.00</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label" data-i18n="dash_open_pos">${t('dash_open_pos')}</div>
        <div class="kpi-value" id="kpi-positions">0</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label" data-i18n="dash_win_rate">${t('dash_win_rate')}</div>
        <div class="kpi-value" id="kpi-winrate">—</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label" data-i18n="dash_total_pnl">${t('dash_total_pnl')}</div>
        <div class="kpi-value" id="kpi-total-pnl">$0.00</div>
      </div>
    </div>

    <!-- Active Strategies -->
    <div class="section-title" style="margin-top:8px;" data-i18n="dash_active">${t('dash_active')}</div>
    <div id="strategy-list">
      <div class="empty-state" style="padding:24px 16px;">
        <div class="spinner"></div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="action-row">
      <button class="action-btn danger" onclick="killSwitch()" data-i18n="dash_kill">${t('dash_kill')}</button>
      <button class="action-btn primary" onclick="refreshData()" data-i18n="dash_refresh">${t('dash_refresh')}</button>
    </div>
  `;

  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const [status, balance, positions, stats] = await Promise.allSettled([
      apiFetch('/api/status'),
      apiFetch('/api/balance'),
      apiFetch('/api/positions'),
      apiFetch('/api/stats')
    ]);

    // Status
    if (status.status === 'fulfilled') {
      const s = status.value;
      const running = s.running ?? s.status === 'running';
      const dot = document.getElementById('dash-status-dot');
      const txt = document.getElementById('dash-status-text');
      if (dot) dot.className = `status-dot ${running ? 'running' : 'stopped'}`;
      if (txt) txt.textContent = running ? 'Bot Running' : 'Bot Stopped';
    }

    // Balance
    if (balance.status === 'fulfilled') {
      const b = balance.value;
      const amt = parseFloat(b.balance ?? b.amount ?? 0).toFixed(2);
      const el = document.getElementById('dash-balance-amt');
      if (el) el.textContent = amt;
    }

    // Positions count
    if (positions.status === 'fulfilled') {
      const pos = Array.isArray(positions.value) ? positions.value : (positions.value.positions ?? []);
      const el = document.getElementById('kpi-positions');
      if (el) el.textContent = pos.length;
    }

    // Stats
    if (stats.status === 'fulfilled') {
      const s = stats.value;
      const todayEl = document.getElementById('kpi-today-pnl');
      const totalEl = document.getElementById('kpi-total-pnl');
      const winEl = document.getElementById('kpi-winrate');

      if (todayEl) {
        const today = parseFloat(s.today_pnl ?? s.todayPnl ?? 0);
        todayEl.textContent = (today >= 0 ? '+' : '') + '$' + today.toFixed(2);
        todayEl.className = `kpi-value ${today >= 0 ? 'green' : ''}`;
        if (today < 0) todayEl.style.color = 'var(--red)';
      }
      if (totalEl) {
        const total = parseFloat(s.total_pnl ?? s.totalPnl ?? 0);
        totalEl.textContent = '$' + total.toFixed(2);
        if (total >= 0) totalEl.classList.add('green');
      }
      if (winEl) {
        const wr = s.win_rate ?? s.winRate;
        winEl.textContent = wr != null ? `${(parseFloat(wr) * 100).toFixed(0)}%` : '—';
      }
    }

    // Render strategy list
    renderStrategyList(status.status === 'fulfilled' ? status.value : null);

  } catch (err) {
    showToast('Failed to load dashboard data', 'error');
  }

  // Schedule next refresh
  if (currentPage === 'dashboard') {
    refreshTimer = setTimeout(loadDashboardData, REFRESH_INTERVAL);
  }
}

function renderStrategyList(statusData) {
  const list = document.getElementById('strategy-list');
  if (!list) return;

  const strategies = statusData?.strategies ?? statusData?.active_strategies ?? [];

  if (!strategies.length) {
    list.innerHTML = `
      <div class="card" style="text-align:center;padding:24px;color:var(--text-muted);">
        <div style="font-size:2rem;margin-bottom:8px;">🤖</div>
        <div style="font-size:13px;" data-i18n="dash_no_strategy">${t('dash_no_strategy')}</div>
      </div>`;
    return;
  }

  list.innerHTML = strategies.map(s => `
    <div class="card" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-weight:600;font-size:.9rem;">${escHtml(s.name ?? s.id ?? 'Strategy')}</div>
        <span class="badge ${s.status === 'running' ? 'badge-green' : 'badge-orange'}">${escHtml(s.status ?? 'unknown')}</span>
      </div>
      <div class="stat-row">
        <span class="key">Market</span>
        <span class="val">${escHtml(s.market ?? '—')}</span>
      </div>
      <div class="stat-row">
        <span class="key">P&L</span>
        <span class="val" style="color:${(s.pnl ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'}">
          ${(s.pnl ?? 0) >= 0 ? '+' : ''}$${parseFloat(s.pnl ?? 0).toFixed(2)}
        </span>
      </div>
    </div>
  `).join('');
}

function refreshData() {
  clearTimeout(refreshTimer);
  loadDashboardData();
  updateGlobalStatus();
  showToast('Refreshing…', 'info', 1500);
}

async function killSwitch() {
  if (!confirm('⚠️ Stop all trading activity and close positions?')) return;
  try {
    await apiFetch('/api/kill', { method: 'POST' });
    showToast('🔴 Kill switch activated', 'error', 4000);
    updateGlobalStatus();
  } catch {
    showToast('Kill switch failed — check connection', 'error');
  }
}

// ════════════════════════════════════════════════════════════
//  PAGE: POSITIONS
// ════════════════════════════════════════════════════════════

function renderPositions() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="section-title" data-i18n="tab_positions">${t('tab_positions')}</div>
    <div id="positions-list">
      <div class="empty-state" style="padding:32px 0;">
        <div class="spinner"></div>
      </div>
    </div>
  `;
  loadPositions();
}

async function loadPositions() {
  const list = document.getElementById('positions-list');
  if (!list) return;

  try {
    const data = await apiFetch('/api/positions');
    const positions = Array.isArray(data) ? data : (data.positions ?? []);

    if (!positions.length) {
      list.innerHTML = `<div class="empty-state" data-i18n="pos_empty">${t('pos_empty')}</div>`;
      return;
    }

    list.innerHTML = positions.map(p => {
      const pnl = parseFloat(p.pnl ?? p.unrealized_pnl ?? 0);
      const pnlPct = parseFloat(p.pnl_pct ?? p.pnlPercent ?? 0);
      const isYes = (p.side ?? '').toUpperCase() === 'YES';
      const entry = parseFloat(p.entry_price ?? p.entryPrice ?? 0).toFixed(2);
      const current = parseFloat(p.current_price ?? p.currentPrice ?? 0).toFixed(2);
      const size = parseFloat(p.size ?? p.amount ?? 0).toFixed(2);
      const stopLoss = p.stop_loss ?? p.stopLoss ?? '—';
      const takeProfit = p.take_profit ?? p.takeProfit ?? '—';

      return `
        <div class="position-card">
          <div class="pos-header">
            <div class="pos-market">${escHtml(p.market ?? p.question ?? 'Unknown Market')}</div>
            <div class="pos-side ${isYes ? 'yes' : 'no'}">${isYes ? 'YES' : 'NO'}</div>
          </div>
          <div class="pos-row">
            <span class="pos-label">Entry</span>
            <span class="pos-val">$${entry}</span>
          </div>
          <div class="pos-row">
            <span class="pos-label">Current</span>
            <span class="pos-val ${pnl >= 0 ? 'green' : ''}" style="${pnl < 0 ? 'color:var(--red)' : ''}">$${current}</span>
          </div>
          <div class="pos-row">
            <span class="pos-label">P&amp;L</span>
            <span class="pos-val ${pnl >= 0 ? 'green' : ''}" style="${pnl < 0 ? 'color:var(--red)' : ''}">
              ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)
            </span>
          </div>
          <div class="pos-row">
            <span class="pos-label">Size</span>
            <span class="pos-val">$${size}</span>
          </div>
          <div class="pos-actions">
            <button class="btn-sm danger" onclick="setStopLoss('${escHtml(p.id ?? '')}', ${parseFloat(stopLoss) || 0})">
              Stop Loss: ${typeof stopLoss === 'number' ? stopLoss.toFixed(2) : stopLoss}
            </button>
            <button class="btn-sm success" onclick="setTakeProfit('${escHtml(p.id ?? '')}', ${parseFloat(takeProfit) || 0})">
              Take Profit: ${typeof takeProfit === 'number' ? takeProfit.toFixed(2) : takeProfit}
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚠️</span>
        <p>Failed to load positions.<br>Check API connection.</p>
      </div>`;
  }

  if (currentPage === 'positions') {
    refreshTimer = setTimeout(loadPositions, REFRESH_INTERVAL);
  }
}

async function setStopLoss(posId, current) {
  const val = prompt(`Stop Loss price (current: ${current}):`, current);
  if (val === null || val === '') return;
  try {
    await apiFetch('/api/positions/stop-loss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position_id: posId, price: parseFloat(val) })
    });
    showToast('Stop loss updated', 'success');
    loadPositions();
  } catch {
    showToast('Failed to set stop loss', 'error');
  }
}

async function setTakeProfit(posId, current) {
  const val = prompt(`Take Profit price (current: ${current}):`, current);
  if (val === null || val === '') return;
  try {
    await apiFetch('/api/positions/take-profit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position_id: posId, price: parseFloat(val) })
    });
    showToast('Take profit updated', 'success');
    loadPositions();
  } catch {
    showToast('Failed to set take profit', 'error');
  }
}

// ════════════════════════════════════════════════════════════
//  PAGE: LOGS
// ════════════════════════════════════════════════════════════

function renderLogs() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="log-filter">
      <button class="filter-btn active" data-level="all" data-i18n="log_all">${t('log_all')}</button>
      <button class="filter-btn" data-level="INFO" data-i18n="log_info">${t('log_info')}</button>
      <button class="filter-btn" data-level="WARNING" data-i18n="log_warn">${t('log_warn')}</button>
      <button class="filter-btn" data-level="ERROR" data-i18n="log_error">${t('log_error')}</button>
    </div>
    <div class="log-container" id="log-output">
      <div style="color:var(--text-muted);text-align:center;padding:20px;">Loading logs…</div>
    </div>
  `;

  // Filter button events
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLogLevel = btn.dataset.level;
      loadLogs();
    });
  });

  loadLogs();

  // Auto-refresh every 30s
  logRefreshTimer = setInterval(() => {
    if (currentPage === 'logs') loadLogs();
  }, REFRESH_INTERVAL);
}

async function loadLogs() {
  const output = document.getElementById('log-output');
  if (!output) return;

  try {
    const level = currentLogLevel === 'all' ? 'all' : currentLogLevel;
    const data = await apiFetch(`/api/logs?lines=100&level=${level}`);
    const logs = Array.isArray(data) ? data : (data.logs ?? []);

    if (!logs.length) {
      output.innerHTML = `<div style="color:var(--text-muted);text-align:center;padding:20px;" data-i18n="log_empty">${t('log_empty')}</div>`;
      return;
    }

    output.innerHTML = logs.map(log => {
      const lvl = (log.level ?? 'INFO').toUpperCase();
      const msg = escHtml(log.message ?? log.msg ?? String(log));
      const ts = log.timestamp ?? log.time ?? '';
      const displayTs = ts ? new Date(ts).toLocaleTimeString() : '';

      let color = '#94a3b8'; // INFO default
      if (lvl === 'WARNING' || lvl === 'WARN') color = '#f59e0b';
      else if (lvl === 'ERROR' || lvl === 'CRITICAL') color = '#ef4444';
      else if (lvl === 'SUCCESS') color = '#22c55e';

      return `<div style="padding:2px 0;border-bottom:1px solid #0d1220;">
        <span style="color:#475569;font-size:11px;">${displayTs} </span>
        <span style="color:${color};font-weight:600;font-size:10px;">[${lvl}]</span>
        <span style="color:${color};"> ${msg}</span>
      </div>`;
    }).join('');

    // Auto-scroll to bottom
    output.scrollTop = output.scrollHeight;

  } catch {
    output.innerHTML = `<div style="color:var(--red);text-align:center;padding:20px;">⚠️ Cannot connect to API</div>`;
  }
}

// ════════════════════════════════════════════════════════════
//  PAGE: SETTINGS — loaded via loadHtmlPage('/app/pages/settings.html')
//  PAGE: STRATEGY  — loaded via loadHtmlPage('/app/pages/strategy.html')
// ════════════════════════════════════════════════════════════

// Legacy testConnection used by older settings page
async function testConnection() {
  try {
    await apiFetch('/api/status');
    showToast('✅ Connected successfully', 'success');
  } catch {
    showToast('❌ Cannot reach API — check URL', 'error');
  }
}

// ── Utilities ────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Tab Bar Click ────────────────────────────────────────────
document.querySelectorAll('.tab-item').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.page));
});

// ── Service Worker Registration ──────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/app/sw.js').catch(() => {});
}

// ── Boot ─────────────────────────────────────────────────────
(async function init() {
  await updateGlobalStatus();
  navigate('dashboard');
  // Apply saved language on boot
  applyLang();

  // Periodic global status refresh
  setInterval(updateGlobalStatus, REFRESH_INTERVAL);
})();
