import Component from "@/views/Component";
import { connect } from "@/views/root";
import { State as RootState, Grid as GridApi } from "@/grid";
import { ColumnOptions } from "@/types";
import List from '@/views/list';
import Column from '@/views/column';
import Header from '@/views/header';
import Body from './Body';
import { withGrid } from "@/views/root";

import styles from './grid.module.css';

interface Props {
    grid: GridApi;
    width: string;
    height: string;
    preloadRowCount: number;
    // rows
    rowHeight: number;
    rows: Record<string, number>;
}

interface ResizingColumn {
    field: string;
    width: number;
    pos: number;
}

class Grid extends Component<Props> {

    protected resizingColumn: ResizingColumn;

    protected unsubscribes: (() => void)[] = [];

    protected ignoreScrollEvents = false;

    public componentDidMount = () => {

        this.unsubscribes.push(this.props.grid.store('grid').subscribeAny(() => {
            const sl = this.props.grid.state('grid').horizontalScrollLeft;
            this.refs.headerContainer.current.style.transform = `translateX(-${sl}px)`;
        }));

        this.unsubscribes.push(this.props.grid.subscribe(() => {
            this.resize();
        }));

        this.resize();
    }

    public componentWillUnmount = () => {
        this.unsubscribes.forEach(f => f());
    }

    public resize() {
        // If a vertical scroll bar appears, the last column will be misaligned
        // a spacer needs to be added
        const list = (this.refs.list.current as any).base;
        const spacerX = list.offsetWidth - list.clientWidth;

        // fake horizontal scrollbar
        let horizontalScrollHeight = 0;
        if (this.refs.headerContainer.current.scrollWidth > this.refs.normalColumns.current.clientWidth) {
            // we need to show a horizontal scrollbar
            horizontalScrollHeight = this.refs.horizontalScrollContainer.current.offsetHeight;
        }

        const contentWidth = (this.refs.headerContainer?.current?.scrollWidth || 0);

        this.refs.header.current.style.paddingRight = spacerX + 'px';
        this.refs.horizontalScrollWrapper.current.style.height = horizontalScrollHeight + 'px';
        this.refs.normalCellsContainer.current.style.width = contentWidth + 'px';
        this.refs.horizontalScrollContainer.current.style.width = contentWidth + 'px';
        this.refs.horizontalLeftSpacer.current.style.width = (this.refs.pinnedLeftColumns?.current?.scrollWidth || 0) + 'px';
        this.refs.horizontalRightSpacer.current.style.width = (this.refs.pinnedRightColumns?.current?.offsetWidth || 0) + spacerX + 'px';
    }

    /**
     * Actions
     */

    protected getColumnOptions = (column: string): ColumnOptions => {
        return this.props.grid.getColumnOptions(column);
    }

    /**
     * Event handlers
     */

    protected handleColumnResizeStart = (field: string, width: number, ev: MouseEvent) => {
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('mousemove', this.handleMouseMove);

        const offsetX = ev.pageX - this.refs.root.current.offsetLeft;
        this.refs.columnResizer.current.style.left = offsetX + 'px';
        this.refs.columnResizer.current.style.width = '2px';
        this.resizingColumn = { field, width, pos: ev.clientX };
    }

    protected handleMouseUp = (ev: MouseEvent) => {
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('mousemove', this.handleMouseMove);
        this.refs.columnResizer.current.style.left = '0px';
        this.refs.columnResizer.current.style.width = '0px';

        if (this.resizingColumn) {
            const width = ev.clientX - this.resizingColumn.pos + this.resizingColumn.width;
            const minWidth = this.getColumnOptions(this.resizingColumn.field).minWidth

            this.props.grid.store('column').dispatch('updateColumnWidth', {
                field: this.resizingColumn.field,
                width: Math.max(width, minWidth)
            });
        }
    }

    protected handleMouseMove = (ev: MouseEvent) => {
        const offsetX = ev.pageX - this.refs.root.current.offsetLeft;
        this.refs.columnResizer.current.style.left = offsetX + 'px';
    }

    protected handleHorizontalScroll = (ev: UIEvent) => {

        // Prevent the horizontal scroll bar from flickering when scrolling
        if (this.ignoreScrollEvents) {
            this.ignoreScrollEvents = false;
            return;
        };

        this.ignoreScrollEvents = true;
        const scrollLeft = (ev.target as HTMLDivElement).scrollLeft;

        if (ev.target != this.refs.normalCells.current) {
            this.refs.normalCells.current.scrollLeft = scrollLeft;
        }
        if (ev.target != this.refs.horizontalScroll.current) {
            this.refs.horizontalScroll.current.scrollLeft = scrollLeft;
        }

        this.props.grid.store('grid').dispatch(
            'setHorizontalScrollLeft', scrollLeft
        );
    }

    /**
     * Renders
     */
    protected listRender = (items: string[]) => {
        return (
            <Body
                items={items}
                handleHorizontalScroll={this.handleHorizontalScroll}
                normalCellsRef={this.createRef("normalCells")}
                normalCellsContainerRef={this.createRef("normalCellsContainer")}
            />
        )
    }

    protected renderColumns = (columns: string[]) => {
        return columns.map(col => {
            return (
                <Column
                    key={col}
                    value={col}
                    onResize={this.handleColumnResizeStart}
                />
            );
        })
    }

    render() {

        const rootStyle = {
            width: this.props.width,
            height: this.props.height,
        };

        return (
            <div ref={this.createRef("root")} className={styles.root} style={rootStyle}>
                {/* headers */}
                <Header
                    headerRef={this.createRef("header")}
                    headerContainerRef={this.createRef("headerContainer")}
                    normalColumnsRef={this.createRef("normalColumns")}
                    pinnedLeftColumnsRef={this.createRef("pinnedLeftColumns")}
                    pinnedRightColumnsRef={this.createRef("pinnedRightColumns")}
                    handleColumnResizeStart={this.handleColumnResizeStart}
                />
                <div className={styles.body}>
                    <List
                        ref={this.createRef("list")}
                        items={this.props.grid.store('row').getRowIds()}
                        itemHeight={this.props.rowHeight}
                        preLoadCount={this.props.preloadRowCount}
                        render={this.listRender}
                    />
                </div>
                {/* fake horizontal scroll bar */}
                <div ref={this.createRef("horizontalScrollWrapper")} className={styles.horizontalScroll}>
                    <div ref={this.createRef("horizontalLeftSpacer")} className={styles.horizontalLeftSpacer}></div>
                    <div ref={this.createRef("horizontalScroll")} className={styles.horizontalScrollView} onScroll={this.handleHorizontalScroll}>
                        <div
                            ref={this.createRef("horizontalScrollContainer")}
                            className={styles.horizontalScrollContainer}
                        ></div>
                    </div>
                    <div ref={this.createRef("horizontalRightSpacer")} className={styles.horizontalRightSpacer}></div>
                </div>
                {/* hidden global elements like column resizer etc. */}
                <div ref={this.createRef("columnResizer")} className={styles.columnResizer}></div>
            </div>
        );
    }
}

const mapStateToProps = (state: RootState) => {
    return {
        width: state.grid.width,
        height: state.grid.height,
        preloadRowCount: state.grid.preloadRowCount,
        rowHeight: state.row.height,
        rows: state.row.rowIndexes,
    };
};

export default connect(mapStateToProps)(withGrid(Grid));
