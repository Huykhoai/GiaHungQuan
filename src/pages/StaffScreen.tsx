import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    AppBar, Toolbar, Typography, Card, CardContent, Button, Fab,
    Dialog, DialogTitle, DialogContent, Box, Divider, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import axiosClient from '../config/axiosClient';
import Loading from '@/ui/Loading/Loading';
import { useNotification } from '../ui/Notification/NotificationContext';

const StaffScreen: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);

    const { data: invoices, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery({
        queryKey: ['activeInvoices'],
        queryFn: async () => {
            const res = await axiosClient.get('/api/invoices/active');
            return res.data;
        }
    });

    const { data: tables, isLoading: isLoadingTables } = useQuery({
        queryKey: ['diningTables'],
        queryFn: async () => {
            const res = await axiosClient.get('/api/dining-tables');
            return res.data;
        }
    });

    const availableTables = tables?.filter((t: any) => t.status === 'EMPTY' || !t.status);

    const createInvoiceMutation = useMutation({
        mutationFn: async (tableId: number) => {
            return axiosClient.post('/api/invoices', { tableId });
        },
        onSuccess: (res) => {
            const newInvoice = res.data;
            setIsAddTableModalOpen(false);
            showNotification('success', 'Mở bàn thành công', `Đã mở ${newInvoice.tableName}`);
            refetchInvoices();
            navigate(`/invoice/${newInvoice.id}`);
        },
        onError: (err: any) => {
            showNotification('error', 'Lỗi', err.response?.data?.message || 'Không thể mở bàn');
        }
    });

    if (isLoadingTables || isLoadingInvoices) {
        return <Loading message="Đang tải dữ liệu nhà hàng..." />;
    }

    return (
        <Box sx={{ minHeight: 'calc(100vh - 100px)', backgroundColor: '#f1f5f9'}}>
            <AppBar position="sticky" elevation={1} sx={{ top: 0, zIndex: 1100 }}>
                <Toolbar sx={{ backgroundColor: 'white', color: '#0f172a' }}>
                    <Button color="inherit" onClick={() => navigate('/home')} sx={{ minWidth: 0, mr: 1, p: 0, fontWeight: 'bold', color: '#2563eb' }}>
                        <ArrowBackIosNewIcon sx={{ fontSize: 18, mr: 0.5 }} /> Home
                    </Button>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', textAlign: 'right' }}>
                        PHỤC VỤ BÀN
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ px: 2, py: 3 }}>
                {invoices?.length === 0 && (
                    <Typography sx={{ textAlign: "center", color: "text.secondary", mt: 5, fontStyle: 'italic' }}>
                        Chưa có bàn nào đang ăn. Quán đang rảnh rỗi!
                    </Typography>
                )}

                {invoices?.map((inv: any) => (
                    <Card
                        key={inv.id}
                        sx={{ mb: 2, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', transition: '0.2s', '&:active': { transform: 'scale(0.98)' } }}
                        onClick={() => navigate(`/invoice/${inv.id}`)}
                    >
                        <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography variant='h6' sx={{ fontWeight: 800, color: '#1e293b' }}>
                                    {inv.tableName}
                                </Typography>
                                <Typography variant='h6' sx={{ fontWeight: 800, color: '#ef4444' }}>
                                    {inv.totalAmount?.toLocaleString() || 0} đ
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 1.5 }} />
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Giờ vào: <span style={{ fontWeight: 'bold', color: 'black' }}>
                                        {new Date(inv.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </Typography>
                                <Chip label="Đang phục vụ" color="success" size="small" sx={{ fontWeight: 'bold', fontSize: '11px' }} />
                            </Box>
                        </CardContent>
                    </Card>
                ))}

                <Fab
                    color="primary"
                    aria-label="add"
                    sx={{ position: 'fixed', bottom: 24, right: 24, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)' }}
                    onClick={() => setIsAddTableModalOpen(true)}
                >
                    <AddIcon sx={{ fontSize: '28px' }} />
                </Fab>
            </Box>

            <Dialog open={isAddTableModalOpen} onClose={() => createInvoiceMutation.isPending ? null : setIsAddTableModalOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', color: '#1e293b' }}>CHỌN BÀN MỞ MỚI</DialogTitle>
                <DialogContent dividers sx={{ backgroundColor: '#f8fafc' }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center", pt: 1 }}>
                        {availableTables?.map((t: any) => (
                            <Chip
                                key={t.id}
                                label={t.name}
                                onClick={() => createInvoiceMutation.mutate(t.id)}
                                color="primary"
                                disabled={createInvoiceMutation.isPending}
                                variant="outlined"
                                sx={{ fontSize: '16px', py: 2.5, px: 2, borderRadius: 2, fontWeight: 'bold', cursor: 'pointer', bgcolor: 'white' }}
                            />
                        ))}
                        {(!availableTables || availableTables.length === 0) && (
                            <Typography sx={{ color: '#ef4444', fontWeight: 'bold', textAlign: 'center', mt: 2 }}>
                                Tất cả các bàn đều đã có khách!
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default StaffScreen;
