/**
 * dashboard.js — Dashboard view: today's stats, all-time totals, price editor.
 */

let _dashboardRefreshTimer = null;

async function renderDashboard() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-xl-9">
        <h4 class="mb-4"><i class="bi bi-speedometer2 text-success"></i> Dashboard</h4>

        <!-- Today stats -->
        <div class="mb-2 d-flex justify-content-between align-items-center">
          <h6 class="text-muted text-uppercase">Today</h6>
          <button class="btn btn-sm btn-outline-success" id="btn-refresh-stats">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>

        <div class="row g-3 mb-4" id="today-stats-cards">
          <div class="col-12 text-center py-3">
            <div class="spinner-border text-success"></div>
          </div>
        </div>

        <h6 class="text-muted text-uppercase mb-3">Product Breakdown — Today</h6>
        <div class="card shadow-sm mb-4">
          <div class="card-body p-0">
            <div id="today-product-table">
              <div class="text-center py-3"><div class="spinner-border spinner-border-sm text-success"></div></div>
            </div>
          </div>
        </div>

        <h6 class="text-muted text-uppercase mb-3">All Time</h6>
        <div class="row g-3 mb-5" id="alltime-stats-cards">
          <div class="col-12 text-center py-3">
            <div class="spinner-border text-success"></div>
          </div>
        </div>

        <!-- Price editor -->
        <h6 class="text-muted text-uppercase mb-3">Manage Prices</h6>
        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <p class="text-muted small mb-3">
              <i class="bi bi-info-circle"></i>
              Changes take effect immediately on the next order — no server restart needed.
            </p>
            <div id="price-editor">
              <div class="text-center py-3"><div class="spinner-border spinner-border-sm text-success"></div></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  document.getElementById('btn-refresh-stats').addEventListener('click', loadStats);

  // Auto-refresh every 60 seconds
  if (_dashboardRefreshTimer) clearInterval(_dashboardRefreshTimer);
  _dashboardRefreshTimer = setInterval(() => {
    if (document.getElementById('today-stats-cards')) loadStats();
    else clearInterval(_dashboardRefreshTimer);
  }, 60000);

  await Promise.all([loadStats(), loadPriceEditor()]);
}

async function loadStats() {
  try {
    const data = await getDashboardStats();

    // Today cards
    const todayCards = document.getElementById('today-stats-cards');
    if (todayCards) {
      todayCards.innerHTML = `
        <div class="col-sm-6">
          <div class="stat-card">
            <div class="stat-value">${data.today.order_count}</div>
            <div class="stat-label"><i class="bi bi-bag-check"></i> Orders Today</div>
          </div>
        </div>
        <div class="col-sm-6">
          <div class="stat-card">
            <div class="stat-value">&#8377;${Number(data.today.revenue).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
            <div class="stat-label"><i class="bi bi-currency-rupee"></i> Revenue Today</div>
          </div>
        </div>`;
    }

    // Today product table
    const prodTable = document.getElementById('today-product-table');
    if (prodTable) {
      if (data.today.items_by_product.length === 0) {
        prodTable.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="bi bi-inbox"></i> No orders today yet.
          </div>`;
      } else {
        const prices = await getPrices();
        const skuPriceMap = { AGRI_TUBE: prices.AGRI_TUBE, MASALA_250: prices.MASALA_250, BADAM_200: prices.BADAM_200 };

        const rows = data.today.items_by_product.map(item => {
          const rev = (item.total_qty * (skuPriceMap[item.sku] || 0)).toFixed(2);
          return `<tr>
            <td class="fw-semibold">${escapeHtml(item.product_name)}</td>
            <td class="text-center">${item.total_qty}</td>
            <td class="text-end text-success fw-bold">&#8377;${Number(rev).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
          </tr>`;
        }).join('');

        prodTable.innerHTML = `
          <table class="table table-sm mb-0">
            <thead class="table-light">
              <tr>
                <th>Product</th>
                <th class="text-center">Units Sold</th>
                <th class="text-end">Revenue</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>`;
      }
    }

    // All-time cards
    const allCards = document.getElementById('alltime-stats-cards');
    if (allCards) {
      allCards.innerHTML = `
        <div class="col-sm-6">
          <div class="stat-card">
            <div class="stat-value">${data.all_time.order_count.toLocaleString('en-IN')}</div>
            <div class="stat-label"><i class="bi bi-bag-check"></i> Total Orders</div>
          </div>
        </div>
        <div class="col-sm-6">
          <div class="stat-card">
            <div class="stat-value">&#8377;${Number(data.all_time.revenue).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
            <div class="stat-label"><i class="bi bi-currency-rupee"></i> Total Revenue</div>
          </div>
        </div>`;
    }
  } catch (err) {
    const todayCards = document.getElementById('today-stats-cards');
    if (todayCards) {
      todayCards.innerHTML = `<div class="col-12"><div class="alert alert-danger">Failed to load stats: ${escapeHtml(err.message)}</div></div>`;
    }
  }
}

async function loadPriceEditor() {
  const editor = document.getElementById('price-editor');
  if (!editor) return;

  try {
    const prices = await getPrices();

    editor.innerHTML = `
      <div class="row g-3">
        <div class="col-sm-4">
          <label class="form-label fw-semibold">Agribathi Tubes (per dozen)</label>
          <div class="input-group price-input-group">
            <span class="input-group-text">&#8377;</span>
            <input type="number" id="price-AGRI_TUBE" class="form-control" min="0.01" step="0.01" value="${prices.AGRI_TUBE}" />
          </div>
        </div>
        <div class="col-sm-4">
          <label class="form-label fw-semibold">Masala Agribathis (per 250g)</label>
          <div class="input-group price-input-group">
            <span class="input-group-text">&#8377;</span>
            <input type="number" id="price-MASALA_250" class="form-control" min="0.01" step="0.01" value="${prices.MASALA_250}" />
          </div>
        </div>
        <div class="col-sm-4">
          <label class="form-label fw-semibold">Badam Malt (per 200g)</label>
          <div class="input-group price-input-group">
            <span class="input-group-text">&#8377;</span>
            <input type="number" id="price-BADAM_200" class="form-control" min="0.01" step="0.01" value="${prices.BADAM_200}" />
          </div>
        </div>
        <div class="col-12">
          <button id="btn-save-prices" class="btn btn-success">
            <i class="bi bi-floppy"></i> Save Prices
          </button>
        </div>
      </div>`;

    document.getElementById('btn-save-prices').addEventListener('click', async () => {
      const newPrices = {
        AGRI_TUBE: parseFloat(document.getElementById('price-AGRI_TUBE').value),
        MASALA_250: parseFloat(document.getElementById('price-MASALA_250').value),
        BADAM_200: parseFloat(document.getElementById('price-BADAM_200').value),
      };

      if (Object.values(newPrices).some(v => isNaN(v) || v <= 0)) {
        showToast('All prices must be positive numbers.', 'danger');
        return;
      }

      try {
        await updatePrices(newPrices);
        showToast('Prices updated successfully!', 'success');
      } catch (err) {
        showToast('Failed to save prices: ' + err.message, 'danger');
      }
    });

  } catch (err) {
    editor.innerHTML = `<div class="alert alert-danger">Failed to load prices: ${escapeHtml(err.message)}</div>`;
  }
}
