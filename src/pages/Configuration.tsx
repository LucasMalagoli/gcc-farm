// src/pages/Configuration.tsx
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import type { AppState, Character, Challenge } from '../types';
import { ChallengeReset } from '../types';
import { Add, Delete, ArrowUpward, ArrowDownward, Sync, LinkOff, Save, Settings } from '@mui/icons-material';
import { useState } from 'react';
import { validateState } from '../data/store';

interface PageProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
  fileHandle: FileSystemFileHandle | null;
  onLinkFile: () => Promise<void>;
  onCreateFile: () => Promise<void>;
  onUnlinkFile: () => void;
}

const Configuration = ({ appState, setAppState, fileHandle, onLinkFile, onCreateFile, onUnlinkFile }: PageProps) => {
  const [newCharName, setNewCharName] = useState('');
  const [newChallengeName, setNewChallengeName] = useState('');
  const [editingChar, setEditingChar] = useState<Character | null>(null);

  const handleAddCharacter = () => {
    if (newCharName.trim() === '') return;
    const newChar: Character = {
      id: `char${new Date().getTime()}`,
      name: newCharName.trim(),
      allowedChallenges: appState.challenges.map(c => c.id),
    } as any;
    const newCharacters = [...appState.characters, newChar];
    const newProgress = { ...appState.progress };
    newProgress[newChar.id] = {};
    appState.challenges.forEach(c => {
      newProgress[newChar.id][c.id] = 0;
    })

    setAppState({ ...appState, characters: newCharacters, progress: newProgress });
    setNewCharName('');
  };

  const handleDeleteCharacter = (charId: string) => {
    const newCharacters = appState.characters.filter((c) => c.id !== charId);
    const newProgress = { ...appState.progress };
    delete newProgress[charId];
    setAppState({ ...appState, characters: newCharacters, progress: newProgress });
  };

  const moveCharacter = (index: number, direction: 'up' | 'down') => {
    const newCharacters = [...appState.characters];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newCharacters.length) return;
    const [char] = newCharacters.splice(index, 1);
    newCharacters.splice(newIndex, 0, char);
    setAppState({ ...appState, characters: newCharacters });
  };

  const handleAddChallenge = () => {
    if (newChallengeName.trim() === '') return;
    const newChallenge: Challenge = {
      id: `chal${new Date().getTime()}`,
      name: newChallengeName.trim(),
      reset: ChallengeReset.Never,
      limit: null
    };
    const newChallenges = [...appState.challenges, newChallenge];
    const newCharacters = appState.characters.map(char => ({
      ...char,
      allowedChallenges: [...((char as any).allowedChallenges || []), newChallenge.id]
    }));
    const newProgress = { ...appState.progress };
    appState.characters.forEach(char => {
      newProgress[char.id][newChallenge.id] = 0;
    });

    setAppState({ ...appState, characters: newCharacters, challenges: newChallenges, progress: newProgress });
    setNewChallengeName('');
  }

  const handleDeleteChallenge = (chalId: string) => {
    const newChallenges = appState.challenges.filter(c => c.id !== chalId);
    const newProgress = { ...appState.progress };
    appState.characters.forEach(char => {
      delete newProgress[char.id][chalId];
    });
    setAppState({ ...appState, challenges: newChallenges, progress: newProgress });
  }

  const moveChallenge = (index: number, direction: 'up' | 'down') => {
    const newChallenges = [...appState.challenges];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newChallenges.length) return;
    const [chal] = newChallenges.splice(index, 1);
    newChallenges.splice(newIndex, 0, chal);
    setAppState({ ...appState, challenges: newChallenges });
  }

  const handleChallengeUpdate = (updatedChallenge: Challenge) => {
    const newChallenges = appState.challenges.map(c => c.id === updatedChallenge.id ? updatedChallenge : c);
    setAppState({ ...appState, challenges: newChallenges });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Configuration</Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Paper sx={{ flex: 1, p: 3 }}>
          <Typography variant="h5" gutterBottom>Characters</Typography>
          <List>
            {appState.characters.map((char, index) => (
              <ListItem key={char.id}>
                <ListItemText primary={char.name} />
                <IconButton onClick={() => setEditingChar(char)}>
                  <Settings />
                </IconButton>
                <IconButton onClick={() => moveCharacter(index, 'up')} disabled={index === 0}>
                  <ArrowUpward />
                </IconButton>
                <IconButton onClick={() => moveCharacter(index, 'down')} disabled={index === appState.characters.length - 1}>
                  <ArrowDownward />
                </IconButton>
                <IconButton onClick={() => handleDeleteCharacter(char.id)}>
                  <Delete />
                </IconButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <TextField
              size="small"
              label="New Character Name"
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              sx={{ mr: 2 }}
            />
            <Button onClick={handleAddCharacter} startIcon={<Add />}>
              Add Character
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ flex: 1, p: 3 }}>
          <Typography variant="h5" gutterBottom>Challenges</Typography>
          <List>
            {appState.challenges.map((chal, index) => (
              <ListItem key={chal.id} sx={{ px: 0, py: 2 }} divider={index < appState.challenges.length - 1}>
                <Box sx={{ display: 'flex', width: '100%', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TextField
                    size="small"
                    label="Name"
                    value={chal.name}
                    onChange={(e) => handleChallengeUpdate({ ...chal, name: e.target.value })}
                    sx={{ flexGrow: 1, minWidth: '200px' }}
                  />
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 120 }} size="small">
                      <InputLabel>Reset</InputLabel>
                      <Select
                        label="Reset"
                        value={chal.reset}
                        onChange={(e) => handleChallengeUpdate({ ...chal, reset: e.target.value as ChallengeReset })}
                      >
                        <MenuItem value={ChallengeReset.Daily}>Daily</MenuItem>
                        <MenuItem value={ChallengeReset.Weekly}>Weekly</MenuItem>
                        <MenuItem value={ChallengeReset.Never}>Never</MenuItem>
                      </Select>
                    </FormControl>
                    {chal.reset === ChallengeReset.Weekly && (
                      <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Day</InputLabel>
                        <Select
                          // @ts-ignore
                          value={chal.weeklyDay !== undefined ? chal.weeklyDay : 2}
                          label="Day"
                          onChange={(e) => handleChallengeUpdate({ ...chal, weeklyDay: e.target.value as number } as any)}
                        >
                          <MenuItem value={0}>Sunday</MenuItem>
                          <MenuItem value={1}>Monday</MenuItem>
                          <MenuItem value={2}>Tuesday</MenuItem>
                          <MenuItem value={3}>Wednesday</MenuItem>
                          <MenuItem value={4}>Thursday</MenuItem>
                          <MenuItem value={5}>Friday</MenuItem>
                          <MenuItem value={6}>Saturday</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                    <TextField
                      type="number"
                      size="small"
                      label="Limit"
                      value={chal.limit === null ? '' : chal.limit}
                      onChange={(e) => handleChallengeUpdate({ ...chal, limit: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                      sx={{ width: '100px' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <IconButton onClick={() => moveChallenge(index, 'up')} disabled={index === 0}>
                      <ArrowUpward />
                    </IconButton>
                    <IconButton onClick={() => moveChallenge(index, 'down')} disabled={index === appState.challenges.length - 1}>
                      <ArrowDownward />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteChallenge(chal.id)}>
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <TextField
              size="small"
              label="New Challenge Name"
              value={newChallengeName}
              onChange={(e) => setNewChallengeName(e.target.value)}
              sx={{ mr: 2 }}
            />
            <Button onClick={handleAddChallenge} startIcon={<Add />}>
              Add Challenge
            </Button>
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h5" gutterBottom>Data Sync</Typography>
        {fileHandle ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Syncing with: <strong>{fileHandle.name}</strong>
            </Typography>
            <Button variant="outlined" startIcon={<LinkOff />} onClick={onUnlinkFile}>
              Disconnect File
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Automatically sync your data with a local JSON file. This requires a modern browser that supports the File System Access API.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<Sync />} onClick={onLinkFile} disabled={!('showOpenFilePicker' in window)}>
                Link to Existing File
              </Button>
              <Button variant="outlined" startIcon={<Save />} onClick={onCreateFile} disabled={!('showSaveFilePicker' in window)}>
                Create New File
              </Button>
            </Box>
          </>
        )}
      </Paper>

      <Dialog open={!!editingChar} onClose={() => setEditingChar(null)}>
        <DialogTitle>Allowed Challenges for {editingChar?.name}</DialogTitle>
        <DialogContent>
          <FormGroup>
            {appState.challenges.map(chal => (
              <FormControlLabel
                key={chal.id}
                control={
                  <Checkbox
                    checked={(editingChar as any)?.allowedChallenges?.includes(chal.id) ?? false}
                    onChange={(e) => {
                      if (!editingChar) return;
                      const currentAllowed = (editingChar as any).allowedChallenges || [];
                      let newAllowed;
                      if (e.target.checked) {
                        newAllowed = [...currentAllowed, chal.id];
                      } else {
                        newAllowed = currentAllowed.filter((id: string) => id !== chal.id);
                      }
                      const updatedChar = { ...editingChar, allowedChallenges: newAllowed };
                      setEditingChar(updatedChar);
                      const newChars = appState.characters.map(c => c.id === updatedChar.id ? updatedChar : c);
                      setAppState({ ...appState, characters: newChars });
                    }}
                  />
                }
                label={chal.name}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingChar(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Configuration;
