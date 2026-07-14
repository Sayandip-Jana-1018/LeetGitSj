/**
 * Notification Service
 *
 * Fires once when a LeetCode credential expires — never per retry.
 * Supports email (via Resend) and Discord webhook.
 */

import { Resend } from "resend";
import { prisma } from "./prisma";

// ============================================================
// Email via Resend
// ============================================================

async function sendEmailNotification(
  toEmail: string,
  username: string,
  appUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[notifications] RESEND_API_KEY not set — skipping email");
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "LeetPush <notifications@leetpush.app>";
  const reconnectUrl = `${appUrl}/dashboard/settings`;

  await resend.emails.send({
    from,
    to: toEmail,
    subject: "⚠️ Your LeetCode sync has stopped — reconnect to keep your streak",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d1117;color:#e6edf3;margin:0;padding:40px 20px;">
        <div style="max-width:520px;margin:0 auto;">
          <div style="background:#161b22;border:1px solid #21262d;border-radius:12px;padding:40px;">
            <div style="width:48px;height:48px;background:#0d9488;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
              <span style="font-size:24px;">⚡</span>
            </div>
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e6edf3;">Your LeetCode session expired</h2>
            <p style="margin:0 0 24px;color:#8b949e;font-size:15px;line-height:1.6;">
              Hey ${username}, your LeetCode connection has expired and syncing has paused.
              Reconnect to keep your GitHub streak alive — it only takes 60 seconds.
            </p>
            <a href="${reconnectUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              Reconnect LeetCode →
            </a>
            <p style="margin:24px 0 0;color:#6e7681;font-size:13px;">
              You'll only receive this email once per session expiry.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ============================================================
// Discord webhook
// ============================================================

async function sendDiscordNotification(
  webhookUrl: string,
  username: string,
  appUrl: string
): Promise<void> {
  const reconnectUrl = `${appUrl}/dashboard/settings`;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: "⚠️ LeetCode session expired — sync paused",
          description: `Hey **${username}**, your LeetCode connection expired and commits have stopped.\n\n[**Reconnect now →**](${reconnectUrl})`,
          color: 0xef4444, // red
          footer: { text: "LeetPush · You'll only get this message once per expiry" },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });
}

// ============================================================
// Main export — fires once on expiry, re-arms after reconnect
// ============================================================

export async function sendExpiryNotification(userId: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://leetpush.app";

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        notifyEmail: true,
        discordWebhookUrl: true,
        notificationSentAt: true,
        leetcodeCredential: { select: { lastVerifiedAt: true, leetcodeUsername: true } },
      },
    });

    if (!user) return;

    // Only fire if we haven't notified since the last successful verification
    const lastVerified = user.leetcodeCredential?.lastVerifiedAt;
    const lastNotified = user.notificationSentAt;
    if (lastNotified && lastVerified && lastNotified > lastVerified) {
      // Already notified for this expiry cycle — skip
      return;
    }

    const displayName =
      user.leetcodeCredential?.leetcodeUsername || user.name || "there";
    const toEmail = user.notifyEmail || user.email;

    const errors: string[] = [];

    // Send email
    if (toEmail) {
      try {
        await sendEmailNotification(toEmail, displayName, appUrl);
      } catch (err) {
        errors.push(`email: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Send Discord webhook (encrypt at rest — decrypt for sending)
    if (user.discordWebhookUrl) {
      try {
        // discordWebhookUrl is stored encrypted; decrypt before use
        const { decrypt } = await import("./encryption");
        const webhookUrl = decrypt(user.discordWebhookUrl);
        await sendDiscordNotification(webhookUrl, displayName, appUrl);
      } catch (err) {
        errors.push(`discord: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Mark notification as sent — prevents re-firing until reconnect + re-expiry
    await prisma.user.update({
      where: { id: userId },
      data: { notificationSentAt: new Date() },
    });

    if (errors.length > 0) {
      console.error(`[notifications] Partial failure for user ${userId}:`, errors);
    }
  } catch (err) {
    // Notification failure must never crash the sync worker
    console.error("[notifications] Failed to send expiry notification:", err);
  }
}
