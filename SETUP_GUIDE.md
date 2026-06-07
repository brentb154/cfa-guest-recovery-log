# H.E.A.R.D. Log — Setup Guide

This guide takes you from zero to a working guest-recovery log in about **15 minutes**. No coding experience needed — you'll copy and paste a few things and click some buttons. Follow the steps in order.

You'll set up three things:
1. A **Google Sheet** to hold the data
2. The **Apps Script backend** that reads and writes to that sheet
3. The **frontend** (`index.html`) that your managers actually use

---

## Before You Start

Download these two files from this project:
- **`Code.gs`** — the backend
- **`index.html`** — the app your team uses

You'll also need a Google account that can create Google Sheets (your CFA Google Workspace account is perfect).

---

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and click **Blank spreadsheet**.
2. Rename it something clear, like **"H.E.A.R.D. Log Data"** (click the title at top-left).
3. Leave the default tab named **`Sheet1`**. (If yours is named something else, that's fine — you'll match it in Step 3.)

You don't need to add any column headers — the setup function does that for you in Step 3.

---

## Step 2 — Get the Sheet ID

The Sheet ID is the long code in the sheet's web address. Look at the URL in your browser:

```
https://docs.google.com/spreadsheets/d/1AbC...XyZ/edit#gid=0
                                        └──────┬──────┘
                                          this part
```

1. Copy everything between `/d/` and the next `/`.
2. Keep it handy — you'll paste it in the next step.

---

## Step 3 — Set Up the Backend (Apps Script)

1. In your Google Sheet, click **Extensions ▸ Apps Script**. A new tab opens with a code editor.
2. Delete any starter code in the `Code.gs` file shown there (usually an empty `myFunction`).
3. Open the **`Code.gs`** file from this project, **select all, copy**, and **paste** it into the Apps Script editor.
4. Near the top, find this line:
   ```js
   const SHEET_ID = 'YOUR_SHEET_ID';
   ```
   Replace `YOUR_SHEET_ID` with the ID you copied in Step 2. Keep the quotes:
   ```js
   const SHEET_ID = '1AbC...XyZ';
   ```
5. If your tab is **not** named `Sheet1`, also update:
   ```js
   const SHEET_NAME = 'Sheet1';
   ```
6. Click the **💾 Save** icon.

### Now run the one-click setup

7. At the top of the editor, find the function dropdown (it may say `doGet`). Change it to **`runFirstTimeSetup`**.
8. Click **▶ Run**.
9. The first time, Google asks for permission:
   - Click **Review permissions**
   - Choose your Google account
   - You may see "Google hasn't verified this app" — click **Advanced ▸ Go to (project name)**
   - Click **Allow**
10. After it runs, click **Execution log** at the bottom. You should see:
    ```
    H.E.A.R.D. Log setup complete.
    Data tab    : Sheet1  (already existed)
    Headers     : written
    Alert emails: initialized
    ```

`runFirstTimeSetup` is **safe to run again** anytime — it never overwrites or deletes existing data. It just makes sure the data tab, header row, and alert storage all exist.

---

## Step 4 — Deploy the Backend as a Web App

This gives your backend a web address the app can talk to.

1. In the Apps Script editor, click **Deploy ▸ New deployment** (top-right).
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description:** `HEARD Log` (anything works)
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**  ← important, or the app can't reach it
4. Click **Deploy**.
5. Copy the **Web app URL**. It looks like:
   ```
   https://script.google.com/macros/s/AKfy.../exec
   ```
   Keep it — you'll paste it in the next step.

> **Updating later:** If you ever change `Code.gs`, click **Deploy ▸ Manage deployments ▸ ✏️ Edit ▸ Version: New version ▸ Deploy** to push the change. The URL stays the same.

---

## Step 5 — Configure the Frontend

1. Open **`index.html`** in a plain text editor (TextEdit on Mac, Notepad on Windows, or VS Code).
2. Find this line near the top of the script section:
   ```js
   const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL';
   ```
   Replace `YOUR_APPS_SCRIPT_URL` with the Web app URL from Step 4. Keep the quotes.

3. Set your two passcodes. Find:
   ```js
   if (passcode === 'YOUR_LOGIN_PASSCODE') {
   ```
   Change `YOUR_LOGIN_PASSCODE` to the 4-digit code your **team** will use to log in (e.g. `'1234'`). Keep the quotes.

