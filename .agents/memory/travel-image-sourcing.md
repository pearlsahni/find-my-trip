---
name: Travel image sourcing
description: Reliability and relevance constraints for destination photography in FindMyTrip.
---

Destination photography should use curated, stable image URLs for country heroes and known city landmarks, with a graceful local fallback. Avoid relying on random tagged-image endpoints as the primary source.

**Why:** A tagged free image service returned a visually valid but incorrect landmark for Japan and missing URLs for some city cards, which weakened destination trust and created fallback artwork.

**How to apply:** When adding a country or city, verify the chosen image URL returns successfully and visually matches the place; keep the helper map as the shared source for country pages, city pages, discovery cards, and companion cards.