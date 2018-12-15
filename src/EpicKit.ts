import * as React from "react";
import { Subscription } from "rxjs";

import { createEpicKit, DispatchFn, Epic, IEpicKit } from "../lib/epickit";

export interface IStateDispatchProps<S> {
  state: S;
  dispatch: DispatchFn<S>;
}

export interface IEpicKitProps<S> {
  epicKit?: IEpicKit<S>;
  initialState?: S;
  epics?: Array<Epic<S>>;
  children: (p: IStateDispatchProps<S>) => React.ReactNode;
}
export class EpicKit<S> extends React.Component<IEpicKitProps<S>> {
  public state: S;

  private epicKit: IEpicKit<S>;
  private subscription: Subscription | undefined;

  constructor(p: IEpicKitProps<S>) {
    super(p);

    if (p.epicKit) {
      this.epicKit = p.epicKit!;
      this.state = p.epicKit.state$.getValue();
    } else if (p.initialState) {
      this.epicKit = createEpicKit<S>(p.initialState, p.epics);
      this.state = p.initialState!;
    } else {
      throw Error("EpicKit component requires epicKit or initialState property to be set");
    }
  }

  public componentDidMount() {
    this.subscription = this.epicKit.epic$.subscribe(([state]) =>
      this.setState(state),
    );
  }

  public componentWillUnmount() {
    this.subscription!.unsubscribe();
  }

  public render() {
    return this.props.children({
      state: this.state,
      dispatch: this.epicKit.dispatch,
    });
  }
}
