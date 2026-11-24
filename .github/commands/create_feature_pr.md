# Feature Pull Request Workflow — Second Brain

This document defines the standardized Pull Request creation procedure for the `second-brain` React Native (Expo + Drizzle SQLite) project. Every completed roadmap step or feature branch MUST follow this exact flow before merging.

---

## Step 1: Check for Existing PR
Check if a Pull Request already exists for the active branch:
```bash
gh pr list --head $(git rev-parse --abbrev-ref HEAD)
```
- If an open PR already exists for this branch, record its number and update it in Step 6 with `gh pr edit`.
- If no PR exists, proceed to create a new PR.

---

## Step 2: Gather Branch Context
Inspect commits, diffs, and working tree to build an accurate summary:
```bash
git status
git log dev...HEAD --oneline
git diff dev...HEAD --stat
```
Verify that working tree is clean and `npx tsc --noEmit` passes with 0 errors.

---

## Step 3: Base Branch Target
- **Always target `dev`** for all feature (`feat/`), fix (`fix/`), chore (`chore/`), and docs (`docs/`) branches.
- `main` is strictly reserved for production release merges cut directly from `dev`.

---

## Step 4: PR Title Convention
Follow this standard format:
```
<type>(step-<N>): <short clear description>
```
Examples:
- `feat(step-2): add obsidian theme tokens and thin-route screens`
- `feat(step-3): add nodes schema, migrations and database provider`
- `fix(step-5): correct recursive cte column aliases in repository`

*Note: Do not include Jira ticket prefixes or arbitrary tags.*

---

## Step 5: PR Body Template
Structure the body using this template:

```markdown
### 📋 Description
<!-- Summary of what this step delivers, why it was implemented, and its architectural context -->

### ✅ Changes
<!-- Group files by functional area without raw code dumps -->
- **Routes / Screens:**
  - `...`
- **Database / Drizzle:**
  - `...`
- **Components / UI:**
  - `...`
- **Hooks / State:**
  - `...`
- **Theme / Config:**
  - `...`
- **Docs & Architecture:**
  - `...`

### 🧪 Testing Checklist
- [ ] Feature works as described in Expo Go
- [ ] \`npx tsc --noEmit\` passes with 0 errors
- [ ] No regressions in existing tabs/screens
- [ ] Uses theme tokens from \`src/theme/tokens.ts\` (no hardcoded colors)
- [ ] No raw emojis used as navigation/UI chrome icons
- [ ] SQLite migrations & foreign keys unaffected (where applicable)
- [ ] \`PROJECT_STATE.md\` and \`docs/walkthroughs/step-<N>.md\` updated

### 🗒️ Additional Notes
- Detailed walkthrough: [\`docs/walkthroughs/step-<N>.md\`](docs/walkthroughs/step-<N>.md)
- New packages added: (none / list packages)
- Next roadmap step: Step <N+1>
```

---

## Step 6: Push Branch & Create / Update PR
1. Ensure the remote tracking branch is up to date:
   ```bash
   git push -u origin $(git rev-parse --abbrev-ref HEAD)
   ```
2. Create the Pull Request (if new):
   ```bash
   gh pr create --base dev --title "<title>" --body "<body>"
   ```
   Or update the existing PR (if one exists):
   ```bash
   gh pr edit <pr-number> --title "<title>" --body "<body>"
   ```

---

## Step 7: Confirm & Hard Stop
- Print the clickable Pull Request URL in the terminal / chat.
- **HARD STOP:** Never merge the PR automatically. Stop and wait for manual review and merge on GitHub.
