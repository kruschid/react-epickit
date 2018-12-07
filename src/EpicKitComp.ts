import * as React from "react";
import { BehaviorSubject, merge, Observable, Subject, Subscription } from "rxjs";
import { filter, mergeAll, share, tap } from "rxjs/operators";

// tslint:disable-next-line
type FirstArgument<T> = T extends (arg1: infer U, ...args: any[]) => any ? U : any;

export type Reducer<S, P = never> = (state: S, payload?: P) => S;

export type Epic<S = any, A extends IAction = IAction<S>, R extends IAction = IAction<S>>
  = (action$: Observable<A>, state$: Observable<S>) => Observable<R>;

export interface IAction <S = any, P = never> {
  type?: symbol;
  payload?: P;
  reducer?: Reducer<S, P>;
}
// type ConnectedDispatch<P = never> = (arg: P) => void;

type DispatchFn<S, P = never> = (action: IAction<S, P>) => void;

type IConnectedActions<L> = {
  [x in keyof L]: (payload: FirstArgument<L[x]>) => void;
};

interface IActionList {
  [x: string]: ReturnType<ICreateAction>;
}

interface IEpicKitCompProps<S, L> {
  initialState?: S;
  epics?: Array<Epic<S>>;
  actions?: L;
  children: (p: {state: S, dispatch: DispatchFn<S>, actions: IConnectedActions<L>}) => React.ReactNode;
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

export class EpicKitComp<S, L extends IActionList> extends React.Component<IEpicKitCompProps<S, L>> {
  public state: S;

  private epicKit: IEpicKit<S>;
  private actions: IConnectedActions<L>;
  private queue: Array<IAction<S>>;
  private subscription: Subscription;

  constructor(p: IEpicKitCompProps<S, L>) {
    super(p);

    this.epicKit = EpicKit(p.initialState, p.epics);
    this.state = p.initialState;
    this.actions = Object.keys(p.actions).map((key: keyof L) =>
      (payload: any) => this.dispatch(p.actions[key]()),
    );
  }

  public dispatch(action: IAction<S>) {
    if (this.subscription) {
      this.epicKit.dispatch(action);
    } else {
      this.queue.push(action);
    }
  }

  public componentDidMount() {
    this.subscription = merge(
      this.epicKit.epic$,
      this.epicKit.state$.pipe(tap(this.setState.bind(this))),
    )
    .subscribe();
  }

  public componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  public render() {
    return this.props.children({
      state: this.state,
      dispatch: this.dispatch.bind(this),
      actions: this.actions,
    });
  }
}
