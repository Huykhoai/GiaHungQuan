export const formatPrice = (value: number | null | undefined): string => {
    if (value == null) return '-';
    return value.toLocaleString('vi-VN') + ' đ';
};