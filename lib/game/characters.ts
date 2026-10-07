export const CHARACTERS = ['Shadow', 'Strategist', 'Oracle', 'Scholar', 'Silver', 'Diplomat', 'Ember', 'Raven'] as const;
export function characterIndex(value: unknown): number {
  if (value === undefined) return 0;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= CHARACTERS.length) {
    throw new Error('Choose one of the available characters.');
  }
  return value;
}

export const CHARACTER_PROFILES = [
  {intro:'A quiet player who watches before making a deal.',strength:'Noticing patterns in past reveals.',weakness:'Waiting too long to commit.',games:['trust','goldrush','contraband'],tip:'Compare a partner’s promises with their last move. Lock before the timer ends.'},
  {intro:'Plans around the numbers, then looks for a better bargain.',strength:'Tracking costs, bids and possible rewards.',weakness:'Assuming everyone makes the sensible choice.',games:['auction','kingdoms','human-auction'],tip:'Set a spending limit before negotiations. Keep room for a surprise.'},
  {intro:'Reads the room and looks for the alliance nobody mentions.',strength:'Following voting blocs and social pressure.',weakness:'Trusting a persuasive story too quickly.',games:['minority','apples','election'],tip:'Count likely votes. A popular promise can put you on the losing side.'},
  {intro:'Studies the rules and keeps a careful record of each round.',strength:'Remembering resources and legal options.',weakness:'Being predictable once a plan works.',games:['poker17','auction','taboo'],tip:'Check your available choices each round. Change tactics when others catch on.'},
  {intro:'Protects what remains and waits for a useful opening.',strength:'Managing risk and limited resources.',weakness:'Missing rewards by playing too cautiously.',games:['survival','kingdoms','contraband'],tip:'Save defenses for a real threat, but take a calculated risk when you trail.'},
  {intro:'Builds deals that give more than one player a reason to agree.',strength:'Negotiating coalitions and shared rewards.',weakness:'Depending on promises that aren’t binding.',games:['downsizing','election','apples'],tip:'Offer a concrete exchange. Watch whether your allies follow through.'},
  {intro:'Makes bold moves and keeps opponents guessing.',strength:'Breaking a predictable pattern.',weakness:'Taking risks without checking the cost.',games:['mask','vault','minority'],tip:'Change your approach with a purpose. Surprise alone does not earn points.'},
  {intro:'Remembers how people treated them and responds in kind.',strength:'Spotting repeat behavior across rounds.',weakness:'Holding a grudge after the situation changes.',games:['trust','goldrush','pandemic'],tip:'Use previous reveals as evidence, then check whether today’s incentives changed.'},
] as const;
