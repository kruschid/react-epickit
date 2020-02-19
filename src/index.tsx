import * as React from "react";
import { DispatchFn, IEpicKit } from "epickit";

type EpicKitContextValue<S> = [S, DispatchFn<S>];

export const createEpicKitContext = <S, >(epicKit: IEpicKit<S>) => {
  const context = React.createContext<EpicKitContextValue<S>>([
    epicKit.state$.value,
    epicKit.dispatch,
  ]);

  return {
    useEpicKit: createEpicKitHook(context),
    EpicKitProvider: createEpicKitProvider(context, epicKit),
  }
}

const createEpicKitProvider = <S, >(
  Context: React.Context<EpicKitContextValue<S>>,
  epicKit: IEpicKit<S>,
) => (p: {
  children: React.ReactElement,
}) => {
  const [state, setState] = React.useState(epicKit.state$.value);

  React.useEffect(() => {
    const subscription = epicKit.epic$.subscribe(
      ({state: nextState}) => setState(nextState),
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Context.Provider value={[state, epicKit.dispatch]}>
      {p.children}
    </Context.Provider>
  );
};

const createEpicKitHook = <S, >(
  context: React.Context<EpicKitContextValue<S>>
) => (): EpicKitContextValue<S> => {
  const value = React.useContext<EpicKitContextValue<S>>(context);
  if (value === undefined) {
    throw new Error('useEpicKit must be child of EpicKitProvider')
  }
  return value;
}
