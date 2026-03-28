# NOA Cafe — Admin-enabled GitHub Pages Site

This project adds an **Admin Panel** + a **Google Apps Script** backend so you can:

- Manage **categories** (create/update/delete, ordering, active toggle)
- Manage **menu items** (BN/EN names, price, ordering, special, image URL, active)
- Update **site settings**: name, motto, logo URL, address, currency, delivery charge, WhatsApp number
- Control **share preview** (Open Graph/Twitter) *values* (stored in Sheet) and copy ready-made meta tags
- See **Orders** (filter by date) and a **Dashboard** (daily/weekly/monthly/custom clicks, orders, revenue, top items)

> Frontend still lives on **GitHub Pages** (static). Menu + settings are loaded from **Google Sheets** via Apps Script. Orders + click events are logged to the same Sheet.

## Structure
```
noa-cafe-admin/
├─ index.html        # Customer-facing site (loads menu+config from Apps Script)
├─ admin.html        # Admin panel (CRUD + dashboard)
└─ apps-script/
   └─ Code.gs        # Google Apps Script backend (REST-like)
```

---
## 1) Google Sheet & Apps Script setup

1. Create a new Google Sheet. Add **these sheets** (tabs):
   - `Config` (leave empty; script will create header)
   - `Categories` (header row): `id, nameBn, nameEn, order, isActive`
   - `Items` (header row): `id, catId, nameBn, nameEn, price, order, special, imageUrl, isActive`
   - `Orders` (leave empty; script will create header)
   - `Events` (leave empty; script will create header)

2. In the Sheet: **Extensions → Apps Script** → paste the code from `apps-script/Code.gs`.

3. **Project Settings** → Timezone: `Asia/Dhaka`.

4. In Apps Script editor: **Project Settings → Script properties** → add `ADMIN_TOKEN` with a long random value (e.g., from a password generator).

5. **Deploy → New deployment** → Type: **Web app**
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Deploy → Copy the Web App URL (ends with `/exec`).

> ⚠️ Write operations (admin CRUD) require the `ADMIN_TOKEN`. The public site uses only GET endpoints and does not need the token.

---
## 2) Configure the Frontend (index.html)

Open `index.html` and set at the top:
```js
const CONFIG = {
  SHEETS_WEBAPP_URL: "https://script.google.com/macros/s/XXXX/exec",
  WHATSAPP_NUMBER: "+8801XXXXXXXXX", // optional
  DELIVERY_CHARGE: 50
};
```
The site will fetch **config** and **menu** from the Sheet and render dynamically. Orders are saved to the `Orders` sheet and return `NOA-YYMMDDXX` order IDs.

---
## 3) Admin Panel (admin.html)

Open `admin.html` in a browser (or host alongside index.html on GitHub Pages):
1. Paste the **Web App URL**.
2. Paste the **ADMIN TOKEN** you set in Script Properties.
3. Use tabs to manage Settings, Categories, Items. Save changes → immediately available on the public site (refresh to see).
4. Dashboard: select a range (Today / 7d / 30d / custom) → see orders, revenue, clicks, and top items.

**OG/Twitter meta control:** Save desired values in Settings. Click **"মেটা ট্যাগ কপি"** to copy tags and paste into `<head>` of `index.html`. (Static meta is required for rich social sharing on GitHub Pages.)

### Standalone mode (no backend URL)
- Leave **Web App URL** empty in `admin.html`.
- The admin panel will save Config/Categories/Items locally in browser `localStorage` (`NOA_STANDALONE_DATA`).
- `index.html` will automatically load the same local data if no Web App URL is set.
- Orders and add-to-cart events are also stored locally and shown in Admin Orders/Dashboard.
- This is ideal for a quick standalone deployment (e.g., Vercel) without Google Sheets.

---
## 4) Deploy on GitHub Pages

1. Create a repository (e.g., `noa-cafe-admin`).
2. Upload `index.html`, `admin.html`, and `apps-script/Code.gs` (Code.gs is just for reference; it runs in Apps Script, not GitHub).
3. Settings → Pages → Deploy from branch (main / root).
4. Visit:
   - Customer site: `https://<username>.github.io/noa-cafe-admin/`
   - Admin: `https://<username>.github.io/noa-cafe-admin/admin.html`

> For security: the Admin uses a **token**. Keep the URL private. For stronger protection, you can restrict Apps Script by using a reverse proxy that checks Google Sign-In, or host Admin on Netlify with password protection.

---
## 5) Notes
- **Order ID:** `NOA-YYMMDDXX` generated server-side (Apps Script), with local fallback.
- **Analytics (clicks):** Every `+ যোগ` click logs `add_to_cart` events to the `Events` sheet.
- **Currency/Delivery:** Controlled via `Config` sheet (admin settings).
- **Images:** Use your own URLs. If an image fails, a fallback image is used.

Enjoy! 🚀
