---
name: commit-push-pr
description: Stage, commit, and push changes for sage_movies. Committing directly to main is the norm for this repo; opens a PR only if asked or if on a non-main branch.
disable-model-invocation: true
---

Commit and push the current changes.

1. Run `git status` and `git diff` (plus `git diff --staged`) to see what changed. Never commit `.env` or any file containing a real `TMDB_API_KEY`.
2. Stage the relevant files. Write a concise commit message in this repo's style (lowercase `type:` prefix — `fix:`, `added:`, `feat:` — matching recent history). End the message with:

   ```
   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```
3. This repo commits directly to `main`, so committing/pushing to the current branch is fine. Push with `git push`.
4. Open a PR **only** if the user asked for one or the current branch is not `main`. Use `gh pr create` with a short body ending in:

   ```
   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

`$ARGUMENTS` — if provided, use it as the commit message / PR title.
