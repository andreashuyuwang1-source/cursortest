#!/usr/bin/env bash
# setup-openclaw.sh
# Installs OpenClaw and guides through Telegram channel setup

set -e

echo "=== OpenClaw + Telegram Setup ==="
echo ""

# ── 1. Install OpenClaw ────────────────────────────────────────────────────────
if command -v openclaw &>/dev/null; then
  echo "[✓] OpenClaw is already installed: $(openclaw --version 2>/dev/null || echo 'version unknown')"
else
  echo "[1/4] Installing OpenClaw..."
  curl -fsSL https://openclaw.ai/install.sh | bash
  # Reload PATH so the newly installed binary is available in this shell session
  export PATH="$HOME/.local/bin:$HOME/bin:$PATH"
  echo "[✓] OpenClaw installed successfully."
fi

echo ""

# ── 2. Copy config template if no config exists ────────────────────────────────
CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.config/openclaw}"
CONFIG_FILE="$CONFIG_DIR/openclaw.config.jsonc"

mkdir -p "$CONFIG_DIR"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "[2/4] Copying Telegram config template to $CONFIG_FILE ..."
  cp "$(dirname "$0")/openclaw.config.jsonc" "$CONFIG_FILE"
  echo "[✓] Config template copied."
  echo ""
  echo "  *** ACTION REQUIRED ***"
  echo "  Edit $CONFIG_FILE and replace YOUR_TELEGRAM_BOT_TOKEN_HERE"
  echo "  with the token you received from @BotFather on Telegram."
  echo ""
  read -rp "  Press Enter once you have updated the config file, or Ctrl-C to exit..."
else
  echo "[2/4] Existing config found at $CONFIG_FILE – skipping template copy."
  echo "      Make sure 'channels.telegram.botToken' is set to your bot token."
  echo ""
fi

# ── 3. Start the gateway ───────────────────────────────────────────────────────
echo "[3/4] Starting OpenClaw gateway (this will run in the foreground)."
echo "      In a separate terminal, run the pairing step below."
echo ""
echo "  PAIRING STEPS:"
echo "  a) Open Telegram and start a chat with your bot."
echo "  b) Send /start – the bot will reply with a 6-character pairing code."
echo "  c) In a new terminal run:"
echo "       openclaw pairing approve telegram <CODE>"
echo ""
echo "  Press Ctrl-C in THIS terminal to stop the gateway when you are done."
echo ""

openclaw gateway

# ── 4. Done ────────────────────────────────────────────────────────────────────
echo ""
echo "[4/4] Gateway stopped. Your Telegram bot is configured."
echo "      Run 'openclaw gateway' any time to bring it back online."
