import * as React from "react";
import { DispatchFn, IEpicKit } from "epickit";
declare type EpicKitContextValue<S> = [S, DispatchFn<S>];
export declare const createEpicKitContext: <S>(epicKit: IEpicKit<S>) => {
    useEpicKit: () => EpicKitContextValue<S>;
    EpicKitProvider: (p: {
        children: React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)> | null) | (new (props: any) => React.Component<any, any, any>)>;
    }) => JSX.Element;
};
export {};
