import { Store, defaultColumnOptions } from ".";
import { useSelector } from "../useSelector";
import data from '@/grid/data.mock';

describe('dispatchers for column', () => {

    test('set columns', () => {

        const store = new Store();

        store.dispatch('setColumns', {
            columns: [
                { field: 'c_01' },
                { field: 'c_02' },
                { field: 'cl_01', pinned: 'left' },
                { field: 'cl_02', pinned: 'left' },
                { field: 'cr_01', pinned: 'right' },
                { field: 'cr_02', pinned: 'right' },
            ],
            defaultOptions: {
                width: 100
            },
        });

        expect(store.getState().pinnedLeftColumns.length).toBe(2);
        expect(store.getState().pinnedRightColumns.length).toBe(2);
        expect(store.getState().normalColumns.length).toBe(2);

        expect(Object.keys(store.getState().columns).length).toBe(6);
        expect(store.getColumnOptions('c_01')).toBeDefined();
        expect(store.getColumnOptions('c_10')).toBeUndefined();

        expect(store.getColumnOptions('c_01').width).toBe(100);
        expect(store.getColumnOptions('c_01').minWidth).toBe(defaultColumnOptions.minWidth);
    });

    test('update column pinned', () => {

        const store = new Store();

        store.dispatch('setColumns', {
            columns: [
                { field: 'c_01' },
                { field: 'c_02' },
                { field: 'cl_01', pinned: 'left' },
                { field: 'cl_02', pinned: 'left' },
                { field: 'cr_01', pinned: 'right' },
                { field: 'cr_02', pinned: 'right' },
            ]
        });

        const cbs = jest.fn();

        useSelector(store, (s) => {
            return { columns: s.columns }
        }, cbs)

        const cb = jest.fn();
        store.subscribe('updateColumnPinned', cb);

        expect(store.getState().pinnedLeftColumns.length).toBe(2);
        expect(store.getState().pinnedRightColumns.length).toBe(2);
        expect(store.getState().normalColumns.length).toBe(2);

        expect(store.getColumnOptions('c_01').pinned).toBeUndefined();

        store.dispatch('updateColumnPinned', { field: 'c_01', pinned: 'left' });

        expect(store.getState().pinnedLeftColumns.length).toBe(3);
        expect(store.getState().pinnedRightColumns.length).toBe(2);
        expect(store.getState().normalColumns.length).toBe(1);

        expect(store.getColumnOptions('c_01').pinned).toBe('left');

        expect(cb).toBeCalledTimes(1);
        expect(cbs).toBeCalledTimes(1);
    });

    test('update column width', () => {

        const store = new Store();

        store.dispatch('setColumns', {
            columns: [
                { field: 'c_01' },
                { field: 'c_02' },
                { field: 'cl_01', pinned: 'left' },
                { field: 'cl_02', pinned: 'left' },
                { field: 'cr_01', pinned: 'right' },
                { field: 'cr_02', pinned: 'right' },
            ],
            defaultOptions: { width: 80 }
        });

        const cbs = jest.fn();

        useSelector(store, (s) => {
            return { options: s.columns['c_01'] }
        }, cbs)

        const cb = jest.fn();
        store.subscribe('updateColumnWidth', cb);

        expect(store.getColumnOptions('c_01').width).toBe(80);
        store.dispatch('updateColumnWidth', { field: 'c_01', width: 120 });
        expect(store.getColumnOptions('c_01').width).toBe(120);

        expect(cb).toBeCalledTimes(1);
        expect(cbs).toBeCalledTimes(1);
    });

});

describe('actions for column', () => {

    const store = new Store();
    store.dispatch('setColumns', {
        columns: data.columns,
    });

    test('getColumnOptions', () => {
        expect(store.getColumnOptions('name').field).toBe('name');
        expect(store.getColumnOptions('hello')).toBeUndefined();
    });

    test('getColumnOptionsByIndex', () => {
        expect(store.getColumnOptionsByIndex(1).field).toBe('status');
        expect(store.getColumnOptionsByIndex(2).field).toBe('name');
        expect(store.getColumnOptionsByIndex(5).field).toBe('game');
        expect(store.getColumnOptionsByIndex(-1)).toBeUndefined();
    });

    test('getColumnByIndex', () => {
        expect(store.getColumnByIndex(1)).toBe('status');
        expect(store.getColumnByIndex(2)).toBe('name');
        expect(store.getColumnByIndex(4)).toBe('date');
        expect(store.getColumnByIndex(5)).toBe('game');
        expect(store.getColumnByIndex(100)).toBeUndefined();
        expect(store.getColumnByIndex(-1)).toBeUndefined();
    });

});