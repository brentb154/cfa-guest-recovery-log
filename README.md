# H.E.A.R.D. Log — Guest Recovery Log

A guest-complaint and recovery tracking tool for Chick-fil-A. Front-of-house leaders log every guest issue in seconds from a phone or tablet, the system automatically flags repeat complainers, and managers get a live dashboard of trends and resolutions — all backed by a single Google Sheet.

> **H.E.A.R.D.** is the CFA guest-recovery mindset: **H**ear them, **E**mpathize, **A**pologize, **R**esolve, and make sure they're **D**elighted. This tool is the record-keeping layer behind that conversation.

**Live menu:** [Cockrell Hill Tech Projects](https://brentb154.github.io/Brent-Chick-fil-A-Tech-Projects)

---

## What Problem Does This Solve?

Guest complaints at a busy location get handled in the moment and then forgotten. There's no shared record, so nobody notices when the *same* guest calls in three times in a month, when one daypart generates most of the issues, or when "free item" is being handed out more than it should. Paper logs and one-off texts don't aggregate.

This tool gives every manager one fast place to:

- **Log a complaint in under a minute** — phone, guest name, order details, issue type, resolution, notes, daypart, and which manager handled it.
- **Catch repeat complainers automatically** — the moment you type a phone number, it checks the last 60 days and shows a badge if that guest already has a history.
- **See the whole picture** — a dashboard with total complaints, flagged guests, and trends, plus a searchable, editable log.
- **Alert leadership** — configurable email alerts when a guest crosses the repeat-complaint threshold.

---

## How It Works (Architecture)

Two pieces, talking over a single web-app URL:

| Piece | File | What it is |
|-------|------|------------|
| **Frontend** | `index.html` | A self-contained React app (loaded from CDN, no build step). Open it in any browser, host it anywhere — GitHub Pages, Drive, a tablet's home screen. |
| **Backend** | `Code.gs` | A Google Apps Script web app bound to your Google Sheet. Handles all reads/writes and stores the data. |
| **Data** | Google Sheet | One tab (`Sheet1`) is the database. Columns are created automatically on first submit. |

```
Manager's browser  ──►  index.html (React)  ──►  Apps Script web app (Code.gs)  ──►  Google Sheet
                                                          │
                                                          └──►  Email alerts (repeat complainers)
```

The frontend never touches the sheet directly — everything goes through the Apps Script URL, so the sheet stays private and only your deployed endpoint can read or write it.

---

## Features

**Logging**
- One-tap complaint form with required-field validation
- Order type: Dine-in, Drive-thru, Mobile Order, Delivery, Catering
- Issue type: Missing Item, Wrong Item, Food Quality, Service Issue, Wait Time, Cleanliness, Other
- Resolution: Refund, Replacement, Free Item, Apology Only, No Resolution
- Daypart: Breakfast, Lunch, Dinner
- Free-apology-dessert checkbox, manager name, date occurred

**Repeat-complainer detection**
- Live phone lookup against the last 60 days as you type
- **Yellow badge:** guest has 2 complaints in 30 days (this one makes 3)
- **Red badge:** guest has 3+ complaints in 30 days
- Tap the badge to see that guest's full history

**Dashboard & log**
- Totals, flagged-guest count, and trends
- Searchable, filterable log (search one field or all fields)
- Edit, delete, and mark-resolved on any entry

**Settings (passcode-protected)**
- Manage the email list for repeat-complainer alerts
- Configurable archive window

**Resilience**
- Offline mode: complaints are saved locally and submit automatically when the connection returns
- Retry-on-failure for flaky network conditions

---

## Setup

This tool needs a Google Sheet, an Apps Script deployment, and two passcodes set in the code. It takes about 15 minutes.

**➡️ Follow the step-by-step [SETUP_GUIDE.md](SETUP_GUIDE.md).** It walks through every screen with no assumed technical knowledge.

Quick version for the impatient:
1. Make a Google Sheet, copy its ID into `Code.gs`.
2. Paste `Code.gs` into the sheet's Apps Script editor and deploy it as a web app.
3. Paste the deployment URL into `index.html`.
4. Set your login and settings passcodes in `index.html`.
5. Open `index.html` and log your first complaint.

---

## Files in This Project

| File | What it is |
|------|------------|
| `index.html` | The full frontend app — open this in a browser to use the tool |
| `Code.gs` | The Google Apps Script backend — paste this into your sheet's script editor |
| `SETUP_GUIDE.md` | Detailed, screen-by-screen setup instructions |
| `README.md` | This file |

---
Built with care for Cockrell Hill Chick-fil-A
