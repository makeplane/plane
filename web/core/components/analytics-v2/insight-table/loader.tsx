import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@plane/propel/table";
import { Loader } from "@plane/ui";

interface TableSkeletonProps {
    columns: any[];
    rows: number;
}

export const TableLoader: React.FC<TableSkeletonProps> = ({ columns, rows }) => (
    <Table>
        <TableHeader>
            <TableRow>
                {
                    columns.map((column, index) => (
                        <TableHead key={index} >
                            {typeof column.header === 'string' ? column.header : ''}
                        </TableHead>
                    ))
                }
            </TableRow>
        </TableHeader>
        <TableBody>
            {
                Array.from({ length: rows }).map((_, rowIndex) => (
                    <TableRow key={rowIndex} >
                        {
                            columns.map((_, colIndex) => (
                                <TableCell key={colIndex} >
                                    <Loader.Item height='20px' width='100%' />
                                </TableCell>
                            ))
                        }
                    </TableRow>
                ))}
        </TableBody>
    </Table>
);
