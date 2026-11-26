/**
 * Nyumba lead capture — receives sign-ups from index.html and appends them
 * to the "Leads" tab of the Google Sheet this script is bound to.
 *
 * Setup: see apps-script/README.md
 */

// Optional: an address to email on every new lead. Leave "" to turn off.
const NOTIFY_EMAIL = "";

const SHEET_NAME = "Leads";
const HEADERS = ["Received", "Name", "Email", "Phone", "Units", "Plan", "Submitted (client)", "Page"];
const PLANS = ["Starter", "Growth", "Enterprise"];
const UNIT_BANDS = ["1–20", "21–100", "101–500", "500+"];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Honeypot: real visitors never fill this hidden field.
  if (p.website) return json_({ ok: true });

  const lead = {
    name: clean_(p.name, 100),
    email: clean_(p.email, 254),
    phone: clean_(p.phone, 20),
    units: UNIT_BANDS.indexOf(p.units) >= 0 ? p.units : "",
    plan: PLANS.indexOf(p.plan) >= 0 ? p.plan : "",
    at: clean_(p.at, 40),
    page: clean_(p.page, 300),
  };

  // Re-check on the server; the browser check can be bypassed.
  if (lead.name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email) ||
      !/^\+?\d{9,13}$/.test(lead.phone)) {
    return json_({ ok: false, error: "invalid" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // serialise concurrent submissions
  try {
    const sheet = getSheet_();
    sheet.appendRow([new Date(), lead.name, lead.email, lead.phone, lead.units,
                     lead.plan, lead.at, lead.page].map(safe_));
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(NOTIFY_EMAIL, "New Nyumba lead: " + lead.name,
      [lead.name, lead.email, lead.phone, "Units: " + lead.units, "Plan: " + lead.plan].join("\n"));
  }
  return json_({ ok: true });
}

// Lets you open the /exec URL in a browser to check the deployment is live.
function doGet() {
  return json_({ ok: true, service: "nyumba-leads" });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function clean_(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
}

// Stop values like "=HYPERLINK(...)" from being run as spreadsheet formulas.
function safe_(v) {
  return typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
