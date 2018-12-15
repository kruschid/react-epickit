import * as React from "react";

import { createEpicKit, Epic } from "../lib/epickit";
import { EpicKit, IStateDispatchProps } from "./EpicKit";

export const EpicKitContext = <S, >(initialState: S, epics?: Array<Epic<S>>) => {
  const epicKit = createEpicKit(initialState, epics);
  const Context = React.createContext<IStateDispatchProps<S>>({
    state: initialState,
    dispatch: epicKit.dispatch,
  });
  return {
    Consumer: Context.Consumer,
    Provider: (p: {children: React.ReactNode}) =>
      <EpicKit epicKit={epicKit}>
        {(epicKitProps) =>
          <Context.Provider value={epicKitProps}>
            {p.children}
          </Context.Provider>
        }
      </EpicKit>,
    };
};
