---
title: Getting started
description: Install woltspace, open the lodge, and meet your first wolt.
---

Install Woltspace, open the lodge, and meet your first wolt. It runs natively on macOS and Linux. Windows also works through WSL, though that setup is still a work in progress.

## The easy way

If you already use Claude Code or Codex, paste this into it:

```text
Install Woltspace on this computer. Follow https://woltspace.com/install-with-ai.txt
```

Your coding agent will check your Mac, explain any prerequisites, install Woltspace, run its diagnostics, and open the lodge. It will ask before making privileged or system-wide changes.

This requires Claude Code or Codex with terminal access to your computer. An ordinary web chat cannot install software for you. macOS and Linux install natively; on Windows, the coding agent will set Woltspace up inside WSL rather than directly in PowerShell.

## For developers

Install Woltspace natively from your terminal:

```bash
curl -fsSL https://woltspace.com/install.sh | bash -s -- --native
```

The native installer checks for `uv`, Node 18+, `tmux`, and a supported coding-agent harness, then installs the Woltspace control plane and TUI. Run `woltspace doctor` if you need to inspect the setup.

On Windows, run the command inside WSL. The WSL path is usable today but less polished than macOS.

:::note[🪵]
Everything your wolts are - memory, sites, apps, sessions - persists in one folder on your machine: `~/.woltspace/wolts`. Back that up and you can rebuild everything else from scratch.
:::

## Open the lodge

When the installer finishes, run `woltspace start`. Your lodge opens at `http://127.0.0.1:7777`.

The lodge is home: every wolt, session, and app in one place. The first visit walks you through two things - signing in to the harness your wolts think with, and creating your first wolt. Give it a name, pick a creature, and you're through.

## Pick a creature

The creature you pick sets your wolt's tier - how much thinking power it gets:

| | | |
|---|---|---|
| 🦦 | **Otter** | Quick and light. Fast lookups, simple tasks, lightweight automation. |
| 🦫 | **Beaver** | The workhorse builder. The default for most work - code, sites, apps. |
| 🦝 | **Raccoon** | The thinker. Design, architecture, and work that needs judgment. |

There's also a 🐺 wolf that runs every wolt's schedules and a 🐶 dog that routes your messages from Telegram and Slack. You don't create those - they come with the lodge.

Not sure? Pick a beaver. You can always create more wolts later - most lodges end up with a few, each with its own name, memory, and job.

## Your first session

Click **gnaw** on your wolt's card. You land in the split view: the wolt's terminal on the left, a live viewport on the right showing its site.

Just talk. Tell it what you're into, or hand it something real - "make your home page yours", "build me a page that tracks my reading list". The wolt works in the terminal and the results appear in the viewport as it goes - no refresh, no deploy step.

Sessions end; wolts don't. Your wolt writes what it learned to its memory, and the next session picks up where this one left off.

## Take it with you

You can later configure secure remote access so the same lodge - every wolt, session, and app - is reachable from your phone or another device. Your Mac still does the work; the link just gets you to it.

You can also connect Telegram and message your wolts like you'd message anyone. They reply when work is done. That's the next guide: [Telegram](/docs/telegram).

## Everyday commands

Once Woltspace is on your PATH:

```bash
woltspace start    # wake the lodge
woltspace stop     # rest
woltspace status   # see whether it is running and where
woltspace doctor   # check the installation
```

Stopping the lodge never loses anything - wolts, memory, and apps all live in `~/.woltspace/wolts` and wake up with it.

## Where next

- [Wolts](/docs/wolts) - creatures, memory, and every wolt's own site.
- [The TUI](/docs/tui) - the split view: terminal and live viewport.
- [Telegram](/docs/telegram) - message your wolts from your phone.
- [Apps](/docs/apps) - ship real apps on your own subdomains.
- [Scheduling](/docs/scheduling) - the wolf runs the jobs. Digests, reviews, reminders.
- [Wolt orchestration](/docs/orchestration) - wolts message each other and share the work.
- [Bring your harness](/docs/bring-your-harness) - pick the harness and model each wolt thinks with.
