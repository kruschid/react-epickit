import * as React from "react";
import * as renderer from "react-test-renderer";
import { interval, of, timer } from "rxjs";
import { delayWhen, mapTo, switchMapTo, tap } from "rxjs/operators";
import { createAction, Epic, filterAction, createEpicKit } from "epickit";

import { EpicKit, EpicKitState } from "../src/EpicKit";

interface IState {
  counter: number;
}

const initialState: IState = {
  counter: 1,
};

const increment = createAction<IState>((state) => ({
  ...state,
  counter: state.counter + 1,
}));

const startCounting = createAction<IState>();

describe("epics", () => {
  it("should execute subsequent actions", () => {
    const epic$: Epic<IState> = (action$) => action$.pipe(
      filterAction(startCounting),
      switchMapTo(interval(100)),
      mapTo(increment()),
    );

    return of(renderer.create(
      <EpicKitState epicKit={createEpicKit(initialState, epic$)}>
        {({state, dispatch}) =>
          <div>
            Counter: {state.counter}
            <button onClick={() => dispatch(startCounting())}></button>
          </div>
        }
      </EpicKitState>,
    ))
    .pipe(
      delayWhen((component) => {
        expect(component).toMatchSnapshot(); // 1
        component.root.find((node) => node.type === "button").props.onClick();
        return timer(120);
      }),
      delayWhen((component) => {
        expect(component).toMatchSnapshot(); // 2
        return timer(100);
      }),
      delayWhen((component) => {
        expect(component).toMatchSnapshot(); // 3
        return timer(300);
      }),
      tap((component) => {
        expect(component).toMatchSnapshot(); // 6
        component.unmount();
      }),
    )
    .toPromise();
  });

  it("should pass state and dispatch via context", () => {
    const {Provider: StateProvider, Consumer: StateConsumer} = EpicKit<IState>(createEpicKit(initialState));

    const Counter = () =>
      <StateConsumer>
        {({state, dispatch}) =>
          <div>
            Counter: {state.counter}
            <button onClick={() => dispatch(increment())}></button>
          </div>
        }
      </StateConsumer>;

    const component = renderer.create(
      <StateProvider>
        <Counter />
      </StateProvider>,
    );
    expect(component).toMatchSnapshot(),
    component.root.find((node) => node.type === "button").props.onClick();
    expect(component).toMatchSnapshot(),
    component.unmount();
  });
});
