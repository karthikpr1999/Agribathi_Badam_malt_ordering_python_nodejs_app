/**
 * app.js — SPA router. Handles navbar navigation and initial view load.
 */

const VIEWS = {
  'order-form':    renderOrderForm,
  'order-history': renderOrderHistory,
  'dashboard':     renderDashboard,
};

function navigateTo(viewName) {
  // Update active nav link
  document.querySelectorAll('.navbar .nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewName);
  });

  const render = VIEWS[viewName];
  if (render) {
    // Clear any running dashboard timer when leaving that view
    if (typeof _dashboardRefreshTimer !== 'undefined' && viewName !== 'dashboard') {
      clearInterval(_dashboardRefreshTimer);
    }
    render();
  }
}

// Toast helper (accessible globally by all view modules)
function showToast(message, type = 'success') {
  const toastEl = document.getElementById('app-toast');
  const bodyEl  = document.getElementById('toast-body');

  // Set color
  toastEl.className = 'toast align-items-center border-0 text-white';
  const colorMap = { success: 'bg-success', danger: 'bg-danger', warning: 'bg-warning text-dark' };
  toastEl.classList.add(colorMap[type] || 'bg-secondary');

  bodyEl.textContent = message;

  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();
}

// Wire up navbar clicks
document.querySelectorAll('.navbar .nav-link[data-view]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(link.dataset.view);
  });
});

// Default view on load
navigateTo('order-form');
