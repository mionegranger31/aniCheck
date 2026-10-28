import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import {Badge, IconButton, IconButtonProps, Tooltip} from '@mui/material';
import React, {FC} from 'react';
import {useSharedState} from './Store';
import {countUserChanges, getCutLinks, resetUserChanges} from './Utils';
import {useUpdateWorker} from './lib/useUpdateWorker';

/**
 * Undo everything the user changed by hand: hidden entries and cut links.
 * Only shown when there is something to undo.
 */
const ResetChangesButton: FC<Omit<IconButtonProps, 'onClick'>> = buttonProps => {
  const [state, setState] = useSharedState();
  const {run} = useUpdateWorker();
  const changes = countUserChanges(state.userOptions);

  if (!changes) return null;

  const reset = () => {
    const hadCutLinks = getCutLinks(state.userOptions).length > 0;
    const ok = window.confirm(
      `Undo your ${changes} change${changes === 1 ? '' : 's'}?\n\n` +
        'Every hidden entry will count again and every unlinked entry will ' +
        'be linked again. This cannot be undone.'
    );
    if (!ok) return;

    setState(s => resetUserChanges(s));
    //Series are built when the data is computed, so linked entries need a recalculation
    if (hadCutLinks && state.user.name) {
      run('fullUpdate', {user: state.user.name, cutLinks: []});
    }
  };

  return (
    <Tooltip title="Undo all hidden entries and unlinked entries">
      <IconButton
        aria-label="Undo all hidden entries and unlinked entries"
        size="large"
        {...buttonProps}
        onClick={reset}
      >
        <Badge badgeContent={changes} color="primary" max={99}>
          <RestartAltRounded />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default ResetChangesButton;
