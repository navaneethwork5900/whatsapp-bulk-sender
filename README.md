# Cloudflare WhatsApp Bulk Sender

## Deploy Steps

1. Upload this project to GitHub

2. Go to Cloudflare Pages:
https://pages.cloudflare.com/

3. Create Project

4. Connect GitHub Repo

5. Build Settings:
Framework preset: None
Build command: Leave Empty
Build output directory: /

6. After deployment:
Settings → Environment Variables

Add:
WHATSAPP_TOKEN = YOUR_TOKEN
PHONE_NUMBER_ID = YOUR_PHONE_NUMBER_ID
ADMIN_EMAIL = your-admin@email.com
ADMIN_PASSWORD = your-secure-password

7. Redeploy

### If it still does not work after adding variables

Cloudflare Pages does **not** always apply newly added secrets to already-running deployments.

1. Go to **Deployments** and trigger a **new production deploy**.
2. Confirm `PHONE_NUMBER_ID` is the numeric WhatsApp sender phone number ID (not your business account ID).
3. Confirm `WHATSAPP_TOKEN` is a valid Meta Graph API token with WhatsApp message permissions.
4. Confirm KV binding name is exactly `MESSAGE_COUNTS` under **Settings → Bindings → Pages Functions**.

`/api/send` now returns clear setup errors for missing vars, invalid reset time, or missing KV binding.

If `ADMIN_EMAIL` or `ADMIN_PASSWORD` is missing, `/api/login` will return:
`Server credentials are not configured...`

---

## Excel Format

Your Excel file must contain:

mobile
919629223941
919876543210

Column name must be:
mobile

---

## API Endpoint

Cloudflare automatically creates:
 /api/send

No separate backend deployment needed.
