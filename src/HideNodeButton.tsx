import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import {IconButton, IconButtonProps, Tooltip} from '@mui/material';
import React, {FC} from 'react';
import {useSharedState} from './Store';
import {NodeType} from './Types';
import {isNodeHidden, toggleHiddenNode} from './Utils';

type props = {
  node: NodeType;
} & Omit<IconButtonProps, 'onClick'>;

/**
 * Hide an entry so it doesn't count for the completion of its series,
 * or bring it back if it was already hidden.
 */
const HideNodeButton: FC<props> = ({node, ...buttonProps}) => {
  const [state, setState] = useSharedState();
  const hidden = isNodeHidden(state.userOptions, node.id);
  const label = hidden
    ? 'Count this entry again'
    : "Hide this entry, it won't count for completion";

  return (
    <Tooltip title={label}>
      <IconButton
        size="small"
        aria-label={label}
        {...buttonProps}
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          setState(state => toggleHiddenNode(state, node.id));
        }}
      >
        {hidden ? <VisibilityRounded /> : <VisibilityOffRounded />}
      </IconButton>
    </Tooltip>
  );
};

export default HideNodeButton;
