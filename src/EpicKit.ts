import * as React from "react";
import { Subscription } from "rxjs";

import { DispatchFn, Epic, EpicKit, IAction, IEpicKit } from "../lib/epickit";

interface IEpicKitProps<S> {
  initialState: S;
  epics?: Array<Epic<S>>;
  children: (state: S, dispatch: DispatchFn<S>) => React.ReactNode;
}

export class EpicKitComp<S> extends React.Component<IEpicKitProps<S>> {
  public state: S;

  private epicKit: IEpicKit<S>;
  private queue: Array<IAction<S>> = [];
  private subscription: Subscription | undefined;

  constructor(p: IEpicKitProps<S>) {
    super(p);

    this.epicKit = EpicKit(p.initialState, p.epics);
    this.state = p.initialState;
  }

  public dispatch(action: IAction<S>) {
    if (this.subscription) {
      this.epicKit.dispatch(action);
    } else {
      this.queue.push(action);
    }
  }

  public componentDidMount() {
    this.subscription = this.epicKit.epic$.subscribe(([state]) =>
      this.setState(state),
    );
    this.queue.forEach(this.epicKit.dispatch);
  }

  public componentWillUnmount() {
    this.subscription!.unsubscribe();
  }

  public render() {
    return this.props.children(this.state, this.dispatch.bind(this));
  }
}
