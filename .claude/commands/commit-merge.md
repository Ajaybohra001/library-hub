# /commit-merge

Commit all staged and unstaged changes, then merge the current branch to master.

## Steps

1. Run `git status` to check the working tree.
2. Run `git diff HEAD` to read what changed.
3. Write a conventional commit message in this format:
   - First line: `type(scope): short description` (under 72 characters).
   - Type is one of: feat, fix, chore, refactor, test, docs.
   - Scope is the feature or folder name (for example: auth, tasks, ui).
   - Leave a blank line, then 2-3 bullet points summarising the key changes.
4. Run `git add .`
5. Run `git commit -m "<message>"`.
6. Read the current branch name with `git branch --show-current`.
7. Run `git checkout master`.
8. Run `git merge <branch>` with `--no-ff` so the merge commit is visible.
9. Print a summary: branch merged, commit hash, files changed.

## Rules

- Never push to remote unless the user explicitly asks.
- If `git status` shows conflicts, stop and report them. Do not resolve them automatically.
- If the branch is already master, stop and tell the user.
