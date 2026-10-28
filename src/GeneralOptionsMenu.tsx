import {Box, Button, Typography, useColorScheme} from '@mui/material';
import React, {FC, useEffect} from 'react';

import MenuItem from '@mui/material/MenuItem';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import {ButtonInputRow} from './ButtonInputRow';
import {useSharedState} from './Store';
import {cutLinkType, userOptionType} from './Types';
import {getCutLinks, linkKey, updateCompletion} from './Utils';
import {useUpdateWorker} from './lib/useUpdateWorker';

const GeneralOptionsMenu: FC = () => {
  const [state, setState] = useSharedState();
  const {mode, setMode} = useColorScheme();
  const {run} = useUpdateWorker();
  const cutLinks = getCutLinks(state.userOptions);

  //Link the two entries again, series are rebuilt from the new data
  const restoreLink = (link: cutLinkType) => {
    const remaining = cutLinks.filter(
      cut => linkKey(cut.a, cut.b) !== linkKey(link.a, link.b)
    );
    setState(s => ({
      ...s,
      userOptions: {...s.userOptions, cutLinks: remaining},
    }));
    if (state.user.name) {
      run('fullUpdate', {user: state.user.name, cutLinks: remaining});
    }
  };

  const handleChangeTheme = (event: SelectChangeEvent) => {
    setMode(event.target.value as 'light' | 'dark' | 'system');
  };
  const handleChangeViz = (event: SelectChangeEvent) => {
    setState(state => {
      return {
        ...state,
        userOptions: {
          ...state.userOptions,
          vizMode: event.target.value as userOptionType['vizMode'],
        },
      };
    });
  };

  useEffect(() => {
    // setState(state => { return { ...state, globalStats: { ...state.globalStats, tot: 1 } } })
    setState(state => updateCompletion(state));
  }, [
    state.userOptions.completion,
    state.userOptions.smartCompletion,
    state.userOptions.mangaComposition,
    state.userOptions.animeComposition,
  ]);

  return (
    <Box>
      <ButtonInputRow
        name="Theme"
        helperText="Auto will set the theme based on your system options"
        control={
          <Select
            labelId="select-theme"
            id="select-theme"
            value={mode}
            onChange={handleChangeTheme}
            sx={{width: '100px'}}
          >
            <MenuItem value={'system'}>System</MenuItem>
            <MenuItem value={'light'}>Light</MenuItem>
            <MenuItem value={'dark'}>Dark</MenuItem>
          </Select>
        }
      />
      <ButtonInputRow
        name="Visualization Type"
        helperText="Graph is best for showing relashionships. List (WIP) for a more ordered display."
        sx={{mt: 2}}
        control={
          <Select
            labelId="select-visualization"
            id="select-visualization"
            value={state.userOptions.vizMode}
            onChange={handleChangeViz}
            sx={{width: '100px'}}
          >
            <MenuItem value={'graph'}>Graph</MenuItem>
            <MenuItem value={'list'}>List</MenuItem>
            {/* <MenuItem value={"dark"}>Dark</MenuItem> */}
          </Select>
        }
      />
      {cutLinks.length > 0 && (
        <Box sx={{mt: 3}}>
          <Typography variant="subtitle2" color="text.secondary">
            Unlinked entries
          </Typography>
          {cutLinks.map(link => (
            <ButtonInputRow
              key={linkKey(link.a, link.b)}
              name={`${link.titleA} ↔ ${link.titleB}`}
              helperText="Not considered related anymore"
              sx={{mt: 1}}
              control={
                <Button size="small" onClick={() => restoreLink(link)}>
                  Restore
                </Button>
              }
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
export default GeneralOptionsMenu;
