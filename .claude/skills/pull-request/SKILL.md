---
name: pull-request
description: Opens a GitHub pull request from the current branch (or the branch the user names) into main, with a description written in very simple Romanian using em dashes. Use whenever the user asks for a pull request or PR in this repo, e.g. "fă un pull request", "deschide un PR", "fă PR cu branch-ul horia/onboarding", "create a PR". In this repo use this skill instead of any generic PR skill.
---

# Pull request (Busola · Ritm)

Opens a PR into `main` and writes a description that anyone on the team, including the Pitcher, understands in one read.

## Steps

1. **Pick the branch.** Use the branch the user named; otherwise the current one (`git branch --show-current`). If it is `main`, stop and ask which branch to use. Never open a PR from `main`.
2. **Uncommitted changes?** Run `git status --short`. If there are changes, list them and ask whether to commit them first. Don't commit `.env.local` or anything with a key.
3. **Get up to date with main** (roadmap rule 5): `git fetch origin` then `git merge origin/main` on the branch. If there are conflicts, stop and tell the user which files conflict.
4. **Build and tests.** If `package.json` exists, run `npm run build` and `npm test`. If either fails, don't open the PR: show the error in one or two lines and stop.
5. **Push.** `git push -u origin <branch>`. Never force-push.
6. **Read what changed.** `git log --oneline origin/main..HEAD` and `git diff origin/main...HEAD --stat`, then read the diff itself. Describe what the code actually does, not only what the commit messages say.
7. **Find the issue.** `gh issue list --state open --limit 100`. Issues are titled like `Horia 3/9 · [H2] Onboarding: 3 steps`. Match by the task code (H2, C4, I1...) in the branch name or commits, or by the content of the diff. Add `Closes #N` only when the PR finishes that task; if it is partial, write `Parte din #N`.
8. **Write the title and body** (rules and template below) into a temp file.
9. **Create the PR.** `gh pr create --base main --head <branch> --title "<title>" --body-file <file>`. If a PR for this branch already exists, update it with `gh pr edit <branch> --title ... --body-file ...` instead.
10. **Don't merge.** Only Cosma merges into `main`. Give the user the PR link.

## Writing rules

- Romanian with diacritics, unless the user asks in English.
- Short sentences. Write for someone who doesn't code: say what the user of the app sees or what the team can now do, not how the code works.
- No jargon in the top sections. Words like component, store, hook, refactor or endpoint go only in "Pentru reviewer". If a term is unavoidable, explain it in five words.
- Every bullet has the form `**Ce** — ce înseamnă sau de ce contează`, with an em dash (—) surrounded by spaces. Never a hyphen (-) or an en dash (–) in its place.
- Be honest: if something was not tested or is still a mock, say so under "Ce nu e inclus".
- Title: at most 60 characters, plain words, with the task code if there is one. Example: `[H2] Onboarding-ul Ritm în 3 pași`.

## Template

```markdown
## Pe scurt
<O propoziție — ce poate face acum utilizatorul sau echipa datorită acestui PR.>

## Ce s-a schimbat
- **<Lucrul 1>** — <ce face, în cuvinte simple>
- **<Lucrul 2>** — <ce face>

## Cum verifici
- **Pasul 1** — <de ex. deschide linkul cu `?demo=1` și sari la ziua 6>
- **Pasul 2** — <ce ar trebui să vezi>

## Ce nu e inclus
- **<Ce lipsește sau e simulat>** — <de ce, sau când vine>

## Pentru reviewer
- **Fișiere principale** — `<cale>`, `<cale>`
- **Build și teste** — <trecute / ce nu s-a rulat și de ce>

Closes #<N>
```

Leave out "Ce nu e inclus" if there is truly nothing to say there. Keep "Cum verifici" for any change someone can see or click.

## Example of a good bullet

- **Ecranul de Lock** — arată câte zile mai sunt până se deblochează banii și cât ar câștiga din dobândă.

Not: "Added LockScreen component with useBank selector and interestEstimate integration."
