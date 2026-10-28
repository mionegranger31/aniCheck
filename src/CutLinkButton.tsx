import LinkOffRounded from '@mui/icons-material/LinkOffRounded';
import {
  IconButton,
  IconButtonProps,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import React, {FC, useState} from 'react';
import {useSharedState} from './Store';
import {NodeType} from './Types';
import {getCutLinks, linkKey} from './Utils';
import {useUpdateWorker} from './lib/useUpdateWorker';

type props = {
  node: NodeType;
} & Omit<IconButtonProps, 'onClick'>;

/**
 * Lists what this entry is linked to inside the open series and lets the user
 * cut one of those links because it isn't a real relation. Only that link is
 * cut: both entries keep every other relation they have.
 */
const CutLinkButton: FC<props> = ({node, ...buttonProps}) => {
  const [state, setState] = useSharedState();
  const {run} = useUpdateWorker();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const neighbours = (() => {
    const serie = state.seriesSelected?.series;
    if (!serie) return [];
    const nodeId = String(node.id);
    const byId = new Map(serie.nodes.map(n => [String(n.id), n]));
    const found = new Map<string, {node: NodeType; relation: string}>();
    for (const edge of serie.edges) {
      const source = String(edge.source);
      const target = String(edge.target);
      const otherId =
        source === nodeId ? target : target === nodeId ? source : undefined;
      const other = otherId ? byId.get(otherId) : undefined;
      if (otherId && other && !found.has(otherId)) {
        found.set(otherId, {node: other, relation: edge.relation});
      }
    }
    return [...found.values()];
  })();

  //Nothing to cut for an entry linked to nothing
  if (!neighbours.length) return null;

  const cutLink = (other: NodeType) => {
    setAnchor(null);
    const current = getCutLinks(state.userOptions);
    const key = linkKey(node.id, other.id);
    if (current.some(link => linkKey(link.a, link.b) === key)) return;

    const cutLinks = [
      ...current,
      {
        a: String(node.id),
        b: String(other.id),
        titleA: node.title,
        titleB: other.title,
      },
    ];
    setState(s => ({...s, userOptions: {...s.userOptions, cutLinks}}));
    //Series are built when the data is computed, so recalculate right away
    if (state.user.name) {
      run('fullUpdate', {user: state.user.name, cutLinks});
    }
  };

  return (
    <>
      <Tooltip title="This entry isn't related to one of these? Cut that link">
        <IconButton
          size="small"
          aria-label="Cut a link with another entry"
          {...buttonProps}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            setAnchor(event.currentTarget);
          }}
        >
          <LinkOffRounded />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        <ListSubheader>Not related to…</ListSubheader>
        {neighbours.map(({node: other, relation}) => (
          <MenuItem key={other.id} onClick={() => cutLink(other)}>
            <ListItemText
              primary={other.title}
              secondary={relation.toLowerCase().replace(/_/g, ' ')}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default CutLinkButton;
