/**
 * api.js — All fetch() calls to the Python backend.
 * Change API_BASE here if your backend runs on a different port.
 */

// Use the same host the page was loaded from, but always port 8000.
// This works for both localhost and EC2 (or any other host).
const API_BASE = `${window.location.protocol}//${window.location.hostname}:8000`;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

async function _request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    const msg = data.detail || JSON.stringify(data);
    throw new Error(msg);
  }
  return data;
}

// ─── Products ───────────────────────────────────────────────
function getProducts() {
  return _request('GET', '/products');
}

// ─── Orders ─────────────────────────────────────────────────
function createOrder(orderData) {
  return _request('POST', '/orders', orderData);
}

function getOrders(params = {}) {
  const qs = new URLSearchParams();
  if (params.date)   qs.set('date',   params.date);
  if (params.from)   qs.set('from',   params.from);
  if (params.to)     qs.set('to',     params.to);
  if (params.search) qs.set('search', params.search);
  if (params.page)   qs.set('page',   params.page);
  if (params.limit)  qs.set('limit',  params.limit);
  const query = qs.toString() ? '?' + qs.toString() : '';
  return _request('GET', '/orders' + query);
}

function getOrder(id) {
  return _request('GET', `/orders/${id}`);
}

function deleteOrder(id) {
  return _request('DELETE', `/orders/${id}`);
}

// ─── Dashboard ──────────────────────────────────────────────
function getDashboardStats() {
  return _request('GET', '/dashboard/stats');
}

function getPrices() {
  return _request('GET', '/dashboard/prices');
}

function updatePrices(pricesData) {
  return _request('PUT', '/dashboard/prices', pricesData);
}
