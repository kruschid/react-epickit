import * as React from "react";
import { DispatchFn, IEpicKit } from "epickit";

interface IStateDispatchProps<S> {
  state: S;
  dispatch: DispatchFn<S>;
}

export function EpicKitState<S>(p: {
  epicKit: IEpicKit<S>;
  children: (p: IStateDispatchProps<S>) => React.ReactElement;
}) {
  const [state, setState] = React.useState(p.epicKit.state$.getValue());

  React.useEffect(() => {
    const subscription = p.epicKit.epic$.subscribe(
      ({state}) => setState(state),
    );
    return () => subscription.unsubscribe();
  });

  return p.children({
    state: state,
    dispatch: p.epicKit.dispatch,
  })
}

export const EpicKit = <S, >(epicKit: IEpicKit<S>) => {
  const Context = React.createContext<IStateDispatchProps<S>>({
    state: epicKit.state$.getValue(),
    dispatch: epicKit.dispatch,
  });

  return {
    Consumer: Context.Consumer,
    Provider: (p: {children: React.ReactElement}) =>
      <EpicKitState epicKit={epicKit}>
        {(epicKitProps) =>
          <Context.Provider value={epicKitProps}>
            {p.children}
          </Context.Provider>
        }
      </EpicKitState>
  };
};
