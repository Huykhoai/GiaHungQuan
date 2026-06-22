import React, { useState, useMemo } from 'react';
import { collection, getDocs, doc, runTransaction, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { MenuItemData, OrderItem, InvoiceData } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Loading from '@/ui/Loading/Loading';
import {
    AppBar, Toolbar, Typography, Card, CardContent, Button,
    Dialog, DialogContent, Box
} from '@mui/material';

const InvoiceDetailScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
    // Lưu các món mới được thêm (chưa update lên DB)
    const [addedItemsDraft, setAddedItemsDraft] = useState<{ [itemId: string]: number }>({});
    const [expandedHistory, setExpandedHistory] = useState<{ [itemId: string]: boolean }>({});
    const toggleHistory = (itemId: string) => setExpandedHistory(p => ({ ...p, [itemId]: !p[itemId] }));

    // === QUERIES ===
    const { data: invoice, isLoading: isLoadingInv, refetch: refetchInv } = useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => {
            if (!id) return null;
            const snap = await getDoc(doc(db, 'invoices', id));
            if (!snap.exists()) return null;
            return { id: snap.id, ...snap.data() } as InvoiceData;
        }
    });

    const { data: menuItems, isLoading: isLoadingMenu } = useQuery({
        queryKey: ['menuItems'],
        queryFn: async () => {
            const snap = await getDocs(collection(db, 'menuItems'));
            const menuItem: Record<string, MenuItemData> = {};
            snap.docs.forEach(d => {
                menuItem[d.id] = { id: d.id, ...d.data() } as MenuItemData;
            });
            return menuItem;
        }
    });

    // === THÊM MÓN TRONG DIALOG ===
    const handleAddQty = (itemId: string, delta: number) => {
        setAddedItemsDraft(prev => {
            const currentQty = prev[itemId] || 0;
            const newQty = Math.max(0, currentQty + delta);
            return { ...prev, [itemId]: newQty };
        });
    };

    const { draftTotalAmount, draftTotalCount } = useMemo(() => {
        let amt = 0, count = 0;
        if (menuItems) {
            Object.keys(addedItemsDraft).forEach(key => {
                const qty = addedItemsDraft[key];
                if (qty > 0) {
                    const itemRef = menuItems[key];
                    if (itemRef) {
                        amt += itemRef.price * qty;
                        count += qty;
                    }
                }
            });
        }
        return { draftTotalAmount: amt, draftTotalCount: count };
    }, [addedItemsDraft, menuItems]);

    // LƯU CÁC MÓN GỌI THÊM VÀO DB
    const { mutateAsync: saveOrder, isPending: isSaving } = useMutation({
        mutationFn: async () => {
            if (!invoice || draftTotalCount === 0) return;
            const invoiceRef = doc(db, 'invoices', invoice.id!);

            await runTransaction(db, async (t) => {
                const sfDoc = await t.get(invoiceRef);
                if (!sfDoc.exists()) throw "Hóa đơn không còn tồn tại!";

                const existingData = sfDoc.data() as InvoiceData;
                const updatedPending: OrderItem[] = existingData.pendingItems ? [...existingData.pendingItems] : [];

                // Gộp các món mới gọi vào danh sách chờ
                Object.keys(addedItemsDraft).forEach(itemId => {
                    const addQty = addedItemsDraft[itemId];
                    if (addQty > 0) {
                        const menuItem = menuItems?.[itemId];
                        if (!menuItem) return;

                        const existingPendingIndex = updatedPending.findIndex(i => i.menuItemId === itemId);
                        if (existingPendingIndex > -1) {
                            updatedPending[existingPendingIndex].quantity += addQty;
                        } else {
                            updatedPending.push({
                                menuItemId: itemId,
                                name: menuItem.name,
                                price: menuItem.price,
                                quantity: addQty
                            });
                        }
                    }
                });

                t.update(invoiceRef, {
                    pendingItems: updatedPending,
                    updatedAt: Date.now()
                });
            });
        },
        onSuccess: () => {
            setIsMenuDialogOpen(false);
            setAddedItemsDraft({}); // Clear the draft
            refetchInv(); // Tải lại chi tiết update
        }
    });

    const { mutateAsync: markAsServed, isPending: isServingItem } = useMutation({
        mutationFn: async (itemIdToServe: string) => {
            if (!invoice) return;
            const invoiceRef = doc(db, 'invoices', invoice.id!);

            await runTransaction(db, async (t) => {
                const sfDoc = await t.get(invoiceRef);
                if (!sfDoc.exists()) throw "Hóa đơn mất tích!";

                const data = sfDoc.data() as InvoiceData;
                const pending = data.pendingItems ? [...data.pendingItems] : [];
                const served = [...data.items];

                const pendingItemIndex = pending.findIndex(i => i.menuItemId === itemIdToServe);
                if (pendingItemIndex === -1) return;

                const itemServing = pending[pendingItemIndex];
                const ts = Date.now();

                // Remove from pending
                pending.splice(pendingItemIndex, 1);

                // Add to served
                const existingServedIndex = served.findIndex(i => i.menuItemId === itemServing.menuItemId);
                if (existingServedIndex > -1) {
                    served[existingServedIndex].quantity += itemServing.quantity;
                    if (!served[existingServedIndex].history) {
                        served[existingServedIndex].history = [{ quantity: served[existingServedIndex].quantity - itemServing.quantity, timestamp: data.createdAt }];
                    }
                    served[existingServedIndex].history.push({ quantity: itemServing.quantity, timestamp: ts });
                } else {
                    itemServing.history = [{ quantity: itemServing.quantity, timestamp: ts }];
                    served.push(itemServing);
                }

                t.update(invoiceRef, {
                    items: served,
                    pendingItems: pending,
                    updatedAt: Date.now()
                });
            });
        },
        onSuccess: () => refetchInv()
    });

    if (isLoadingInv) return <Loading message="Đang tải hóa đơn..." />;
    if (!invoice) return <Box sx={{ p: 3, textAlign: "center" }}><Typography>Hóa đơn không tồn tại!</Typography></Box>;

    const pendingMoney = invoice.pendingItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const servedMoney = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalInvoiceMoney = servedMoney;

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f1f5f9', pb: 10 }}>
            {/* Header Màn Chi Tiết Hóa Đơn */}
            <AppBar position="sticky" elevation={1}>
                <Toolbar sx={{ backgroundColor: 'white', color: 'black' }}>
                    <Button color="inherit" onClick={() => navigate('/staff')} sx={{ minWidth: 0, mr: 1, p: 0, fontWeight: 'bold', color: '#1976d2' }}>
                        {'<'} Bàn
                    </Button>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', textAlign: 'right' }}>
                        {invoice.tableName}
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Thông Tin Chung Hóa Đơn */}
            <Box sx={{ px: 2, py: 3 }}>
                {(isServingItem || isSaving) && <Loading fullPage message="Đang lưu..." />}
                <Card sx={{ borderRadius: 3, mb: 3, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
                    <CardContent>
                        <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>TỔNG THANH TOÁN (ĐÃ PHỤC VỤ)</Typography>
                        <Typography sx={{ fontSize: "24px", fontWeight: "bold", mt: 0.5 }} variant="h6" >{totalInvoiceMoney.toLocaleString()} đ</Typography>
                        {pendingMoney > 0 && (
                            <Typography variant="body2" sx={{ color: '#fbbf24', mt: 0.5, fontStyle: 'italic' }}>
                                (Đang làm/Chờ bê ra: {pendingMoney.toLocaleString()} đ)
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                {/* NÚT THÊM MÓN */}
                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ borderRadius: 3, py: 1.5, mb: 3, fontWeight: 'bold', fontSize: '16px' }}
                    onClick={() => setIsMenuDialogOpen(true)}
                >
                    + GỌI THÊM MÓN
                </Button>

                {/* DANH SÁCH MÓN ĐANG LÀM / CHỜ PHỤC VỤ (Pending Items) */}
                {invoice.pendingItems && invoice.pendingItems.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ fontSize: "20px", fontWeight: "bold", mb: 1.5, color: "#d97706" }} variant="subtitle1" >
                            ⌛ MÓN ĐANG LÀM / CHỜ BÊ RA:
                        </Typography>
                        {invoice.pendingItems.map((item, index) => (
                            <Card key={`pending-${index}`} sx={{ mb: 1.5, borderRadius: 3, border: '2px solid #fcd34d', backgroundColor: '#fffbeb' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: "bold", fontSize: "16px", color: '#b45309' }} >{item.name}</Typography>
                                        <Typography sx={{ fontWeight: "bold", fontSize: "16px", color: '#b45309', mt: 0.5 }}>
                                            Số lượng: x {item.quantity}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            sx={{ fontWeight: 'bold' }}
                                            onClick={() => markAsServed(item.menuItemId)}
                                            disabled={isServingItem}
                                        >
                                            ✅ ĐÃ BÊ RA
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                {/* DANH SÁCH MÓN ĐÃ ĐƯA LÊN CHO KHÁCH (Served Items) */}
                <Typography sx={{ fontSize: "20px", fontWeight: "bold", mt: 0.5, mb: 1.5, color: "text.secondary" }} variant="subtitle1" >
                    ✅ CÁC MÓN ĐÃ PHỤC VỤ:
                </Typography>

                {invoice.items.length === 0 && (!invoice.pendingItems || invoice.pendingItems.length === 0) && (
                    <Typography sx={{ fontSize: "18px", fontWeight: "bold", mt: 0.5, mb: 2, color: "text.secondary", textAlign: "center" }} >Bàn này chưa gọi món nào.</Typography>
                )}

                {invoice.items.map((item, index) => (
                    <Card key={index} sx={{ mb: 1.5, borderRadius: 3 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography sx={{ fontWeight: "bold", fontSize: "16px" }} >{item.name}</Typography>
                                    <Typography sx={{ fontWeight: "bold", fontSize: "14px", color: "text.secondary" }} >
                                        Đơn giá: {item.price.toLocaleString()} đ
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: "right" }}>
                                    <Typography sx={{ fontWeight: "bold", fontSize: "18px", color: "primary.main" }}>
                                        x {item.quantity}
                                    </Typography>
                                    <Typography sx={{ color: "error.main", fontWeight: "bold", fontSize: "15px" }}>
                                        {(item.price * item.quantity).toLocaleString()} đ
                                    </Typography>
                                </Box>
                            </Box>

                            {/* HIỂN THỊ LỊCH SỬ GỌI MÓN */}
                            {item.history && item.history.length > 0 && (
                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed #cbd5e1' }}>
                                    <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                        onClick={() => toggleHistory(item.menuItemId)}
                                    >
                                        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "bold" }}>Lịch sử gọi món</Typography>
                                        <Typography variant="body2" sx={{ color: "primary.main" }}>{expandedHistory[item.menuItemId] ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}</Typography>
                                    </Box>
                                    {expandedHistory[item.menuItemId] && (
                                        <Box sx={{ mt: 1 }}>
                                            {item.history.map((h, hIdx) => (
                                                <Box key={hIdx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                        Lúc {new Date(h.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: "bold", color: "black" }}>+ {h.quantity}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* DIALOG MENU GỌI THÊM MÓN */}
            <Dialog
                open={isMenuDialogOpen}
                onClose={() => !isSaving && setIsMenuDialogOpen(false)}
                fullScreen // Chuyển thành FullScreen Dialog trên Mobile cho dễ lướt menu
            >
                {/* Header Menu Dialog */}
                <AppBar position="sticky" elevation={1}>
                    <Toolbar sx={{ backgroundColor: 'white', color: 'black' }}>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                            MENU QUÁN
                        </Typography>
                        <Button color="inherit" onClick={() => setIsMenuDialogOpen(false)} sx={{ fontWeight: 'bold' }}>ĐÓNG</Button>
                    </Toolbar>
                </AppBar>

                <DialogContent sx={{ p: 2, backgroundColor: '#f1f5f9', pb: 12 }}>
                    {isLoadingMenu && <Loading message="Tải Menu..." />}
                    {Object.values(menuItems || {}).map(item => {
                        const qty = addedItemsDraft[item.id!] || 0;
                        return (
                            <Card key={item.id} sx={{ mb: 1.5, borderRadius: 3 }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: "bold", fontSize: "16px" }}>{item.name}</Typography>
                                        <Typography sx={{ color: "text.secondary", fontSize: "14px" }}>{item.price.toLocaleString()} đ</Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Button
                                            variant="contained" size="small"
                                            sx={{ minWidth: 0, width: 32, height: 32, borderRadius: 2, backgroundColor: '#e2e8f0', color: 'black', boxShadow: 'none' }}
                                            onClick={() => handleAddQty(item.id!, -1)} disabled={qty === 0}
                                        >
                                            -
                                        </Button>
                                        <Typography sx={{ fontWeight: "bold", width: 24, textAlign: 'center' }}>{qty}</Typography>
                                        <Button
                                            variant="contained" color="primary" size="small"
                                            sx={{ minWidth: 0, width: 32, height: 32, borderRadius: 2, boxShadow: 'none' }}
                                            onClick={() => handleAddQty(item.id!, 1)}
                                        >
                                            +
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        )
                    })}
                </DialogContent>

                {/* BOTTOM BAR Ở BOTTOM CỦA MENU DIALOG */}
                <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, bgcolor: 'white', p: 2, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)', borderTop: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                            <Typography sx={{ variant: "caption", color: "text.secondary", display: "block" }}>Thêm {draftTotalCount} món</Typography>
                            <Typography sx={{ variant: "h6", color: "error.main", fontWeight: "bold" }}>{draftTotalAmount.toLocaleString()} đ</Typography>
                        </Box>
                        <Button
                            variant="contained" size="large" sx={{ borderRadius: 3, fontWeight: 'bold', px: 4 }}
                            onClick={() => saveOrder()} disabled={isSaving || draftTotalCount === 0}
                        >
                            {isSaving ? "ĐANG LƯU..." : "XÁC NHẬN"}
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
};

export default InvoiceDetailScreen;
