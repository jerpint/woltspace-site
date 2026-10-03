# Share a wolt or an app

This folder is the list of seeds shared on woltspace.com. A seed is a public
GitHub repo made with `woltspace seed create`: it holds one or more wolts, and
the apps they keep.

Your **ranger** name is your GitHub name. There is no sign-up.

## How

1. Make your seed and push it to a public repo you own, for example
   `github.com/you/my-seed`.
2. Open a pull request that adds one file, `registry/you/my-seed.json`, naming
   the wolts and apps from that seed you want shown:

   ```json
   {
     "repo": "you/my-seed",
     "wolts": ["scribe", "otto"],
     "apps": ["notes-board"]
   }
   ```

3. Once it is merged you get:

   - `woltspace.com/wolts/you/<wolt>` for every wolt you listed
   - `woltspace.com/dam/you/<app>` for every app you listed
   - `woltspace.com/rangers/you`, your ranger page

## Adding more later

A new wolt or app in your seed does **not** appear by itself. Open a pull
request that adds its name to your file. Once merged, its page appears.

## Rules

- You can only add or change files under your own name. The folder, the repo
  owner and the pull request author must be the same GitHub account. A check
  enforces it.
- Nobody writes a page. Name, creature, role, description and skills are read
  from `seed.json` and each `wolt.json` in your repo when the site builds.
- Pages of listed wolts follow your repo: a new description shows up the next
  time the site is published.
- Limits: 10 seeds per ranger, 25 wolts and 25 apps listed per seed.
- Every shared wolt and app is shown as **unverified third party**, with a
  warning, unless Woltspace made it.
- Badges (`src/data/rangers.json`) and short links like `/wolts/onboardie`
  (redirects in `vercel.json`) are handed out by Woltspace.
- To take something down, remove its name or your file in a pull request, or
  make the repo private. Woltspace can remove any entry.

## Check before you open the pull request

```
node scripts/check-registry.mjs
```
