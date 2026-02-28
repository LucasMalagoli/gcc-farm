// src/pages/Dashboard.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import { Loop, EventRepeat, DoNotDisturb } from '@mui/icons-material';
import { type AppState, ChallengeReset } from '../types';
import { useEffect, useRef } from 'react';

interface PageProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

const Dashboard = ({ appState, setAppState }: PageProps) => {
  const randomizedCellRef = useRef<HTMLTableCellElement>(null);

  const handleProgressChange = (
    characterId: string,
    challengeId: string,
    value: string
  ) => {
    const intValue = parseInt(value, 10);
    if (!isNaN(intValue)) {
      setAppState({
        ...appState,
        progress: {
          ...appState.progress,
          [characterId]: {
            ...appState.progress[characterId],
            [challengeId]: intValue,
          },
        },
      });
    }
  };

  useEffect(() => {
    if (appState.randomizedChallenge) {
      const { characterId, challengeId } = appState.randomizedChallenge;
      const challenge = appState.challenges.find(c => c.id === challengeId);
      const progress = appState.progress[characterId]?.[challengeId] ?? 0;
      if (challenge && challenge.limit !== null && progress >= challenge.limit) {
        setAppState({ ...appState, randomizedChallenge: null });
      }
    }
  }, [appState, setAppState]);

  useEffect(() => {
    if (randomizedCellRef.current) {
      randomizedCellRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [appState.randomizedChallenge]);

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 150px)', overflow: 'auto' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell align="center">Character</TableCell>
            {appState.challenges.map((challenge) => (
              <TableCell key={challenge.id} align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  {challenge.name}
                  {challenge.reset === ChallengeReset.Daily && (
                    <Tooltip title="Daily Reset">
                      <Loop fontSize="small" color="action" />
                    </Tooltip>
                  )}
                  {challenge.reset === ChallengeReset.Weekly && (
                    <Tooltip title={`Weekly Reset (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(challenge as any).weeklyDay ?? 2]})`}>
                      <EventRepeat fontSize="small" color="action" />
                    </Tooltip>
                  )}
                  {challenge.reset === ChallengeReset.Never && (
                    <Tooltip title="No Reset">
                      <DoNotDisturb fontSize="small" color="disabled" />
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {appState.characters.map((character) => (
            <TableRow key={character.id}>
              <TableCell align="center">{character.name}</TableCell>
              {appState.challenges.map((challenge) => {
                const isRandomized =
                  appState.randomizedChallenge?.characterId === character.id &&
                  appState.randomizedChallenge?.challengeId === challenge.id;

                const allowed = (character as any).allowedChallenges?.includes(challenge.id) ?? true;
                if (!allowed) {
                  return (
                    <TableCell key={challenge.id} align="center" sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                      <Typography variant="caption" color="text.disabled">N/A</Typography>
                    </TableCell>
                  );
                }

                const progress = appState.progress[character.id]?.[challenge.id] ?? 0;
                let backgroundColor = undefined;
                if (isRandomized) {
                  backgroundColor = 'rgba(94, 146, 243, 0.15)';
                } else if (challenge.limit !== null && challenge.limit > 0) {
                  if (progress >= challenge.limit) {
                    backgroundColor = 'rgba(102, 187, 106, 0.15)';
                  } else if (progress > 0) {
                    backgroundColor = 'rgba(255, 193, 7, 0.15)';
                  }
                }

                return (
                  <TableCell
                    key={challenge.id}
                    align="center"
                    ref={isRandomized ? randomizedCellRef : null}
                    sx={{
                      backgroundColor,
                      color: 'inherit',
                      transition: 'background-color 0.5s ease',
                    }}
                  >
                    <TextField
                      type="number"
                      size="small"
                      variant="outlined"
                      value={progress}
                      onChange={(e) =>
                        handleProgressChange(
                          character.id,
                          challenge.id,
                          e.target.value
                        )
                      }
                      InputProps={{
                        endAdornment: challenge.limit ? `/${challenge.limit}` : '',
                        style: { fontSize: '0.9rem' }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: isRandomized ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.02)',
                        },
                        '& input': { textAlign: 'center' }
                      }}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Dashboard;
