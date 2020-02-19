import * as React from "react";
import * as renderer from "react-test-renderer";
import { interval, timer } from "rxjs";
import { mapTo, switchMapTo } from "rxjs/operators";
import { createAction, Epic, filterAction, createEpicKit } from "epickit";
import { createEpicKitContext } from ".";

// state
interface State {
  counter: number;
}

const initialState: State = {
  counter: 1,
};

// actiions
const increment = createAction<State>((state) => ({
  ...state,
  counter: state.counter + 1,
}));

const startCounting = createAction<State>();

// epics
const epic: Epic<State> = (action$) => action$.pipe(
  filterAction(startCounting),
  switchMapTo(interval(100)),
  mapTo(increment()),
);

const {
  EpicKitProvider,
  useEpicKit,
} = createEpicKitContext(createEpicKit(initialState, epic));


const Counter = () => {
  const [state, dispatch] = useEpicKit();

  return (
    <div>
      Counter: <span>{state.counter}</span>
      <button onClick={() => dispatch(startCounting())}></button>
    </div>
  );
}

describe("epics", () => {
  it("should execute subsequent actions", async () => {

    let component: renderer.ReactTestRenderer;
    renderer.act(() => {
      component = renderer.create(
        <EpicKitProvider>
          <Counter />
        </EpicKitProvider>,
      )
    });

    const assertCounterValue = (n: string) =>
      expect(
        component.root.findByType("span").children[0]
      )
      .toStrictEqual(n);
  
    const wait = (n: number) => async () => {
      await timer(n).toPromise();
    }
    
    expect(assertCounterValue("1"));

    renderer.act(() => {
      component.root.findByType("button").props.onClick();
    });
    
    await renderer.act(wait(120));
    
    expect(assertCounterValue("2"));
    
    await renderer.act(wait(100));
    
    expect(assertCounterValue("3"));
    
    await renderer.act(wait(300));
    
    expect(assertCounterValue("6"));

    renderer.act(() => {
      component.unmount();
    });
  });
});
