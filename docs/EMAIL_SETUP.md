# Email Setup Guide 📧

Configure email sending for invitations and notifications.

---

## Option 1: Gmail SMTP (Easiest for Development)

### Step 1: Enable App Password in Gmail

1. Go to Google Account: https://myaccount.google.com
2. Security → 2-Step Verification (enable if not already)
3. Security → App passwords
4. Create new app password for "10x PM"
5. Copy the 16-character password

### Step 2: Add to .env

```bash
# Email Configuration
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your-16-char-app-password

EMAIL_FROM=your.email@gmail.com
EMAIL_FROM_NAME=10x PM
```

### Step 3: Restart Services

```bash
docker compose restart server
```

### Step 4: Test

Send an invitation → Email will be sent to the recipient!

**Limits:** 500 emails/day (Gmail free tier)

---

## Option 2: SendGrid (Best for Production)

### Step 1: Sign Up

1. Go to https://sendgrid.com
2. Sign up (100 free emails/day forever!)
3. Verify email
4. Create API key

### Step 2: Add to .env

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-api-key-here

EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=10x PM
```

### Step 3: Verify Domain (Optional)

For production, verify your domain in SendGrid to avoid spam folder.

### Step 4: Restart

```bash
docker compose restart server
```

**Limits:** 100 emails/day (free), unlimited (paid)

---

## Option 3: AWS SES (Enterprise)

### Step 1: AWS Setup

1. Go to AWS Console → SES
2. Verify email address or domain
3. Request production access (starts in sandbox)
4. Create IAM credentials

### Step 2: Add to .env

```bash
EMAIL_PROVIDER=aws_ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=10x PM
```

### Step 3: Restart

```bash
docker compose restart server
```

**Limits:** 62,000 free emails/month, then $0.10 per 1,000

---

## Testing Email

### Without Configuration (Development)

If SMTP not configured:
- Invitation still created in database ✅
- Email not sent ❌
- Invite link logged to console ✅

**Get link from database:**
```sql
SELECT email, invite_link, status
FROM archon_invitations
ORDER BY created_at DESC
LIMIT 1;
```

Copy the link and test directly!

### With Configuration (Production)

Email will be sent automatically when invitation is created!

---

## Email Template Preview

**Subject:** You're invited to join [Organization] on 10x PM

**Body:**
```
Hi there!

[Inviter Name] has invited you to join [Organization] as a [Role].

"[Personal Message]"

[Accept Invitation Button]

This invitation expires in 7 days.
```

---

## Troubleshooting

**Email not sending?**
1. Check logs: `docker compose logs server | grep "email\|invitation"`
2. Verify SMTP credentials in .env
3. Check Gmail app password is correct
4. Ensure port 587 is not blocked

**Emails going to spam?**
1. Verify domain with SendGrid/SES
2. Add SPF/DKIM records to DNS
3. Use professional "from" address

**Rate limits hit?**
1. Gmail: 500/day → Upgrade to SendGrid
2. SendGrid free: 100/day → Add payment method
3. AWS SES: Request limit increase

---

## Current Status

✅ Email service implemented
✅ 3 providers supported (SMTP, SendGrid, AWS SES)
✅ HTML + text email templates
✅ Automatic sending on invitation

**Need:** Add SMTP credentials to use email sending!

**Or:** Use invite links from database for now.
