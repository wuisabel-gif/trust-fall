# Game art

- `public/tournament-room.png`: original cinematic tournament background, already integrated into the game.
- `public/player-portraits.png`: four transparent character busts in equal horizontal quarters, generated with built-in imagegen from the tournament illustration. No API key required.

Portrait prompt: preserve the reference's four original adult anime competitors in order (shaggy dark hair, stern dark suit, long dark hair, blond glasses). Four equal horizontal cells, consistent waist-up scale, guarded expressions, charcoal clothes, gold rim lighting, transparent background, no room/table/UI/text.

CSS renders the portrait strip at 400% width and selects each quarter with background positions 0%, 33.333%, 66.667%, and 100%. The original image remains unmodified.
