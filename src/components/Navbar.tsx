// src/components/Navbar.tsx
import { AppBar, Toolbar, Button } from '@mui/material';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onRandomize: () => void;
}

const Navbar = ({ onRandomize }: NavbarProps) => {
  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Button color="inherit" component={Link} to="/">
          Dashboard
        </Button>
        <Button color="inherit" onClick={onRandomize}>
          Randomizer
        </Button>
        <Button color="inherit" component={Link} to="/config">
          Configuration
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
