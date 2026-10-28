import {problematicNodes} from '../ProblematicNodes';
import {computeData, relationPriority} from '../Utils';
import {GET_LISTS} from './queries';

type CutLinks = {a: string; b: string}[];
type FullUpdateArgs = {user: string; cutLinks?: CutLinks};

const ANILIST_URL = 'https://graphql.anilist.co';

const state: {running: boolean; pending: FullUpdateArgs | null} = {
  running: false,
  pending: null,
};

/** Fetch one list type, turning every way AniList can refuse into a readable error */
const fetchLists = async (user: string, type: 'ANIME' | 'MANGA') => {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({query: GET_LISTS, variables: {user, type}}),
  });

  if (res.status === 429) {
    const wait = res.headers.get('Retry-After');
    throw new Error(
      `AniList is limiting requests, try again ${
        wait ? `in ${wait} seconds` : 'in a minute'
      }`
    );
  }

  const json = await res.json().catch(() => null);
  if (!json || json.errors?.length || !json.data?.MediaListCollection) {
    const reason = json?.errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new Error(`AniList did not return the ${type} list (${reason})`);
  }
  return json.data.MediaListCollection.lists as any[];
};

const fullUpdate = async ({user, cutLinks = []}: FullUpdateArgs) => {
  self.postMessage({
    type: 'status',
    status: 'loading',
    log: 'Loading your Anime&Manga List',
  });

  const [animeLists, mangaLists] = await Promise.all([
    fetchLists(user, 'ANIME'),
    fetchLists(user, 'MANGA'),
  ]);

  self.postMessage({
    type: 'status',
    status: 'loading',
    log: '⚙ Computing received data',
  });

  const res = computeData(
    [...animeLists, ...mangaLists],
    relationPriority,
    problematicNodes,
    cutLinks
  );

  self.postMessage({
    type: 'status',
    status: 'success',
    log: '✅ Computation Completed!',
  });
  self.postMessage({type: 'result', action: 'fullUpdate', result: res});
};

/**
 * Runs the update, and whatever happens the worker is free again afterwards.
 * A request that arrives while an update is running is not lost: the latest
 * one runs as soon as the current one is over.
 */
const runFullUpdate = async (args: FullUpdateArgs) => {
  if (state.running) {
    console.log('Already executing the action, will run again after it');
    state.pending = args;
    return;
  }
  state.running = true;
  try {
    await fullUpdate(args);
  } catch (error) {
    console.error(error);
    self.postMessage({
      type: 'status',
      status: 'error',
      log: `⚠ ${error instanceof Error ? error.message : 'Update failed'}`,
    });
    self.postMessage({type: 'error', error: String(error)});
  } finally {
    state.running = false;
  }

  const next = state.pending;
  state.pending = null;
  if (next) await runFullUpdate(next);
};

self.onmessage = async e => {
  const data: {
    type: 'start';
    action: 'fullUpdate';
    arguments: FullUpdateArgs;
  } = e.data;
  console.log(e);

  if (data.type === 'start') {
    switch (data.action) {
      case 'fullUpdate':
        await runFullUpdate(data.arguments);
        break;

      default:
        console.log('Unknown action');
        break;
    }
  }
};
