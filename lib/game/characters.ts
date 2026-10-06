export const CHARACTERS = ['Shadow', 'Strategist', 'Oracle', 'Scholar', 'Silver', 'Diplomat', 'Ember', 'Raven'] as const;
export function characterIndex(value: unknown): number {
  if (value === undefined) return 0;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= CHARACTERS.length) {
    throw new Error('Choose one of the available characters.');
  }
  return value;
}