4. Find:
   ```js
   if (settingsPasscode === 'YOUR_SETTINGS_PASSCODE') {
   ```
   Change `YOUR_SETTINGS_PASSCODE` to a **different** 4-digit code only **managers** know — this protects the email-alert settings (e.g. `'5678'`). Keep the quotes.

5. Paste your **API token**. Find:
   ```js
   const API_TOKEN = 'YOUR_API_TOKEN';
   ```
   Replace `YOUR_API_TOKEN` with the token that `runFirstTimeSetup` printed in the execution log back in Step 3 (a long string of letters and numbers). Keep the quotes. **This must match exactly** — it's the shared secret that stops anyone with your web-app URL from reading or changing your guest data. If you lost it, just re-run `runFirstTimeSetup` and look at the log again.

6. **Save** the file.

---

## Step 6 — Use It

1. **Double-click `index.html`** to open it in any browser, or host it (see options below).
2. Enter your **login passcode** from Step 5.
3. Log a test complaint:
   - Type a phone number
   - Fill the required fields (marked with *)
   - Click **Submit Complaint**
4. Open your Google Sheet — you should see the row appear. 🎉

That's it. The app is live.

---

## Where to Put `index.html` So Your Team Can Reach It

Pick whichever fits your team:

| Option | Best for | How |
|--------|----------|-----|
| **Local file** | One device | Double-click `index.html`. Bookmark it. |
| **Tablet home screen** | A dedicated front-counter tablet | Open the file in the browser, then "Add to Home Screen." |
| **Google Drive** | Quick sharing | Upload `index.html`, open with a preview/host add-on. |
| **GitHub Pages** | A permanent link | Host it in a repo with Pages enabled (this project already lives on the Cockrell Hill Tech site). |

---

## Email Alerts for Repeat Complainers

1. In the app, open **⚙️ Settings** and enter your **settings passcode** (Step 5).
2. Add the email addresses that should be notified when a guest crosses the repeat-complaint threshold.
3. Addresses are stored on the backend (in Script Properties), so they persist for everyone — not just your device.

---

## How the Repeat-Complainer Flags Work

When you enter a phone number, the backend looks at that guest's history:

- **Yellow badge** — 2 complaints in the last 30 days (the one you're logging makes 3)
- **Red badge** — 3+ complaints in the last 30 days

Tap a badge to see the guest's recent history. The phone lookup scans the last **60 days** of records.

---

## Troubleshooting

**"Set SHEET_ID at the top of this file before running setup."**
You ran `runFirstTimeSetup` before pasting your Sheet ID in Step 3. Paste it, save, and run again.

**App opens but data won't load / submit fails**
- Double-check `APPS_SCRIPT_URL` in `index.html` exactly matches the URL from Step 4 (it must end in `/exec`, not `/dev`).
- Re-confirm the deployment's **Who has access** is set to **Anyone** (Step 4).
- After any change to `Code.gs`, redeploy a **New version** (see the note in Step 4).

**"Google hasn't verified this app"**
Normal for personal scripts. Click **Advanced ▸ Go to (project) ▸ Allow**. It's your own script.

**Rows appear in the sheet but columns look shifted**
Make sure the header row matches the `HEADERS` list in `Code.gs`. Re-running `runFirstTimeSetup` on an **empty** sheet rewrites them correctly. (It won't touch a sheet that already has data — clear the tab first if you need a clean reset.)

**Wrong tab**
The `SHEET_NAME` in `Code.gs` must exactly match your tab name, including capitalization.

---

## Quick Reference

| What | Where |
|------|-------|
| Sheet ID | `Code.gs` → `SHEET_ID` |
| Tab name | `Code.gs` → `SHEET_NAME` |
| One-click setup | `Code.gs` → run `runFirstTimeSetup` |
| Web app URL | `index.html` → `APPS_SCRIPT_URL` |
| API token | `index.html` → `API_TOKEN` (must match the token from `runFirstTimeSetup`) |
| Login passcode | `index.html` → `YOUR_LOGIN_PASSCODE` |
| Settings passcode | `index.html` → `YOUR_SETTINGS_PASSCODE` |
| Alert emails | App ▸ Settings (stored on backend) |

> **Note on security:** the login/settings passcodes are convenience locks in the browser only. The **API token** is what actually protects your data — without a matching token, the backend rejects every read and write. Keep it private, and don't commit your real token to a public repo.

---
Built with care for Cockrell Hill Chick-fil-A
