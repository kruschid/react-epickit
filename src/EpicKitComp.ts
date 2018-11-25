import * as React from "react";
import { BehaviorSubject, merge, Observable, Subject, Subscription } from "rxjs";
import { filter, mergeAll, share, tap } from "rxjs/operators";

export type Reducer<S, P = never> = (state: S, payload?: P) => S;
export type Epic<S = any, A extends IAction = IAction<S>, R extends IAction = IAction<S>>
  = (action$: Observable<A>, state$: Observable<S>) => Observable<R>;

export interface IAction <S = any, P = any> {
  type?: symbol;
  payload?: P;
  reducer?: Reducer<S, P>;
}
type DispatchFn<S> = (action: IAction<S>) => void;
type LifecycleCallback<S> = (p: {state: S, dispatch: DispatchFn<S>}) => void;

interface IEpicKitCompProps<S> {
  initialState?: S;
  epics?: Array<Epic<S>>;
  onCreate?: LifecycleCallback<S>;
  onDestroy?: LifecycleCallback<S>;
  children: (p: {state: S, dispatch: DispatchFn<S>}) => React.ReactNode;
}

interface IEpicKit<S> {
  state$: Observable<S>;
  action$: Observable<IAction<S>>;
  epic$: Observable<IAction<S>>;
  dispatch: DispatchFn<S>;
}

interface ICreateAction {
  <S, P = never>(type: symbol, reducer?: Reducer<S>): (payload?: P) => IAction<S, P>;
  <S, P = never>(reducer: Reducer<S>): (payload?: P) => IAction<S, P>;
}

export const createAction: ICreateAction = <S = any, P = never>(
  typeOrReducer: symbol | Reducer<S>,
  reducer?: Reducer<S>,
) => (
  payload?: P,
): IAction<S, P> => ({
  type: typeof typeOrReducer === "symbol"
    ? typeOrReducer as symbol : undefined,
  reducer: typeof typeOrReducer === "function"
    ? typeOrReducer as Reducer<S> : reducer,
  payload,
});

const reduceState = <S, T extends IAction<S>>(
  state$: BehaviorSubject<S>,
  action$: Observable<T>,
): Observable<T> =>
  action$.pipe(
    filter(({reducer}) => !!reducer),
    tap(({reducer, payload}) => state$.next(reducer(state$.getValue(), payload))),
  );

const connectEpics = <S>(
  state$: BehaviorSubject<S>,
  action$: Subject<IAction<S>>,
  epics: Array<Epic<S>>,
): Observable<IAction<S>> =>
  merge(
    epics.map((epic) => epic(action$, state$)),
  )
  .pipe(
    mergeAll(),
    tap((action) => action$.next(action)),
  );

export const EpicKit = <S>(initialState: S, epics: Array<Epic<S>> = []): IEpicKit<S> => {
  const state$ = new BehaviorSubject<S>(initialState);
  const action$ = new Subject<IAction<S>>();
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

export class EpicKitComp<S> extends React.Component<IEpicKitCompProps<S>> {
  public state: S;

  private epicKit: IEpicKit<S>;
  private epicsSubscription: Subscription;
  private stateSubscription: Subscription;

  constructor(p: IEpicKitCompProps<S>) {
    super(p);

    this.state = p.initialState;
    this.epicKit = EpicKit(p.initialState, p.epics);
  }

  public componentDidMount() {
    this.stateSubscription = this.epicKit.state$.pipe(
      tap(this.setState.bind(this)),
    )
    .subscribe();
  }

  public componentWillUnmount() {
    this.epicsSubscription.unsubscribe();
    this.stateSubscription.unsubscribe();
  }

  public render() {
    if (!this.epicsSubscription) {
      this.epicsSubscription = this.epicKit.epic$.subscribe();
    }
    return this.props.children({state: this.state, dispatch: this.epicKit.dispatch});
  }
}
