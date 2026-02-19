# OpenClaw – Telegram Setup Guide

Connect OpenClaw to Telegram so you can chat with your AI assistant from any device.

---

## Prerequisites

- A Telegram account
- A terminal (Linux / macOS / WSL)
- `curl` and `bash` available

---

## Step 1 – Create a Telegram Bot

1. Open Telegram and search for **@BotFather**.
2. Start a chat and send `/newbot`.
3. Follow the prompts (choose a display name and a username ending in `bot`).
4. BotFather will reply with an **API token** that looks like:

   ```
   1234567890:ABCDefGHIjklMNOpqrSTUvwxYZ
   ```

5. Copy and keep this token – you will need it in Step 3.

> **Tip:** Optionally send `/setprivacy` to BotFather and choose **Disable** if you
> want the bot to see all messages in group chats (not just those that mention it).

---

## Step 2 – Install OpenClaw

Run the one-liner installer in your terminal:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

The installer detects your OS and places the `openclaw` binary on your PATH.
Verify the installation:

```bash
openclaw --version
```

---

## Step 3 – Configure the Telegram Channel

### Option A – Interactive wizard (easiest)

```bash
openclaw channels add telegram
```

Paste your bot token when prompted. OpenClaw writes the config for you.

### Option B – Edit config manually

1. Copy the template from this repository:

   ```bash
   mkdir -p ~/.config/openclaw
   cp openclaw.config.jsonc ~/.config/openclaw/openclaw.config.jsonc
   ```

2. Open `~/.config/openclaw/openclaw.config.jsonc` in your editor and replace
   `YOUR_TELEGRAM_BOT_TOKEN_HERE` with the token from BotFather.

### Option C – Environment variable

Export the token before starting the gateway:

```bash
export TELEGRAM_BOT_TOKEN="1234567890:ABCDefGHIjklMNOpqrSTUvwxYZ"
openclaw gateway
```

---

## Step 4 – Start the Gateway

```bash
openclaw gateway
```

Leave this terminal open. The gateway connects your bot to Telegram.

---

## Step 5 – Pair Your Telegram Account

1. Open Telegram, find your new bot by its username, and send `/start`.
2. The bot replies with a **6-character pairing code** (e.g. `XK9M2P`).
3. In a **new terminal**, approve the code:

   ```bash
   openclaw pairing approve telegram XK9M2P
   ```

You are now paired. Send any message to the bot and it will reply.

---

## Quick-Start Alternative

The `setup-openclaw.sh` script in this repository combines Steps 2–5 into a
single guided flow:

```bash
chmod +x setup-openclaw.sh
./setup-openclaw.sh
```

---

## Useful Commands

| Command | Description |
|---|---|
| `openclaw gateway` | Start the message gateway |
| `openclaw channels list` | Show configured channels |
| `openclaw pairing list telegram` | List pending pairing requests |
| `openclaw pairing approve telegram <CODE>` | Approve a pairing request |
| `openclaw config get channels.telegram` | View current Telegram config |
| `openclaw config set channels.telegram.dmPolicy open` | Allow anyone (use carefully) |

---

## Bot Commands (in Telegram)

Once paired, send these commands inside your Telegram chat:

| Command | Description |
|---|---|
| `/help` | List all available commands |
| `/status` | Show model, token usage, system health |
| `/model` | Switch AI model interactively |
| `/reset` | Clear conversation context |

---

## Troubleshooting

**Bot does not respond**
- Confirm the gateway is running (`openclaw gateway`).
- Check the token in your config (`openclaw config get channels.telegram.botToken`).
- Make sure you completed the pairing step.

**"Pairing code expired"**
- Codes expire after 1 hour. Send `/start` again to get a new code.

**Bot ignores group messages**
- By default `requireMention: true`. Mention the bot by username, e.g. `@mybot Hello`.
- Or set `requireMention: false` in the config.

**"Forbidden" errors from Telegram API**
- Double-check the bot token – even a single wrong character causes this error.
- Make sure the bot has not been deleted or revoked in BotFather.

---

## References

- [OpenClaw Telegram docs](https://docs.openclaw.ai/channels/telegram)
- [OpenClaw full documentation](https://docs.openclaw.ai)
- [Telegram BotFather](https://t.me/BotFather)
