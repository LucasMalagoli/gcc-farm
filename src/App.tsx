// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme, Box, Modal, Typography, Button } from '@mui/material';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Configuration from './pages/Configuration';
import { type AppState, ChallengeReset } from './types';
import { loadState, validateState, sanitizeState } from './data/store';
import { get, set, del } from 'idb-keyval'; // For persisting file handles in IndexedDB
import { useEffect, useState } from 'react';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5e92f3', // Softer, less neon blue
    },
    secondary: {
      main: '#c48b9f', // Muted pink/purple
    },
    background: {
      default: '#12161d', // Soft dark slate
      paper: '#1a2027',   // Slightly lighter slate for cards
    },
    text: {
      primary: '#e3e8ee',
      secondary: '#94a0b8',
    },
  },
  shape: {
    borderRadius: 16, // Significantly rounder corners globally
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none', // Remove ALL CAPS from buttons for a softer feel
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a2027',
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)', // Soft, diffused shadow
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24, // Pill-shaped buttons
          boxShadow: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)', // Very subtle dividers
        },
      },
    },
  },
});

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: 'none',
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  p: 4,
  outline: 'none',
  textAlign: 'center',
};

function App() {
  const [appState, setAppState] = useState<AppState>(loadState());
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    const saveData = async () => {
      if (fileHandle) {
        try {
          if ((await fileHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
            if ((await fileHandle.requestPermission({ mode: 'readwrite' })) !== 'granted') {
              console.error('Permission to write to file was denied.');
              alert('Could not save to file: Permission denied.');
              setFileHandle(null); // Disconnect if permission is lost
              return;
            }
          }

          const writable = await fileHandle.createWritable();
          // Create a deep copy to avoid potential race conditions or mutations
          const stateToSave = JSON.parse(JSON.stringify(appState));
          await writable.write(JSON.stringify(stateToSave, null, 2));
          await writable.close();
        } catch (error) {
          console.error('Error saving to file:', error);
          alert(`An error occurred while saving to ${fileHandle.name}. See console for details.`);
          setFileHandle(null); // Disconnect on error
        }
      }
    };

    // Debounce saving to avoid excessive writes
    const timer = setTimeout(() => saveData(), 500);
    return () => clearTimeout(timer);

  }, [appState, fileHandle, isInitialized]);

  useEffect(() => {
    const initializeApp = async () => {
      let initialState = loadState(); // Start with default

      try {
        // Try to load the file handle from IndexedDB
        const handle: FileSystemFileHandle | undefined = await get('fileHandle');

        if (handle) {
          // Check for permission without prompting the user. If not granted, we can't load.
          if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') {
            const file = await handle.getFile();
            const contents = await file.text();
            const json = JSON.parse(contents);

            if (validateState(json)) {
              initialState = sanitizeState(json); // Use file state if valid
              setFileHandle(handle);
              console.log(`Successfully loaded state from ${handle.name}`);
            } else {
              // The file is invalid, so we remove the handle and fall back to default.
              await del('fileHandle');
            }
          } else {
            // Permission not granted, so we can't load. Remove the handle.
            await del('fileHandle');
          }
        }
      } catch (error) {
        console.error('Failed to load from persisted file handle:', error);
        // If loading fails, remove the handle and proceed with the default state.
        await del('fileHandle');
      }

      // Now, run resets on the determined initial state
      const now = new Date();
      const spFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const spDateString = spFormatter.format(now);
      const todayResetTime = new Date(`${spDateString}T00:00:00-03:00`).getTime();

      // @ts-ignore
      const lastCheck = initialState.lastResetCheck || 0;
      let newState = { ...initialState };
      let hasChanges = false;

      newState.challenges.forEach((chal) => {
        let shouldReset = false;
        if (chal.reset === ChallengeReset.Daily) {
          if (lastCheck < todayResetTime) shouldReset = true;
        } else if (chal.reset === ChallengeReset.Weekly) {
          // @ts-ignore
          const weeklyDay = chal.weeklyDay !== undefined ? chal.weeklyDay : 2; // Default Tuesday
          const currentDayOfWeek = new Date(todayResetTime).getUTCDay();
          let daysSinceWeeklyReset = currentDayOfWeek - weeklyDay;
          if (daysSinceWeeklyReset < 0) daysSinceWeeklyReset += 7;
          const thisWeekResetTime =
            todayResetTime - daysSinceWeeklyReset * 24 * 60 * 60 * 1000;
          if (lastCheck < thisWeekResetTime) shouldReset = true;
        }

        if (shouldReset) {
          newState.characters.forEach((char) => {
            newState.progress[char.id][chal.id] = 0;
          });
          hasChanges = true;
        }
      });

      if (hasChanges || lastCheck < Date.now()) {
        // @ts-ignore
        newState.lastResetCheck = Date.now();
      }

      // Set the final, fully initialized state
      setAppState(newState);
      setIsInitialized(true);
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleOpenRandomizer = () => {
    setIsFadingOut(false);
    setRandomizerOpen(true);
  };

  const linkFile = async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });

      const file = await handle.getFile();
      const contents = await file.text();
      const json = JSON.parse(contents);

      if (validateState(json)) {
        setAppState(sanitizeState(json));
        setFileHandle(handle);
        await set('fileHandle', handle); // Persist handle
      } else {
        alert('Invalid file format. The selected file is not a valid state file.');
      }
    } catch (error) {
      console.error('Error linking file:', error);
    }
  };

  const createFile = async () => {
    try {
      const handle = await window.showSaveFilePicker({
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });
      setFileHandle(handle);
      await set('fileHandle', handle); // Persist handle
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const unlinkFile = async () => {
    setFileHandle(null);
    await del('fileHandle'); // Remove persisted handle
  };

  const handleRoll = () => {
    const uncompleted: { characterId: string; challengeId: string }[] = [];
    appState.characters.forEach((char) => {
      appState.challenges.forEach((chal) => {
        const allowed = (char as any).allowedChallenges?.includes(chal.id) ?? true;
        if (!allowed) return;

        const progress = appState.progress[char.id][chal.id];
        const limit = chal.limit;
        if (limit === null || progress < limit) {
          uncompleted.push({ characterId: char.id, challengeId: chal.id });
        }
      });
    });

    if (uncompleted.length === 0) {
      setAppState({ ...appState, randomizedChallenge: null });
      return;
    }

    const randomIndex = Math.floor(Math.random() * uncompleted.length);
    const randomPair = uncompleted[randomIndex];

    setAppState({ ...appState, randomizedChallenge: randomPair });

    setTimeout(() => {
      setIsFadingOut(true);
    }, 1000);

    setTimeout(() => {
      setRandomizerOpen(false);
      setIsFadingOut(false);
    }, 2000);
  };

  const randomizedCharacter = appState.randomizedChallenge ? appState.characters.find(c => c.id === appState.randomizedChallenge?.characterId) : null;
  const randomizedChallenge = appState.randomizedChallenge ? appState.challenges.find(c => c.id === appState.randomizedChallenge?.challengeId) : null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <Navbar onRandomize={handleOpenRandomizer} />
          <Box component="main" sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            <Routes>
              <Route path="/" element={<Dashboard appState={appState} setAppState={setAppState} />} />
              <Route
                path="/config"
                element={
                  <Configuration
                    appState={appState} setAppState={setAppState}
                    fileHandle={fileHandle} onLinkFile={linkFile} onCreateFile={createFile} onUnlinkFile={unlinkFile}
                  />}
              />
            </Routes>
          </Box>
        </Box>
        <Modal
          open={randomizerOpen}
          onClose={() => setRandomizerOpen(false)}
        >
          <Box sx={{
            ...modalStyle,
            opacity: isFadingOut ? 0 : 1,
            transition: 'opacity 1s ease-out'
          }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Randomizer
            </Typography>
            {randomizedCharacter && randomizedChallenge && (
              <>
                <Typography variant="body1">Your random pick is:</Typography>
                <Typography variant="h5" sx={{ mt: 1, mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                  {randomizedCharacter.name} - {randomizedChallenge.name}
                </Typography>
              </>
            )}
            <Button variant="contained" size="large" onClick={handleRoll} sx={{ mt: 2 }}>
              Roll
            </Button>
          </Box>
        </Modal>
      </Router>
    </ThemeProvider>
  );
}

export default App;
