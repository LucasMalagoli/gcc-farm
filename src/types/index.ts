// src/types/index.ts
export interface Character {
  id: string;
  name: string;
}

export enum ChallengeReset {
  Daily = 'daily',
  Weekly = 'weekly',
  Never = 'never',
}

export interface Challenge {
  id: string;
  name: string;
  reset: ChallengeReset;
  limit: number | null;
}

export interface AppState {
  characters: Character[];
  challenges: Challenge[];
  progress: {
    [characterId: string]: {
      [challengeId: string]: number;
    };
  };
  randomizedChallenge: {
    characterId: string;
    challengeId: string;
  } | null;
}
