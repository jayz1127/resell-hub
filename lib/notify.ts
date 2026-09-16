/**
 * Free push notifications with ZERO signup, via ntfy.sh (a free, open
 * push service). No account, no bot creation — you just pick a secret
 * topic name (like a password for a channel only you know) and:
 *
 *   1. Install the ntfy app (iOS/Android) or open https://ntfy.sh/app
 *      in a browser, and "subscribe" to your topic name.
 *   2. Set NTFY_TOPIC to that same name as a GitHub Actions secret.
 *
 * That's the whole setup — one less account than the original plan.
 * Pick something long and hard to guess (e.g. "joshresell-8f2a1c"),
 * since anyone who knows your topic name can read your notifications —
 * it's not a login, so treat it like a shared secret, not a username.
 */
export async function notify(message: string): Promise<void> {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) {
    console.warn("NTFY_TOPIC not configured, skipping notify:", message);
    return;
  }

  const res = await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    body: message,
  });

  if (!res.ok) {
    console.error("ntfy notify failed:", res.status, await res.text());
  }
}
