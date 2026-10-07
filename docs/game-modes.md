# Game collection and adaptation scope

All 22 lobby choices are playable in the same anonymous multiplayer room. Each match runs five 45-second rounds, with 12-second reveals, public chat, secret locked moves, and server-controlled AI seats. Mode-specific instructions appear in the lobby, during play, and in How to play. Most modes need two seats; voting/contact/chair/election modes need three. The six-seat cap includes AI.

These are independently implemented short adaptations inspired by the supplied tournament descriptions. They are not exact recreations of long manga/drama rounds. There is no money, debt, physical action, outside voter, or real-world gambling. Unknown source rules were replaced with explicit original rules. Highest eligible score wins after five rounds, rather than permanent elimination or advancement to a later tournament.

| Source format | Lobby mode | Adaptation |
|---|---|---|
| Opening money challenge | Vault Exchange | Simultaneous guard, offer, take exchanges between rotating pairs; no thirty-day theft mechanic. |
| Minority Rule | Minority Vote | Smaller voting bloc scores; tie/unanimous votes get a small reward. No elimination. |
| Downsizing Game | Alliance Ballot | Allocate one five-vote block to another seat; no vote trading currency. |
| Contraband | Contraband | Paired cargo and inspection estimates; 0/20/40/60 point quantities, five turns. |
| 24-Shot Russian Roulette | 24 Chamber | A virtual trap wheel and push-your-luck reward; no weapons. |
| 17 Poker | Seventeen | Original draw/stand target-17 card rules; source did not supply full rules. |
| Stationary Roulette | Stationary Wheel | Original three-color hidden wheel prediction; source did not supply full rules. |
| Pandemic Game | Contact Protocol | Simultaneous directed contacts, public infection and vaccine collection; no movement or elimination. |
| Musical Chairs | Steal a Chair | Secret seat claims, rotating forbidden previous seat and random contested claims; no Gaya or medal market. |
| Bid Poker | Auction Poker | Five public-card auctions, secret bids, finite credits, five-card poker comparison. Best legal replacement is automatic. |
| Collective Ghostleg Lottery | Ghostleg Lottery | Four lanes; each seat may add one bridge. Bottom lane rewards determine points. |
| Human Auction | Team Auction | A rotating captain and one-round ally bids; no persistent four-person teams. |
| Records of the Four Kingdoms | Four Kingdoms | Up to four factions, public life, one action per seat per round, simultaneous attacks and defense; five-round limit. |
| Angels and Demons | Angels & Demons | A themed variant sharing Contact Protocol mechanics. |
| Gold Rush | Gold Rush | Gold/decoy against inspect/pass, rotating paired roles. |
| Garden of Eden | Three Apples | Red/gold/silver collective pact with explicit point payouts; five rounds rather than thirteen. |
| Taboo Game | Taboo Pact | Original public rotating symbol prohibitions and simultaneous secret moves. |
| Grandmother selection | Lost Fortune | Original return/keep/audit point game, replacing the real-world selection scene. |
| President’s Game | President’s Game | Elections on rounds 1/3/5, share/tax policies on 2/4, one broken promise per president. Only current seats vote. |
| Last Man Standing | Last Seat Standing | Energy, shields, strikes and limited deflections; virtual actions and a five-round limit. |
| Mask Game | Mask Exchange | Original truth/lie/expose crowd scoring; the supplied description contains no playable rules. |
| Existing game | Trust / Fall | Rotating cooperation/betrayal pairs. |

## Inactivity

Scores start at zero. No submission means no move and −10 points. A lone observer earns zero. A submitted paired move facing a timeout earns +10 participation points. No player who never submitted any move is eligible to win. Votes or team rewards do not override timeout penalties.

## Server privacy and randomness

Current secret choices, tokens, bot personalities, the unused deck and the round seed are removed from public room responses. Only the viewer's own locked move is returned. Auction hands are public by design. Random wheel results, card draws, contested chairs and vote/bid ties derive from a cryptographically generated per-round seed committed before submissions. Bots select legal moves using public resources/history and their own personality; they do not inspect human secret moves or hidden random outcomes.

## Validation

Run `npm run test:game`. The engine suite covers all 22 modes across legal seat counts, five rounds, solo AI, server-owned bot seats, legal options, privacy, scoring, timeouts and rematches. Browser checks exercise selector/rules/locking/reveals for every mode, mobile overflow and refresh recovery. Real browser contexts represent separate clients; large-audience load and physical device testing are outside this verification.
