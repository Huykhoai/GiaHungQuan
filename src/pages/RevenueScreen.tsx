import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    AppBar, Toolbar, Typography, Box, Card, CardContent, Container, Button
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../config/axiosClient';
import Loading from '@/ui/Loading/Loading';
import MultiFilterBar from '@/common/MultiFilterBar/MultiFilterBar';
import type { FilterItem } from '@/common/MultiFilterBar/MultiFilterBar';
import { formatPrice } from '@/utils/formatPrice';

const filterCategories: FilterItem[] = [
    { key: 'date', label: 'Ngày Hóa Đơn', type: 'date' },
    { key: 'tableName', label: 'Tên Bàn', type: 'text' }
];

const RevenueScreen: React.FC = () => {
    const navigate = useNavigate();

    const todayStr = new Date().toLocaleDateString('en-CA');
    const [filters, setFilters] = useState<Record<string, any>>({ date: todayStr });

    const { data: historyInvoices, isLoading } = useQuery({
        queryKey: ['invoiceHistory', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.date) params.append('date', filters.date);
            if (filters.tableName) params.append('tableName', filters.tableName);

            const res = await axiosClient.get(`/api/invoices/history?${params.toString()}`);
            return res.data;
        }
    });

    const handleFilterChange = (newFilters: Record<string, any>) => {
        setFilters(newFilters);
    };

    const totalRevenue = historyInvoices?.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0) || 0;

    return (
        <Box sx={{ minHeight: 'calc(100vh - 64px)', backgroundColor: '#f1f5f9' }}>
            <AppBar position="sticky" elevation={1}>
                <Toolbar sx={{ backgroundColor: 'white', color: '#0f172a' }}>
                    <Button color="inherit" onClick={() => navigate('/admin')} sx={{ minWidth: 0, mr: 1, p: 0, fontWeight: 'bold', color: '#2563eb' }}>
                        <ArrowBackIosNewIcon sx={{ fontSize: 18, mr: 0.5 }} /> Về Admin
                    </Button>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', textAlign: 'center' }}>
                        LỊCH SỬ HÓA ĐƠN
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 3, pb: 6 }}>

                        <MultiFilterBar
                            categories={filterCategories}
                            initialFilters={filters}
                            onFilterChange={handleFilterChange}
                        />

                {/* Tổng quan Doanh Thu */}
                <Card sx={{ my: 4, borderRadius: 3, background: 'linear-gradient(to right, #2563eb, #3b82f6)', color: 'white' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>TỔNG DOANH THU THEO BỘ LỌC</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 900 }}>
                            {formatPrice(totalRevenue)}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                            ({historyInvoices?.length || 0} hóa đơn đã thanh toán)
                        </Typography>
                    </CardContent>
                </Card>

                {/* Danh sách Hóa đơn */}
                {isLoading ? (
                    <Loading message="Đang tải dữ liệu..." />
                ) : historyInvoices?.length === 0 ? (
                    <Typography sx={{ textAlign: 'center', mt: 5, color: '#64748b', fontSize: '1.2rem', fontWeight: 600 }}>
                        Không có hóa đơn nào trùng khớp với bộ lọc.
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {historyInvoices?.map((invoice: any) => (
                            <Box key={invoice.id}>
                                <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', transition: 'all 0.2s', '&:hover': { borderColor: '#94a3b8', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ bgcolor: '#e0e7ff', p: 1.5, borderRadius: '50%', display: 'flex' }}>
                                                <ReceiptIcon sx={{ color: '#4f46e5' }} />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>
                                                    {invoice.tableName}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    {new Date(invoice.createdAt).toLocaleString('vi-VN')}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#16a34a' }}>
                                                {formatPrice(invoice.totalAmount)}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white', bgcolor: '#10b981', px: 1, py: 0.2, borderRadius: 1, display: 'inline-block', mt: 0.5 }}>
                                                ĐÃ THANH TOÁN
                                            </Typography>
                                        </Box>
                                    </CardContent>

                                    <Button
                                        fullWidth
                                        sx={{ borderTop: '1px solid #f1f5f9', py: 1.5, color: '#3b82f6', fontWeight: 600, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                                        onClick={() => navigate(`/invoice/${invoice.id}`)}
                                    >
                                        XEM CHI TIẾT
                                    </Button>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default RevenueScreen;
