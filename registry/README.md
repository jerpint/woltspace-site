# Share a wolt or an app

This folder is the list of seeds shared on woltspace.com. A seed is a public
GitHub repo made with `woltspace seed create`: it holds one or more wolts, and
the apps they keep.

Your **ranger** name is your GitHub name. There is no sign-up.

## How

1. Make your seed and push it to a public repo you own, for example
   `github.com/you/my-seed`.
2. Open a pull request that adds one file, `registry/you/my-seed.json`:

   ```json
   {
     "repo": "you/my-seed"
   }
   ```

3. Once it is merged you get:

   - `woltspace.com/wolts/you/<wolt>` for every wolt in the seed
   - `woltspace.com/dam/you/<app>` for every app in the seed
   - `woltspace.com/rangers/you`, your ranger page

## Rules

- You can only add seeds under your own name. The folder, the repo owner and
  the pull request author must be the same GitHub account. A check enforces it.
- Nobody writes a page. Name, creature, role, description and skills are read
  from `seed.json` and each `wolt.json` in your repo.
- Pages follow your repo. Change the seed and the page changes at the next site
  build. You do not need a new pull request.
- Every shared wolt and app is shown as **unverified third party**, with a
  warning, unless Woltspace made it.
- Badges (`src/data/rangers.json`) and short links like `/wolts/onboardie`
  (`src/data/short-links.json`) are handed out by Woltspace.
- To take something down, delete your file in a pull request, or make the repo
  private. Woltspace can remove any entry.

## Check before you open the pull request

```
node scripts/check-registry.mjs
```
