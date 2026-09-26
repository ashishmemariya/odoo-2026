/**
 * StockSense Minimalist State Store & Interaction Engine
 * Matches Odoo x LPU Jalandhar Hackathon Requirements
 */

(function () {
  'use strict';

  // --- Initial Database State (Reactive in Memory) ---
  const state = {
    currentView: 'dashboard', // dashboard, products, receipts, deliveries, transfers, adjustments, ledger, warehouses, settings
    kanbanMode: false,
    userRole: 'manager', // manager, staff
    isAuthenticated: true, // true, false
    currentUser: { name: 'Rahul Sharma', email: 'rahul.sharma@stocksense.io', role: 'Inventory Manager' },
    authMode: 'login', // login, signup
    selectedWarehouse: 'ALL',
    searchQuery: '',
    statusFilter: 'ALL',

    warehouses: [
      { id: 'WH-01', name: 'Main Store', shortCode: 'WH/Stock1', address: 'Plot 42, Industrial Zone A' },
      { id: 'WH-02', name: 'Production Rack', shortCode: 'WH/Stock2', address: 'Assembly Line Annex, Gate 3' },
      { id: 'WH-03', name: 'Dispatch Bay', shortCode: 'WH/Stock3', address: 'Logistics Dock 4' }
    ],

    locations: [
      { id: 'LOC-01', name: 'Bay B-04 (Raw Materials)', shortCode: 'WH/Stock1/B04', warehouse: 'WH-01' },
      { id: 'LOC-02', name: 'Production Buffer Rack', shortCode: 'WH/Stock2/BUF', warehouse: 'WH-02' },
      { id: 'LOC-03', name: 'Staging Lane Alpha', shortCode: 'WH/Stock3/STG', warehouse: 'WH-03' },
      { id: 'LOC-04', name: 'Quarantine & Inspection', shortCode: 'WH/Stock1/QC', warehouse: 'WH-01' }
    ],

    products: [
      { id: 'PRD-1', name: 'Desk', sku: 'DESK-001', category: 'Furniture', cost: 3000, onHand: 50, freeToUse: 45, unit: 'Units' },
      { id: 'PRD-2', name: 'Table', sku: 'TBL-002', category: 'Furniture', cost: 3000, onHand: 50, freeToUse: 50, unit: 'Units' },
      { id: 'PRD-3', name: 'Office Chair', sku: 'CHR-104', category: 'Furniture', cost: 2200, onHand: 38, freeToUse: 32, unit: 'Units' },
      { id: 'PRD-4', name: 'Hydraulic Valves 1/2"', sku: 'HV-902', category: 'Components', cost: 850, onHand: 8, freeToUse: 4, unit: 'Units' },
      { id: 'PRD-5', name: 'Hex Bolts M8 x 40mm', sku: 'HB-088', category: 'Hardware', cost: 15, onHand: 1200, freeToUse: 1100, unit: 'Units' },
      { id: 'PRD-6', name: 'Steel Rods 12mm', sku: 'STEEL-001', category: 'Raw Materials', cost: 450, onHand: 100, freeToUse: 80, unit: 'EA' }
    ],

    receipts: [
      {
        id: 'WH/IN/0001',
        from: 'Vendor (Jindal Steel)',
        to: 'WH/Stock1',
        contact: 'Azure Interior',
        scheduleDate: '2026-12-01',
        status: 'Ready',
        items: [{ productId: 'PRD-1', name: 'Desk', quantity: 10 }],
        responsible: 'Rahul Sharma'
      },
      {
        id: 'WH/IN/0002',
        from: 'Vendor (Apex Hardware)',
        to: 'WH/Stock1',
        contact: 'Azure Interior',
        scheduleDate: '2026-12-01',
        status: 'Ready',
        items: [{ productId: 'PRD-2', name: 'Table', quantity: 8 }],
        responsible: 'Rahul Sharma'
      },
      {
        id: 'WH/IN/0003',
        from: 'Supplier Global',
        to: 'WH/Stock1',
        contact: 'Direct Purchase',
        scheduleDate: '2026-12-05',
        status: 'Draft',
        items: [{ productId: 'PRD-4', name: 'Hydraulic Valves 1/2"', quantity: 20 }],
        responsible: 'Rahul Sharma'
      },
      {
        id: 'WH/IN/0004',
        from: 'Precision Fasteners',
        to: 'WH/Stock1',
        contact: 'Standard Order',
        scheduleDate: '2026-11-20',
        status: 'Done',
        items: [{ productId: 'PRD-5', name: 'Hex Bolts M8 x 40mm', quantity: 500 }],
        responsible: 'Priya Patel'
      }
    ],

    deliveries: [
      {
        id: 'WH/OUT/0001',
        from: 'WH/Stock1',
        to: 'Azure Interior (Customer)',
        contact: 'Azure Interior',
        deliveryAddress: '24 Silicon Tower, Sector 5',
        scheduleDate: '2026-12-01',
        status: 'Ready',
        operationType: 'Standard Delivery',
        items: [{ productId: 'PRD-1', name: 'Desk', quantity: 5 }],
        responsible: 'Amit Shah'
      },
      {
        id: 'WH/OUT/0002',
        from: 'WH/Stock1',
        to: 'Metro Workspace',
        contact: 'Metro Workspace',
        deliveryAddress: 'Terminal 1 Plaza',
        scheduleDate: '2026-12-02',
        status: 'Ready',
        operationType: 'Express Dispatch',
        items: [{ productId: 'PRD-3', name: 'Office Chair', quantity: 6 }],
        responsible: 'Amit Shah'
      },
      {
        id: 'WH/OUT/0003',
        from: 'WH/Stock1',
        to: 'Matrix Heavy Eng',
        contact: 'Matrix Eng',
        deliveryAddress: 'Industrial Zone West',
        scheduleDate: '2026-12-04',
        status: 'Waiting',
        operationType: 'Standard Delivery',
        items: [{ productId: 'PRD-4', name: 'Hydraulic Valves 1/2"', quantity: 4 }],
        responsible: 'Amit Shah'
      }
    ],

    moveHistory: [
      {
        reference: 'WH/IN/0001',
        date: '12/1/2026',
        contact: 'Azure Interior',
        from: 'vendor',
        to: 'WH/Stock1',
        productName: 'Desk',
        quantity: 10,
        type: 'in', // in, out, internal
        status: 'Done'
      },
      {
        reference: 'WH/OUT/0002',
        date: '12/1/2026',
        contact: 'Azure Interior',
        from: 'WH/Stock1',
        to: 'vendor',
        productName: 'Table',
        quantity: 8,
        type: 'out',
        status: 'Done'
      },
      {
        reference: 'WH/OUT/0003',
        date: '12/1/2026',
        contact: 'Azure Interior',
        from: 'WH/Stock2',
        to: 'vendor',
        productName: 'Office Chair',
        quantity: 4,
        type: 'out',
        status: 'Done'
      },
      {
        reference: 'WH/INT/0001',
        date: '12/1/2026',
        contact: 'Internal Logistics',
        from: 'WH/Stock1',
        to: 'WH/Stock2',
        productName: 'Desk',
        quantity: 2,
        type: 'internal',
        status: 'Done'
      }
    ]
  };

  // --- Utility Functions ---
  function formatCurrency(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="material-symbols-outlined" style="font-size:1.15rem; color:#38bdf8;">info</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // --- Rendering Engines ---

  // 1. Dashboard View
  function renderDashboard() {
    const totalStock = state.products.reduce((acc, p) => acc + p.onHand, 0);
    const totalValuation = state.products.reduce((acc, p) => acc + (p.onHand * p.cost), 0);
    const readyReceipts = state.receipts.filter(r => r.status === 'Ready').length;
    const readyDeliveries = state.deliveries.filter(d => d.status === 'Ready').length;
    const lowStockCount = state.products.filter(p => p.onHand <= 10).length;

    return `
      <div class="page-header">
        <div class="header-title-block">
          <h1>Stock Operations Command</h1>
          <p>Real-time inventory ledger, receipt processing, and outbound delivery stream</p>
        </div>
        <div class="header-actions">
          <div class="segmented-control">
            <button class="segment-btn ${state.userRole === 'manager' ? 'active' : ''}" onclick="window.StockSense.setRole('manager')">Manager View</button>
            <button class="segment-btn ${state.userRole === 'staff' ? 'active' : ''}" onclick="window.StockSense.setRole('staff')">Staff View</button>
          </div>
          <button class="btn btn-secondary" onclick="window.StockSense.openModal('receipt')">
            <span class="material-symbols-outlined text-[1.125rem]">call_received</span>
            <span>Receive Stock</span>
          </button>
          <button class="btn btn-primary" onclick="window.StockSense.openModal('delivery')">
            <span class="material-symbols-outlined text-[1.125rem]">local_shipping</span>
            <span>New Delivery</span>
          </button>
        </div>
      </div>

      <!-- Core KPI Strip -->
      <div class="metrics-strip">
        <div class="metric-card">
          <div class="metric-card-top">
            <span class="metric-label">Total Stock Units</span>
            <div class="metric-icon-wrap blue"><span class="material-symbols-outlined">inventory_2</span></div>
          </div>
          <div class="metric-value-row">
            <span class="metric-number">${totalStock.toLocaleString()}</span>
            <span class="metric-unit">Units</span>
          </div>
          <div class="metric-badge-row">
            <span class="badge badge-emerald"><span class="badge-dot"></span> Active Mesh</span>
            <span style="color:var(--text-muted); font-size:0.75rem;">Across ${state.warehouses.length} Warehouses</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-card-top">
            <span class="metric-label">Inventory Valuation</span>
            <div class="metric-icon-wrap green"><span class="material-symbols-outlined">payments</span></div>
          </div>
          <div class="metric-value-row">
            <span class="metric-number">${formatCurrency(totalValuation)}</span>
          </div>
          <div class="metric-badge-row">
            <span class="badge badge-neutral"><span class="badge-dot"></span> Cost Basis</span>
            <span style="color:var(--text-muted); font-size:0.75rem;">Reconciled Live</span>
          </div>
        </div>

        <div class="metric-card" style="cursor:pointer;" onclick="window.StockSense.navigate('receipts')">
          <div class="metric-card-top">
            <span class="metric-label">Inbound Receipts</span>
            <div class="metric-icon-wrap amber"><span class="material-symbols-outlined">call_received</span></div>
          </div>
          <div class="metric-value-row">
            <span class="metric-number">${readyReceipts}</span>
            <span class="metric-unit">Ready to Receive</span>
          </div>
          <div class="metric-badge-row">
            <span class="badge badge-amber"><span class="badge-dot"></span> In Progress</span>
            <span style="color:var(--text-muted); font-size:0.75rem;">Click to process</span>
          </div>
        </div>

        <div class="metric-card" style="cursor:pointer;" onclick="window.StockSense.navigate('deliveries')">
          <div class="metric-card-top">
            <span class="metric-label">Outbound Deliveries</span>
            <div class="metric-icon-wrap red"><span class="material-symbols-outlined">local_shipping</span></div>
          </div>
          <div class="metric-value-row">
            <span class="metric-number">${readyDeliveries}</span>
            <span class="metric-unit">To Deliver</span>
          </div>
          <div class="metric-badge-row">
            <span class="badge badge-crimson"><span class="badge-dot"></span> Dispatch Ready</span>
            <span style="color:var(--text-muted); font-size:0.75rem;">Fulfillment queue</span>
          </div>
        </div>
      </div>

      <!-- Quick Odoo-Style Operation Hub Cards -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        <!-- Inbound Card -->
        <div class="metric-card" style="background:linear-gradient(to bottom right, var(--bg-card), var(--bg-subtle));">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                <span class="material-symbols-outlined" style="color:var(--brand-primary)">move_to_inbox</span>
                <h3 style="font-size:1.1rem; font-weight:600;">Receipts (Inbound)</h3>
              </div>
              <p style="font-size:0.8125rem; color:var(--text-muted);">Vendor consignments & warehouse intake</p>
            </div>
            <span class="badge badge-blue">${readyReceipts} To Receive</span>
          </div>
          <div style="display:flex; gap:0.75rem; margin-top:auto;">
            <button class="btn btn-primary" style="flex:1;" onclick="window.StockSense.navigate('receipts')">View Receipts</button>
            <button class="btn btn-secondary" onclick="window.StockSense.openModal('receipt')">+ Inbound</button>
          </div>
        </div>

        <!-- Outbound Card -->
        <div class="metric-card" style="background:linear-gradient(to bottom right, var(--bg-card), var(--bg-subtle));">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                <span class="material-symbols-outlined" style="color:var(--success)">local_shipping</span>
                <h3 style="font-size:1.1rem; font-weight:600;">Deliveries (Outbound)</h3>
              </div>
              <p style="font-size:0.8125rem; color:var(--text-muted);">Customer orders & shipments ready to stage</p>
            </div>
            <span class="badge badge-emerald">${readyDeliveries} To Deliver</span>
          </div>
          <div style="display:flex; gap:0.75rem; margin-top:auto;">
            <button class="btn btn-primary" style="flex:1;" onclick="window.StockSense.navigate('deliveries')">View Deliveries</button>
            <button class="btn btn-secondary" onclick="window.StockSense.openModal('delivery')">+ Delivery</button>
          </div>
        </div>

        <!-- Internal Transfer Card -->
        <div class="metric-card" style="background:linear-gradient(to bottom right, var(--bg-card), var(--bg-subtle));">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                <span class="material-symbols-outlined" style="color:var(--warning)">multiple_stop</span>
                <h3 style="font-size:1.1rem; font-weight:600;">Internal Transfers</h3>
              </div>
              <p style="font-size:0.8125rem; color:var(--text-muted);">Inter-warehouse stock rebalancing</p>
            </div>
            <span class="badge badge-amber">Active</span>
          </div>
          <div style="display:flex; gap:0.75rem; margin-top:auto;">
            <button class="btn btn-primary" style="flex:1;" onclick="window.StockSense.navigate('transfers')">View Transfers</button>
            <button class="btn btn-secondary" onclick="window.StockSense.openModal('transfer')">+ Transfer</button>
          </div>
        </div>
      </div>

      <!-- Recent Stock Ledger Trace -->
      <div class="table-card">
        <div class="table-header-block">
          <div>
            <div class="table-title">Recent Stock Movement Log</div>
            <div class="table-subtitle">Audited double-entry ledger stream</div>
          </div>
          <button class="btn btn-secondary" onclick="window.StockSense.navigate('ledger')">
            <span>View Full Ledger</span>
            <span class="material-symbols-outlined text-[1rem]">arrow_forward</span>
          </button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Contact</th>
                <th>From</th>
                <th>To</th>
                <th>Product</th>
                <th style="text-align:right;">Quantity</th>
                <th style="text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${state.moveHistory.slice(0, 4).map(item => `
                <tr onclick="window.StockSense.inspectMovement('${item.reference}')">
                  <td class="cell-mono cell-primary">${item.reference}</td>
                  <td class="cell-sub">${item.date}</td>
                  <td>${item.contact}</td>
                  <td class="cell-sub">${item.from}</td>
                  <td class="cell-sub font-semibold" style="color:var(--brand-primary);">${item.to}</td>
                  <td class="cell-primary">${item.productName}</td>
                  <td style="text-align:right;" class="cell-mono font-bold ${item.type === 'in' ? 'text-emerald-500' : item.type === 'out' ? 'text-red-500' : ''}">
                    ${item.type === 'in' ? '+' : item.type === 'out' ? '-' : ''}${item.quantity}
                  </td>
                  <td style="text-align:center;">
                    <span class="badge ${item.status === 'Done' ? 'badge-emerald' : 'badge-neutral'}">${item.status}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 2. Products View (With Live In-place Stock Editing as required in problem statement)
  function renderProducts() {
    const filtered = state.products.filter(p => {
      const q = state.searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });

    return `
      <div class="page-header">
        <div class="header-title-block">
          <h1>Product Inventory & Stock Management</h1>
          <p>Product unit cost, physical on-hand quantity, and unreserved free-to-use balance</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" onclick="window.StockSense.exportProductsCSV()">
            <span class="material-symbols-outlined text-[1.125rem]">download</span>
            <span>Export CSV</span>
          </button>
          <button class="btn btn-primary" onclick="window.StockSense.openModal('addProduct')">
            <span class="material-symbols-outlined text-[1.125rem]">add</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div class="filter-toolbar">
        <div class="filter-group">
          <div class="search-container" style="max-width:320px;">
            <span class="material-symbols-outlined search-icon">search</span>
            <input type="text" class="search-input" placeholder="Search product name or SKU..." value="${state.searchQuery}" oninput="window.StockSense.setSearch(this.value)" />
          </div>
        </div>
        <div style="font-size:0.8125rem; color:var(--text-muted);">
          Showing <strong>${filtered.length}</strong> of ${state.products.length} registered products
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Per Unit Cost</th>
                <th>On Hand</th>
                <th>Free to Use</th>
                <th style="text-align:center;">Stock Level</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(p => `
                <tr>
                  <td>
                    <div class="cell-primary">${p.name}</div>
                    <div class="cell-sub">${p.category}</div>
                  </td>
                  <td class="cell-mono cell-sub">${p.sku}</td>
                  <td class="cell-mono font-semibold">${formatCurrency(p.cost)}</td>
                  <td>
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                      <button class="btn btn-icon" style="width:28px; height:28px;" onclick="window.StockSense.updateStock('${p.id}', -1)" title="Decrease stock">−</button>
                      <span class="cell-mono font-bold" style="font-size:1rem; min-width:36px; text-align:center;">${p.onHand}</span>
                      <button class="btn btn-icon" style="width:28px; height:28px;" onclick="window.StockSense.updateStock('${p.id}', 1)" title="Increase stock">+</button>
                    </div>
                  </td>
                  <td class="cell-mono font-semibold" style="color:var(--brand-primary);">${p.freeToUse} ${p.unit}</td>
                  <td style="text-align:center;">
                    ${p.onHand <= 10 
                      ? `<span class="badge badge-crimson"><span class="badge-dot"></span> Low Stock</span>`
                      : `<span class="badge badge-emerald"><span class="badge-dot"></span> Healthy</span>`
                    }
                  </td>
                  <td style="text-align:right;">
                    <button class="btn btn-subtle" onclick="window.StockSense.quickAdjustPrompt('${p.id}')">
                      <span class="material-symbols-outlined text-[1rem]">tune</span>
                      <span>Update</span>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 3. Receipts View (List / Kanban Mode + Validation Workflow)
  function renderReceipts() {
    const list = state.receipts;

    return `
      <div class="page-header">
        <div class="header-title-block">
          <h1>Inbound Receipts</h1>
          <p>Schedule, verify, and validate goods arriving from vendors into warehouse locations</p>
        </div>
        <div class="header-actions">
          <div class="segmented-control">
            <button class="segment-btn ${!state.kanbanMode ? 'active' : ''}" onclick="window.StockSense.setKanban(false)">
              <span class="material-symbols-outlined text-[1rem] align-middle">view_list</span> List
            </button>
            <button class="segment-btn ${state.kanbanMode ? 'active' : ''}" onclick="window.StockSense.setKanban(true)">
              <span class="material-symbols-outlined text-[1rem] align-middle">view_kanban</span> Kanban
            </button>
          </div>
          <button class="btn btn-primary" onclick="window.StockSense.openModal('receipt')">
            <span class="material-symbols-outlined text-[1.125rem]">add</span>
            <span>New Receipt</span>
          </button>
        </div>
      </div>

      ${!state.kanbanMode ? `
        <div class="table-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Contact</th>
                  <th>Schedule Date</th>
                  <th style="text-align:center;">Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(r => `
                  <tr>
                    <td class="cell-mono cell-primary">${r.id}</td>
                    <td>${r.from}</td>
                    <td class="font-semibold" style="color:var(--brand-primary);">${r.to}</td>
                    <td>${r.contact}</td>
                    <td class="cell-mono cell-sub">${r.scheduleDate}</td>
                    <td style="text-align:center;">
                      <span class="badge ${r.status === 'Done' ? 'badge-emerald' : r.status === 'Ready' ? 'badge-blue' : 'badge-neutral'}">
                        ${r.status}
                      </span>
                    </td>
                    <td style="text-align:right;">
                      ${r.status === 'Draft' ? `
                        <button class="btn btn-secondary" onclick="window.StockSense.advanceReceipt('${r.id}', 'Ready')">Mark Ready</button>
                      ` : r.status === 'Ready' ? `
                        <button class="btn btn-primary" onclick="window.StockSense.advanceReceipt('${r.id}', 'Done')">Validate</button>
                      ` : `
                        <button class="btn btn-subtle" onclick="window.StockSense.printReceipt('${r.id}')">Print</button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <div class="kanban-grid">
          <div class="kanban-column">
            <div class="kanban-col-header">
              <span class="kanban-col-title">Draft</span>
              <span class="kanban-count">${list.filter(x => x.status === 'Draft').length}</span>
            </div>
            ${list.filter(x => x.status === 'Draft').map(r => `
              <div class="kanban-card" onclick="window.StockSense.advanceReceipt('${r.id}', 'Ready')">
                <div class="kanban-card-ref">
                  <span class="cell-mono font-bold">${r.id}</span>
                  <span class="badge badge-neutral">Draft</span>
                </div>
                <div class="kanban-card-title">${r.from}</div>
                <div class="kanban-card-meta">
                  <span>To: ${r.to}</span>
                  <span>${r.scheduleDate}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="kanban-column">
            <div class="kanban-col-header">
              <span class="kanban-col-title">Ready</span>
              <span class="kanban-count">${list.filter(x => x.status === 'Ready').length}</span>
            </div>
            ${list.filter(x => x.status === 'Ready').map(r => `
              <div class="kanban-card" style="border-left: 3px solid var(--brand-primary);" onclick="window.StockSense.advanceReceipt('${r.id}', 'Done')">
                <div class="kanban-card-ref">
                  <span class="cell-mono font-bold">${r.id}</span>
                  <span class="badge badge-blue">Ready</span>
                </div>
                <div class="kanban-card-title">${r.from}</div>
                <div class="kanban-card-meta">
                  <span>To: ${r.to}</span>
                  <span>${r.scheduleDate}</span>
                </div>
                <button class="btn btn-primary" style="margin-top:0.5rem;" onclick="event.stopPropagation(); window.StockSense.advanceReceipt('${r.id}', 'Done')">Validate Inbound</button>
              </div>
            `).join('')}
          </div>

          <div class="kanban-column">
            <div class="kanban-col-header">
              <span class="kanban-col-title">Done / Received</span>
              <span class="kanban-count">${list.filter(x => x.status === 'Done').length}</span>
            </div>
            ${list.filter(x => x.status === 'Done').map(r => `
              <div class="kanban-card" style="border-left: 3px solid var(--success);">
                <div class="kanban-card-ref">
                  <span class="cell-mono font-bold">${r.id}</span>
                  <span class="badge badge-emerald">Done</span>
                </div>
                <div class="kanban-card-title">${r.from}</div>
                <div class="kanban-card-meta">
                  <span>To: ${r.to}</span>
                  <span>${r.scheduleDate}</span>
                </div>
                <button class="btn btn-subtle" style="margin-top:0.5rem;" onclick="window.StockSense.printReceipt('${r.id}')">Print Movement Slip</button>
              </div>
            `).join('')}
          </div>
        </div>
      `}
    `;
  }

  // 4. Delivery Orders View (List / Kanban Mode)
  function renderDeliveries() {
    const list = state.deliveries;

    return `
      <div class="page-header">
        <div class="header-title-block">
          <h1>Delivery Orders (Outbound)</h1>
          <p>Customer dispatch pipeline with stock reservation and delivery order validation</p>
        </div>
        <div class="header-actions">
          <div class="segmented-control">
            <button class="segment-btn ${!state.kanbanMode ? 'active' : ''}" onclick="window.StockSense.setKanban(false)">
              <span class="material-symbols-outlined text-[1rem] align-middle">view_list</span> List
            </button>
            <button class="segment-btn ${state.kanbanMode ? 'active' : ''}" onclick="window.StockSense.setKanban(true)">
              <span class="material-symbols-outlined text-[1rem] align-middle">view_kanban</span> Kanban
            </button>
          </div>
          <button class="btn btn-primary" onclick="window.StockSense.openModal('delivery')">
            <span class="material-symbols-outlined text-[1.125rem]">add</span>
            <span>New Delivery</span>
          </button>
        </div>
      </div>

      ${!state.kanbanMode ? `
        <div class="table-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>From</th>
                  <th>To / Customer</th>
                  <th>Contact</th>
                  <th>Schedule Date</th>
                  <th style="text-align:center;">Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(d => `
                  <tr>
                    <td class="cell-mono cell-primary">${d.id}</td>
                    <td class="cell-sub">${d.from}</td>
                    <td class="font-semibold">${d.to}</td>
                    <td>${d.contact}</td>
                    <td class="cell-mono cell-sub">${d.scheduleDate}</td>
                    <td style="text-align:center;">
                      <span class="badge ${d.status === 'Done' ? 'badge-emerald' : d.status === 'Ready' ? 'badge-blue' : 'badge-amber'}">
                        ${d.status}
                      </span>
                    </td>
                    <td style="text-align:right;">
                      ${d.status === 'Draft' ? `
                        <button class="btn btn-secondary" onclick="window.StockSense.advanceDelivery('${d.id}', 'Ready')">Check Availability</button>
                      ` : d.status === 'Ready' ? `
                        <button class="btn btn-primary" onclick="window.StockSense.advanceDelivery('${d.id}', 'Done')">Validate Dispatch</button>
                      ` : `
                        <button class="btn btn-subtle" onclick="window.StockSense.printReceipt('${d.id}')">Print Slip</button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <div class="kanban-grid">
          <div class="kanban-column">
            <div class="kanban-col-header">
              <span class="kanban-col-title">Waiting / Draft</span>
              <span class="kanban-count">${list.filter(x => x.status === 'Draft' || x.status === 'Waiting').length}</span>
            </div>
            ${list.filter(x => x.status === 'Draft' || x.status === 'Waiting').map(d => `
              <div class="kanban-card">
                <div class="kanban-card-ref">
                  <span class="cell-mono font-bold">${d.id}</span>
                  <span class="badge badge-amber">${d.status}</span>
                </div>
                <div class="kanban-card-title">${d.to}</div>
                <div class="kanban-card-meta">
                  <span>From: ${d.from}</span>
                  <span>${d.scheduleDate}</span>
                </div>
                <button class="btn btn-secondary" style="margin-top:0.5rem;" onclick="window.StockSense.advanceDelivery('${d.id}', 'Ready')">Make Ready</button>
              </div>
            `).join('')}
          </div>

          <div class="kanban-column">
            <div class="kanban-col-header">
              <span class="kanban-col-title">Ready to Deliver</span>
              <span class="kanban-count">${list.filter(x => x.status === 'Ready').length}</span>
            </div>
            ${list.filter(x => x.status === 'Ready').map(d => `
              <div class="kanban-card" style="border-left:3px solid var(--brand-primary);">
                <div class="kanban-card-ref">
                  <span class="cell-mono font-bold">${d.id}</span>
                  <span class="badge badge-blue">Ready</span>
                </div>
                <div class="kanban-card-title">${d.to}</div>
                <div class="kanban-card-meta">
                  <span>${d.deliveryAddress || 'Standard Warehouse Dispatch'}</span>
                </div>
                <button class="btn btn-primary" style="margin-top:0.5rem;" onclick="window.StockSense.advanceDelivery('${d.id}', 'Done')">Validate Dispatch</button>
              </div>
            `).join('')}
          </div>

          <div class="kanban-column">
            <div class="kanban-col-header">
              <span class="kanban-col-title">Done / Shipped</span>
              <span class="kanban-count">${list.filter(x => x.status === 'Done').length}</span>
            </div>
            ${list.filter(x => x.status === 'Done').map(d => `
              <div class="kanban-card" style="border-left:3px solid var(--success);">
                <div class="kanban-card-ref">
                  <span class="cell-mono font-bold">${d.id}</span>
                  <span class="badge badge-emerald">Done</span>
                </div>
                <div class="kanban-card-title">${d.to}</div>
                <div class="kanban-card-meta">
                  <span>Completed</span>
                </div>
                <button class="btn btn-subtle" style="margin-top:0.5rem;" onclick="window.StockSense.printReceipt('${d.id}')">Print Dispatch Note</button>
              </div>
            `).join('')}
          </div>
        </div>
      `}
    `;
  }

  // 5. Stock Move History (Ledger View)
  function renderLedger() {
    return `
      <div class="page-header">
        <div class="header-title-block">
          <h1>Stock Move History & Audit Ledger</h1>
          <p>Chronological trace of all Inbound, Outbound, and Internal Transfers</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" onclick="window.StockSense.exportLedgerCSV()">
            <span class="material-symbols-outlined text-[1.125rem]">download</span>
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Contact</th>
                <th>From Location</th>
                <th>To Location</th>
                <th>Product</th>
                <th style="text-align:right;">Quantity Moved</th>
                <th style="text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${state.moveHistory.map(m => `
                <tr onclick="window.StockSense.inspectMovement('${m.reference}')">
                  <td class="cell-mono cell-primary">${m.reference}</td>
                  <td class="cell-sub">${m.date}</td>
                  <td>${m.contact}</td>
                  <td class="cell-sub">${m.from}</td>
                  <td class="cell-sub font-semibold" style="color:var(--brand-primary);">${m.to}</td>
                  <td class="cell-primary">${m.productName}</td>
                  <td style="text-align:right;" class="cell-mono font-bold ${m.type === 'in' ? 'text-emerald-500' : m.type === 'out' ? 'text-red-500' : ''}">
                    ${m.type === 'in' ? '+' : m.type === 'out' ? '-' : ''}${m.quantity}
                  </td>
                  <td style="text-align:center;">
                    <span class="badge badge-emerald">${m.status}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 6. Warehouses & Locations View
  function renderWarehouses() {
    return `
      <div class="page-header">
        <div class="header-title-block">
          <h1>Warehouses & Physical Locations</h1>
          <p>Central facility definitions, zones, production racks, and dispatch bays</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="window.StockSense.openModal('addWarehouse')">
            <span class="material-symbols-outlined text-[1.125rem]">add</span>
            <span>New Warehouse</span>
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        ${state.warehouses.map(wh => `
          <div class="metric-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
              <div>
                <h3 style="font-size:1.1rem; font-weight:600; color:var(--text-primary);">${wh.name}</h3>
                <span class="cell-mono cell-sub">${wh.shortCode}</span>
              </div>
              <span class="badge badge-blue">Active Hub</span>
            </div>
            <p style="font-size:0.8125rem; color:var(--text-muted); margin-bottom:1rem;">${wh.address}</p>
            <div style="padding-top:0.75rem; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; font-size:0.8125rem;">
              <span style="color:var(--text-muted);">Assigned Zones: 4 Bins</span>
              <span style="color:var(--brand-primary); font-weight:600;">Online Mesh</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Specific Locations Table -->
      <div class="table-card">
        <div class="table-header-block">
          <div>
            <div class="table-title">Internal Locations & Storage Bins</div>
            <div class="table-subtitle">Sub-locations for raw materials, WIP racks, and finished goods</div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Short Code</th>
                <th>Warehouse</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${state.locations.map(loc => `
                <tr>
                  <td class="cell-primary">${loc.name}</td>
                  <td class="cell-mono">${loc.shortCode}</td>
                  <td class="cell-sub">${loc.warehouse}</td>
                  <td><span class="badge badge-emerald">Available</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 7. Auth Page (Login / Sign Up)
  function renderAuth() {
    const isLogin = state.authMode === 'login';
    return `
      <div class="auth-overlay">
        <div class="auth-card">
          <div class="auth-brand-row">
            <div class="brand-badge">S</div>
            <div>
              <div class="auth-title">${isLogin ? 'Welcome Back' : 'Create Account'}</div>
              <div class="auth-subtitle">${isLogin ? 'Enter your credentials to access the StockSense Command Center' : 'Sign up to manage warehouse stock, receipts, and deliveries'}</div>
            </div>
          </div>

          <div class="auth-tabs">
            <button type="button" class="auth-tab-btn ${isLogin ? 'active' : ''}" onclick="window.StockSense.setAuthMode('login')">Sign In</button>
            <button type="button" class="auth-tab-btn ${!isLogin ? 'active' : ''}" onclick="window.StockSense.setAuthMode('signup')">Sign Up</button>
          </div>

          <form class="auth-form" onsubmit="window.StockSense.handleAuthSubmit(event)">
            ${!isLogin ? `
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" id="auth-name" placeholder="e.g. Rahul Sharma" required />
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label">${isLogin ? 'Login ID or Email' : 'Work Email'}</label>
              <input type="email" class="form-input" id="auth-email" placeholder="name@company.com" value="${isLogin ? (state.currentUser?.email || 'rahul.sharma@stocksense.io') : ''}" required />
            </div>

            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <label class="form-label">Password</label>
                ${isLogin ? `<a href="javascript:void(0)" onclick="alert('Password reset instructions sent to your registered email.')" style="font-size:0.75rem; color:var(--brand-primary); text-decoration:none;">Forgot password?</a>` : ''}
              </div>
              <input type="password" class="form-input" id="auth-password" placeholder="••••••••••••" value="${isLogin ? 'password123' : ''}" required />
            </div>

            ${!isLogin ? `
              <div class="form-group">
                <label class="form-label">Role Assignment</label>
                <select class="custom-select" id="auth-role" style="width:100%;">
                  <option value="manager">Warehouse Manager (Full Operational Access)</option>
                  <option value="staff">Staff Operator (Floor Scanning & Moves)</option>
                </select>
              </div>
            ` : ''}

            <button type="submit" class="btn btn-primary" style="width:100%; padding:0.7rem;">
              <span>${isLogin ? 'Sign In to StockSense' : 'Register Account'}</span>
              <span class="material-symbols-outlined text-[1.125rem]">arrow_forward</span>
            </button>

            <div class="auth-helper">
              ${isLogin ? 'Demo account pre-filled with Manager privileges.' : 'Password must contain at least 8 characters.'}
            </div>
          </form>

          <div class="auth-footer-note">
            ${isLogin ? `Don't have an account? <a onclick="window.StockSense.setAuthMode('signup')">Sign up</a>` : `Already registered? <a onclick="window.StockSense.setAuthMode('login')">Sign in</a>`}
          </div>

          ${state.isAuthenticated ? `
            <div style="text-align:center; padding-top:0.5rem; border-top:1px solid var(--border-default);">
              <a href="javascript:void(0)" onclick="window.StockSense.navigate('dashboard')" style="font-size:0.8125rem; color:var(--text-muted); text-decoration:none; display:inline-flex; align-items:center; gap:0.25rem;">
                <span class="material-symbols-outlined" style="font-size:0.95rem;">arrow_back</span>
                <span>Return to Active Dashboard</span>
              </a>
            </div>
          ` : `
            <div style="text-align:center; padding-top:0.5rem; border-top:1px solid var(--border-default);">
              <a href="javascript:void(0)" onclick="window.StockSense.quickDemoLogin('manager')" style="font-size:0.75rem; color:var(--brand-primary); font-weight:600; text-decoration:none; margin:0 0.5rem;">
                Quick Demo: Manager
              </a>
              <span style="color:var(--text-dim); font-size:0.75rem;">•</span>
              <a href="javascript:void(0)" onclick="window.StockSense.quickDemoLogin('staff')" style="font-size:0.75rem; color:var(--brand-primary); font-weight:600; text-decoration:none; margin:0 0.5rem;">
                Quick Demo: Staff
              </a>
            </div>
          `}
        </div>
      </div>
    `;
  }

  // --- Master View Switcher ---
  function render() {
    const mainContainer = document.getElementById('view-container');
    if (!mainContainer) return;

    if (!state.isAuthenticated || state.currentView === 'login') {
      mainContainer.innerHTML = renderAuth();
      const sidebar = document.querySelector('.app-sidebar');
      const topbar = document.querySelector('.app-topbar');
      if (sidebar) sidebar.style.display = 'none';
      if (topbar) topbar.style.display = 'none';
      const mainLayout = document.querySelector('.app-main-layout');
      if (mainLayout) mainLayout.style.marginLeft = '0';
      return;
    } else {
      const sidebar = document.querySelector('.app-sidebar');
      const topbar = document.querySelector('.app-topbar');
      if (sidebar) sidebar.style.display = '';
      if (topbar) topbar.style.display = '';
      const mainLayout = document.querySelector('.app-main-layout');
      if (mainLayout && window.innerWidth > 1024) mainLayout.style.marginLeft = 'var(--sidebar-w)';
    }

    // Update user profile display
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const avatarEl = document.querySelector('.avatar');
    if (userNameEl && state.currentUser) userNameEl.textContent = state.currentUser.name;
    if (userRoleEl && state.currentUser) userRoleEl.textContent = state.currentUser.role;
    if (avatarEl && state.currentUser) {
      const initials = state.currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      avatarEl.textContent = initials || 'US';
    }

    // Highlight sidebar active link
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.getAttribute('data-view') === state.currentView) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    if (state.currentView === 'dashboard') {
      mainContainer.innerHTML = renderDashboard();
    } else if (state.currentView === 'products') {
      mainContainer.innerHTML = renderProducts();
    } else if (state.currentView === 'receipts') {
      mainContainer.innerHTML = renderReceipts();
    } else if (state.currentView === 'deliveries') {
      mainContainer.innerHTML = renderDeliveries();
    } else if (state.currentView === 'transfers') {
      mainContainer.innerHTML = renderReceipts(); // Shares transfer operation
    } else if (state.currentView === 'ledger') {
      mainContainer.innerHTML = renderLedger();
    } else if (state.currentView === 'warehouses') {
      mainContainer.innerHTML = renderWarehouses();
    } else {
      mainContainer.innerHTML = renderDashboard();
    }
  }

  // --- Public API & Interaction Handlers ---
  window.StockSense = {
    navigate: function (view) {
      state.currentView = view;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      render();
    },

    setRole: function (role) {
      state.userRole = role;
      showToast(`Switched to ${role === 'manager' ? 'Manager (Full Command)' : 'Staff (Floor Operator)'} view`);
      render();
    },

    setKanban: function (isKanban) {
      state.kanbanMode = isKanban;
      render();
    },

    setSearch: function (query) {
      state.searchQuery = query;
      render();
    },

    // Stock adjustments on hand
    updateStock: function (productId, delta) {
      const p = state.products.find(x => x.id === productId);
      if (!p) return;
      const newOnHand = Math.max(0, p.onHand + delta);
      const newFree = Math.max(0, p.freeToUse + delta);
      p.onHand = newOnHand;
      p.freeToUse = newFree;

      // Append to Ledger
      state.moveHistory.unshift({
        reference: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString('en-US'),
        contact: 'Floor Count Adjustment',
        from: 'Physical Shelf',
        to: 'WH/Stock1',
        productName: p.name,
        quantity: Math.abs(delta),
        type: delta >= 0 ? 'in' : 'out',
        status: 'Done'
      });

      showToast(`Updated stock for ${p.name}: ${p.onHand} units on hand`);
      render();
    },

    quickAdjustPrompt: function (productId) {
      const p = state.products.find(x => x.id === productId);
      if (!p) return;
      const count = prompt(`Enter new on-hand physical count for ${p.name}:`, p.onHand);
      if (count !== null && !isNaN(count)) {
        const diff = parseInt(count, 10) - p.onHand;
        this.updateStock(productId, diff);
      }
    },

    // Workflow stage progression
    advanceReceipt: function (receiptId, targetStatus) {
      const r = state.receipts.find(x => x.id === receiptId);
      if (!r) return;
      r.status = targetStatus;

      if (targetStatus === 'Done') {
        // Increment actual stock on receipt completion
        r.items.forEach(item => {
          const prod = state.products.find(p => p.id === item.productId || p.name === item.name);
          if (prod) {
            prod.onHand += item.quantity;
            prod.freeToUse += item.quantity;
          }
        });
        state.moveHistory.unshift({
          reference: r.id,
          date: new Date().toLocaleDateString('en-US'),
          contact: r.contact,
          from: r.from,
          to: r.to,
          productName: r.items[0]?.name || 'Consignment Items',
          quantity: r.items[0]?.quantity || 1,
          type: 'in',
          status: 'Done'
        });
        showToast(`Receipt ${r.id} validated! Stock received into ${r.to}`);
      } else {
        showToast(`Receipt ${r.id} marked as ${targetStatus}`);
      }
      render();
    },

    advanceDelivery: function (deliveryId, targetStatus) {
      const d = state.deliveries.find(x => x.id === deliveryId);
      if (!d) return;
      d.status = targetStatus;

      if (targetStatus === 'Done') {
        // Decrement stock upon validation
        d.items.forEach(item => {
          const prod = state.products.find(p => p.id === item.productId || p.name === item.name);
          if (prod) {
            prod.onHand = Math.max(0, prod.onHand - item.quantity);
            prod.freeToUse = Math.max(0, prod.freeToUse - item.quantity);
          }
        });
        state.moveHistory.unshift({
          reference: d.id,
          date: new Date().toLocaleDateString('en-US'),
          contact: d.contact,
          from: d.from,
          to: d.to,
          productName: d.items[0]?.name || 'Outbound Goods',
          quantity: d.items[0]?.quantity || 1,
          type: 'out',
          status: 'Done'
        });
        showToast(`Delivery ${d.id} validated! Stock dispatched from ${d.from}`);
      } else {
        showToast(`Delivery ${d.id} is now ${targetStatus}`);
      }
      render();
    },

    printReceipt: function (ref) {
      showToast(`Generating printable movement slip for ${ref}...`);
      setTimeout(() => window.print(), 300);
    },

    inspectMovement: function (ref) {
      const item = state.moveHistory.find(m => m.reference === ref);
      if (!item) return;
      alert(`Ledger Trace for ${ref}:\nProduct: ${item.productName}\nQuantity: ${item.quantity}\nFrom: ${item.from}\nTo: ${item.to}\nDate: ${item.date}\nStatus: ${item.status}`);
    },

    openModal: function (type) {
      const backdrop = document.getElementById('modal-backdrop');
      const container = document.getElementById('modal-dialog-container');
      if (!backdrop || !container) return;

      if (type === 'receipt') {
        container.innerHTML = `
          <div class="modal-header">
            <h2 class="modal-title">Create Inbound Stock Receipt</h2>
            <button class="btn btn-icon" onclick="window.StockSense.closeModal()"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form onsubmit="window.StockSense.submitNewReceipt(event)">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Vendor / Source</label>
                <input class="form-input" id="rcpt-vendor" required placeholder="e.g. Jindal Steel Ltd" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Destination Warehouse</label>
                  <select class="custom-select" id="rcpt-dest" style="width:100%;">
                    <option value="WH/Stock1">Main Store (WH/Stock1)</option>
                    <option value="WH/Stock2">Production Rack (WH/Stock2)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Schedule Date</label>
                  <input type="date" class="form-input" id="rcpt-date" value="${new Date().toISOString().slice(0, 10)}" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Product</label>
                  <select class="custom-select" id="rcpt-product" style="width:100%;">
                    ${state.products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Quantity</label>
                  <input type="number" min="1" class="form-input" id="rcpt-qty" value="10" required />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="window.StockSense.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Receipt</button>
            </div>
          </form>
        `;
      } else if (type === 'delivery') {
        container.innerHTML = `
          <div class="modal-header">
            <h2 class="modal-title">Create Outbound Delivery Order</h2>
            <button class="btn btn-icon" onclick="window.StockSense.closeModal()"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form onsubmit="window.StockSense.submitNewDelivery(event)">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Customer / Recipient</label>
                <input class="form-input" id="del-customer" required placeholder="e.g. Azure Interior" />
              </div>
              <div class="form-group">
                <label class="form-label">Delivery Address</label>
                <input class="form-input" id="del-address" required placeholder="e.g. Plot 24, Cyber Park" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Source Warehouse</label>
                  <select class="custom-select" id="del-source" style="width:100%;">
                    <option value="WH/Stock1">Main Store (WH/Stock1)</option>
                    <option value="WH/Stock2">Production Rack (WH/Stock2)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Product</label>
                  <select class="custom-select" id="del-product" style="width:100%;">
                    ${state.products.map(p => `<option value="${p.id}">${p.name} (Available: ${p.freeToUse})</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Quantity to Dispatch</label>
                <input type="number" min="1" class="form-input" id="del-qty" value="5" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="window.StockSense.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Delivery Order</button>
            </div>
          </form>
        `;
      } else if (type === 'addProduct') {
        container.innerHTML = `
          <div class="modal-header">
            <h2 class="modal-title">Add New Product to Catalog</h2>
            <button class="btn btn-icon" onclick="window.StockSense.closeModal()"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form onsubmit="window.StockSense.submitNewProduct(event)">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Product Name</label>
                  <input class="form-input" id="new-prod-name" required placeholder="e.g. Executive Desk" />
                </div>
                <div class="form-group">
                  <label class="form-label">SKU / Code</label>
                  <input class="form-input" id="new-prod-sku" required placeholder="e.g. DSK-EX-01" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <input class="form-input" id="new-prod-cat" required placeholder="e.g. Furniture" />
                </div>
                <div class="form-group">
                  <label class="form-label">Cost Price (₹)</label>
                  <input type="number" class="form-input" id="new-prod-cost" value="2500" required />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Initial Opening Stock</label>
                <input type="number" class="form-input" id="new-prod-stock" value="20" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="window.StockSense.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Product</button>
            </div>
          </form>
        `;
      } else if (type === 'transfer') {
        container.innerHTML = `
          <div class="modal-header">
            <h2 class="modal-title">Create Internal Stock Transfer</h2>
            <button class="btn btn-icon" onclick="window.StockSense.closeModal()"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form onsubmit="window.StockSense.submitTransfer(event)">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Source Location</label>
                  <select class="custom-select" id="tr-from" style="width:100%;">
                    <option value="WH/Stock1">Main Store (WH/Stock1)</option>
                    <option value="WH/Stock2">Production Rack (WH/Stock2)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Destination Location</label>
                  <select class="custom-select" id="tr-to" style="width:100%;">
                    <option value="WH/Stock2">Production Rack (WH/Stock2)</option>
                    <option value="WH/Stock3">Dispatch Bay (WH/Stock3)</option>
                    <option value="WH/Stock1">Main Store (WH/Stock1)</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Product</label>
                  <select class="custom-select" id="tr-product" style="width:100%;">
                    ${state.products.map(p => `<option value="${p.id}">${p.name} (On hand: ${p.onHand})</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Quantity</label>
                  <input type="number" min="1" class="form-input" id="tr-qty" value="5" required />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="window.StockSense.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Execute Transfer</button>
            </div>
          </form>
        `;
      }

      backdrop.classList.add('active');
    },

    closeModal: function () {
      const backdrop = document.getElementById('modal-backdrop');
      if (backdrop) backdrop.classList.remove('active');
    },

    submitNewReceipt: function (e) {
      e.preventDefault();
      const vendor = document.getElementById('rcpt-vendor').value;
      const dest = document.getElementById('rcpt-dest').value;
      const date = document.getElementById('rcpt-date').value;
      const prodId = document.getElementById('rcpt-product').value;
      const qty = parseInt(document.getElementById('rcpt-qty').value, 10);
      const prod = state.products.find(p => p.id === prodId);

      const newId = `WH/IN/${String(state.receipts.length + 1).padStart(4, '0')}`;
      state.receipts.unshift({
        id: newId,
        from: vendor,
        to: dest,
        contact: vendor,
        scheduleDate: date,
        status: 'Ready',
        items: [{ productId: prodId, name: prod ? prod.name : 'Item', quantity: qty }],
        responsible: 'Rahul Sharma'
      });

      this.closeModal();
      showToast(`Created inbound receipt ${newId}`);
      this.navigate('receipts');
    },

    submitNewDelivery: function (e) {
      e.preventDefault();
      const customer = document.getElementById('del-customer').value;
      const address = document.getElementById('del-address').value;
      const source = document.getElementById('del-source').value;
      const prodId = document.getElementById('del-product').value;
      const qty = parseInt(document.getElementById('del-qty').value, 10);
      const prod = state.products.find(p => p.id === prodId);

      const newId = `WH/OUT/${String(state.deliveries.length + 1).padStart(4, '0')}`;
      state.deliveries.unshift({
        id: newId,
        from: source,
        to: customer,
        contact: customer,
        deliveryAddress: address,
        scheduleDate: new Date().toISOString().slice(0, 10),
        status: 'Ready',
        operationType: 'Standard Dispatch',
        items: [{ productId: prodId, name: prod ? prod.name : 'Item', quantity: qty }],
        responsible: 'Amit Shah'
      });

      this.closeModal();
      showToast(`Created delivery order ${newId}`);
      this.navigate('deliveries');
    },

    submitNewProduct: function (e) {
      e.preventDefault();
      const name = document.getElementById('new-prod-name').value;
      const sku = document.getElementById('new-prod-sku').value;
      const cat = document.getElementById('new-prod-cat').value;
      const cost = parseFloat(document.getElementById('new-prod-cost').value);
      const stock = parseInt(document.getElementById('new-prod-stock').value, 10);

      const newProd = {
        id: `PRD-${state.products.length + 1}`,
        name: name,
        sku: sku,
        category: cat,
        cost: cost,
        onHand: stock,
        freeToUse: stock,
        unit: 'Units'
      };
      state.products.push(newProd);

      this.closeModal();
      showToast(`Added product "${name}" to inventory catalog`);
      this.navigate('products');
    },

    submitTransfer: function (e) {
      e.preventDefault();
      const from = document.getElementById('tr-from').value;
      const to = document.getElementById('tr-to').value;
      const prodId = document.getElementById('tr-product').value;
      const qty = parseInt(document.getElementById('tr-qty').value, 10);
      const prod = state.products.find(p => p.id === prodId);

      const ref = `WH/INT/${String(state.moveHistory.length + 1).padStart(4, '0')}`;
      state.moveHistory.unshift({
        reference: ref,
        date: new Date().toLocaleDateString('en-US'),
        contact: 'Internal Logistics Rebalance',
        from: from,
        to: to,
        productName: prod ? prod.name : 'Component',
        quantity: qty,
        type: 'internal',
        status: 'Done'
      });

      this.closeModal();
      showToast(`Transferred ${qty} units of ${prod ? prod.name : 'product'} from ${from} to ${to}`);
      this.navigate('ledger');
    },

    exportProductsCSV: function () {
      let csv = 'Product Name,SKU,Category,Cost,On Hand,Free to Use\n';
      state.products.forEach(p => {
        csv += `"${p.name}","${p.sku}","${p.category}",${p.cost},${p.onHand},${p.freeToUse}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stocksense_catalog_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      showToast('Catalog CSV exported successfully');
    },

    exportLedgerCSV: function () {
      let csv = 'Reference,Date,Contact,From,To,Product,Quantity,Status\n';
      state.moveHistory.forEach(m => {
        csv += `"${m.reference}","${m.date}","${m.contact}","${m.from}","${m.to}","${m.productName}",${m.quantity},"${m.status}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stocksense_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      showToast('Audit ledger CSV exported successfully');
    },

    toggleTheme: function () {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      showToast(`Switched to ${isDark ? 'Dark' : 'Light'} appearance`);
    },

    toggleMobileMenu: function () {
      const sidebar = document.querySelector('.app-sidebar');
      if (sidebar) sidebar.classList.toggle('mobile-open');
    },

    setAuthMode: function (mode) {
      state.authMode = mode;
      render();
    },

    handleAuthSubmit: function (e) {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const isLogin = state.authMode === 'login';
      
      let name = 'User';
      let role = 'Inventory Manager';
      if (!isLogin) {
        const nameInput = document.getElementById('auth-name');
        name = nameInput ? nameInput.value : 'Rahul Sharma';
        const roleInput = document.getElementById('auth-role');
        role = roleInput && roleInput.value === 'staff' ? 'Staff Operator' : 'Inventory Manager';
      } else {
        name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
        role = state.userRole === 'staff' ? 'Staff Operator' : 'Inventory Manager';
      }

      state.isAuthenticated = true;
      state.currentUser = { name: name, email: email, role: role };
      state.currentView = 'dashboard';
      showToast(`Welcome ${name}! Authenticated successfully.`);
      render();
    },

    signOut: function () {
      state.isAuthenticated = false;
      state.currentView = 'login';
      state.authMode = 'login';
      showToast('Signed out of StockSense session');
      render();
    },

    quickDemoLogin: function (roleType) {
      state.isAuthenticated = true;
      state.currentView = 'dashboard';
      if (roleType === 'staff') {
        state.userRole = 'staff';
        state.currentUser = { name: 'Pooja Verma', email: 'pooja.v@stocksense.io', role: 'Staff Operator' };
        showToast('Signed in as Staff Operator (Floor Operations)');
      } else {
        state.userRole = 'manager';
        state.currentUser = { name: 'Rahul Sharma', email: 'rahul.sharma@stocksense.io', role: 'Inventory Manager' };
        showToast('Signed in as Inventory Manager (Full Command)');
      }
      render();
    }
  };

  // Keyboard Shortcuts (F2 search, Escape modal)
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.StockSense.closeModal();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const s = document.querySelector('.search-input');
      if (s) s.focus();
    }
  });

  // Restore Theme
  if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }

  // Initial Load
  document.addEventListener('DOMContentLoaded', function () {
    render();
  });
})();
