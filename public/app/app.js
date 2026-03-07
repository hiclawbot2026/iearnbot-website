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
        <span id="dash-status-text" style="font-size:13px;font-weight:600;">Connecting…</span>
      </div>
      <div class="balance" style="font-size:1.1rem;font-weight:700;" id="dash-balance">
        $<span id="dash-balance-amt">—</span> <span class="unit" style="color:var(--text-muted);font-size:.75rem;font-weight:400;">USDC.e</span>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">Today P&amp;L</div>
        <div class="kpi-value green" id="kpi-today-pnl">+$0.00</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Open Positions</div>
        <div class="kpi-value" id="kpi-positions">0</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Win Rate</div>
        <div class="kpi-value" id="kpi-winrate">—</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total P&amp;L</div>
        <div class="kpi-value" id="kpi-total-pnl">$0.00</div>
      </div>
    </div>

    <!-- Active Strategies -->
    <div class="section-title" style="margin-top:8px;">Active Strategies</div>
    <div id="strategy-list">
      <div class="empty-state" style="padding:24px 16px;">
        <div class="spinner"></div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="action-row">
      <button class="action-btn danger" onclick="killSwitch()">🔴 Kill Switch</button>
      <button class="action-btn primary" onclick="refreshData()">🔄 Refresh</button>
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
        <div style="font-size:13px;">No active strategies</div>
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
    <div class="section-title">Open Positions</div>
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
      list.innerHTML = `<div class="empty-state">📭 No open positions</div>`;
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
      <button class="filter-btn active" data-level="all">All</button>
      <button class="filter-btn" data-level="INFO">INFO</button>
      <button class="filter-btn" data-level="WARNING">WARN</button>
      <button class="filter-btn" data-level="ERROR">ERROR</button>
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
      output.innerHTML = `<div style="color:var(--text-muted);text-align:center;padding:20px;">No logs found</div>`;
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

  // Periodic global status refresh
  setInterval(updateGlobalStatus, REFRESH_INTERVAL);
})();
