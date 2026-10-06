# Game art

- `public/tournament-room.png`: original cinematic tournament background, already integrated into the game.
- `public/player-portraits.png`: four transparent character busts in equal horizontal quarters, generated with built-in imagegen from the tournament illustration. No API key required.

Portrait prompt: preserve the reference's four original adult anime competitors in order (shaggy dark hair, stern dark suit, long dark hair, blond glasses). Four equal horizontal cells, consistent waist-up scale, guarded expressions, charcoal clothes, gold rim lighting, transparent background, no room/table/UI/text.

CSS renders the portrait strip at 400% width and selects each quarter with background positions 0%, 33.333%, 66.667%, and 100%. The original image remains unmodified.

## Selectable characters

`public/player-portraits-extra.png` adds Silver, Diplomat, Ember, and Raven, alongside the four original portraits. Generated with built-in imagegen as four equal-width transparent cells, matching the charcoal/gold cinematic anime style.

Prompt: four original adult waist-up portraits—silver-bob woman in a black jacket, Black man with short curls in a charcoal suit, auburn-ponytail woman in a high-collar coat, and East Asian man with shoulder-length dark hair in a black turtleneck. Guarded confident expressions, gold rim light, equal horizontal cells, transparent background, no room/table/UI/text.

Players select one of eight characters before joining or in the lobby. The server stores the selected index in the shared player record; existing rooms receive a compatible default appearance. Character changes in the lobby reset readiness.
