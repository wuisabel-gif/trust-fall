import type { Player, Room } from './engine';
import type { BotStyle } from './bots';
const voices: Record<BotStyle, readonly string[]> = {
  friendly: [
    '{partner}, thirty points each sounds better than a grudge.',
    'I’d rather build an alliance than win one cheap round.',
    'Let’s make this a round we can both feel good about.',
    '{partner}, I’m offering trust. What are you offering?',
    'There’s enough on the table for both of us.',
    'A promise only matters if you keep it.',
    'We can both walk away ahead. Think about it.',
    'I’m still willing to give someone the benefit of the doubt.',
  ],
  cautious: [
    '{partner}, give me a reason to trust you.',
    'I’m listening. That doesn’t mean I’m convinced.',
    'The quiet ones worry me more than the loud ones.',
    'I’ll judge the choice, not the speech.',
    'Cooperation works when both sides mean it.',
    'Let’s keep the deal simple. No clever loopholes.',
    '{partner}, I’m weighing the risk before I lock in.',
    'Someone at this table is promising too much.',
  ],
  opportunist: [
    '{partner}, a deal is useful only if it pays.',
    'Everyone wants trust. I want points.',
    'You don’t get ahead by playing every round safely.',
    'I’m open to an alliance. Make it worth my while.',
    'The scoreboard is the only witness I need.',
    '{partner}, are we making a deal or just making conversation?',
    'I can be very cooperative when the price is right.',
    'There’s a difference between being trusted and being predictable.',
  ],
  unpredictable: [
    '{partner}, feeling lucky this round?',
    'I had a plan. Then I changed my mind.',
    'Maybe I’m bluffing. Maybe that’s the bluff.',
    'The obvious move is starting to look suspicious.',
    'I like this table better when nobody feels safe.',
    '{partner}, try to guess what I’m thinking. I dare you.',
    'Let’s give the reveal something interesting to show.',
    'Don’t mistake a smile for a promise.',
  ],
  mirror: [
    '{partner}, the way you play tells me how to respond.',
    'Trust is a two-way street.',
    'Show me cooperation and I’ll remember it.',
    'I don’t forget what the reveal shows.',
    'Your reputation arrives at the table before you do.',
    '{partner}, I’m watching actions rather than promises.',
    'Fair treatment tends to find its way back to you.',
    'We teach each other how this game will go.',
  ],
};
type PublicContext = Pick<Room, 'round' | 'players' | 'history' | 'messages'>;
// Current secret choices are deliberately absent from this dialogue context.
export function botDialogue(context: PublicContext, bot: Player, partner: Player, roundStart: number, seed: number): string {
  const candidates = [...voices[bot.botStyle ?? 'unpredictable']].map(line => line.replaceAll('{partner}', partner.name));
  const previous = context.history.at(-1)?.results;
  const theirLastMove = previous?.find(result => result.id === partner.id);
  const ourLastRound = previous?.find(result => result.id === bot.id);
  if (theirLastMove?.choice === 'betray') candidates.unshift(`${partner.name}, I saw that betrayal last round. Why should this time be different?`);
  if (theirLastMove?.choice === 'cooperate') candidates.unshift(`${partner.name}, you cooperated last round. That earns some credit with me.`);
  if (ourLastRound?.gain === 0) candidates.unshift('I trusted someone last round and got nothing. I’m not brushing that off.');
  const lead = Math.max(...context.players.map(player => player.score));
  if (context.round > 1 && bot.score < lead) candidates.push('I’m behind on points. Playing it safe might not be enough.');
  if (context.round > 1 && bot.score === lead) candidates.push('I’ve got a lead to protect. Every choice matters now.');
  if (context.round === 5) candidates.unshift(`${partner.name}, last round. No future favors to bargain with.`);
  const speaker = `${bot.name} · AI`;
  const recentOwn = new Set(context.messages.filter(message => message.name === speaker).slice(-5).map(message => message.text));
  const thisRound = new Set(context.messages.filter(message => message.at >= roundStart).map(message => message.text));
  const recentTable = new Set(context.messages.slice(-12).map(message => message.text));
  const fresh = candidates.filter(line => !recentOwn.has(line) && !thisRound.has(line) && !recentTable.has(line));
  const available = fresh.length ? fresh : candidates.filter(line => !recentOwn.has(line) && !thisRound.has(line));
  const pool = available.length ? available : candidates.filter(line => !thisRound.has(line));
  return pool[seed % pool.length];
}
