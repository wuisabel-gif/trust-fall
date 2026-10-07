import { settingsOf } from '../settings';
import type { Room, Result } from '../engine';
import { modeOf } from './catalog';
export type ModeState = {
    infected: string[];
    vaccines: Record<string, number>;
    hands: Record<string, number[]>;
    credits: Record<string, number>;
    shields: Record<string, number>;
    energy: Record<string, number>;
    deflect: Record<string, number>;
    kingdoms: number[];
    president?: string;
    taxed: string[];
};
export function initializeMode(r: Room) {
    const ids = r.players.map(p => p.id);
    r.modeState = { infected: ids.slice(0, ids.length > 3 ? 2 : 1), vaccines: {}, hands: {}, credits: {}, shields: {}, energy: {}, deflect: {}, kingdoms: [100, 100, 100, 100].slice(0, Math.min(4, ids.length)), taxed: [] };
    const deck = Array.from({ length: 52 }, (_, i) => i);
    for (let i = deck.length - 1; i > 0; i--) {
        const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    for (const id of ids) {
        r.modeState.hands[id] = deck.splice(0, 5);
        r.modeState.credits[id] = 100;
        r.modeState.shields[id] = 3;
        r.modeState.energy[id] = 0;
        r.modeState.deflect[id] = 3;
    }
    r.deck = deck;
}
export function draw(r: Room, key: string, max: number) { let value = r.roundSeed ?? 1; for (const c of key)
    value = Math.imul(value ^ c.charCodeAt(0), 16777619); return (value >>> 0) % max; }
export type PublicModeContext = Pick<Room, 'mode' | 'modeState' | 'players' | 'round' | 'history'>;
export function faction(r: PublicModeContext, id: string) { return r.players.findIndex(p => p.id === id) % Math.min(4, r.players.length); }
export function activeIds(r: Room) { return r.players.filter(p => !(r.mode === 'survival' && r.modeState!.shields[p.id] <= 0) && !(r.mode === 'kingdoms' && r.modeState!.kingdoms[faction(r, p.id)] <= 0)).map(p => p.id); }
export function optionsFor(r: PublicModeContext, id: string) {
    const mode = modeOf(r.mode), others = r.players.filter(p => p.id !== id);
    if (mode.id === 'downsizing' || (mode.id === 'pandemic' || mode.id === 'angels'))
        return others.map(p => ({ value: p.id, label: p.name }));
    if (mode.id === 'election')
        return r.round % 2 ? r.players.map(p => ({ value: p.id, label: `Vote ${p.name}` })) : r.modeState?.president === id ? [{ value: 'share', label: 'Share · +20 for all' }, ...(!r.modeState.taxed.includes(id) ? [{ value: 'tax', label: 'Tax · break the promise' }] : [])] : [{ value: 'support', label: 'Support' }, { value: 'oppose', label: 'Oppose' }];
    if (mode.id === 'kingdoms')
        return [{ value: 'rest', label: 'Rest' }, { value: 'defend', label: 'Defend your kingdom' }, ...r.modeState!.kingdoms.map((lp, i) => ({ value: `attack:${i}`, label: `Attack kingdom ${i + 1} · ${lp} life` })).filter((o, i) => i !== faction(r, id) && r.modeState!.kingdoms[i] > 0)];
    if (mode.id === 'chairs')
        return mode.options.slice(0, r.players.length - 1).filter(o => o.value !== r.history.at(-1)?.results.find(x => x.id === id)?.choice);
    if (mode.id === 'auction')
        return mode.options.filter(o => Number(o.value) * 10 <= (r.modeState?.credits[id] ?? 100));
    if (mode.id === 'survival')
        return mode.options.filter(o => o.value === '0' || o.value === '1' && (r.modeState?.energy[id] ?? 0) > 0 || o.value === '2' && (r.modeState?.deflect[id] ?? 0) > 0);
    return mode.options;
}
export function needsChoice(r: Room, id: string) { return activeIds(r).includes(id) && (!modeOf(r.mode).paired || r.pairs.some(p => p.length === 2 && p.includes(id))); }
export function roundDetails(r: Room, id: string) {
    const s = r.modeState, m = r.mode === 'angels' ? 'pandemic' : modeOf(r.mode).id;
    if (!s)
        return '';
    const pair = r.pairs.find(p => p.includes(id));
    if (m === 'contraband' || m === 'goldrush')
        return `Your role: ${pair?.[r.round % 2 === 1 ? 0 : 1] === id ? 'SMUGGLER' : 'INSPECTOR'}. Amount buttons mean cargo for the smuggler and estimate for the inspector.`;
    if (m === 'poker17')
        return `Your starting total: ${8 + draw(r, `${id}:total`, 7)}. Target: 17.`;
    if (m === 'pandemic')
        return `You are ${s.infected.includes(id) ? 'INFECTED' : 'HEALTHY'} · ${s.vaccines[id] ?? 0} vaccines. Infected: ${r.players.filter(p => s.infected.includes(p.id)).map(p => p.name).join(', ') || 'nobody'}.`;
    if (m === 'auction')
        return `Your hand: ${(s.hands[id] ?? []).map(cardName).join(' ')} · ${s.credits[id]} credits · Offered: ${cardName(r.deck?.[r.round - 1] ?? 0)}. All hands are shown in the standings.`;
    if (m === 'kingdoms')
        return `You belong to kingdom ${faction(r, id) + 1}. Life: ${s.kingdoms.map((lp, i) => `K${i + 1}: ${lp}`).join(' · ')}.`;
    if (m === 'human-auction')
        return `Captain: ${r.players[(r.round - 1) % r.players.length].name}. Captain selects their base reward; others bid.`;
    if (m === 'taboo')
        return `Forbidden symbols: ${r.players.map((p, i) => `${p.name}: ${modeOf('taboo').options[(r.round + i) % 3].label}`).join(' · ')}.`;
    if (m === 'election')
        return r.round % 2 ? 'Election round. Most votes wins office.' : `Policy round. President: ${r.players.find(p => p.id === s.president)?.name}.`;
    if (m === 'survival')
        return `Shields: ${s.shields[id]} · energy: ${s.energy[id]} · deflections: ${s.deflect[id]}. Strike targets the next living seat.`;
    return '';
}
export function cardName(card: number) { return `${['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'][card % 13]}${['♠', '♥', '♦', '♣'][Math.floor(card / 13)]}`; }
// Full five-card poker order, then lexicographic rank kickers.
export function pokerValue(cards: number[]) {
    const ranks = cards.map(c => c % 13 + 2).sort((a, b) => b - a), counts = new Map<number, number>();
    for (const n of ranks)
        counts.set(n, (counts.get(n) ?? 0) + 1);
    const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const flush = cards.every(c => Math.floor(c / 13) === Math.floor(cards[0] / 13));
    const unique = [...new Set(ranks)];
    const straight = unique.length === 5 && (unique[0] - unique[4] === 4 || unique.join(',') === '14,5,4,3,2') ? (unique[0] === 14 && unique[1] === 5 ? 5 : unique[0]) : 0;
    const category = straight && flush ? 8 : groups[0][1] === 4 ? 7 : groups[0][1] === 3 && groups[1][1] === 2 ? 6 : flush ? 5 : straight ? 4 : groups[0][1] === 3 ? 3 : groups[0][1] === 2 && groups[1][1] === 2 ? 2 : groups[0][1] === 2 ? 1 : 0;
    const kickers = straight ? [straight] : groups.flatMap(([rank, count]) => Array(count).fill(rank));
    return kickers.reduce((v, n) => v * 15 + n, category) * 15 ** (5 - kickers.length);
}
function winner(r: Room, ids: string[], key: string) { return ids[draw(r, key, ids.length)]; }
export function resolveMode(r: Room): Result[] {
    const mode = r.mode === 'angels' ? 'pandemic' : modeOf(r.mode).id, s = r.modeState!, ids = r.players.map(p => p.id), c = r.choices;
    const submitted = ids.filter(id => c[id] !== undefined), counts = (value: string) => submitted.filter(id => c[id] === value).length;
    const results: Result[] = ids.map(id => ({ id, partner: null, choice: c[id] ?? null, otherChoice: null, gain: needsChoice(r, id) ? c[id] === undefined ? -10 : 0 : 0, detail: c[id] === undefined ? (needsChoice(r, id) ? 'Timed out · no move · −10 points' : 'Observer · no points') : `Selected ${optionsFor(r, id).find(o => o.value === c[id])?.label ?? c[id]}` }));
    const timedOut = results.filter(x => x.detail?.startsWith('Timed out')).map(x => x.id);
    const out = (id: string) => results.find(x => x.id === id)!;
    const gain = (id: string, n: number, detail: string) => { out(id).gain = n; out(id).detail = detail; };
    if (mode === 'trust' || mode === 'contraband' || mode === 'goldrush' || mode === 'taboo' || mode === 'vault') {
        for (const pair of r.pairs) {
            if (pair.length !== 2)
                continue;
            const [a, b] = r.round % 2 === 1 ? pair : [...pair].reverse();
            out(a).partner = b;
            out(b).partner = a;
            out(a).otherChoice = c[b] ?? null;
            out(b).otherChoice = c[a] ?? null;
            if (c[a] === undefined || c[b] === undefined) {
                for (const id of pair)
                    if (c[id] !== undefined)
                        gain(id, 10, 'Partner timed out · participation +10');
                continue;
            }
            if (mode === 'trust') {
                for (const [id, other] of [[a, b], [b, a]])
                    gain(id, c[id] === 'cooperate' ? (c[other] === 'cooperate' ? 30 : 0) : (c[other] === 'cooperate' ? 50 : 5), `${c[id]} vs ${c[other]}`);
            }
            if (mode === 'contraband') {
                const cargo = Number(c[a]) * 20, estimate = Number(c[b]) * 20;
                const caught = cargo > 0 && estimate >= cargo;
                gain(a, cargo === 0 ? estimate / 2 : caught ? 0 : cargo, `Smuggled ${cargo}; inspection estimate ${estimate}`);
                gain(b, caught ? cargo : 0, `Estimated ${estimate}; cargo ${cargo}`);
            }
            if (mode === 'goldrush') {
                const gold = c[a] === '1', inspect = c[b] === '1';
                gain(a, gold ? (inspect ? 0 : 40) : (inspect ? 20 : 5), `${gold ? 'Gold' : 'Decoy'} · ${inspect ? 'inspected' : 'passed'}`);
                gain(b, gold ? (inspect ? 40 : 0) : (inspect ? -10 : 5), out(a).detail!);
            }
            if (mode === 'vault') {
                for (const [id, other] of [[a, b], [b, a]])
                    gain(id, c[id] === '1' ? -20 : c[id] === '2' ? (c[other] === '0' ? 0 : c[other] === '2' ? 0 : 30) : c[other] === '0' ? 5 : 0, 'Vault exchange resolved');
                for (const [id, other] of [[a, b], [b, a]]) {
                    if (c[id] === '1')
                        out(other).gain += 20;
                    if (c[id] === '2' && c[other] === '1')
                        out(other).gain -= 30;
                }
            }
            if (mode === 'taboo') {
                for (const [id, other] of [[a, b], [b, a]]) {
                    const forbidden = String((r.round + ids.indexOf(other)) % 3);
                    gain(id, c[id] === forbidden ? -10 : 15, `Partner forbade ${modeOf('taboo').options[Number(forbidden)].label}`);
                }
                for (const [id, other] of [[a, b], [b, a]])
                    if (c[id] === String((r.round + ids.indexOf(other)) % 3))
                        out(other).gain += 20;
            }
        }
    }
    else if (mode === 'minority') {
        const yes = counts('0'), no = counts('1');
        for (const id of submitted)
            gain(id, yes === no || !yes || !no ? 5 : counts(c[id]) < submitted.length / 2 ? 40 : 0, `Yes ${yes} · No ${no}`);
    }
    else if (mode === 'apples') {
        const red = counts('0'), gold = counts('1'), silver = counts('2');
        for (const id of submitted) {
            const n = red === ids.length ? 30 : red > 0 ? (c[id] === '0' ? 0 : 40) : !gold || !silver ? 0 : gold === silver ? 5 : counts(c[id]) === Math.max(gold, silver) ? 20 : 0;
            gain(id, n, `Red ${red} · Gold ${gold} · Silver ${silver}${submitted.length < ids.length ? ' · incomplete pact' : ''}`);
        }
    }
    else if (mode === 'downsizing') {
        for (const id of submitted)
            gain(id, 5, 'Ballot submitted +5');
        for (const id of submitted) {
            out(c[id]).gain += 25;
            out(c[id]).detail = `Received ${submitted.filter(x => c[x] === id).length * 5} votes`;
        }
    }
    else if (mode === 'roulette') {
        for (const id of submitted) {
            const n = Number(c[id]);
            const chambers = Array.from({ length: 24 }, (_, i) => i);
            for (let i = 23; i > 0; i--) {
                const j = draw(r, `wheel:${i}`, i + 1);
                [chambers[i], chambers[j]] = [chambers[j], chambers[i]];
            }
            const start = draw(r, `${id}:start`, 24);
            const traps = Array.from({ length: n }, (_, i) => chambers[(start + i) % 24] < 6).some(Boolean);
            gain(id, traps ? -10 : [5, 15, 30, 50][n], traps ? 'A trap stopped your run' : `${n} chambers safely passed`);
        }
    }
    else if (mode === 'poker17') {
        const totals = submitted.map(id => ({ id, total: 8 + draw(r, `${id}:total`, 7) + Array.from({ length: Number(c[id]) }, (_, i) => 1 + draw(r, `${id}:card:${i}`, 6)).reduce((a, b) => a + b, 0) }));
        const best = Math.max(0, ...totals.filter(t => t.total <= 17).map(t => t.total));
        for (const { id, total } of totals)
            gain(id, total > 17 ? -10 : total === best ? 40 : 10, `Final total ${total}${total > 17 ? ' · bust' : ''}`);
    }
    else if (mode === 'stationary') {
        const color = draw(r, 'wheel', 3);
        for (const id of submitted)
            gain(id, Number(c[id]) === color ? 30 : 0, `Wheel: ${modeOf(mode).options[color].label}`);
    }
    else if (mode === 'pandemic') {
        const infected = new Set(s.infected), next = new Set(s.infected);
        for (const id of submitted) {
            const target = c[id];
            if (!infected.has(id) && !infected.has(target)) {
                s.vaccines[id] = (s.vaccines[id] ?? 0) + 1;
                gain(id, 20, 'Healthy contact · vaccine +1');
            }
            else if (infected.has(id) && !infected.has(target)) {
                next.delete(id);
                gain(id, 5, 'Recovered through healthy contact');
            }
            else if (!infected.has(id) && infected.has(target)) {
                next.add(id);
                gain(id, 0, 'Contact infected you');
            }
            else
                gain(id, 0, 'Both contacts infected');
        }
        s.infected = [...next];
    }
    else if (mode === 'chairs') {
        for (const chair of modeOf(mode).options) {
            const claimants = submitted.filter(id => c[id] === chair.value);
            if (!claimants.length)
                continue;
            const win = winner(r, claimants, chair.value);
            for (const id of claimants)
                gain(id, id === win ? (claimants.length === 1 ? 30 : 10) : 0, `${chair.label}: ${r.players.find(p => p.id === win)?.name} wins${claimants.length > 1 ? ' contested draw' : ''}`);
        }
    }
    else if (mode === 'auction') {
        if (submitted.length) {
            const bid = Math.max(...submitted.map(id => Number(c[id]) * 10)), tied = submitted.filter(id => Number(c[id]) * 10 === bid), win = winner(r, tied, 'auction');
            s.credits[win] -= bid;
            const hand = s.hands[win], card = r.deck![r.round - 1];
            let best = hand, bestValue = pokerValue(hand);
            for (let i = 0; i < 5; i++) {
                const candidate = hand.map((x, j) => i === j ? card : x), value = pokerValue(candidate);
                if (value > bestValue) {
                    best = candidate;
                    bestValue = value;
                }
            }
            s.hands[win] = best;
            for (const id of submitted)
                gain(id, 0, `${r.players.find(p => p.id === win)?.name} wins ${cardName(card)} for ${bid} credits`);
        }
        if (r.round === settingsOf(r).rounds) {
            const ordered = [...ids].sort((a, b) => pokerValue(s.hands[b]) - pokerValue(s.hands[a]) || s.credits[b] - s.credits[a]);
            for (const id of ids) {
                const rank = ordered.filter(other => pokerValue(s.hands[other]) > pokerValue(s.hands[id]) || pokerValue(s.hands[other]) === pokerValue(s.hands[id]) && s.credits[other] > s.credits[id]).length;
                out(id).gain += (ids.length - rank) * 100;
                s.credits[id] = Math.max(0, s.credits[id]);
                out(id).detail = `Hand ${s.hands[id].map(cardName).join(' ')} · ${s.credits[id]} credits · rank ${rank + 1}`;
            }
        }
    }
    else if (mode === 'kingdoms') {
        const damage = s.kingdoms.map(() => 0), defense = s.kingdoms.map(() => 0), cost = s.kingdoms.map(() => 0);
        for (const id of submitted) {
            const f = faction(r, id);
            if (c[id] === 'defend') {
                defense[f] += 20;
                cost[f]++;
            }
            if (c[id].startsWith('attack:')) {
                damage[Number(c[id].split(':')[1])] += 20;
                cost[f]++;
            }
        }
        s.kingdoms = s.kingdoms.map((lp, i) => Math.max(0, lp - cost[i] - Math.max(0, damage[i] - defense[i])));
        for (const id of ids)
            gain(id, c[id] === undefined && needsChoice(r, id) ? -10 : 0, `Kingdom ${faction(r, id) + 1}: ${s.kingdoms[faction(r, id)]} life`);
        if (r.round === settingsOf(r).rounds)
            for (const id of ids)
                out(id).gain += s.kingdoms[faction(r, id)];
    }
    else if (mode === 'ghostleg') {
        const routes = [0, 1, 2, 3];
        for (const id of submitted) {
            const bridge = Number(c[id]);
            if (bridge < 3) {
                for (let i = 0; i < 4; i++)
                    routes[i] = routes[i] === bridge ? bridge + 1 : routes[i] === bridge + 1 ? bridge : routes[i];
            }
        }
        for (const id of submitted)
            gain(id, (routes[ids.indexOf(id) % 4] + 1) * 10, `Start lane ${ids.indexOf(id) % 4 + 1} → prize lane ${routes[ids.indexOf(id) % 4] + 1}`);
    }
    else if (mode === 'human-auction') {
        const captain = ids[(r.round - 1) % ids.length], bidders = submitted.filter(id => id !== captain);
        if (c[captain] !== undefined && bidders.length) {
            const bid = Math.max(...bidders.map(id => Number(c[id]) * 10)), win = winner(r, bidders.filter(id => Number(c[id]) * 10 === bid), 'team');
            for (const id of submitted)
                gain(id, id === captain ? bid + Number(c[captain]) * 10 : id === win ? Number(c[captain]) * 20 - bid : 5, `Captain ${r.players.find(p => p.id === captain)?.name} · ally ${r.players.find(p => p.id === win)?.name} · bid ${bid}`);
        }
        else
            for (const id of submitted)
                gain(id, 5, 'Auction incomplete · participation +5');
    }
    else if (mode === 'election') {
        if (r.round % 2) {
            const candidates = ids.map(id => ({ id, votes: counts(id) })), max = Math.max(...candidates.map(p => p.votes));
            if (submitted.length) {
                s.president = winner(r, candidates.filter(p => p.votes === max).map(p => p.id), 'election');
                for (const id of submitted)
                    gain(id, id === s.president ? 10 : 5, `${r.players.find(p => p.id === s.president)?.name} elected with ${max} votes`);
            }
        }
        else {
            const policy = s.president ? c[s.president] : undefined;
            if (policy === 'tax')
                s.taxed.push(s.president!);
            for (const id of submitted)
                gain(id, policy === 'share' ? 20 : policy === 'tax' ? (id === s.president ? 50 : c[id] === 'support' ? 5 : 10) : 5, policy ? `President chose ${policy}` : 'President timed out · participation +5');
        }
    }
    else if (mode === 'survival') {
        const live = ids.filter(id => s.shields[id] > 0), hits: Record<string, number> = {};
        for (const id of submitted) {
            if (c[id] === '0')
                s.energy[id]++;
            if (c[id] === '2')
                s.deflect[id]--;
            if (c[id] === '1') {
                s.energy[id]--;
                const target = live[(live.indexOf(id) + 1) % live.length];
                const struck = c[target] === '2' ? id : target;
                hits[struck] = (hits[struck] ?? 0) + 1;
            }
        }
        for (const id of live)
            s.shields[id] = Math.max(0, s.shields[id] - (hits[id] ?? 0));
        for (const id of submitted)
            gain(id, 0, `${s.shields[id]} shields · ${s.energy[id]} energy`);
        if (r.round === settingsOf(r).rounds)
            for (const id of ids)
                out(id).gain += s.shields[id] * 20 + s.energy[id] * 5;
    }
    else if (mode === 'mask') {
        const truth = counts('0'), lies = counts('1');
        for (const id of submitted)
            gain(id, c[id] === '0' ? (lies > truth ? 0 : 20) : c[id] === '1' ? (truth ? 30 : 0) : lies ? lies * 15 : -10, `Truth ${truth} · Lies ${lies} · Expose ${counts('2')}`);
    }
    else if (mode === 'selection') {
        const keep = counts('1'), audit = counts('2');
        for (const id of submitted)
            gain(id, c[id] === '0' ? 20 : c[id] === '1' ? (audit ? -20 : 40) : keep ? keep * 20 : -10, `${keep} kept the bag · ${audit} audits`);
    }
    for (const id of timedOut) {
        out(id).gain = -10;
        out(id).detail = 'Timed out · no move · −10 points';
    }
    return results;
}
