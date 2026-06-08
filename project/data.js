/* ============================================================
   Seed data — task list & statuses from Taran_Checklist_v3.pdf
   Amounts intentionally left blank (template to fill in).
   "Current month" anchored to June 2026.
   ============================================================ */

// Stable "today" for consistent due-date highlighting in the demo.
const TODAY = "2026-06-08";

// Category metadata for the financial roll-up
const CATEGORIES = {
  utility:    { label: "Utility Bills",      color: "oklch(0.56 0.13 255)" },
  mobile:     { label: "Mobile Bills",       color: "oklch(0.62 0.14 200)" },
  membership: { label: "Membership Fees",    color: "oklch(0.58 0.13 300)" },
  software:   { label: "Software Expenses",  color: "oklch(0.62 0.13 155)" },
  promotion:  { label: "Promotion Expenses", color: "oklch(0.70 0.13 55)" },
  admin:      { label: "Back Office / Admin", color: "oklch(0.55 0.02 260)" },
  compliance: { label: "Compliance",         color: "oklch(0.50 0.02 260)" },
};

// helper to build a task with sane defaults
function T(o) {
  return Object.assign({
    vendor: "", category: "admin", responsible: "", isPayment: true,
    budget: "", actual: "", paymentDate: "", refNo: "", remarks: "",
    invoiceNo: "", invoiceDate: "", billAmount: "", gst: "",
    paymentMode: "", txnRef: "", approval: "Pending", doc: "No",
  }, o);
}

