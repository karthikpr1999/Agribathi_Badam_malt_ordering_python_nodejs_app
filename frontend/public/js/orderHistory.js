/**
 * orderHistory.js — Order History view with search, date filter, pagination, expand rows.
 */

let _historyState = {
  page: 1,
  limit: 20,
  search: '',
  fromDate: '',
  toDate: '',
  total: 0,
  expandedOrderId: null,
};

let _searchDebounce = null;

async function renderOrderHistory() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-xl-10">
        <h4 class="mb-4"><i class="bi bi-clock-history text-success"></i> Order History</h4>

        <!-- Filters -->
        <div class="card shadow-sm mb-3">
          <div class="card-body py-2">
            <div class="row g-2 align-items-end">
              <div class="col-md-4">
                <label class="form-label small text-muted mb-1">Search (name or phone)</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text"><i class="bi bi-search"></i></span>
                  <input type="text" id="hist-search" class="form-control" placeholder="Search..." value="${_historyState.search}" />
                </div>
              </div>
              <div class="col-md-3">
                <label class="form-label small text-muted mb-1">From date</label>
                <input type="date" id="hist-from" class="form-control form-control-sm" value="${_historyState.fromDate}" />
              </div>
              <div class="col-md-3">
                <label class="form-label small text-muted mb-1">To date</label>
                <input type="date" id="hist-to" class="form-control form-control-sm" value="${_historyState.toDate}" />
              </div>
              <div class="col-md-2">
                <button id="btn-filter-clear" class="btn btn-outline-secondary btn-sm w-100">
                  <i class="bi bi-x-circle"></i> Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div id="history-table-area">
              <div class="text-center py-4">
                <div class="spinner-border text-success"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center mt-3" id="hist-pagination"></div>
      </div>
    </div>
  `;

  // Wire up filter controls
  document.getElementById('hist-search').addEventListener('input', e => {
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(() => {
      _historyState.search = e.target.value.trim();
      _historyState.page = 1;
      loadHistoryData();
    }, 400);
  });

  document.getElementById('hist-from').addEventListener('change', e => {
    _historyState.fromDate = e.target.value;
    _historyState.page = 1;
    loadHistoryData();
  });

  document.getElementById('hist-to').addEventListener('change', e => {
    _historyState.toDate = e.target.value;
    _historyState.page = 1;
    loadHistoryData();
  });

  document.getElementById('btn-filter-clear').addEventListener('click', () => {
    _historyState = { ..._historyState, search: '', fromDate: '', toDate: '', page: 1 };
    document.getElementById('hist-search').value = '';
    document.getElementById('hist-from').value = '';
    document.getElementById('hist-to').value = '';
    loadHistoryData();
  });

  await loadHistoryData();
}

async function loadHistoryData() {
  const area = document.getElementById('history-table-area');
  if (!area) return;
  area.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-success"></div></div>';

  try {
    const params = {
      page: _historyState.page,
      limit: _historyState.limit,
    };
    if (_historyState.search)   params.search = _historyState.search;
    if (_historyState.fromDate) params.from   = _historyState.fromDate;
    if (_historyState.toDate)   params.to     = _historyState.toDate;

    const data = await getOrders(params);
    _historyState.total = data.total;
    renderHistoryTable(data.orders);
    renderPagination(data.total, data.page, data.limit);
  } catch (err) {
    area.innerHTML = `<div class="alert alert-danger m-3">Error loading orders: ${err.message}</div>`;
  }
}

function renderHistoryTable(orders) {
  const area = document.getElementById('history-table-area');
  if (!area) return;

  if (orders.length === 0) {
    area.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
        No orders found.
      </div>`;
    return;
  }

  area.innerHTML = `
    <div class="table-responsive history-scroll">
      <table class="table table-hover mb-0 history-table">
        <thead class="table-success sticky-top">
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Date</th>
            <th class="text-end">Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="history-tbody"></tbody>
      </table>
    </div>`;

  const tbody = document.getElementById('history-tbody');
  orders.forEach(order => {
    const isExpanded = _historyState.expandedOrderId === order.id;
    const tr = document.createElement('tr');
    tr.dataset.orderId = order.id;
    tr.innerHTML = `
      <td class="text-muted small align-middle">#${order.id}</td>
      <td class="fw-semibold align-middle">${escapeHtml(order.customer_name)}</td>
      <td class="align-middle">${escapeHtml(order.customer_phone)}</td>
      <td class="align-middle small">${order.order_date}</td>
      <td class="text-end align-middle fw-bold text-success">&#8377;${order.total_amount.toFixed(2)}</td>
      <td class="align-middle text-end">
        <button class="btn btn-sm btn-outline-success btn-expand" data-order-id="${order.id}">
          <i class="bi bi-chevron-${isExpanded ? 'up' : 'down'}"></i>
        </button>
      </td>`;
    tbody.appendChild(tr);

    if (isExpanded) {
      const detailTr = document.createElement('tr');
      detailTr.className = 'order-detail-row';
      detailTr.id = `detail-${order.id}`;
      detailTr.innerHTML = `<td colspan="6"><div class="text-center py-2"><div class="spinner-border spinner-border-sm text-success"></div></div></td>`;
      tbody.appendChild(detailTr);
      loadOrderDetail(order.id);
    }
  });

  // Expand/collapse on button click
  tbody.addEventListener('click', async e => {
    const btn = e.target.closest('.btn-expand');
    if (!btn) return;
    const orderId = parseInt(btn.dataset.orderId);

    if (_historyState.expandedOrderId === orderId) {
      _historyState.expandedOrderId = null;
    } else {
      _historyState.expandedOrderId = orderId;
    }
    renderHistoryTable(
      Array.from(document.querySelectorAll('#history-tbody tr[data-order-id]')).map(tr => ({
        id: parseInt(tr.dataset.orderId),
        customer_name: tr.cells[1].textContent,
        customer_phone: tr.cells[2].textContent,
        order_date: tr.cells[3].textContent,
        total_amount: parseFloat(tr.cells[4].textContent.replace('₹', '')),
      }))
    );
    if (_historyState.expandedOrderId) {
      loadOrderDetail(_historyState.expandedOrderId);
    }
  });
}

