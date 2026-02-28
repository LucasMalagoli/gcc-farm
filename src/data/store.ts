// src/data/store.ts
import type { AppState, Challenge, Character } from '../types';
import { ChallengeReset } from '../types';

const initialCharacters: Character[] = [
  { id: 'char1', name: 'Character 1', allowedChallenges: ['chal1', 'chal2', 'chal3'] } as any,
  { id: 'char2', name: 'Character 2', allowedChallenges: ['chal1', 'chal2', 'chal3'] } as any,
  { id: 'char3', name: 'Character 3', allowedChallenges: ['chal1', 'chal2', 'chal3'] } as any,
];

const initialChallenges: Challenge[] = [
  { id: 'chal1', name: 'Challenge 1', reset: ChallengeReset.Daily, limit: 5 },
  { id: 'chal2', name: 'Challenge 2', reset: ChallengeReset.Weekly, limit: 1, weeklyDay: 2 } as any,
  { id: 'chal3', name: 'Challenge 3', reset: ChallengeReset.Never, limit: null },
];

const initialProgress = () => {
  const progress: AppState['progress'] = {};
  initialCharacters.forEach(char => {
    progress[char.id] = {};
    initialChallenges.forEach(chal => {
      progress[char.id][chal.id] = 0;
    });
  });
  return progress;
}

export const loadState = (): AppState => {
  return {
    characters: initialCharacters,
    challenges: initialChallenges,
    progress: initialProgress(),
    randomizedChallenge: null,
  };
};

export const validateState = (data: any): data is AppState => {
  if (typeof data !== 'object' || data === null) return false;
  const { characters, challenges, progress } = data;
  return Array.isArray(characters) && Array.isArray(challenges) && typeof progress === 'object';
};

export const sanitizeState = (state: AppState): AppState => {
  const newState = { ...state };
  let hasChanges = false;

  if (!newState.progress) {
    newState.progress = {};
    hasChanges = true;
  }

  newState.characters = newState.characters.map(char => {
    if (!(char as any).allowedChallenges) {
      hasChanges = true;
      return { ...char, allowedChallenges: newState.challenges.map(c => c.id) } as any;
    }
    return char;
  });

  newState.characters.forEach(char => {
    if (!newState.progress[char.id]) {
      newState.progress[char.id] = {};
      hasChanges = true;
    }
    newState.challenges.forEach(chal => {
      if (typeof newState.progress[char.id][chal.id] !== 'number') {
        newState.progress[char.id][chal.id] = 0;
        hasChanges = true;
      }
    });
  });

  return hasChanges ? newState : state;
};
