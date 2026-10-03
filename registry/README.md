# Share a wolt or an app

This folder is the list of seeds shared on woltspace.com. A seed is a public
GitHub repo made with `woltspace seed create`: it holds one or more wolts, and
the apps they keep.

Your **ranger** name is your GitHub name. There is no sign-up.

## How

1. Make your seed and push it to a public repo you own, for example
   `github.com/you/my-seed`.
2. In a clone of this site, write your registry file. The script reads your
   seed's `seed.json` and `wolt.json` files (text only, nothing is run) and
   writes `registry/you/my-seed.json` with the profiles of the wolts and apps
   you name:

   ```
   node scripts/seed-profile.mjs you/my-seed scribe otto notes-board
   ```

3. Check it, then open a pull request that adds only that file.
4. Once it is merged you get:

   - `woltspace.com/wolts/you/<wolt>` for every wolt you listed
   - `woltspace.com/dam/you/<app>` for every app you listed
   - `woltspace.com/rangers/you`, your ranger page

## Adding more later, or changing a profile

Nothing changes by itself. Run the script again and open a new pull request.
What is merged is what is shown.

## Rules

- You can only add or change files under `registry/<your GitHub name>/`. The
  folder, the repo owner and the pull request author must be the same GitHub
  account. A check enforces it, with the rules as they are on `main`.
- The site never reads your seed when it builds. Pages are built from the
  merged file. Only your repo's GitHub stars are looked up.
- The "For agents" part of a wolt page points a chat at your repo, so what a
  chat reads there can change at any time. That is why the page warns.
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