async function loadOrderDetail(orderId) {
  const detailCell = document.querySelector(`#detail-${orderId} td`);
  if (!detailCell) return;

  try {
    const order = await getOrder(orderId);
    const itemsHtml = order.items.map(item => `
      <tr>
        <td>${escapeHtml(item.product_name)}</td>
        <td class="text-center">x ${item.quantity}</td>
        <td class="text-end text-muted">&#8377;${item.unit_price.toFixed(2)}</td>
        <td class="text-end fw-semibold">&#8377;${item.line_total.toFixed(2)}</td>
      </tr>`).join('');

    detailCell.innerHTML = `
      <div class="p-2">
        <table class="table table-sm table-borderless mb-2">
          <thead><tr>
            <th>Product</th><th class="text-center">Qty</th>
            <th class="text-end">Unit Price</th><th class="text-end">Subtotal</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr class="border-top">
              <td colspan="3" class="text-end fw-bold">Total</td>
              <td class="text-end fw-bold text-success">&#8377;${order.total_amount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        ${order.notes ? `<p class="text-muted small mb-2"><i class="bi bi-chat-left-text"></i> ${escapeHtml(order.notes)}</p>` : ''}
        <button class="btn btn-sm btn-outline-danger btn-delete-order" data-order-id="${order.id}">
          <i class="bi bi-trash"></i> Delete Order
        </button>
      </div>`;

    detailCell.querySelector('.btn-delete-order').addEventListener('click', async () => {
      if (!confirm(`Delete Order #${order.id}? This cannot be undone.`)) return;
      try {
        await deleteOrder(order.id);
        showToast(`Order #${order.id} deleted.`, 'warning');
        _historyState.expandedOrderId = null;
        loadHistoryData();
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'danger');
      }
    });
  } catch (err) {
    detailCell.innerHTML = `<div class="text-danger p-2">Failed to load order: ${err.message}</div>`;
  }
}

function renderPagination(total, page, limit) {
  const pgEl = document.getElementById('hist-pagination');
  if (!pgEl) return;
  const totalPages = Math.ceil(total / limit);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  pgEl.innerHTML = `
    <span class="text-muted small">
      Showing ${start}–${end} of ${total} orders
    </span>
    <div class="d-flex gap-2">
      <button class="btn btn-sm btn-outline-success" id="btn-prev" ${page <= 1 ? 'disabled' : ''}>
        <i class="bi bi-chevron-left"></i> Prev
      </button>
      <span class="btn btn-sm btn-light disabled">${page} / ${totalPages || 1}</span>
      <button class="btn btn-sm btn-outline-success" id="btn-next" ${page >= totalPages ? 'disabled' : ''}>
        Next <i class="bi bi-chevron-right"></i>
      </button>
    </div>`;

  document.getElementById('btn-prev')?.addEventListener('click', () => {
    _historyState.page--;
    loadHistoryData();
  });
  document.getElementById('btn-next')?.addEventListener('click', () => {
    _historyState.page++;
    loadHistoryData();
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
