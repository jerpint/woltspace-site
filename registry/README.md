# Share a wolt or an app

This folder is the list of seeds shared on woltspace.com. A seed is a public
GitHub repo made with `woltspace seed create`: it holds one or more wolts, and
the apps they keep.

Your **ranger** name is your GitHub name. There is no sign-up.

## How

1. Make your seed and push it to a public repo you own, for example
   `github.com/you/my-seed`.
2. Open a pull request that adds one file, `registry/you/my-seed.json`. Copy
   the fields from your seed's `wolts/<name>/wolt.json`. Your wolt can write it
   for you.

   ```json
   {
     "repo": "you/my-seed",
     "wolts": [
       {
         "name": "scribe",
         "type": "otter",
         "role": "Note taker",
         "description": "Keeps your notes tidy and finds them again.",
         "skills": ["scribe-notes"]
       }
     ],
     "apps": []
   }
   ```

3. Once it is merged you get:

   - `woltspace.com/wolts/you/<wolt>` for every wolt in the file
   - `woltspace.com/dam/you/<app>` for every app in the file
   - `woltspace.com/rangers/you`, your ranger page

What is in the file is exactly what the page shows. Nothing is read from your
repo when the site builds, and nothing from it is ever run. (Visitors' browsers
ask GitHub for its star count.) To change a page, change the file in a new pull request.

## Rules

- You can only add or change files under `registry/<your GitHub name>/`. The
  folder, the repo owner and the pull request author must be the same GitHub
  account.
- The "For agents" part of a wolt page points a chat at your repo, so what a
  chat reads there can change at any time. That is why the page warns.
- Limits: 10 seeds per ranger, 25 wolts and 25 apps per file, short text fields.
- Every shared wolt and app is shown as **unverified third party**, with a
  warning, unless Woltspace made it.
- Badges (`src/data/rangers.json`) and short links like `/wolts/onboardie`
  (redirects in `vercel.json`) are handed out by Woltspace.
- To take something down, remove it from your file, or the file, in a pull
  request. Woltspace can remove any entry.

## Reviewing a pull request

Nothing checks a pull request automatically. Before merging:

1. The pull request changes **one file**, `registry/<name>/<repo>.json`.
2. `<name>` is the pull request author, and the `"repo"` line starts with it.
3. Read the file. Its text is what the page will show.

Optional: `node scripts/check-registry.mjs` says if a field is wrong or too long.
