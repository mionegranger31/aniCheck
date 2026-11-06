import {Dispatch, useEffect, useState} from 'react';
import {singletonHook} from 'react-singleton-hook';
import {useSharedState} from '../Store';
import {cutLinkType} from '../Types';
import {talkingWorker} from './WebWorkersInterfaces';

type cutLinksType = Pick<cutLinkType, 'a' | 'b'>[];

//This hook runs in a React root of its own, outside the shared state provider
//(the state is undefined in here), so it can't read the user options.
//What shapes the series (the relations the user cut, how "Other" relations
//are treated) is handed over by a component that is inside the provider
//(ManagerWorkerResult), and used by every update that doesn't say otherwise.
type updateOptionsType = {
  cutLinks: cutLinksType;
  splitOtherRelations: boolean;
};
let latestOptions: updateOptionsType = {
  cutLinks: [],
  splitOtherRelations: false,
};
export const setOptionsForUpdates = (options: updateOptionsType) => {
  latestOptions = {
    cutLinks: options.cutLinks.map(({a, b}) => ({a, b})),
    splitOtherRelations: options.splitOtherRelations,
  };
};

//sabre
const IHateSingletonHookCreator = (
  action: 'fullUpdate',
  args: {
    user: string;
    cutLinks?: cutLinksType;
    splitOtherRelations?: boolean;
  }
) => {
  console.log('Running');
  console.log(talkingWorker);
  talkingWorker.postMessage({
    type: 'start',
    action: action,
    arguments: {
      user: args.user,
      cutLinks: args.cutLinks ?? latestOptions.cutLinks,
      splitOtherRelations:
        args.splitOtherRelations ?? latestOptions.splitOtherRelations,
    },
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
  const run = IHateSingletonHookCreator;

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
