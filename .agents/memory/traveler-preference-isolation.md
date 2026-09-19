---
name: Traveler preference isolation
description: Merge and cache rules that prevent travel preferences crossing accounts or overwriting newer server data.
---

After sign-in, the saved server profile is authoritative. Wait for the profile read to finish before any authenticated write. An anonymous onboarding draft may seed an account only when that account has no saved profile, and the anonymous draft must be cleared after a successful transfer. Any authenticated device cache must be namespaced by identity.

**Why:** A global local-storage profile can leak one traveler’s taste to another account on a shared browser, while writing before the profile read finishes can overwrite newer server preferences with stale device data.

**How to apply:** Use the anonymous draft only for signed-out browsing and one-time account linking. Use per-user caches only as a resilience fallback for the matching signed-in account. Never copy account-owned preferences back into the anonymous keys.