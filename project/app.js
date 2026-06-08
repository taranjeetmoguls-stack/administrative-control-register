/* ============================================================
   Administrative Control Register — application logic
   ============================================================ */
(function () {
  "use strict";

  const STORE_KEY = "acr_v3_state";
  const PERIOD_KEY = "acr_v3_period";
  let period = localStorage.getItem(PERIOD_KEY) || TODAY.slice(0, 7); // "YYYY-MM"
  let today = new Date(period + "-08T00:00:00"); // as-of reference (8th of the reporting month)

  // ---------- state ----------
  let tasks = loadState();
  let activeTab = "dashboard";
  let search = "";
  let statusFilter = "all";

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // merge saved values onto seed (keeps schema fresh if seed changes)
        return SEED_TASKS.map(seed => {
          const s = saved.find(x => x.id === seed.id);
          return s ? Object.assign({}, seed, s) : Object.assign({}, seed);
        });
      }
    } catch (e) { /* ignore */ }
    return SEED_TASKS.map(t => Object.assign({}, t));
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(tasks)); } catch (e) {}
  }

  // ---------- formatting ----------
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  function money(v) {
    if (v === "" || v == null || isNaN(+v)) return "—";
    return inr.format(+v);
  }
  function num(v) { const n = parseFloat(String(v).replace(/[^0-9.-]/g, "")); return isNaN(n) ? 0 : n; }
  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }
  function daysUntil(iso) {
    if (!iso) return null;
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return null;
    return Math.round((d - today) / 86400000);
  }

  // ---------- status logic ----------
  // effective visual state used for row tint + dashboard buckets
  function effStatus(t) {
    const s = (t.status || "Pending").toLowerCase();
    if (s === "completed") return "completed";
    if (s === "verified") return "verified";
    if (s === "in progress") return "inprogress";
    if (s === "overdue") return "overdue";
    // pending -> derive urgency
    const du = daysUntil(t.dueDate);
    if (du != null && du < 0) return "overdue";
    if (du != null && du <= 7) return "upcoming";
    return "pending";
  }
  function isDone(t) { const e = effStatus(t); return e === "completed" || e === "verified"; }

  const STATUS_OPTS = ["Pending", "In Progress", "Completed", "Verified", "Overdue"];
  function statusClass(s) {
    s = (s || "Pending").toLowerCase();
    if (s === "completed" || s === "verified") return "st-completed";
    if (s === "in progress") return "st-inprogress";
    if (s === "overdue") return "st-overdue";
    return "st-pending";
  }

  // ---------- icons ----------
  const I = {
    total: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    done:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6L9 17l-5-5"/></svg>',
    pend:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    over:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.4 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.4a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>',
    chev:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9l6 6 6-6"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    info:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    bolt:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
  };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  // ============================================================
  //  REGISTER (tab) RENDERING
  // ============================================================
  function tasksForTab(tabId) {
    let list = tasks.filter(t => t.tab === tabId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => (t.name + " " + t.vendor + " " + t.responsible).toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      list = list.filter(t => effStatus(t) === statusFilter);
    }
    return list;
  }

  function diffParts(t) {
    if (t.budget === "" || t.actual === "") return { txt: "—", cls: "zero" };
    const d = num(t.budget) - num(t.actual);
    const cls = d > 0 ? "pos" : d < 0 ? "neg" : "zero";
    const sign = d > 0 ? "+" : "";
    return { txt: sign + inr.format(d), cls };
  }

  function dueCell(t) {
    let badge = "";
    if (!isDone(t)) {
      const du = daysUntil(t.dueDate);
      if (du != null && du < 0) badge = `<div class="due-badge over">Overdue ${Math.abs(du)}d</div>`;
      else if (du != null && du <= 7) badge = `<div class="due-badge up">Due in ${du}d</div>`;
    }
    return `<input class="cell-in date" type="date" data-field="dueDate" data-id="${t.id}" value="${esc(t.dueDate)}">${badge}`;
  }

  const FREQ_OPTS = ["1st Week", "2nd Week", "3rd Week", "4th Week", "Weekly", "Monthly", "Quarterly", "Half-Yearly", "Yearly"];
  function freqSelect(t) {
    const opts = FREQ_OPTS.includes(t.freq) ? FREQ_OPTS : [t.freq, ...FREQ_OPTS];
    const o = opts.map(x => `<option ${x === t.freq ? "selected" : ""}>${esc(x)}</option>`).join("");
    return `<div class="freq-sel"><select data-field="freq" data-id="${t.id}">${o}</select></div>`;
  }

  function statusSelect(t) {
    const opts = STATUS_OPTS.map(o => `<option ${o === t.status ? "selected" : ""}>${o}</option>`).join("");
    return `<div class="status-sel"><select class="${statusClass(t.status)}" data-field="status" data-id="${t.id}">${opts}</select></div>`;
  }

  function taskRow(t) {
    const eff = effStatus(t);
    const d = diffParts(t);
    const amt = (field, ph) => `<input class="cell-in amt" inputmode="numeric" data-field="${field}" data-id="${t.id}" value="${esc(t[field])}" placeholder="${ph}" ${t.isPayment ? "" : "disabled"}>`;
    return `
    <tr class="task" data-id="${t.id}" data-eff="${eff}">
      <td class="sr num">${t.sr || ""}</td>
      <td>
        <div class="taskname">${esc(t.name)}</div>
        <div class="taskvendor">${esc(t.vendor)}</div>
      </td>
      <td>${freqSelect(t)}</td>
      <td>${dueCell(t)}</td>
      <td>${t.isPayment ? amt("budget", "₹ budget") : '<span class="taskvendor">—</span>'}</td>
      <td>${t.isPayment ? amt("actual", "₹ actual") : '<span class="taskvendor">—</span>'}</td>
      <td class="r"><span class="diff ${d.cls}">${d.txt}</span></td>
      <td>${statusSelect(t)}</td>
      <td class="r"><button class="expand-btn" data-expand="${t.id}" aria-label="Details">${I.chev}</button></td>
    </tr>
    <tr class="detail" data-detail="${t.id}"><td colspan="9">${detailPanel(t)}</td></tr>`;
  }

  function fld(t, field, label, opts) {
    opts = opts || {};
    const v = esc(t[field]);
    const cls = opts.mono ? "mono" : "";
    if (opts.type === "textarea")
      return `<div class="field ${opts.full ? "full" : ""}"><label>${label}</label><textarea data-field="${field}" data-id="${t.id}" placeholder="${opts.ph || ""}">${v}</textarea></div>`;
    if (opts.type === "select") {
      const o = opts.options.map(x => `<option ${x === t[field] ? "selected" : ""}>${x}</option>`).join("");
      return `<div class="field"><label>${label}</label><select data-field="${field}" data-id="${t.id}">${o}</select></div>`;
    }
    if (opts.type === "computed")
      return `<div class="field"><label>${label}</label><div class="computed" data-computed="${field}" data-id="${t.id}">${opts.value}</div></div>`;
    return `<div class="field ${opts.full ? "full" : ""}"><label>${label}</label><input class="${cls}" type="${opts.type || "text"}" data-field="${field}" data-id="${t.id}" value="${v}" placeholder="${opts.ph || ""}"></div>`;
  }

  function detailPanel(t) {
    const totalVal = (t.billAmount === "" && t.gst === "") ? "—" : inr.format(num(t.billAmount) + num(t.gst));
    const taskDetails = `
      <div class="detail-group">
        <h4>Task &amp; Approval</h4>
        <div class="fgrid">
          ${fld(t, "responsible", "Responsible Person")}
          ${fld(t, "vendor", "Vendor / Department")}
          ${fld(t, "paymentDate", "Payment Date", { type: "date" })}
          ${fld(t, "refNo", "Reference No.", { mono: true, ph: "REF-…" })}
          ${fld(t, "remarks", "Remarks", { type: "textarea", full: true, ph: "Notes…" })}
        </div>
      </div>`;
    const payment = t.isPayment ? `
      <div class="detail-group">
        <h4>Payment Monitoring</h4>
        <div class="fgrid">
          ${fld(t, "invoiceNo", "Invoice Number", { mono: true, ph: "INV-…" })}
          ${fld(t, "invoiceDate", "Invoice Date", { type: "date" })}
          ${fld(t, "dueDate", "Due Date", { type: "date" })}
          ${fld(t, "billAmount", "Bill Amount (₹)", { mono: true, ph: "0" })}
          ${fld(t, "gst", "GST Amount (₹)", { mono: true, ph: "0" })}
          ${fld(t, "total", "Total Amount (₹)", { type: "computed", value: totalVal })}
          ${fld(t, "paymentMode", "Payment Mode", { type: "select", options: ["", "Bank Transfer", "UPI", "Cheque", "Cash"] })}
          ${fld(t, "txnRef", "Transaction Ref. No.", { mono: true, ph: "TXN-…" })}
          ${fld(t, "approval", "Approval Status", { type: "select", options: ["Pending", "Approved", "Rejected"] })}
          ${fld(t, "doc", "Supporting Doc Attached", { type: "select", options: ["No", "Yes"] })}
        </div>
      </div>` : `
      <div class="detail-group">
        <h4>Compliance</h4>
        <div class="fgrid">
          ${fld(t, "doc", "Supporting Doc Attached", { type: "select", options: ["No", "Yes"] })}
          ${fld(t, "refNo", "Filing / Acknowledgement No.", { mono: true, ph: "ACK-…" })}
        </div>
      </div>`;
    return `<div class="detail-inner">${taskDetails}${payment}</div>`;
  }

  function renderRegister(tabId) {
    const list = tasksForTab(tabId);
    const groups = tabId === "monthly"
      ? [1, 2, 3, 4].map(w => ({ label: WEEK_LABELS[w], items: list.filter(t => t.week === w) }))
      : [{ label: null, items: list }];

    const intro = {
      weekly:    "Recurring expense verification performed every week across all entities.",
      monthly:   "Compliance, payroll follow-ups and utility / mobile bill payments, scheduled by week.",
      quarterly: "Club & facility memberships billed once a quarter.",
      yearly:    "Annual membership renewals.",
    }[tabId];

    let body = "";
    if (!list.length) {
      body = `<tr><td colspan="9"><div class="empty-note">No tasks match the current filter.</div></td></tr>`;
    } else {
      groups.forEach(g => {
        if (!g.items.length) return;
        if (g.label) body += `<tr class="grouprow"><td colspan="9">${g.label}<span class="gcount">${g.items.length} task${g.items.length > 1 ? "s" : ""}</span></td></tr>`;
        body += g.items.map(taskRow).join("");
      });
    }

    return `
      <div class="view-head">
        <div>
          <h2>${TABS.find(x => x.id === tabId).label} Register</h2>
          <div class="desc">${intro}</div>
        </div>
      </div>
      ${filterBar()}
      <div class="tablecard"><div class="tscroll">
        <table class="reg">
          <thead><tr>
            <th>Sr</th><th>Task &amp; Vendor</th><th>Frequency</th><th>Due Date</th>
            <th>Budget</th><th>Actual</th><th class="r">Difference</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div></div>`;
  }

  function filterBar() {
    const filters = [
      ["all", "All"], ["upcoming", "Upcoming"], ["overdue", "Overdue"],
      ["inprogress", "In Progress"], ["pending", "Pending"], ["completed", "Completed"], ["verified", "Verified"],
    ];
    const chips = filters.map(([v, l]) =>
      `<button class="fchip ${statusFilter === v ? "active" : ""}" data-filter="${v}">${l}</button>`).join("");
    return `
      <div class="filterbar">
        <div class="search">${I.search}<input id="searchbox" placeholder="Search tasks, vendors…" value="${esc(search)}"></div>
        <div class="chip-filters">${chips}</div>
      </div>`;
  }

  // ============================================================
  //  DASHBOARD
  // ============================================================
  function renderDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(isDone).length;
    const overdue = tasks.filter(t => effStatus(t) === "overdue").length;
    const inprog = tasks.filter(t => effStatus(t) === "inprogress").length;
    const upcoming = tasks.filter(t => effStatus(t) === "upcoming").length;
    const pending = total - completed - overdue;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    // donut buckets
    const buckets = [
      { key: "done", nm: "Completed / Verified", ct: completed, color: "var(--green)" },
      { key: "prog", nm: "In Progress", ct: inprog, color: "var(--amber-edge)" },
      { key: "up", nm: "Upcoming (≤7 days)", ct: upcoming, color: "var(--blue)" },
      { key: "pend", nm: "Pending", ct: pending - inprog - upcoming, color: "var(--slate)" },
      { key: "over", nm: "Overdue", ct: overdue, color: "var(--red)" },
    ].filter(b => b.ct > 0);

    // conic gradient
    let acc = 0, stops = [];
    buckets.forEach(b => {
      const start = (acc / total) * 360; acc += b.ct;
      const end = (acc / total) * 360;
      stops.push(`${b.color} ${start}deg ${end}deg`);
    });
    const donutBg = stops.length ? `background: conic-gradient(${stops.join(",")});` : "background: var(--line);";
    const legend = buckets.map(b =>
      `<div class="legend-item"><span class="dot" style="background:${b.color}"></span><span class="nm">${b.nm}</span><span class="ct num">${b.ct}</span><span class="pc num">${Math.round((b.ct / total) * 100)}%</span></div>`).join("");

    // completion ring
    const C = 2 * Math.PI * 28;
    const ringDash = `${(pct / 100) * C} ${C}`;

    // upcoming list (next 7 days + overdue), not done
    const soon = tasks
      .filter(t => !isDone(t))
      .map(t => ({ t, du: daysUntil(t.dueDate) }))
      .filter(x => x.du != null && x.du <= 7)
      .sort((a, b) => a.du - b.du);
    const upList = soon.length ? soon.map(({ t, du }) => {
      const over = du < 0;
      const d = new Date(t.dueDate + "T00:00:00");
      return `<div class="up-item ${over ? "over" : "up"}">
        <div class="when"><div class="d num">${d.getDate()}</div><div class="m">${d.toLocaleDateString("en-IN", { month: "short" })}</div></div>
        <div class="info"><div class="nm">${esc(t.name)}</div><div class="meta">${esc(t.vendor)} · ${esc(t.freq)}</div></div>
        <div class="tag">${over ? "Overdue " + Math.abs(du) + "d" : "Due in " + du + "d"}</div>
      </div>`;
    }).join("") : `<div class="up-empty">Nothing due in the next 7 days. 🎉</div>`;

    // financial summary
    const fin = financialSummary();

    const stat = (cls, ico, v, k) =>
      `<div class="card stat"><div class="ico ${ico}">${I[cls === "i-total" ? "total" : cls === "i-done" ? "done" : cls === "i-pend" ? "pend" : "over"]}</div><div class="v">${v}</div><div class="k">${k}</div></div>`;

    return `
      <div class="view-head">
        <div>
          <h2>Management Dashboard</h2>
          <div class="desc">Live summary across all registers · auto-calculated from the data you enter</div>
        </div>
        <div class="legend-strip">
          <span class="ls"><span class="sw" style="background:var(--green)"></span>Completed / Verified</span>
          <span class="ls"><span class="sw" style="background:var(--amber-edge)"></span>In Progress</span>
          <span class="ls"><span class="sw" style="background:var(--red)"></span>Overdue</span>
          <span class="ls"><span class="sw" style="background:var(--blue)"></span>Upcoming due</span>
        </div>
      </div>

      <div class="dash-grid">
        <div class="stat-row">
          ${stat("i-total", "i-total", total, "Total Tasks")}
          ${stat("i-done", "i-done", completed, "Completed")}
          ${stat("i-pend", "i-pend", pending, "Pending")}
          ${stat("i-over", "i-over", overdue, "Overdue")}
          <div class="card stat completion">
            <div style="display:flex;align-items:center;gap:14px">
              <svg class="ring" width="64" height="64" viewBox="0 0 64 64">
                <circle class="bg" cx="32" cy="32" r="28" fill="none" stroke-width="7"/>
                <circle class="fg" cx="32" cy="32" r="28" fill="none" stroke-width="7" stroke-dasharray="${ringDash}"/>
              </svg>
              <div><div class="v">${pct}%</div><div class="k">Completion</div></div>
            </div>
          </div>
        </div>

        <div class="dash-cols">
          <div class="card pad-lg">
            <h3 class="card-title">Status Distribution</h3>
            <p class="card-sub">Across ${total} tracked tasks</p>
            <div class="donut-wrap">
              <div class="donut" style="${donutBg}"><div class="center"><div class="big num">${total}</div><div class="lbl">Tasks</div></div></div>
              <div class="legend">${legend}</div>
            </div>
          </div>
          <div class="card pad-lg">
            <h3 class="card-title">Due in the Next 7 Days</h3>
            <p class="card-sub">${soon.length} task${soon.length === 1 ? "" : "s"} need attention</p>
            <div class="up-list">${upList}</div>
          </div>
        </div>

        <div class="card pad-lg">
          <h3 class="card-title">Financial Summary</h3>
          <p class="card-sub">Budget vs actual by category · variance = budget − actual</p>
          ${fin}
          <div class="fin-note">${I.info}<span>Enter budget &amp; actual amounts in the registers to populate this summary — totals update automatically.</span></div>
        </div>
      </div>`;
  }

  function financialSummary() {
    const rows = FIN_ORDER.map(catKey => {
      const cat = CATEGORIES[catKey];
      const items = tasks.filter(t => t.category === catKey && t.isPayment);
      const budget = items.reduce((s, t) => s + num(t.budget), 0);
      const actual = items.reduce((s, t) => s + num(t.actual), 0);
      return { catKey, cat, budget, actual };
    }).filter(r => tasks.some(t => t.category === r.catKey && t.isPayment));

    const tB = rows.reduce((s, r) => s + r.budget, 0);
    const tA = rows.reduce((s, r) => s + r.actual, 0);

    function varCell(b, a) {
      const v = b - a;
      const cls = v > 0 ? "pos" : v < 0 ? "neg" : "zero";
      const txt = (b === 0 && a === 0) ? "—" : (v > 0 ? "+" : "") + inr.format(v);
      return `<td class="r amt var ${cls}">${txt}</td>`;
    }
    const body = rows.map(r => `
      <tr>
        <td class="cat"><span class="swatch" style="background:${r.cat.color}"></span>${r.cat.label}</td>
        <td class="r amt">${r.budget ? inr.format(r.budget) : "—"}</td>
        <td class="r amt">${r.actual ? inr.format(r.actual) : "—"}</td>
        ${varCell(r.budget, r.actual)}
      </tr>`).join("");

    return `
      <table class="fin">
        <thead><tr><th>Category</th><th class="r">Budget Amount</th><th class="r">Actual Amount</th><th class="r">Variance</th></tr></thead>
        <tbody>
          ${body}
          <tr class="total">
            <td class="cat">Total</td>
            <td class="r amt">${tB ? inr.format(tB) : "—"}</td>
            <td class="r amt">${tA ? inr.format(tA) : "—"}</td>
            ${varCell(tB, tA)}
          </tr>
        </tbody>
      </table>`;
  }

  // ============================================================
  //  SHELL + EVENTS
  // ============================================================
  function renderTabs() {
    const bar = document.getElementById("tabs");
    bar.innerHTML = TABS.map(tab => {
      const cnt = tab.id === "dashboard" ? "" : `<span class="count">${tasks.filter(t => t.tab === tab.id).length}</span>`;
      return `<button class="tab ${activeTab === tab.id ? "active" : ""}" data-tab="${tab.id}">${tab.label}${cnt}</button>`;
    }).join("");
  }

  function renderView() {
    const host = document.getElementById("view");
    host.className = "view active";
    host.innerHTML = activeTab === "dashboard" ? renderDashboard() : renderRegister(activeTab);
  }

  function rerenderDashboardIfActive() {
    if (activeTab === "dashboard") renderView();
  }

  // update a single task row's tint + status select class + due badge
  function refreshRow(id) {
    const t = tasks.find(x => x.id === id);
    const row = document.querySelector(`tr.task[data-id="${id}"]`);
    if (!t || !row) return;
    row.setAttribute("data-eff", effStatus(t));
    const sel = row.querySelector('select[data-field="status"]');
    if (sel) sel.className = statusClass(t.status);
    const dueTd = row.children[3];
    if (dueTd) dueTd.innerHTML = dueCell(t);
  }

  // mirror a value into every input bound to the same field+id (row ↔ detail panel)
  function syncField(id, field, val, except) {
    document.querySelectorAll(`[data-field="${field}"][data-id="${id}"]`).forEach(el => {
      if (el !== except) el.value = val;
    });
  }

  function refreshDiff(id) {
    const t = tasks.find(x => x.id === id);
    const row = document.querySelector(`tr.task[data-id="${id}"]`);
    if (!t || !row) return;
    const d = diffParts(t);
    const cell = row.querySelector(".diff");
    if (cell) { cell.className = "diff " + d.cls; cell.textContent = d.txt; }
  }

  function refreshComputedTotal(id) {
    const t = tasks.find(x => x.id === id);
    const el = document.querySelector(`[data-computed="total"][data-id="${id}"]`);
    if (el) el.textContent = (t.billAmount === "" && t.gst === "") ? "—" : inr.format(num(t.billAmount) + num(t.gst));
  }

  // ---------- event wiring ----------
  function wire() {
    // tab switch
    document.getElementById("tabs").addEventListener("click", e => {
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;
      activeTab = btn.dataset.tab;
      renderTabs(); renderView();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const host = document.getElementById("view");

    // input (text/number/textarea) — live
    host.addEventListener("input", e => {
      const el = e.target;
      if (el.id === "searchbox") { search = el.value; renderView(); const s = document.getElementById("searchbox"); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } return; }
      const field = el.dataset.field, id = el.dataset.id;
      if (!field || !id) return;
      const t = tasks.find(x => x.id === id);
      if (!t) return;
      t[field] = el.value;
      if (field === "budget" || field === "actual") refreshDiff(id);
      if (field === "billAmount" || field === "gst") refreshComputedTotal(id);
      saveState();
    });

    // change (selects, dates) — may affect status/urgency
    host.addEventListener("change", e => {
      const el = e.target;
      const field = el.dataset.field, id = el.dataset.id;
      if (!field || !id) return;
      const t = tasks.find(x => x.id === id);
      if (!t) return;
      t[field] = el.value;
      if (field === "freq") {
        const wk = { "1st Week": 1, "2nd Week": 2, "3rd Week": 3, "4th Week": 4 }[el.value];
        if (wk) t.week = wk;
      }
      saveState();
      if (field === "freq") {
        if (activeTab === "monthly") renderView();
        return;
      }
      if (field === "dueDate") { refreshRow(id); syncField(id, "dueDate", el.value, el); return; }
      if (field === "status") refreshRow(id);
    });

    // expand / collapse + filters (click)
    host.addEventListener("click", e => {
      const exp = e.target.closest("[data-expand]");
      if (exp) {
        const id = exp.dataset.expand;
        const row = document.querySelector(`tr.task[data-id="${id}"]`);
        const det = document.querySelector(`tr.detail[data-detail="${id}"]`);
        row.classList.toggle("open");
        det.classList.toggle("show");
        return;
      }
      const fc = e.target.closest("[data-filter]");
      if (fc) { statusFilter = fc.dataset.filter; renderView(); return; }
    });

    // header actions
    document.getElementById("btn-print").addEventListener("click", () => window.print());
    document.getElementById("btn-reset").addEventListener("click", () => {
      if (confirm("Reset all data back to the seed checklist? Your entered amounts and edits will be cleared.")) {
        localStorage.removeItem(STORE_KEY);
        localStorage.removeItem(PERIOD_KEY);
        tasks = SEED_TASKS.map(t => Object.assign({}, t));
        period = TODAY.slice(0, 7);
        today = new Date(period + "-08T00:00:00");
        updatePeriodUI();
        renderTabs(); renderView();
      }
    });
  }

  // assign Sr numbers per seed order
  SEED_TASKS.forEach((t, i) => { t.sr = i + 1; });
  tasks.forEach(t => { const seed = SEED_TASKS.find(s => s.id === t.id); if (seed) t.sr = seed.sr; });

  // ---------- reporting period ----------
  function daysInMonth(ym) {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  }
  function updatePeriodUI() {
    const inp = document.getElementById("period-input");
    if (inp) inp.value = period;
    const tv = document.getElementById("today-val");
    if (tv) tv.textContent = today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }
  function changePeriod(newPeriod) {
    if (!newPeriod) return;
    period = newPeriod;
    today = new Date(period + "-08T00:00:00");
    localStorage.setItem(PERIOD_KEY, period);
    // roll recurring (monthly + weekly) due dates into the selected month, preserving day-of-month
    const dim = daysInMonth(period);
    tasks.forEach(t => {
      if ((t.tab === "monthly" || t.tab === "weekly") && t.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)) {
        const day = Math.min(parseInt(t.dueDate.slice(8, 10), 10) || 1, dim);
        t.dueDate = period + "-" + String(day).padStart(2, "0");
      }
    });
    saveState();
    updatePeriodUI();
    renderTabs();
    renderView();
  }

  // ---------- boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    updatePeriodUI();
    const inp = document.getElementById("period-input");
    if (inp) inp.addEventListener("change", e => changePeriod(e.target.value));
    renderTabs();
    renderView();
    wire();
  });
})();
