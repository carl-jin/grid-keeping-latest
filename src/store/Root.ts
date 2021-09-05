import { Callback, Store } from ".";

export type AnyStores<S> = {
    [K in keyof S]: Store<any, any>
};

export type StateOfStore<S extends Store<any, any>> = S extends Store<infer State, any> ? State : never;
export type ActionsOfStore<S extends Store<any, any>> = S extends Store<any, infer Actions> ? Actions : never;

type Actions<T> = {
    [P in keyof T]: undefined;
};

export type State<S extends AnyStores<S>> = {
    [K in keyof S]: StateOfStore<S[K]>;
}

export type Stores<S extends AnyStores<S>> = {
    [K in keyof S]: Store<StateOfStore<S[K]>, ActionsOfStore<S[K]>>;
};

export class Root<S extends AnyStores<S>> extends Store<State<S>, Actions<S>> {

    constructor(public stores: Stores<S>) {

        super(
            Object.keys(stores).reduce((obj, key) => {
                (obj as any)[key] = [];
                return obj;
            }, {} as Record<keyof S, Callback[]>),
            Object.keys(stores).reduce((s, key) => {
                (s as any)[key] = stores[key as keyof S].getState();
                return s;
            }, {} as State<S>)
        );

        Object.keys(stores).forEach((s) => {

            stores[s as keyof S].subscribeAny(() => {
                this.dispatch(s as keyof S, undefined);
            });

            this.handle(s as keyof S, (state) => {
                (state as any)[s] = stores[s as keyof S].getState();
                return { ...state };
            });

        });
    }

    public store<K extends keyof S>(s: K) {
        return this.stores[s];
    }
}

export default Root;
