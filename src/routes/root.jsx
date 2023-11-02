import logo from '../app_icon.webp';
import '../App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Fab,
  Paper,
  styled,
  ThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';
import {Restore, Search, Settings} from '@mui/icons-material';

import {createTheme} from '@mui/material/styles';
import {useState} from "react";
import {Link as RouterLink, Outlet} from "react-router-dom";

const theme = createTheme({
  palette: {
    white: {
      main: '#ffffff',
    }
  },
});


const StyledFab = styled(Fab)({
  position: 'absolute',
  zIndex: 1,
  top: -30,
  left: 0,
  right: 0,
  margin: '0 auto',
});


function TopBar() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='sticky' color={"white"}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} fontSize={"1.2em"} >
              <img src={logo} className="App-logo" alt="logo" />
              PictoLex
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}


function BottomBar() {
  const [value, setValue] = useState(null);
  return (
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
          }}
        >
          <BottomNavigationAction label="Recents" icon={<Restore />} component={RouterLink} to={"/history"} />
          <RouterLink to={"/"}>
            <StyledFab color="secondary" aria-label="add" onClick={()=>{setValue(null)}}>
                <Search />
            </StyledFab>
          </RouterLink>
          <BottomNavigationAction label="Settings" icon={<Settings />} component={RouterLink} to={"/settings"} />
        </BottomNavigation>
      </Paper>
  )
}

function Root() {
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <TopBar/>
        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
        <BottomBar/>
      </ThemeProvider>
    </div>
  );
}


export default Root;