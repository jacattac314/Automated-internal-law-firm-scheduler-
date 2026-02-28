// @ts-check
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Table rows are in a hidden panel — wait for DOM attachment, not visibility
  await page.waitForSelector('#table-body tr', { state: 'attached' });
});

// ─────────────────────────────────────────────────────────────────────
// 1. PAGE LOAD & HEADER
// ─────────────────────────────────────────────────────────────────────
test.describe('Page load & header', () => {
  test('page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle('Meridian Legal — Claims Automation Platform');
  });

  test('logo and firm name are visible', async ({ page }) => {
    await expect(page.locator('.logo-mark')).toHaveText('ML');
    await expect(page.locator('.logo-text')).toHaveText('Meridian Legal');
    await expect(page.locator('.logo-sub')).toHaveText('Claims Automation');
  });

  test('live badge is visible', async ({ page }) => {
    const badge = page.locator('.badge-live');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Live');
  });

  test('Run Demo Simulation button is visible and enabled', async ({ page }) => {
    const btn = page.locator('#btnRun');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await expect(btn).toContainText('Run Demo Simulation');
  });

  test('sticky header stays at top on scroll', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 500));
    const header = page.locator('header');
    const box = await header.boundingBox();
    expect(box.y).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 2. TAB NAVIGATION
