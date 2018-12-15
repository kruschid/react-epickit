import * as React from "react";
import * as renderer from "react-test-renderer";
import { interval, of, timer } from "rxjs";
import { delayWhen, filter, mapTo, switchMapTo, tap } from "rxjs/operators";

import { createAction, createActionWithPayload, Epic, IAction } from "../lib/epickit";
import { Lifecycle } from "../lib/Lifecycle";
import { EpicKit } from "../src/EpicKit";
import { EpicKitContext } from "../src/EpicKitContext";

// state definition
interface IState {
  counter: number;
}
const initialState: IState = {
  counter: 1,
};

const increment: IAction<IState> = createAction<IState>((state) => ({
  ...state, counter: state.counter + 1,
}));

const addToCounter = createActionWithPayload<IState, number>((s, p) => ({
  counter: s.counter + p,
}));

const START_COUNTING = Symbol("START_COUNTING");
const INC_COUNTER = Symbol("INC_COUNTER");

const startCounting = createAction(START_COUNTING);
const incCounter = createAction<IState>(INC_COUNTER, (state) => ({
  ...state, counter: state.counter + 1,
}));

describe("state", () => {
  it("should pass initial state to children component", async () => {
    const component = renderer.create(
      <EpicKit initialState={{counter: 1}}>
        {({state}) => <span>{state.counter}</span>}
      </EpicKit>,
    );
    expect(component).toMatchSnapshot();
    component.unmount();
  });
});

describe("reducers", () => {
  it("should pass payload to reducer", () => {
    const component = renderer.create(
      <EpicKit initialState={{counter: 1}}>
        {({state, dispatch}) =>
          <div>
            {state.counter}
            <button onClick={() => dispatch(addToCounter(5))} />
          </div>
        }
      </EpicKit>,
    );
    expect(component).toMatchSnapshot();
    component.root.find((node) => node.type === "button").props.onClick();
    expect(component).toMatchSnapshot();
    component.unmount();
  });
});

describe("epics", () => {
  it("should execute subsequent actions", () => {
    const epic$: Epic<IState> = (action$) => action$.pipe(
      filter((action) => START_COUNTING === action.type),
      switchMapTo(interval(100)),
      mapTo(incCounter),
    );

    return of(renderer.create(
      <EpicKit initialState={initialState} epics={[epic$]}>
        {({state, dispatch}) =>
          <>
            <Lifecycle onCreate={() => dispatch(startCounting)} />
            <span>{state.counter}</span>
          </>
        }
      </EpicKit>,
    ))
    .pipe(
      delayWhen((component) => {
        expect(component).toMatchSnapshot(); // 1
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
    const {Provider: StateProvider, Consumer: StateConsumer} = EpicKitContext<IState>(initialState);

    const Counter = () =>
      <StateConsumer>
        {({state, dispatch}) =>
          <div>
            Counter: {state.counter}
            <button onClick={() => dispatch(increment)}></button>
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
