import GridElement from "@/grid/GridElement";
import SelectionRange from "@/selection/SelectionRange";
import { ColumnOptions, Coordinate } from "@/types";
import { classes, isObjectEqual } from "@/utils";
import { createRef } from "preact";
import { CellValueChangedEvent } from "../Events";

import styles from './cell.module.css';

interface CellProps {
    row: string;
    column: ColumnOptions;
    onMouseDown?: (row: string, col: string) => void
    onMouseMove?: (row: string, col: string) => void
    onMouseUp?: (row: string, col: string) => void
}

interface Boundary {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
}

interface CellState {
    active?: boolean;
    selected?: boolean;
    boundary: Boundary;
}

class Cell extends GridElement<CellProps, CellState> {

    protected cell = createRef<HTMLDivElement>();

    protected coord: Coordinate;

    protected timer: number = null;

    protected io: IntersectionObserver;

    protected gui: HTMLElement;

    constructor(props: CellProps) {
        super(props);

        this.state = {
            selected: false,
            active: false,
            boundary: { left: false, top: false, bottom: false, right: false }
        }

        this.coord = this.grid.getCoordinate(this.props.row, this.props.column.field);
        this.io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.doRender();
                this.io.disconnect();
            }
        })
    }

    componentDidMount() {
        this.grid.addListener('selectionChanged', this.handleSelectionChanged);
        this.grid.addListener('cellValueChanged', this.handleCellValueChanged);
        this.handleSelectionChanged(this.grid.getSelectionRanges());
        this.io.observe(this.cell.current);
    }

    componentWillUnmount() {
        this.grid.removeListener('selectionChanged', this.handleSelectionChanged);
        this.grid.removeListener('cellValueChanged', this.handleCellValueChanged);
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    protected doRender() {
        const value = this.grid.getCellValue(this.props.row, this.props.column.field);
        let result: HTMLElement | string = value;

        if (this.props.column.cellRender) {
            this.timer = setTimeout(() => {
                const render = new this.props.column.cellRender();
                render.init && render.init({
                    props: this.props.column.cellRendererParams,
                    value: value,
                    column: this.props.column,
                });

                this.timer = null;

                if (!this.cell.current) {
                    return;
                }

                if (this.gui) {
                    this.cell.current.removeChild(this.gui);
                }

                this.gui = render.gui();
                this.cell.current.appendChild(this.gui);
                render.afterAttached && render.afterAttached();
            }, 0);
        } else {
            this.cell.current && (this.cell.current.textContent = result.toString());
        }
    }

    protected handleSelectionChanged = (selections: SelectionRange[]) => {

        let selected = false;
        let boundary = { left: false, top: false, bottom: false, right: false };

        for (let i in selections) {
            const s = selections[i];
            if (!s.contains(this.coord)) {
                continue;
            }

            selected = true;

            s.isLeft(this.coord) && (boundary.left = true);
            s.isRight(this.coord) && (boundary.right = true);
            s.isTop(this.coord) && (boundary.top = true);
            s.isBottom(this.coord) && (boundary.bottom = true);
        }

        if (selected != this.state.selected || !isObjectEqual(boundary, this.state.boundary)) {
            this.setState({
                selected: selected,
                boundary: boundary
            });
        }
    }

    protected handleCellValueChanged = (ev: CellValueChangedEvent) => {
        if (ev.row === this.props.row && ev.column === this.props.column.field) {
            this.doRender();
        }
    }

    protected handleMouseDown = () => {
        this.props.onMouseDown && this.props.onMouseDown(this.props.row, this.props.column.field);
    }

    protected handleMouseMove = () => {
        this.props.onMouseMove && this.props.onMouseMove(this.props.row, this.props.column.field);
    }

    protected handleMouseUp = () => {
        this.props.onMouseUp && this.props.onMouseUp(this.props.row, this.props.column.field);
    }

    render() {

        const cellStyle: { [key: string]: any } = {
            width: this.props.column.width,
        }

        if (this.props.column.flex) {
            cellStyle.flexGrow = 1;
        }

        const className = classes({
            [styles.cell]: true,
            [styles.cellSelected]: this.state.selected,
            [styles.cellLeftBoundary]: this.state.boundary.left,
            [styles.cellRightBoundary]: this.state.boundary.right,
            [styles.cellTopBoundary]: this.state.boundary.top,
            [styles.cellBottomBoundary]: this.state.boundary.bottom,
        })

        return (
            <div
                ref={this.cell}
                className={className}
                style={cellStyle}
                onMouseDown={this.handleMouseDown}
                onMouseMove={this.handleMouseMove}
                onMouseUp={this.handleMouseUp}
            />
        );
    }

}

export default Cell;
