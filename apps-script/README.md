# Sending Nyumba sign-ups to a Google Sheet

The sign-up form in `index.html` posts each lead to a small Google Apps Script
web app (`Code.gs`), which adds a row to a Google Sheet. It's free and takes
about 5 minutes to set up.

## 1. Create the sheet and script
1. Create a new Google Sheet (e.g. "Nyumba Leads").
2. In the sheet, open **Extensions → Apps Script**.
3. Delete what's in `Code.gs` and paste in the contents of [`Code.gs`](Code.gs).
4. Optional: put your email address in `NOTIFY_EMAIL` to get an email for every new lead.
5. Click **Save**.

## 2. Deploy it as a web app
1. Click **Deploy → New deployment**, then the gear icon → **Web app**.
2. Set **Execute as:** *Me* and **Who has access:** *Anyone*.
3. Click **Deploy** and approve the permissions. Google will warn that the app
   isn't verified. That's expected for your own script: choose
   **Advanced → Go to (project name)**.
4. Copy the **Web app URL**. It ends in `/exec`.

To check it works, open that URL in your browser. You should see
`{"ok":true,"service":"nyumba-leads"}`.

## 3. Connect the page
In `index.html`, find this line and paste your URL between the quotes:

```js
const SHEET_ENDPOINT = "";
```

Submit the form once. A **Leads** tab with headers and your test row should
appear in the sheet.

## Notes
- **After editing `Code.gs`**, go to **Deploy → Manage deployments → Edit →
  Version: New version** so the change goes live. This keeps the same URL.
- **The URL is public.** Anyone who has it can post to it. The script checks
  every field again, ignores bots that fill the hidden "website" field, and
  stops spreadsheet formulas from being written into cells.
- **What the page can confirm.** Browsers can't read the script's reply from
  another site, so the page shows "success" once the request reaches Google.
  It shows an error only if the request can't be sent at all (for example,
  when the visitor is offline).
- **If `SHEET_ENDPOINT` is empty**, leads are only saved in the visitor's own
  browser, as before, and a warning appears in the browser console.
