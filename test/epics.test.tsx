import * as React from "react";
import * as renderer from "react-test-renderer";
import { interval, of, timer } from "rxjs";
import { delayWhen, filter, mapTo, switchMapTo, tap } from "rxjs/operators";

import { createAction, Epic, EpicKitComp } from "../src/EpicKitComp";
import { Lifecycle } from "../src/Lifecycle";

// state definition
interface IState {
  counter: number;
}
const initialState: IState = {
  counter: 1,
};

describe("state", () => {
  it("should pass initial state to children component", async () => {
    const component = renderer.create(
      <EpicKitComp initialState={{counter: 1}}>
        {({state}) => <span>{state.counter}</span>}
      </EpicKitComp>,
    );
    expect(component).toMatchSnapshot();
    component.unmount();
  });
});

describe("reducers", () => {
  it("should pass payload to reducer", () => {
    const actionList = {
      addToCounter: createAction<IState, number>((s, p) => ({
        counter: s.counter + p,
      })),
    };
    const component = renderer.create(
      <EpicKitComp initialState={{counter: 1}} actions={actionList}>
        {({state, actions: {addToCounter}}) =>
          <div>
            {state.counter}
            <button onClick={() => addToCounter(5)} />
          </div>
        }
      </EpicKitComp>,
    );
    expect(component).toMatchSnapshot();
    component.root.find((node) => node.type === "button").props.onClick();
    expect(component).toMatchSnapshot();
    component.unmount();
  });
});

describe("epics", () => {
  it("should execute subsequent actions", () => {
    // action types
    const START_COUNTING = Symbol("START_COUNTING");
    const INC_COUNTER = Symbol("INC_COUNTER");

    // actions
    const startCounting = createAction(START_COUNTING);
    const incCounter = createAction<IState>(INC_COUNTER, (state) => ({
      ...state, counter: state.counter + 1,
    }));

    // epic
    const epic$: Epic = (action$) => action$.pipe(
      filter((action) => START_COUNTING === action.type),
      switchMapTo(interval(100)),
      mapTo(incCounter()),
    );

    return of(renderer.create(
      <EpicKitComp initialState={initialState} epics={[epic$]}>
        {({state, dispatch}) =>
          <>
            <Lifecycle onCreate={() => dispatch(startCounting())} />
            <span>{state.counter}</span>
          </>
        }
      </EpicKitComp>,
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

  it.skip("should pass payload to epic", () => null);
  it.skip("should support registering of multiple epics", () => null);
  it.skip("should support dependency injection via context", () => null);
  it.skip("should support dependency injection via properties", () => null);
  it.skip("should bubble up actions to context provider", () => null);
  it.skip("should provide interface for loggers", () => null);
  it.skip("should support hot module replacement", () => null);
});
