import React, { useState } from 'react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { TableData, InvoiceData } from '../types';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Loading from '@/ui/Loading/Loading';
import {
    AppBar, Toolbar, Typography, Card, CardContent, Button, Fab,
    Dialog, DialogTitle, DialogContent, Box, Divider, Chip
} from '@mui/material';

const StaffScreen: React.FC = () => {
    const navigate = useNavigate();
    const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);

    // === QUERIES ===
    const { data: tables, isLoading: isLoadingTables } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => {
            const snap = await getDocs(collection(db, 'tables'));
            return snap.docs.sort((a, b) => a.data().name.localeCompare(b.data().name)).map(d => ({ id: d.id, ...d.data() } as TableData));
        }
    });

    const { data: invoices, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const q = query(collection(db, 'invoices'), where('status', '==', 'eating'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as InvoiceData)).sort((a, b) => b.updatedAt - a.updatedAt);
        }
    });

    // Mở Bàn Mới (Tạo Invoice mới)
    const { mutateAsync: createInvoice } = useMutation({
        mutationFn: async (table: TableData) => {
            const newInvoice = {
                tableId: table.id!,
                tableName: table.name,
                items: [],
                status: 'eating',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            const addedRef = await addDoc(collection(db, 'invoices'), newInvoice);
            return { id: addedRef.id, ...newInvoice } as InvoiceData;
        },
        onSuccess: (newInv) => {
            setIsAddTableModalOpen(false);
            refetchInvoices();
            navigate(`/invoice/${newInv.id}`); // Mở màn chi tiết ngay lập tức
        }
    });

    // Bàn khả dụng = Các bàn chưa có trong Invoices
    const availableTables = tables?.filter(t => !invoices?.some(inv => inv.tableId === t.id));

    if (isLoadingTables || isLoadingInvoices) {
        return <Loading message="Đang tải dữ liệu nhà hàng..." />;
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f1f5f9', pb: 10 }}>
            {/* Header Màn Hình Chính */}
            <AppBar position="sticky" elevation={1}>
                <Toolbar sx={{ backgroundColor: 'white', color: 'black' }}>
                    <Button color="inherit" onClick={() => navigate('/')} sx={{ minWidth: 0, mr: 1, p: 0, fontWeight: 'bold', color: '#1976d2' }}>
                        {'<'} Trang Chủ
                    </Button>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', textAlign: 'right' }}>
                        CÁC BÀN ĐANG PHỤC VỤ
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* DANH SÁCH HÓA ĐƠN ĐANG MỞ (SESSION) */}
            <Box sx={{ px: 2, py: 3 }}>
                {invoices?.length === 0 && (
                    <Typography sx={{ textAlign: "center", color: "text.secondary", mt: 5 }}>
                        Chưa có bàn nào đang ăn. Quán đang rảnh rỗi!
                    </Typography>
                )}

                {invoices?.map(inv => {
                    const totalMoney = inv.items.reduce((s, i) => s + (i.price * i.quantity), 0);
                    // Lọc những từ liên quan đến Bia để thống kê nhanh
                    const beerItems = inv.items.filter(i => i.name.toLowerCase().includes('bia'));
                    const totalBeers = beerItems.reduce((s, i) => s + i.quantity, 0);

                    return (
                        <Card
                            key={inv.id}
                            sx={{ mb: 2, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                            onClick={() => navigate(`/invoice/${inv.id}`)}
                        >
                            <CardContent>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                    <Typography variant='h6' sx={{ fontWeight: "bold", color: "primary.main" }}>
                                        {inv.tableName}
                                    </Typography>
                                    <Typography variant='h6' sx={{ fontWeight: "bold", color: "error.main" }}>
                                        {totalMoney.toLocaleString()} đ
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 1.5 }} />
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Tổng món đã gọi: <span style={{ fontWeight: 'bold', color: 'black' }}>{inv.items.reduce((s, i) => s + i.quantity, 0)}</span>
                                    </Typography>
                                    {totalBeers > 0 && (
                                        <Typography variant="body2" color="text.secondary">
                                            Bia: <span style={{ fontWeight: 'bold', color: '#d97706' }}>{totalBeers} cốc/ca</span>
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    )
                })}

                <Fab
                    color="primary"
                    aria-label="add"
                    sx={{ position: 'fixed', bottom: 24, right: 24 }}
                    onClick={() => setIsAddTableModalOpen(true)}
                >
                    <span style={{ fontSize: '24px' }}>+</span>
                </Fab>
            </Box>

            {/* MODAL CHỌN MỞ BÀN MỚI */}
            <Dialog open={isAddTableModalOpen} onClose={() => setIsAddTableModalOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>MỞ BÀN MỚI CHO KHÁCH</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center", pt: 1 }}>
                        {availableTables?.map(t => (
                            <Chip
                                key={t.id}
                                label={t.name}
                                onClick={() => createInvoice(t)}
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '16px', py: 2.5, px: 2, borderRadius: 2, fontWeight: 'bold', cursor: 'pointer' }}
                            />
                        ))}
                        {availableTables?.length === 0 && <Typography>Tất cả các bàn đều đã có khách ngồi!</Typography>}
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default StaffScreen;
