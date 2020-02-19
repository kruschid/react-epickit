"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
exports.createEpicKitContext = function (epicKit) {
    var context = React.createContext([
        epicKit.state$.value,
        epicKit.dispatch,
    ]);
    return {
        useEpicKit: createEpicKitHook(context),
        EpicKitProvider: createEpicKitProvider(context, epicKit),
    };
};
var createEpicKitProvider = function (Context, epicKit) { return function (p) {
    var _a = React.useState(epicKit.state$.value), state = _a[0], setState = _a[1];
    React.useEffect(function () {
        var subscription = epicKit.epic$.subscribe(function (_a) {
            var nextState = _a.state;
            return setState(nextState);
        });
        return function () { return subscription.unsubscribe(); };
    }, []);
    return (React.createElement(Context.Provider, { value: [state, epicKit.dispatch] }, p.children));
}; };
var createEpicKitHook = function (context) { return function () {
    var value = React.useContext(context);
    if (value === undefined) {
        throw new Error('useEpicKit must be child of EpicKitProvider');
    }
    return value;
}; };
//# sourceMappingURL=index.js.map