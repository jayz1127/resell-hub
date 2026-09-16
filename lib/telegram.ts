/**
 * Free push notifications via a Telegram bot. Create one with @BotFather
 * (2 minutes, see SETUP.md), then set TELEGRAM_BOT_TOKEN and
 * TELEGRAM_CHAT_ID as secrets. This is the fallback that makes a broken
 * or blocked scraper safe: whatever else happens, you get told.
 */
export async function notify(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("Telegram not configured, skipping notify:", message);
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });

  if (!res.ok) {
    console.error("Telegram notify failed:", res.status, await res.text());
  }
}
