import { QueueingSubject } from "queueing-subject";
import { BehaviorSubject, merge, Observable, Subject } from "rxjs";
import { filter, ignoreElements, map, mergeAll, share, tap } from "rxjs/operators";

export type Reducer<S, P = any> = (state: S, payload: P) => S;
export type Epic<S = any, A extends IAction = IAction<S>, R extends IAction = IAction<S>> = (
  action$: Observable<A>,
  state$: Observable<S>,
) => Observable<R>;

export interface IAction <S = any, P = any> {
  type?: symbol;
  payload: P;
  reducer?: Reducer<S, P>;
}

export type DispatchFn<S> = (action: IAction<S>) => void;

export interface IEpicKit<S> {
  state$: BehaviorSubject<S>;
  action$: Subject<IAction<S>>;
  epic$: Observable<[S, IAction<S>]>;
  dispatch: DispatchFn<S>;
}

export const createAction = <S = any>(
  typeOrReducer: symbol | Reducer<S>,
  reducer?: Reducer<S>,
): IAction<S> => ({
  type: typeof typeOrReducer === "symbol" ? typeOrReducer : undefined,
  reducer: typeof typeOrReducer === "function" ? typeOrReducer : reducer,
  payload: undefined,
});

export const createActionWithPayload = <S, P>(
  typeOrReducer: symbol | Reducer<S, P>,
  reducer?: Reducer<S, P>,
) => (
  payload: P,
): IAction<S, P> => ({
  type: typeof typeOrReducer === "symbol" ? typeOrReducer : undefined,
  reducer: typeof typeOrReducer === "function" ? typeOrReducer : reducer,
  payload,
});

export const reduceState = <S, T extends IAction<S>>(
  state$: BehaviorSubject<S>,
  action$: Observable<T>,
): Observable<[S, T]> =>
  action$.pipe(
    tap(({reducer, payload}) => {
      if (reducer) {
        state$.next(reducer(state$.getValue(), payload));
      }
    }),
    map<T, [S, T]>((action) => [state$.getValue(), action]),
  );

export const connectEpics = <S>(
  state$: BehaviorSubject<S>,
  action$: Subject<IAction<S>>,
  epics: Array<Epic<S>>,
): Observable<never> =>
  merge(
    epics.map((epic) => epic(action$, state$)),
  )
  .pipe(
    mergeAll(),
    tap((action) => action$.next(action)),
    ignoreElements(),
  );

export const filterAction = <P, S = any>(type: symbol | symbol[]) => (observable$: Observable<IAction<S, P>>) =>
  observable$.pipe(
    filter((action) =>
      Array.isArray(action.type) ? action.type.indexOf(type) >= 0 : action.type === type,
    ),
  );

export const createEpicKit = <S>(initialState: S, epics: Array<Epic<S>> = []): IEpicKit<S> => {
  const state$ = new BehaviorSubject<S>(initialState);
  const action$ = new QueueingSubject<IAction<S>>();
  const epic$ = merge(
    connectEpics(state$, action$, epics),
    reduceState(state$, action$),
  )
  .pipe(share());

  const dispatch: DispatchFn<S> = (action) =>
    action$.next(action);

  return {
    state$,
    action$,
    epic$,
    dispatch,
  };
};
