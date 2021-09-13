import { Pinned, ColumnOptions, BaseColumnOptions, GetColumnMenuItemsParams, MenuItem } from "@/types";
import { Store as BaseStore } from "@/grid/store";
import update from 'immutability-helper';

export interface Actions {
    updateColumnPinned: { field: string, pinned: Pinned };
    updateColumnVisible: { field: string, visible: boolean };
    updateColumnWidth: { field: string, width?: number, flex?: number };
    setColumns: { columns: ColumnOptions[], defaultOptions?: BaseColumnOptions };
    setHeight: number;
}

export interface State {
    // save ordered column fields
    pinnedLeftColumns: string[];
    pinnedRightColumns: string[];
    normalColumns: string[];
    // column options
    columns: Record<string, ColumnOptions>;
    // header
    height: number;
    // column menus
    getColumnMenuItems?: (params: GetColumnMenuItemsParams) => MenuItem[];
}

const initialState: State = {
    pinnedLeftColumns: [],
    pinnedRightColumns: [],
    normalColumns: [],
    columns: {},
    height: 30,
};

export const defaultColumnOptions: BaseColumnOptions = {
    width: 200,
    minWidth: 50,
    visible: true,
};

export class Store extends BaseStore<State, Actions> {
    constructor(initial?: Partial<State>) {
        super({
            updateColumnPinned: [],
            updateColumnWidth: [],
            updateColumnVisible: [],
            setColumns: [],
            setHeight: [],
        }, Object.assign({}, initialState, initial));

        this.handle('updateColumnPinned', (state, { field, pinned }) => {

            const newState = update(state, {
                columns: {
                    [field]: { pinned: { $set: pinned } }
                }
            });

            return {
                ...newState,
                ...this.setColumns(Object.values(newState.columns))
            };
        });

        this.handle('updateColumnVisible', (state, { field, visible }) => {
            const newState = update(state, {
                columns: {
                    [field]: { visible: { $set: visible } }
                }
            });

            return {
                ...newState,
                ...this.setColumns(Object.values(newState.columns))
            };
        });

        this.handle('updateColumnWidth', (state, { field, width, flex }) => {
            if (flex !== undefined) {
                return update(state, {
                    columns: {
                        [field]: { flex: { $set: flex } }
                    }
                });
            }

            return update(state, {
                columns: {
                    [field]: { width: { $set: width } }
                }
            });
        });

        this.handle('setColumns', (state, { columns, defaultOptions }) => {

            const result = this.setColumns(columns, Object.assign({}, defaultColumnOptions, defaultOptions))

            return update(state, {
                pinnedLeftColumns: { $set: result.pinnedLeftColumns },
                pinnedRightColumns: { $set: result.pinnedRightColumns },
                normalColumns: { $set: result.normalColumns },
                columns: { $set: result.columns }
            });
        });

        this.handle('setHeight', (state, height) => {
            return update(state, {
                height: { $set: height },
            });
        });
    }

    protected setColumns = (columnOptions: ColumnOptions[], defaultColumnOption: BaseColumnOptions = {}) => {
        let pinnedLeftColumns: string[] = [];
        let pinnedRightColumns: string[] = [];
        let normalColumns: string[] = [];
        let columns: Record<string, ColumnOptions> = {};

        columnOptions.forEach(col => {
            col = Object.assign({}, defaultColumnOption, col);
            columns[col.field] = col;

            if (!col.visible) {
                return;
            }

            if (col.pinned == 'left') {
                pinnedLeftColumns.push(col.field);
            } else if (col.pinned == 'right') {
                pinnedRightColumns.push(col.field);
            } else {
                normalColumns.push(col.field);
            }
        })

        return {
            pinnedLeftColumns,
            pinnedRightColumns,
            normalColumns,
            columns
        };
    }

    /**
     * Actions
     */

    public getColumnOptions(column: string) {
        return this._state.columns[column];
    }

    public getColumnOptionsByIndex(x: number) {
        return this._state.columns[this.getColumnByIndex(x)];
    }

    public getColumnByIndex(x: number) {
        if (x < this._state.pinnedLeftColumns.length) {
            return this._state.pinnedLeftColumns[x];
        }

        x -= this._state.pinnedLeftColumns.length;
        if (x < this._state.normalColumns.length) {
            return this._state.normalColumns[x];
        }

        x -= this._state.normalColumns.length;
        return this._state.pinnedRightColumns[x];
    }
}

export default Store;
