import {Dispatch, useEffect, useState} from 'react';
import {singletonHook} from 'react-singleton-hook';
import {useSharedState} from '../Store';
import {cutLinkType} from '../Types';
import {getCutLinks} from '../Utils';
import {talkingWorker} from './WebWorkersInterfaces';
//sabre
const IHateSingletonHookCreator = (
  action: 'fullUpdate',
  args: {user: string; cutLinks?: Pick<cutLinkType, 'a' | 'b'>[]}
) => {
  console.log('Running');
  console.log(talkingWorker);
  talkingWorker.postMessage({
    type: 'start',
    action: action,
    arguments: {user: args.user, cutLinks: args.cutLinks ?? []},
  });
};

export const updateWorker = () => {
  const [state, setState] = useSharedState();
  const [status, setStatus] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  // const wrk = useRef<Worker>(talkingWorker);
  // const run = useCallback((action: "fullUpdate", args: { user: string }) => {
  //   console.log("Running");
  //   console.log(talkingWorker);
  //   talkingWorker.postMessage({
  //     type: "start",
  //     action: action,
  //     arguments: { user: args.user },
  //   });
  // }, []);
  //Every update, whoever starts it, must use the links the user has cut.
  //Reading them while rendering is what makes this hook update when they change.
  const cutLinks = getCutLinks(state.userOptions).map(({a, b}) => ({a, b}));
  const run = (
    action: Parameters<typeof IHateSingletonHookCreator>[0],
    args: Parameters<typeof IHateSingletonHookCreator>[1]
  ) =>
    IHateSingletonHookCreator(action, {
      ...args,
      cutLinks: args.cutLinks ?? cutLinks,
    });

  // const getResult = () => {
  //   setResult(null);
  //   return result;
  // };

  useEffect(() => {
    console.log('Setting Up WorkerHook');
    talkingWorker.onmessage = e => {
      console.log(e);
      e.data.type === 'status' && setStatus([e.data.status, e.data.log]);
      e.data.type === 'result' && setResult(e.data);
      e.data.type === 'error' && setError(e.data.error);
    };
  }, []);

  return {run, status, result, setResult, setStatus, error};
};

export const useUpdateWorker = singletonHook(
  {
    run: IHateSingletonHookCreator,
    status: null,
    result: null,
    setResult: (() => {}) as Dispatch<any>,
    setStatus: (() => {}) as Dispatch<any>,
    error: null,
  },
  updateWorker
);
