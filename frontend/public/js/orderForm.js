/**
 * orderForm.js — New Order entry view.
 */

async function renderOrderForm() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-7 col-md-10">
        <h4 class="mb-4"><i class="bi bi-plus-circle text-success"></i> New Order</h4>

        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <h6 class="card-subtitle mb-3 text-muted">Customer Details</h6>
            <div class="row g-3">
              <div class="col-sm-6">
                <label class="form-label fw-semibold">Customer Name <span class="text-danger">*</span></label>
                <input type="text" id="cust-name" class="form-control" placeholder="e.g. Ravi Kumar" />
              </div>
              <div class="col-sm-6">
                <label class="form-label fw-semibold">Phone Number <span class="text-danger">*</span></label>
                <input type="tel" id="cust-phone" class="form-control" placeholder="e.g. 9876543210" />
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Notes (optional)</label>
                <input type="text" id="cust-notes" class="form-control" placeholder="Any special instructions..." />
              </div>
            </div>
          </div>
        </div>

        <h6 class="text-muted mb-2">Products</h6>
        <div id="product-rows">
          <div class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-success"></div>
            <span class="ms-2 text-muted">Loading products...</span>
          </div>
        </div>

        <div class="order-total-bar mt-3 d-flex justify-content-between align-items-center">
          <span><i class="bi bi-receipt"></i> Order Total</span>
          <span id="order-total">&#8377;0.00</span>
        </div>

        <div class="d-grid mt-4">
          <button id="btn-place-order" class="btn btn-success btn-lg" disabled>
            <i class="bi bi-check-circle"></i> Place Order
          </button>
        </div>
      </div>
    </div>
  `;

  let products = [];
  try {
    products = await getProducts();
  } catch (err) {
    document.getElementById('product-rows').innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> Failed to load products: ${err.message}
      </div>`;
    return;
  }

  // Render product rows
  const rowsContainer = document.getElementById('product-rows');
  rowsContainer.innerHTML = products.map(p => `
    <div class="product-row d-flex align-items-center gap-3 flex-wrap">
      <div class="flex-grow-1">
        <div class="product-name">${p.name}</div>
        <div class="price-tag">&#8377;${p.price.toFixed(2)} per ${p.unit_label}</div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <label class="form-label mb-0 text-muted small">Qty (${p.unit_label})</label>
        <input
          type="number"
          class="form-control form-control-sm qty-input"
          style="width:90px"
          data-product-id="${p.id}"
          data-price="${p.price}"
          min="0"
          step="1"
          value="0"
          id="qty-${p.id}"
        />
      </div>
      <div class="subtotal" id="sub-${p.id}">&#8377;0.00</div>
    </div>
  `).join('');

  // Live total calculation
  function recalculate() {
    let total = 0;
    document.querySelectorAll('.qty-input').forEach(input => {
      const qty = Math.max(0, parseFloat(input.value) || 0);
      const price = parseFloat(input.dataset.price);
      const lineTotal = qty * price;
      total += lineTotal;
      document.getElementById(`sub-${input.dataset.productId}`).textContent =
        '\u20B9' + lineTotal.toFixed(2);
    });
    document.getElementById('order-total').textContent = '\u20B9' + total.toFixed(2);
    const hasQty = Array.from(document.querySelectorAll('.qty-input'))
      .some(i => parseFloat(i.value) > 0);
    document.getElementById('btn-place-order').disabled = !hasQty;
  }

  rowsContainer.addEventListener('input', recalculate);

  // Submit
  document.getElementById('btn-place-order').addEventListener('click', async () => {
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const notes = document.getElementById('cust-notes').value.trim();

    if (!name) { showToast('Please enter the customer name.', 'danger'); return; }
    if (!phone) { showToast('Please enter the phone number.', 'danger'); return; }

    const items = [];
    document.querySelectorAll('.qty-input').forEach(input => {
      const qty = parseFloat(input.value) || 0;
      if (qty > 0) {
        items.push({ product_id: parseInt(input.dataset.productId), quantity: qty });
      }
    });

    if (items.length === 0) {
      showToast('Please enter quantity for at least one product.', 'danger');
      return;
    }

    const btn = document.getElementById('btn-place-order');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Placing...';

    try {
      const order = await createOrder({ customer_name: name, customer_phone: phone, notes, items });
      showToast(`Order #${order.id} placed successfully! Total: \u20B9${order.total_amount.toFixed(2)}`, 'success');
      // Reset form
      document.getElementById('cust-name').value = '';
      document.getElementById('cust-phone').value = '';
      document.getElementById('cust-notes').value = '';
      document.querySelectorAll('.qty-input').forEach(i => { i.value = 0; });
      recalculate();
    } catch (err) {
      showToast('Error placing order: ' + err.message, 'danger');
      btn.disabled = false;
    }

    btn.innerHTML = '<i class="bi bi-check-circle"></i> Place Order';
  });
}
