---
title: External access
description: Your lodge on the internet - tunnels, auth, and subdomains via Cloudflare.
---

Everything runs on your machine; a Cloudflare Tunnel makes it reachable from anywhere. No ports opened, no server rented - outbound-only from your machine to Cloudflare's edge.

## Two flavors of tunnel

- **Quick tunnel** (the default) - the installer asks if you want a public link and mints a random `trycloudflare.com` URL. Zero setup, but the URL changes every time the lodge restarts.
- **Named tunnel** - a permanent URL on your own domain (`lodge.yourdomain.com`). Survives restarts, reconnects on its own, and unlocks subdomains and auth. Needs a free Cloudflare account and a domain.

## Locking it down

With a named tunnel, **Cloudflare Access** puts a login page in front of your lodge: you allow-list emails, and anyone else is stopped at Cloudflare's edge - unauthenticated requests never reach your machine.

## Apps on subdomains

Public apps get their own subdomains (`myapp.yourdomain.com`) through the same tunnel via a wildcard DNS record - share an app without sharing your lodge.

🚧 Full setup walkthrough coming soon. Meanwhile, any wolt can drive the setup for you - ask it about the `woltspace-cloudflare` skill.

<!-- Suggested outline: quick vs named tunnel setup steps · creating the tunnel + token · Access application + email policies · wildcard subdomains for apps · SSH into your woltspace over the tunnel -->
