---
name: GitHub publishing fallback
description: Reliable publishing when a connected GitHub integration does not authenticate workspace Git commands.
---

If both `git push` and `gh` remain unauthenticated after the GitHub connection is attached, use the authenticated GitHub REST proxy. For an empty repository, initialize its default branch, upload content-addressed blobs, create the full tree and commit, then update the branch ref.

**Why:** In this workspace, both GitHub connection types reported as active while HTTPS Git, SSH Git, and `gh` still received no credentials. The REST proxy had the expected repository write permission and published successfully.

**How to apply:** Try normal Git once after connection. If credential injection is still absent, avoid repeated auth retries or asking for tokens. Use the connector SDK proxy, then verify the remote branch SHA, recursive file count, and a representative application file.