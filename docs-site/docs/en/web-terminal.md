# Web Terminal (interactive)

Every session comes with an xterm.js-based Web Terminal, at an address like `http://<WEB_EXTERNAL_HOST>:<port>`.

![Web Terminal](https://magic-builder.tos-cn-beijing.volces.com/uploads/1780033301701_web_terminal.gif)

## Two kinds of links

| Link | Source | Capability |
|------|------|------|
| **Read-only link** | Automatically shown on the streaming card | Check progress anytime, can't type |
| **Operation link** | Click "🔑 Get operation link" on the card, sent via direct message | Operate the CLI directly in the browser |

## Mobile

On tablets/phones, a **floating shortcut toolbar** is provided: `Esc`, `Ctrl+C`, `Tab`, arrow keys, and more, so you can smoothly control the CLI on your phone too (for example, selecting menus or confirming permissions in Claude Code).

## Three-way sync

The Lark topic, the Web Terminal, and the local tmux all show the real-time state of the **same** CLI process. Typing in tmux on your computer, typing in the Web Terminal on your phone, and sending a message in Lark all have the same effect.
