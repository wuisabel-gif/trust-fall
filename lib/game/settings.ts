export const ROUND_OPTIONS = [3, 5, 7] as const;
export const TIMER_OPTIONS = [30, 45, 60, 90] as const;
export type MatchSettings = { rounds: number; negotiationSeconds: number };
export const DEFAULT_SETTINGS: MatchSettings = { rounds: 5, negotiationSeconds: 45 };
export function settingsOf(room: { settings?: MatchSettings }): MatchSettings {
    return room.settings ?? DEFAULT_SETTINGS;
}
