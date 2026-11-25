# Telegram integration

The Telegram integration connects one bot to a Plane workspace and maps one Telegram group or forum topic to each project. It uses the existing work item activity pipeline for created, state, assignee, comment, and user mention events.

## Setup

1. Set `WEB_URL` to the public HTTPS origin that serves Plane's `/api/` routes. Telegram accepts webhook ports 443, 80, 88, and 8443. It cannot deliver webhooks to a local HTTP URL.
2. Create a bot with [BotFather](https://t.me/BotFather). Its webhook must be unused; Plane will not replace another application's webhook.
3. In workspace **Settings → Integrations**, connect the bot token. The token is encrypted in the database and is not returned by the API. If Telegram's webhook registration times out, use **Register webhook** to retry without reconnecting the bot.
4. Add the bot to a Telegram group. Send `/plane@your_bot_username chat` in the group or desired forum topic to see the chat and topic IDs. Map those IDs to a Plane project in the same settings screen. Addressing the bot by username ensures Telegram delivers the command even when group privacy mode is enabled.
5. Each member can link their own Telegram account from workspace **Settings → General**. The link opens a private chat with the bot and expires after 15 minutes. Use **Refresh status** after returning to Plane.

Members linked to Plane can send `/plane@your_bot_username create <title>` in a mapped chat. `/plane create <title>` also works when Telegram delivers the unqualified command. Replying to a message with that command includes the replied-to text as the work item description. The bot checks current workspace and project membership before creating anything, and applies the project's default assignee when eligible. Project guests cannot create work items unless they are workspace admins, matching the app API's create permission.

Telegram updates are authenticated with Telegram's webhook secret header and deduplicated by update ID. A bot is limited to one Plane workspace because Telegram provides a single webhook per bot. Disconnecting removes the Telegram webhook and its local mappings and links.

## Development validation

Run the focused Django tests with:

```sh
docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/contract/app/test_telegram_integration.py -q
```

The tests mock Telegram's Bot API. A live smoke test still requires a bot, a public HTTPS Plane instance, and a group or forum topic. Mattermost and Rocket.Chat are outside this integration.