// ─────────────────────────────────────────────────────────────────────
test.describe('Tab navigation', () => {
  test('Dashboard tab is active by default', async ({ page }) => {
    await expect(page.locator('#tab0')).toHaveClass(/active/);
    await expect(page.locator('#panel0')).toHaveClass(/active/);
    await expect(page.locator('#panel1')).not.toHaveClass(/active/);
    await expect(page.locator('#panel2')).not.toHaveClass(/active/);
  });

  test('clicking Claimant Tracker tab activates it', async ({ page }) => {
    await page.locator('#tab1').click();
    await expect(page.locator('#tab1')).toHaveClass(/active/);
    await expect(page.locator('#panel1')).toHaveClass(/active/);
    await expect(page.locator('#panel0')).not.toHaveClass(/active/);
  });

  test('clicking Automation Flows tab activates it', async ({ page }) => {
    await page.locator('#tab2').click();
    await expect(page.locator('#tab2')).toHaveClass(/active/);
    await expect(page.locator('#panel2')).toHaveClass(/active/);
    await expect(page.locator('#panel0')).not.toHaveClass(/active/);
  });

  test('tabs cycle correctly — Dashboard → Flows → Tracker → Dashboard', async ({ page }) => {
    await page.locator('#tab2').click();
    await expect(page.locator('#panel2')).toHaveClass(/active/);
    await page.locator('#tab1').click();
    await expect(page.locator('#panel1')).toHaveClass(/active/);
    await page.locator('#tab0').click();
    await expect(page.locator('#panel0')).toHaveClass(/active/);
  });

  test('only one panel is visible at a time', async ({ page }) => {
    for (const tabIdx of [0, 1, 2]) {
      await page.locator(`#tab${tabIdx}`).click();
      const visiblePanels = await page.locator('.panel.active').count();
      expect(visiblePanels).toBe(1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// 3. DASHBOARD — KPIs
// ─────────────────────────────────────────────────────────────────────
test.describe('Dashboard — KPIs', () => {
  test('all four KPI cards are visible', async ({ page }) => {
    for (const id of ['kpi-total', 'kpi-open', 'kpi-esc', 'kpi-rt']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test('KPI initial values are correct', async ({ page }) => {
    await expect(page.locator('#kv-total')).toHaveText('247');
    await expect(page.locator('#kv-open')).toHaveText('183');
    await expect(page.locator('#kv-esc')).toHaveText('14');
  });

  test('KPI deltas are visible', async ({ page }) => {
    await expect(page.locator('#kd-total')).toBeVisible();
    await expect(page.locator('#kd-open')).toBeVisible();
    await expect(page.locator('#kd-esc')).toBeVisible();
    await expect(page.locator('#kd-rt')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────
// 4. DASHBOARD — STATUS BREAKDOWN
// ─────────────────────────────────────────────────────────────────────
test.describe('Dashboard — Status Breakdown', () => {
  test('all six status bars are rendered', async ({ page }) => {
    for (const id of ['bar-new','bar-review','bar-pending','bar-approved','bar-esc','bar-closed']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test('bar counts match expected initial values', async ({ page }) => {
    const expected = { 'bc-new':'52','bc-review':'63','bc-pending':'34','bc-approved':'19','bc-esc':'14','bc-closed':'5' };
    for (const [id, val] of Object.entries(expected)) {
      await expect(page.locator(`#${id}`)).toHaveText(val);
    }
  });

  test('bar fills have non-zero widths', async ({ page }) => {
    for (const id of ['bar-new','bar-review','bar-pending','bar-approved','bar-esc']) {
      const width = await page.locator(`#${id}`).evaluate(el => el.style.width);
      expect(parseInt(width)).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// 5. DASHBOARD — ACTION ITEMS & WORKLOAD
// ─────────────────────────────────────────────────────────────────────
test.describe('Dashboard — Action Items & Workload', () => {
  test('action items list has 4 items', async ({ page }) => {
    const items = page.locator('#action-list .action-item');
    await expect(items).toHaveCount(4);
  });

  test('urgent action item is present', async ({ page }) => {
    const urgent = page.locator('#action-list .action-item.urgent');
    await expect(urgent).toHaveCount(1);
    await expect(urgent).toContainText('escalations');
  });

  test('batch workload shows all 6 metrics', async ({ page }) => {
    for (const id of ['wl-intake','wl-alerts','wl-batch','wl-esc','wl-reports','wl-saved']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test('workload initial values are present', async ({ page }) => {
    await expect(page.locator('#wl-intake')).toHaveText('23');
    await expect(page.locator('#wl-alerts')).toHaveText('47');
    await expect(page.locator('#wl-batch')).toHaveText('138');
    await expect(page.locator('#wl-esc')).toHaveText('6');
    await expect(page.locator('#wl-reports')).toHaveText('1');
    await expect(page.locator('#wl-saved')).toHaveText('9.4h');
  });
});

// ─────────────────────────────────────────────────────────────────────
// 6. CLAIMANT TRACKER — TABLE
// ─────────────────────────────────────────────────────────────────────
test.describe('Claimant Tracker — Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.locator('#tab1').click();
  });

  test('table renders 20 rows initially', async ({ page }) => {
    const rows = page.locator('#table-body tr');
    await expect(rows).toHaveCount(20);
    await expect(page.locator('#filter-count')).toHaveText('Showing 20 of 20');
  });

  test('all expected column headers are present', async ({ page }) => {
    const headers = ['Matter #', 'Claimant', 'Matter Type', 'Attorney', 'Status', 'Priority', 'Next Deadline', 'Days Open'];
    for (const h of headers) {
      await expect(page.locator(`thead th:has-text("${h}")`)).toBeVisible();
    }
  });

  test('first row contains CLM-2024-089', async ({ page }) => {
    const firstId = page.locator('#table-body tr:first-child td:first-child');
    await expect(firstId).toHaveText('CLM-2024-089');
  });

  test('status chips are rendered in status column', async ({ page }) => {
    const chips = page.locator('#table-body .status-chip');
    const count = await chips.count();
    expect(count).toBe(20);
  });

  test('priority chips are rendered', async ({ page }) => {
    const chips = page.locator('#table-body .priority-chip');
    const count = await chips.count();
    expect(count).toBe(20);
  });

  test('escalated rows have red status chip', async ({ page }) => {
    const escalatedChips = page.locator('#table-body .status-chip.s-escalated');
    const count = await escalatedChips.count();
    expect(count).toBeGreaterThanOrEqual(3); // 3 escalated claimants
  });
});

// ─────────────────────────────────────────────────────────────────────
// 7. CLAIMANT TRACKER — FILTERS
// ─────────────────────────────────────────────────────────────────────
test.describe('Claimant Tracker — Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.locator('#tab1').click();
  });

  test('text search by matter ID narrows results', async ({ page }) => {
    await page.locator('#search-input').fill('CLM-2024-089');
    await expect(page.locator('#table-body tr')).toHaveCount(1);
    await expect(page.locator('#filter-count')).toHaveText('Showing 1 of 20');
  });

  test('text search by claimant name is case-insensitive', async ({ page }) => {
    await page.locator('#search-input').fill('harrison');
    const rows = page.locator('#table-body tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Harrison');
  });

  test('status filter — Escalated shows only escalated rows', async ({ page }) => {
    await page.locator('#filter-status').selectOption('Escalated');
    const rows = page.locator('#table-body tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(3);
    // All visible rows should have escalated chip
    const chips = page.locator('#table-body .status-chip.s-escalated');
    await expect(chips).toHaveCount(count);
  });

  test('status filter — Approved shows only approved rows', async ({ page }) => {
    await page.locator('#filter-status').selectOption('Approved');
    const chips = page.locator('#table-body .status-chip.s-approved');
    const rows = page.locator('#table-body tr');
    const rowCount = await rows.count();
    await expect(chips).toHaveCount(rowCount);
  });

  test('attorney filter narrows by assigned attorney', async ({ page }) => {
    await page.locator('#filter-attorney').selectOption('J. Harrington');
    const rows = page.locator('#table-body tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('J. Harrington');
    }
  });

  test('priority filter — High shows only high priority', async ({ page }) => {
    await page.locator('#filter-priority').selectOption('High');
    const chips = page.locator('#table-body .priority-chip.p-high');
    const rows = page.locator('#table-body tr');
    const rowCount = await rows.count();
    await expect(chips).toHaveCount(rowCount);
  });

  test('combined filters work together', async ({ page }) => {
    await page.locator('#filter-status').selectOption('Escalated');
    await page.locator('#filter-priority').selectOption('High');
    const rows = page.locator('#table-body tr');
    const count = await rows.count();
    // All rows must be both escalated and high priority
    const escalatedChips = page.locator('#table-body .status-chip.s-escalated');
    await expect(escalatedChips).toHaveCount(count);
    const highChips = page.locator('#table-body .priority-chip.p-high');
    await expect(highChips).toHaveCount(count);
  });

  test('clearing search restores all 20 rows', async ({ page }) => {
    await page.locator('#search-input').fill('harrison');
    await expect(page.locator('#table-body tr')).toHaveCount(1);
    await page.locator('#search-input').fill('');
    await expect(page.locator('#table-body tr')).toHaveCount(20);
  });

  test('empty search query shows no results gracefully', async ({ page }) => {
    await page.locator('#search-input').fill('ZZZNOMATCH999');
    await expect(page.locator('#table-body tr')).toHaveCount(0);
    await expect(page.locator('#filter-count')).toHaveText('Showing 0 of 20');
  });
});

// ─────────────────────────────────────────────────────────────────────
// 8. AUTOMATION FLOWS — STATIC CONTENT
// ─────────────────────────────────────────────────────────────────────
test.describe('Automation Flows — Static content', () => {
  test.beforeEach(async ({ page }) => {
    await page.locator('#tab2').click();
  });

  test('integration architecture section is visible', async ({ page }) => {
    await expect(page.locator('.arch-row').first()).toBeVisible();
    await expect(page.locator('.arch-node').first()).toBeVisible();
  });

  test('all 5 flow cards are rendered', async ({ page }) => {
    const cards = page.locator('.flow-card');
    await expect(cards).toHaveCount(5);
  });

  test('flow numbers 1–5 are present', async ({ page }) => {
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator('.flow-num').nth(i - 1)).toHaveText(String(i));
    }
  });

  test('each flow card has a name, type, description, and steps', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      const card = page.locator('.flow-card').nth(i);
      await expect(card.locator('.flow-name')).not.toBeEmpty();
      await expect(card.locator('.flow-type')).not.toBeEmpty();
      await expect(card.locator('.flow-desc')).not.toBeEmpty();
      const steps = card.locator('.flow-step');
      await expect(steps).toHaveCount(5);
    }
  });

  test('all flow step icons start in pending state (○)', async ({ page }) => {
    const icons = page.locator('.flow-step.pending .step-icon');
    const count = await icons.count();
    expect(count).toBe(25); // 5 flows × 5 steps
  });

  test('all status badges start as Idle', async ({ page }) => {
    const badges = page.locator('.flow-status-badge.fsb-idle');
    await expect(badges).toHaveCount(5);
  });

  test('each flow card shows three metrics', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      const metrics = page.locator('.flow-card').nth(i).locator('.flow-metric-item');
      await expect(metrics).toHaveCount(3);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// 9. SIMULATION — BUTTON BEHAVIOR
// ─────────────────────────────────────────────────────────────────────
test.describe('Simulation — Button behavior', () => {
  test('button disables immediately on click', async ({ page }) => {
    await page.locator('#btnRun').click();
    // Check disabled within 500ms of click
    await expect(page.locator('#btnRun')).toBeDisabled({ timeout: 500 });
  });

  test('simulation switches to Automation Flows tab', async ({ page }) => {
    await page.locator('#btnRun').click();
    // Should switch to tab 2 after a short delay
    await expect(page.locator('#tab2')).toHaveClass(/active/, { timeout: 3000 });
  });

  test('progress bar appears during simulation', async ({ page }) => {
    await page.locator('#btnRun').click();
    // Progress bar should have non-zero scale
    await page.waitForFunction(() => {
      const el = document.getElementById('sim-progress');
      const t = el?.style?.transform || '';
      const match = t.match(/scaleX\(([^)]+)\)/);
      return match && parseFloat(match[1]) > 0;
    }, { timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────
// 10. SIMULATION — TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────
test.describe('Simulation — Toast notifications', () => {
  test('first toast appears after simulation starts', async ({ page }) => {
    await page.locator('#btnRun').click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 4000 });
  });

  test('simulation-starting toast contains expected text', async ({ page }) => {
    await page.locator('#btnRun').click();
    await expect(page.locator('.toast-title').first()).toContainText('Simulation', { timeout: 4000 });
  });

  test('multiple toasts are queued during simulation', async ({ page }) => {
    await page.locator('#btnRun').click();
    // Wait for at least 2 toasts to appear
    await page.waitForFunction(() => document.querySelectorAll('.toast').length >= 2, { timeout: 8000 });
    const count = await page.locator('.toast').count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('toasts auto-dismiss after a few seconds', async ({ page }) => {
    await page.locator('#btnRun').click();
    // Wait for a toast to appear
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 4000 });
    // Then wait for it to be removed (toasts last ~3.8s + 0.35s fade)
    await page.waitForFunction(() => {
      const toasts = document.querySelectorAll('.toast');
      return Array.from(toasts).some(t => t.classList.contains('fade-out') || toasts.length === 0);
    }, { timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────
// 11. SIMULATION — FLOW 1 (INTAKE)
// ─────────────────────────────────────────────────────────────────────
test.describe('Simulation — Flow 1: New Matter Intake', () => {
  test('Flow 1 card enters running state', async ({ page }) => {
    await page.locator('#btnRun').click();
    await page.locator('#tab2').click();
    await expect(page.locator('#flow-card-0')).toHaveClass(/running/, { timeout: 5000 });
  });

  test('Flow 1 badge shows Running', async ({ page }) => {
    await page.locator('#btnRun').click();
    await page.locator('#tab2').click();
    await expect(page.locator('#fsb-0')).toHaveClass(/fsb-running/, { timeout: 5000 });
  });

  test('Flow 1 steps animate — step 0 leaves pending state', async ({ page }) => {
    await page.locator('#btnRun').click();
    await page.locator('#tab2').click();
    // Step transitions pending → active → done; check it has progressed either way
    await expect(page.locator('#fstep-0-0')).not.toHaveClass(/pending/, { timeout: 8000 });
  });

  test('Flow 1 completes — badge shows Complete', async ({ page }) => {
    await page.locator('#btnRun').click();
    await page.locator('#tab2').click();
    await expect(page.locator('#fsb-0')).toHaveClass(/fsb-done/, { timeout: 15000 });
  });

  test('Flow 1 completion adds new claimant row to table', async ({ page }) => {
    await page.locator('#btnRun').click();
    // Wait for flow 1 to complete
    await page.locator('#tab2').click();
    await expect(page.locator('#fsb-0')).toHaveClass(/fsb-done/, { timeout: 15000 });
    // Now check the tracker
    await page.locator('#tab1').click();
    await expect(page.locator('#table-body tr')).toHaveCount(21, { timeout: 3000 });
  });
});

// ─────────────────────────────────────────────────────────────────────
// 12. SIMULATION — FLOW 3 (BATCH UPDATE)
// ─────────────────────────────────────────────────────────────────────
test.describe('Simulation — Flow 3: Batch Status Update', () => {
  test('Flow 3 completes with Complete badge', async ({ page }) => {
    await page.locator('#btnRun').click();
    await page.locator('#tab2').click();
    await expect(page.locator('#fsb-2')).toHaveClass(/fsb-done/, { timeout: 40000 });
  });

  test('batch update changes row CLM-2024-296 to Approved', async ({ page }) => {
    await page.locator('#btnRun').click();
    await page.locator('#tab2').click();
    await expect(page.locator('#fsb-2')).toHaveClass(/fsb-done/, { timeout: 40000 });
    await page.locator('#tab1').click();
    const row = page.locator('#row-CLM-2024-296');
    await expect(row.locator('.status-chip')).toContainText('Approved', { timeout: 3000 });
  });
});

// ─────────────────────────────────────────────────────────────────────
// 13. SIMULATION — FLOW 4 (ESCALATION) — KPI UPDATE
// ─────────────────────────────────────────────────────────────────────
test.describe('Simulation — Flow 4: Escalation', () => {
  test('escalated KPI updates from 14 to 17 after Flow 4', async ({ page }) => {
    await page.locator('#btnRun').click();
    await page.locator('#tab2').click();
    await expect(page.locator('#fsb-3')).toHaveClass(/fsb-done/, { timeout: 55000 });
    await page.locator('#tab0').click();
    await expect(page.locator('#kv-esc')).toHaveText('17', { timeout: 3000 });
  });

  test('workload escalation counter updates', async ({ page }) => {
    await page.locator('#btnRun').click();
    await page.locator('#tab2').click();
    await expect(page.locator('#fsb-3')).toHaveClass(/fsb-done/, { timeout: 55000 });
    await page.locator('#tab0').click();
    await expect(page.locator('#wl-esc')).toHaveText('9', { timeout: 3000 });
  });
});

// ─────────────────────────────────────────────────────────────────────
// 14. SIMULATION — FULL COMPLETION
// ─────────────────────────────────────────────────────────────────────
test.describe('Simulation — Full run completion', () => {
  // Increase timeout for the full simulation (~45s of animation)
  test.setTimeout(120_000);

  test('all 5 flow badges show Complete at end', async ({ page }) => {
    await page.locator('#btnRun').click();
    await page.locator('#tab2').click();
    for (let i = 0; i < 5; i++) {
      await expect(page.locator(`#fsb-${i}`)).toHaveClass(/fsb-done/, { timeout: 90000 });
    }
  });

  test('total claims KPI updates to 248', async ({ page }) => {
    await page.locator('#btnRun').click();
    // Wait for simulation to finish (button re-enables)
    await expect(page.locator('#btnRun')).toBeEnabled({ timeout: 90000 });
    await page.locator('#tab0').click();
    await expect(page.locator('#kv-total')).toHaveText('248');
  });

  test('hours saved updates to 11.2h', async ({ page }) => {
    await page.locator('#btnRun').click();
    await expect(page.locator('#btnRun')).toBeEnabled({ timeout: 90000 });
    await page.locator('#tab0').click();
    await expect(page.locator('#wl-saved')).toHaveText('11.2h');
  });

  test('simulation returns to Dashboard tab when done', async ({ page }) => {
    await page.locator('#btnRun').click();
    await expect(page.locator('#btnRun')).toBeEnabled({ timeout: 90000 });
    await expect(page.locator('#tab0')).toHaveClass(/active/);
  });

  test('Run button re-enables after simulation completes', async ({ page }) => {
    await page.locator('#btnRun').click();
    await expect(page.locator('#btnRun')).toBeDisabled({ timeout: 500 });
    await expect(page.locator('#btnRun')).toBeEnabled({ timeout: 90000 });
    await expect(page.locator('#btnRun')).toContainText('Run Demo Simulation');
  });

  test('simulation can be run a second time', async ({ page }) => {
    // First run
    await page.locator('#btnRun').click();
    await expect(page.locator('#btnRun')).toBeEnabled({ timeout: 90000 });
    // Second run
    await page.locator('#btnRun').click();
    await expect(page.locator('#btnRun')).toBeDisabled({ timeout: 500 });
    await expect(page.locator('#btnRun')).toBeEnabled({ timeout: 90000 });
  });
});

// ─────────────────────────────────────────────────────────────────────
// 15. RESPONSIVENESS
// ─────────────────────────────────────────────────────────────────────
test.describe('Responsiveness', () => {
  test('renders correctly at 1280×800 (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.kpi-grid')).toBeVisible();
    await expect(page.locator('#btnRun')).toBeVisible();
  });

  test('renders correctly at 768×1024 (tablet)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.kpi-grid')).toBeVisible();
    await expect(page.locator('#btnRun')).toBeVisible();
    await expect(page.locator('.tab-bar')).toBeVisible();
  });

  test('renders correctly at 390×844 (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForSelector('#table-body tr', { state: 'attached' });
    await expect(page.locator('header')).toBeVisible();
    // Tab bar should still be accessible
    await expect(page.locator('.tab-bar')).toBeVisible();
  });

  test('claimant table is horizontally scrollable on narrow viewports', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });
    await page.locator('#tab1').click();
    const tblWrap = page.locator('.tbl-wrap');
    await expect(tblWrap).toBeVisible();
    const overflow = await tblWrap.evaluate(el => getComputedStyle(el).overflowX);
    expect(overflow).toBe('auto');
  });
});

// ─────────────────────────────────────────────────────────────────────
// 16. ACCESSIBILITY BASICS
// ─────────────────────────────────────────────────────────────────────
test.describe('Accessibility basics', () => {
  test('page has lang attribute', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('page has charset meta tag', async ({ page }) => {
    await expect(page.locator('meta[charset]')).toHaveCount(1);
  });

  test('page has viewport meta tag', async ({ page }) => {
    await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
  });

  test('Run button has visible text content', async ({ page }) => {
    const text = await page.locator('#btnRun').innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('table has thead with column headers', async ({ page }) => {
    await page.locator('#tab1').click();
    await expect(page.locator('thead th').first()).toBeVisible();
    const thCount = await page.locator('thead th').count();
    expect(thCount).toBe(8);
  });
});