const SEED_TASKS = [
  // ---------------- MONTHLY · First Week ----------------
  T({ id: "m1", tab: "monthly", week: 1, freq: "1st Week",
      name: "Tamarind Attendance Verification", vendor: "Tamarind · HR",
      category: "compliance", isPayment: false, responsible: "Taran (Admin)",
      dueDate: "2026-06-05", status: "Verified", remarks: "Completed & Verified" }),
  T({ id: "m2", tab: "monthly", week: 1, freq: "1st Week",
      name: "Tamarind Tourism Data Submission", vendor: "Tamarind · Tourism Dept",
      category: "compliance", isPayment: false, responsible: "Taran (Admin)",
      dueDate: "2026-06-05", status: "Completed", remarks: "Submitted to portal" }),
  T({ id: "m3", tab: "monthly", week: 1, freq: "1st Week",
      name: "C-Form Verification & Compliance Check", vendor: "Tamarind · Front Office",
      category: "compliance", isPayment: false, responsible: "Front Office",
      dueDate: "2026-06-06", status: "Verified", remarks: "All foreign guest C-Forms filed" }),

  // ---------------- MONTHLY · Second Week ----------------
  T({ id: "m4", tab: "monthly", week: 2, freq: "2nd Week",
      name: "Follow-up with Lucis Team — Salary Sheet & Documents", vendor: "Lucis · Payroll",
      category: "compliance", isPayment: false, responsible: "Accounts",
      dueDate: "2026-06-11", status: "Completed", remarks: "Salary sheet & docs received" }),
  T({ id: "m5", tab: "monthly", week: 2, freq: "2nd Week",
      name: "M-8 Gas Bill Payment", vendor: "M-8 · Gas Agency",
      category: "utility", responsible: "Accounts",
      dueDate: "2026-06-12", status: "Completed", remarks: "Paid" }),
  T({ id: "m6", tab: "monthly", week: 2, freq: "2nd Week",
      name: "Ajanta Airtel Mobile Bill Payment", vendor: "Ajanta · Airtel",
      category: "mobile", responsible: "Accounts",
      dueDate: "2026-06-12", status: "Completed", remarks: "Paid" }),
  T({ id: "m7", tab: "monthly", week: 2, freq: "2nd Week",
      name: "Tamarind Airtel Mobile Bill Payment", vendor: "Tamarind · Airtel",
      category: "mobile", responsible: "Accounts",
      dueDate: "2026-06-13", status: "Completed", remarks: "Paid" }),

  // ---------------- MONTHLY · Third Week ----------------
  T({ id: "m8", tab: "monthly", week: 3, freq: "3rd Week",
      name: "Tamarind BSNL Bill Payment", vendor: "Tamarind · BSNL",
      category: "mobile", responsible: "Accounts",
      dueDate: "2026-06-13", status: "Pending", remarks: "Due this week" }),
  T({ id: "m9", tab: "monthly", week: 3, freq: "3rd Week",
      name: "M-8 Internet Bill Payment", vendor: "M-8 · Broadband",
      category: "utility", responsible: "Accounts",
      dueDate: "2026-06-22", status: "Pending", remarks: "" }),
  T({ id: "m10", tab: "monthly", week: 3, freq: "3rd Week",
      name: "Tamarind Vodafone Mobile Bill Payment", vendor: "Tamarind · Vodafone Idea",
      category: "mobile", responsible: "Accounts",
      dueDate: "2026-06-14", status: "Pending", remarks: "Due this week" }),

  // ---------------- MONTHLY · Fourth Week ----------------
  T({ id: "m11", tab: "monthly", week: 4, freq: "4th Week",
      name: "M-8 Electricity Bill Payment", vendor: "M-8 · State Electricity Board",
      category: "utility", responsible: "Accounts",
      dueDate: "2026-06-28", status: "Pending", remarks: "" }),
  T({ id: "m12", tab: "monthly", week: 4, freq: "4th Week",
      name: "M-8 Water Bill Payment", vendor: "M-8 · Municipal Water Dept",
      category: "utility", responsible: "Accounts",
      dueDate: "2026-06-05", status: "Pending", remarks: "Missed cycle — clear immediately" }),

  // ---------------- WEEKLY (recurring expense verification) ----------------
  T({ id: "w1", tab: "weekly", freq: "Weekly",
      name: "Pushp Vihar Back Office — Expense Verification", vendor: "Pushp Vihar · Back Office",
      category: "admin", responsible: "Taran (Admin)",
      dueDate: "2026-06-12", status: "In Progress", remarks: "Reconciling petty cash" }),
  T({ id: "w2", tab: "weekly", freq: "Weekly",
      name: "Marketing & Promotion — Expense Verification", vendor: "Marketing",
      category: "promotion", responsible: "Marketing",
      dueDate: "2026-06-12", status: "Pending", remarks: "" }),
  T({ id: "w3", tab: "weekly", freq: "Weekly",
      name: "Software Subscriptions — Expense Verification", vendor: "IT / SaaS",
      category: "software", responsible: "IT",
      dueDate: "2026-06-12", status: "Completed", remarks: "All renewals confirmed" }),
  T({ id: "w4", tab: "weekly", freq: "Weekly",
      name: "Internet & Utility — Expense Verification", vendor: "Admin",
      category: "utility", responsible: "Accounts",
      dueDate: "2026-06-12", status: "Pending", remarks: "" }),
  T({ id: "w5", tab: "weekly", freq: "Weekly",
      name: "Miscellaneous Administrative — Expense Verification", vendor: "Admin",
      category: "admin", responsible: "Taran (Admin)",
      dueDate: "2026-06-12", status: "Pending", remarks: "" }),

  // ---------------- QUARTERLY ----------------
  T({ id: "q1", tab: "quarterly", freq: "Quarterly",
      name: "Gymkhana Club Membership Payment", vendor: "Gymkhana Club",
      category: "membership", responsible: "Taran (Admin)",
      dueDate: "2026-06-30", status: "In Progress", remarks: "Renewal in progress" }),

  // ---------------- YEARLY ----------------
  T({ id: "y1", tab: "yearly", freq: "Yearly",
      name: "Saket Sports Complex Membership Renewal", vendor: "Saket Sports Complex",
      category: "membership", responsible: "Taran (Admin)",
      dueDate: "2026-07-15", status: "Pending", remarks: "Annual renewal" }),
];

// Order of categories shown in the financial summary
const FIN_ORDER = ["utility", "mobile", "membership", "software", "promotion", "admin"];

// Tabs config
const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "weekly",    label: "Weekly" },
  { id: "monthly",   label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly",    label: "Yearly" },
];

const WEEK_LABELS = { 1: "First Week", 2: "Second Week", 3: "Third Week", 4: "Fourth Week" };
