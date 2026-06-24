import React from "react";
import { Pagination as PaginationMUI } from "@mui/material";
const primary = import.meta.env.VITE_PRIMARY_COLOR;
interface PaginationProps {
    totalItems: number;
    page: number;
    size: number;
    onChange: (page: number) => void;
}
const Pagination: React.FC<PaginationProps> = ({ totalItems, page, size, onChange }) => {
    return (
        <PaginationMUI
            count={Math.ceil(totalItems / size)}
            page={page}
            onChange={(_, value) => onChange(value)}
            shape="circular"
            size="small"
            showLastButton
            showFirstButton
            sx={{
                paddingY: "5px",
                '& .MuiPaginationItem-root': {
                    color: primary,
                    '&.Mui-selected': {
                        backgroundColor: primary,
                        color: 'white'
                    },
                    '&:hover': {
                        backgroundColor: primary,
                        color: 'white'
                    }
                }
            }}
        />
    );
};

export default React.memo(Pagination);