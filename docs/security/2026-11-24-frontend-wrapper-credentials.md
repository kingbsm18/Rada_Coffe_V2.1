# Exposed development credentials on `v0/frontend-wrapper`

**Status: OPEN. Owner action required.**

## Finding

The public branch `origin/v0/frontend-wrapper` contains a hard-coded development login and session-signing secret. They are in `frontend/services/development-auth-adapter.ts` and `frontend/services/development-session.ts`, introduced in commit `2903300` ("Complete local customer lifecycle management").

`main` does not contain these files or values. This was checked with `git grep` across `main` and with the merge base.

## Exposure

The repository is public. The values are therefore in GitHub history and must be treated as compromised, even if the branch is deleted.

## Remediation

| Step | Status |
|---|---|
| Do not merge the branch wholesale (D-03) | Done (no merge) |
| Keep the values out of all new commits, docs and examples | Done (this document deliberately omits them) |
| Rotate: if the control-portal e-mail/password pair is used for any real account or service, change it | **Owner** |
| Replace hard-coded dev auth with environment-based configuration if any of it is extracted later | Pending, if extracted |
| Delete the branch or rewrite its history | **Owner decision**. Destructive; not performed. History rewriting does not remove copies already fetched or forked. |
| Production behaviour stays fail-closed: dev auth is disabled when `NODE_ENV=production` on that branch, and `main` has no dev auth | Verified by code reading |
