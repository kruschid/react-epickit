import { createAction, IAction, Reducer } from "../src/EpicKitComp";

describe("#createAction", () => {
  it("should create actions", () => {
    const type = Symbol("type");
    const payload = "payload";
    const reducer: Reducer<string> = (state) => state.concat("123");
    const reducerWithPayload: Reducer<string, string> = (state, p) => state.concat(p);

    const cases: Array<[IAction, IAction]> = [[
      // only type
      createAction<string>(type)(),
      {type, payload: undefined, reducer: undefined},
    ], [
      // type and payload
      createAction<string, string>(type)(payload),
      {type, payload, reducer: undefined},
    ], [
      // type and reducer
      createAction<string>(type, reducer)(),
      {type, payload: undefined, reducer},
    ], [
      // type, payload and reducer
      createAction<string, string>(type, reducerWithPayload)(payload),
      {type, payload, reducer: reducerWithPayload},
    ], [
      // payload and reducer
      createAction<string, string>(reducerWithPayload)(payload),
      {type: undefined, payload, reducer: reducerWithPayload},
    ]];

    cases.forEach(([action, expectedAction]) => {
      expect(action).toMatchObject(expectedAction);
    });
  });
});
