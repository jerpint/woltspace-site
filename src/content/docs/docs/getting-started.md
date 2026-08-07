---
title: Getting started
description: Install woltspace, open the lodge, and meet your first wolt - in about five minutes.
---

Install, open the lodge, meet your first wolt - about five minutes.

## What you need

- **Docker** - free, works on Mac, Windows, and Linux. [Get Docker Desktop](https://www.docker.com/products/docker-desktop/) and open it once so it's running.
- **A terminal** - Spotlight → "Terminal" on Mac, PowerShell on Windows, Ctrl-Alt-T on Linux.
- **git** - already installed on most machines; the installer will tell you if it's missing.

## Install

One command in your terminal:

```bash
curl -fsSL https://woltspace.com/install.sh | bash
```

Here's what it does: clones the woltspace repo into the folder you run it from, asks one question - whether you want a public link so you can reach your lodge from other devices - then builds the sandboxed container and starts it.

:::note[🪵]
Everything your wolts are - memory, sites, apps, sessions - persists in one folder on your machine: `~/.woltspace/wolts`. Back that up and you can rebuild everything else from scratch.
:::

## Open the lodge

When the installer finishes it prints your lodge URL - `http://localhost:7777`, plus the public link if you enabled one. Open it in a browser.

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

If you enabled the public link, the same lodge - every wolt, session, and app - is reachable from your phone or any other device. Your machine does the work; the link just gets you to it.

You can also connect Telegram and message your wolts like you'd message anyone. They reply when work is done. That's the next guide: [Telegram](/docs/telegram).

## Everyday commands

From the folder where you installed:

```bash
./woltspace/woltspace start    # wake the lodge
./woltspace/woltspace stop     # rest
./woltspace/woltspace update   # pull the latest platform
./woltspace/woltspace backup   # snapshot your wolts
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
