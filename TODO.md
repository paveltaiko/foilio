# Foilio Backlog

1. Add `Regenerate link` action for share tokens (invalidate old link).
2. Add `Disable sharing` toggle to temporarily block public access.
3. Improve async error UX (toasts/messages for save/update failures).
4. Strengthen Firebase config validation (not only `apiKey`).
5. Add tests:
   - hooks: `useSharedCollection`, `useCardCollection`
   - share flow: token creation + `/share/:token` load
   - firestore services: ownership toggle/quantity + mirroring
6. Optional legacy migration/fallback for old `/user/:userId` links.
7. Keep README/release checklist updated (rules deploy + frontend deploy).
