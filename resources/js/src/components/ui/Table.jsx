import React, { memo } from "react";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import styles from "./Table.module.scss";

const TableRow = memo(({ row, columns }) => (
    <tr>
        {columns.map((column) => (
            <td key={column.accessor}>
                {column.Cell
                    ? column.Cell({
                          value: row[column.accessor],
                          row,
                      })
                    : row[column.accessor]}
            </td>
        ))}
    </tr>
));

TableRow.displayName = "TableRow";

const Table = ({
    columns,
    data,
    loading = false,
    noDataMessage = "No data found.",
    sortBy,
    onSort,
}) => {
    const handleSort = (accessor) => {
        if (!onSort) return;
        const isCurrent = sortBy?.field === accessor;
        const newDirection = isCurrent && sortBy?.direction === "asc" ? "desc" : "asc";
        onSort({ field: accessor, direction: newDirection });
    };

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    {columns.map((column) => (
                        <th
                            key={column.accessor}
                            style={{ width: column.width || "auto" }}
                            className={column.sortable ? styles.sortable : ""}
                            onClick={() => column.sortable && handleSort(column.accessor)}
                        >
                            <span>
                                {column.Header}
                                {column.sortable && (
                                    <span className={styles.sortIndicator}>
                                        <IoIosArrowUp
                                            className={
                                                sortBy?.field === column.accessor &&
                                                sortBy?.direction === "asc"
                                                    ? styles.active
                                                    : ""
                                            }
                                        />
                                        <IoIosArrowDown
                                            className={
                                                sortBy?.field === column.accessor &&
                                                sortBy?.direction === "desc"
                                                    ? styles.active
                                                    : ""
                                            }
                                        />
                                    </span>
                                )}
                            </span>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr>
                        <td colSpan={columns.length} style={{ textAlign: "center" }}>
                            <div className={styles.spinnerContainer}>
                                <div className={styles.spinner}></div>
                            </div>
                        </td>
                    </tr>
                ) : data.length > 0 ? (
                    data.map((row) => (
                        <TableRow key={row.id} row={row} columns={columns} />
                    ))
                ) : (
                    <tr>
                        <td colSpan={columns.length} style={{ textAlign: "center" }}>
                            {noDataMessage}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default Table;