import { Store as BaseStore } from "@/grid/store";
import { Fillable, GetContextMenuItemsParams, MenuItem } from "@/types";
import update from 'immutability-helper';
import {numeric} from "../../../../example/fake";

export interface Actions {
    destroy: undefined;
    setLoading: boolean;
}

export interface State {
    width: string;
    height: string;
    preloadRowCount: number;
    disabledVirtualScrolling: number | boolean;
    fillable?: Fillable;
    loading?: boolean;
    destroyed?: boolean;
    // context menus
    getContextMenuItems?: (params: GetContextMenuItemsParams) => MenuItem[];
}

const initialState: State = {
    width: '100%',
    height: '100%',
    preloadRowCount: 20,
    disabledVirtualScrolling: false
};

export class Store extends BaseStore<State, Actions> {
    constructor(initial?: Partial<State>) {
        super({
            setLoading: [],
            destroy: [],
        }, Object.assign({}, initialState, initial));

        this.handle('setLoading', (state, loading) => {
            return update(state, {
                loading: { $set: loading }
            });
        });

        this.handle('destroy', (state) => {
            return update(state, {
                destroyed: { $set: true },
            })
        });
    }

    public destroy() {
        this.dispatch('destroy', undefined);
    }
}

export default Store;
