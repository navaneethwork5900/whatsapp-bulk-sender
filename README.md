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

7. Redeploy

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
