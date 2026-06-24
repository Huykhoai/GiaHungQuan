import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    AppBar, Toolbar, Typography, Card, CardContent, Button,
    Dialog, DialogContent, Box, IconButton, TextField
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import axiosClient from '../config/axiosClient';
import Loading from '@/ui/Loading/Loading';
import { useNotification } from '../ui/Notification/NotificationContext';
import { formatPrice } from '@/utils/formatPrice';
import { useWebSocket } from '../hooks/useWebSocket';
import { Cancel, CheckCircle } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDialog from '@/ui/ConfirmDialog/ConfirmDialog';

const InvoiceDetailScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    useWebSocket(`/topic/invoice/${id}`, (message) => {
        if (message === 'UPDATED') {
            queryClient.invalidateQueries({ queryKey: ['invoiceItems', id] });
            queryClient.invalidateQueries({ queryKey: ['invoice', id] });
        }
    });

    const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
    const [isOpenConfirm, setIsOpenConfirm] = useState(false);
    const [isOpenCancel, setIsOpenCancel] = useState(false);
    const [itemCancelId, setItemCancelId] = useState(null);
    const [isOpenDelete, setIsOpenDelete] = useState(false);
    const [addedItemsDraft, setAddedItemsDraft] = useState<{ [itemId: string]: { quantity: number, note: string } }>({});
    const [expandedHistory, setExpandedHistory] = useState<{ [itemId: string]: boolean }>({});

    const toggleHistory = (itemId: string) => setExpandedHistory(p => ({ ...p, [itemId]: !p[itemId] }));

    const { data: invoice, isLoading: loadingInv, refetch: refetchInv } = useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => (await axiosClient.get(`/api/invoices/${id}`)).data
    });

    const { data: invoiceItems, isLoading: loadingItems, refetch: refetchItems } = useQuery({
        queryKey: ['invoiceItems', id],
        queryFn: async () => (await axiosClient.get(`/api/invoices/${id}/items`)).data
    });

    const { data: menuList, isLoading: loadingMenu } = useQuery({
        queryKey: ['menuItems'],
        queryFn: async () => (await axiosClient.get(`/api/menu-items`)).data
    });

    const pendingItems = useMemo(() => invoiceItems?.filter((i: any) => i.status === 'PENDING') || [], [invoiceItems]);
    const isPaid = useMemo(() => invoice?.status === 'PAID', [invoice]);

    const groupedServedItems = useMemo(() => {
        const served = invoiceItems?.filter((i: any) => i.status === 'SERVED') || [];
        const groups: Record<number, any> = {};
        served.forEach((item: any) => {
            if (!groups[item.menuItemId]) {
                groups[item.menuItemId] = {
                    menuItemId: item.menuItemId,
                    name: item.name,
                    price: item.price,
                    totalQuantity: 0,
                    history: []
                };
            }
            groups[item.menuItemId].totalQuantity += item.quantity;
            groups[item.menuItemId].history.push({
                quantity: item.quantity,
                timestamp: item.updatedAt,
                note: item.note
            });
        });
        return Object.values(groups);
    }, [invoiceItems]);

    const handleAddQty = (itemId: string | number, delta: number) => {
        setAddedItemsDraft(prev => {
            const currentItem = prev[itemId] || { quantity: 0, note: '' };
            const newQty = Math.max(0, currentItem.quantity + delta);
            return { ...prev, [itemId]: { ...currentItem, quantity: newQty } };
        });
    };

    const handleNoteChange = (itemId: string | number, note: string) => {
        setAddedItemsDraft(prev => {
            const currentItem = prev[itemId] || { quantity: 0, note: '' };
            return { ...prev, [itemId]: { ...currentItem, note } };
        });
    };

    const { draftTotalAmount, draftTotalCount } = useMemo(() => {
        let amt = 0, count = 0;
        if (menuList) {
            Object.keys(addedItemsDraft).forEach(key => {
                const qty = addedItemsDraft[key]?.quantity || 0;
                if (qty > 0) {
                    const itemRef = menuList.find((m: any) => m.id.toString() === key);
                    if (itemRef) {
                        amt += itemRef.price * qty;
                        count += qty;
                    }
                }
            });
        }
        return { draftTotalAmount: amt, draftTotalCount: count };
    }, [addedItemsDraft, menuList]);

    const { mutateAsync: orderMutation, isPending: isOrdering } = useMutation({
        mutationFn: async () => {
            const payloadItems = Object.keys(addedItemsDraft)
                .filter(k => addedItemsDraft[k]?.quantity > 0)
                .map(k => ({
                    menuItemId: Number(k),
                    quantity: addedItemsDraft[k].quantity,
                    note: addedItemsDraft[k].note
                }));

            return axiosClient.post(`/api/invoices/${id}/order`, { items: payloadItems });
        },
        onSuccess: () => {
            showNotification('success', 'Thành công', 'Đã lưu món vào danh sách chờ!');
            setIsMenuDialogOpen(false);
            setAddedItemsDraft({});
            refetchItems();
        },
        onError: (err: any) => showNotification('error', err.response?.data?.message || 'Không thể gọi món', 'Lỗi')
    });

    const { mutateAsync: serveMutation, isPending: isServing } = useMutation({
        mutationFn: async (itemId: number) => axiosClient.put(`/api/invoices/items/${itemId}/serve`),
        onSuccess: (response: any) => {
            const invoiceItem = response.data;
            refetchInv();
            refetchItems();
            showNotification('success', 'Đã bê món ' + invoiceItem.name + ' ra!', 'Thành công');
        },
        onError: (err: any) => showNotification('error', err.response?.data?.message || 'Không thể bê món', 'Lỗi')
    });

    const { mutateAsync: cancelMutation, isPending: isCancelling } = useMutation({
        mutationFn: async (itemId: number) => axiosClient.delete(`/api/invoices/items/${itemId}`),
        onSuccess: () => {
            showNotification('success', 'Đã hủy món ăn', 'Thành công');
            refetchItems();
            refetchInv();
        },
        onError: (err: any) => showNotification('error', err.response?.data?.message || 'Không thể hủy món', 'Lỗi')
    });

    const { mutateAsync: payMutation, isPending: isPaying } = useMutation({
        mutationFn: async () => axiosClient.post(`/api/invoices/${id}/pay`),
        onSuccess: () => {
            showNotification('success', 'Hoàn tất', 'Hóa đơn đã được thanh toán!');
            navigate('/staff');
        },
        onError: (err: any) => showNotification('error', 'Không thể thanh toán', err.response?.data?.message || 'Lỗi')
    });

    const { mutateAsync: deleteInvoiceMutation, isPending: isDeletingInvoice } = useMutation({
        mutationFn: async () => axiosClient.delete(`/api/invoices/${id}`),
        onSuccess: (response: any) => {
            const msg = response?.data?.message;
            if (response?.data?.status === 400) {
                showNotification('error', msg, 'Lỗi')
                return;
            }
            showNotification('success', msg, 'Thành công');
            navigate('/staff');
        },
        onError: (err: any) => showNotification('error', err.response?.data?.message || 'Lỗi', 'Không thể hủy bàn')
    });

    if (loadingInv || loadingItems) return <Loading message="Đang tải hóa đơn..." />;
    if (!invoice) return <Box sx={{ p: 3, textAlign: "center" }}><Typography>Hóa đơn không tồn tại!</Typography></Box>;

    const totalInvoiceMoney = invoice.totalAmount || 0;
    const pendingMoney = pendingItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    return (
        <Box sx={{ minHeight: 'calc(100vh - 100px)', backgroundColor: '#f1f5f9' }}>
            <AppBar position="sticky" elevation={1} sx={{ top: 0, zIndex: 1100 }}>
                <Toolbar sx={{ backgroundColor: 'white', color: '#0f172a' }}>
                    <Button color="inherit" onClick={() => navigate('/staff')} sx={{ minWidth: 0, mr: 1, p: 0, fontWeight: 'bold', color: '#2563eb' }}>
                        <ArrowBackIosNewIcon sx={{ fontSize: 18, mr: 0.5 }} /> Bàn
                    </Button>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', textAlign: 'right' }}>
                        {invoice.tableName}
                    </Typography>
                    {invoiceItems?.length === 0 && (
                        <IconButton
                            color="error"
                            onClick={() => setIsOpenDelete(true)}
                            sx={{ ml: 1, bgcolor: '#fee2e2' }}
                            disabled={isDeletingInvoice}
                        >
                            <DeleteIcon />
                        </IconButton>
                    )}
                </Toolbar>
            </AppBar>

            <Box sx={{ px: 2, py: 3 }}>
                {(isServing || isPaying || isOrdering || isCancelling) && <Loading fullPage message="Đang xử lý..." />}

                <Card sx={{ borderRadius: 3, mb: 3, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
                    <CardContent>
                        <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>TỔNG THANH TOÁN (ĐÃ PHỤC VỤ)</Typography>
                        <Typography sx={{ fontSize: "28px", fontWeight: "bold", mt: 0.5 }} variant="h5" >
                            {formatPrice(totalInvoiceMoney)}
                        </Typography>
                        {pendingMoney > 0 && (
                            <Typography variant="body2" sx={{ color: '#fbbf24', mt: 0.5, fontStyle: 'italic' }}>
                                (Đang làm/Chờ bê ra: {formatPrice(pendingMoney)})
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                <Button
                    variant="contained" fullWidth size="large"
                    sx={{ borderRadius: 3, py: 1.5, mb: 3, fontWeight: 'bold', fontSize: '16px' }}
                    onClick={() => setIsMenuDialogOpen(true)}
                >
                    + GỌI THÊM MÓN
                </Button>

                {pendingItems.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ fontSize: "16px", fontWeight: 800, mb: 1.5, color: "#d97706", display: 'flex', alignItems: 'center' }}>
                            ⌛ MÓN ĐANG LÀM / CHỜ BÊ RA:
                        </Typography>
                        {pendingItems.map((item: any) => (
                            <Card key={item.id} sx={{ mb: 1.5, borderRadius: 3, border: '2px solid #fcd34d', backgroundColor: '#fffbeb' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, fontSize: "16px", color: '#b45309' }}>{item.name}</Typography>
                                        <Typography sx={{ fontWeight: 600, fontSize: "15px", color: '#b45309', mt: 0.5 }}>
                                            Số lượng: x <span style={{ fontSize: '18px' }}>{item.quantity}</span>
                                        </Typography>
                                        {item.note && (
                                            <Typography sx={{ fontStyle: 'italic', fontSize: "13px", color: '#d97706', mt: 0.5 }}>
                                                * LƯU Ý: {item.note}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton
                                            sx={{ border: '1px solid #22c55e' }}
                                            onClick={() => serveMutation(item.id)} disabled={isServing}
                                        >
                                            <CheckCircle fontSize='small' color='success' />
                                        </IconButton>
                                        <IconButton
                                            sx={{ border: '1px solid #ef4444' }}
                                            onClick={() => {
                                                setItemCancelId(item.id);
                                                setIsOpenCancel(true);
                                            }}
                                            disabled={isCancelling}
                                        >
                                            <Cancel fontSize='small' color='error' />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                <Typography sx={{ fontSize: "16px", fontWeight: 800, mt: 0.5, mb: 1.5, color: "text.secondary" }}>
                    ✅ CÁC MÓN ĐÃ PHỤC VỤ:
                </Typography>

                {groupedServedItems.length === 0 && pendingItems.length === 0 && (
                    <Typography sx={{ fontSize: "15px", fontWeight: "bold", mt: 0.5, mb: 2, color: "text.secondary", textAlign: "center" }} >
                        Bàn này chưa gọi món nào.
                    </Typography>
                )}

                {groupedServedItems.map((group: any) => (
                    <Card key={group.menuItemId} sx={{ mb: 1.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: "16px" }}>{group.name}</Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: "14px", color: "text.secondary" }}>
                                        Đơn giá: {group.price.toLocaleString()} đ
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: "right" }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: "18px", color: "#2563eb" }}>
                                        x {group.totalQuantity}
                                    </Typography>
                                    <Typography sx={{ color: "#ef4444", fontWeight: 800, fontSize: "15px" }}>
                                        {(group.price * group.totalQuantity).toLocaleString()} đ
                                    </Typography>
                                </Box>
                            </Box>

                            {group.history.length > 0 && (
                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed #cbd5e1' }}>
                                    <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                        onClick={() => toggleHistory(group.menuItemId?.toString())}
                                    >
                                        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>Chi tiết lịch sử bưng bê</Typography>
                                        <Typography variant="body2" sx={{ color: "#2563eb", fontWeight: 'bold' }}>
                                            {expandedHistory[group.menuItemId?.toString()] ? 'Thu gọn ▲' : 'Xem ▼'}
                                        </Typography>
                                    </Box>
                                    {expandedHistory[group.menuItemId?.toString()] && (
                                        <Box sx={{ mt: 1.5, pl: 1, borderLeft: '3px solid #e2e8f0' }}>
                                            {group.history.map((h: any, hIdx: number) => (
                                                <Box key={hIdx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, fontSize: '13px' }}>
                                                        Lúc {new Date(h.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        {h.note && <span style={{ color: '#d97706', fontStyle: 'italic' }}> - {h.note}</span>}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#1e293b", fontSize: '13px' }}>
                                                        + {h.quantity}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                ))}

                <Box sx={{ mt: 5, mb: 2 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        sx={{ py: 1.5, borderRadius: 3, fontWeight: 'bold', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                        onClick={() => setIsOpenConfirm(true)}
                        disabled={pendingItems.length > 0 || isPaying || isPaid}
                    >
                        {pendingItems.length > 0 ? "BÀN CHƯA LÊN ĐỦ ĐỒ - KHÔNG THỂ CHỐT" : "Thanh toán"}
                    </Button>
                </Box>
            </Box>

            <Dialog open={isMenuDialogOpen} onClose={() => !isOrdering && setIsMenuDialogOpen(false)} fullScreen>
                <AppBar position="sticky" elevation={1}>
                    <Toolbar sx={{ backgroundColor: 'white', color: 'black' }}>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                            MENU QUÁN
                        </Typography>
                        <Button color="inherit" onClick={() => setIsMenuDialogOpen(false)} sx={{ fontWeight: 'bold', color: '#ef4444' }}>ĐÓNG</Button>
                    </Toolbar>
                </AppBar>

                <DialogContent sx={{ p: 2, backgroundColor: '#f1f5f9', pb: 12 }}>
                    {loadingMenu && <Loading message="Tải Menu..." />}
                    {menuList?.map((item: any) => {
                        const draft = addedItemsDraft[item.id] || { quantity: 0, note: '' };
                        const qty = draft.quantity;
                        return (
                            <Card key={item.id} sx={{ mb: 1.5, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: "16px" }}>{item.name}</Typography>
                                            <Typography sx={{ color: "text.secondary", fontSize: "14px", fontWeight: 600 }}>{formatPrice(item.price)}</Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <IconButton
                                                sx={{ bgcolor: '#e2e8f0', color: 'black', borderRadius: 2 }}
                                                onClick={() => handleAddQty(item.id, -1)} disabled={qty === 0}
                                            >
                                                <Typography sx={{ fontSize: 18, fontWeight: 'bold', lineHeight: 0.5 }}>-</Typography>
                                            </IconButton>
                                            <Typography sx={{ fontWeight: 800, width: 24, textAlign: 'center', fontSize: 18 }}>{qty}</Typography>
                                            <IconButton
                                                sx={{ bgcolor: '#2563eb', color: 'white', borderRadius: 2, '&:hover': { bgcolor: '#1d4ed8' } }}
                                                onClick={() => handleAddQty(item.id, 1)}
                                            >
                                                <Typography sx={{ fontSize: 18, fontWeight: 'bold', lineHeight: 0.5 }}>+</Typography>
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {qty > 0 && (
                                        <Box sx={{ mt: 1.5 }}>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                placeholder="Ghi chú (Ví dụ: không hành, bỏ đá...)"
                                                value={draft.note}
                                                onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
                                            />
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </DialogContent>

                <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, bgcolor: 'white', p: 2, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)', borderTop: '1px solid #e2e8f0', zIndex: 1200 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>Thêm {draftTotalCount} món</Typography>
                            <Typography variant="h6" sx={{ color: "#ef4444", fontWeight: 900 }}>{formatPrice(draftTotalAmount)}</Typography>
                        </Box>
                        <Button
                            variant="contained" size="large" sx={{ borderRadius: 3, fontWeight: 800, px: 4 }}
                            onClick={() => orderMutation()} disabled={isOrdering || draftTotalCount === 0}
                        >
                            {isOrdering ? "ĐANG LƯU..." : "XÁC NHẬN GỌI"}
                        </Button>
                    </Box>
                </Box>
            </Dialog>
            <ConfirmDialog
                open={isOpenConfirm}
                onClose={() => setIsOpenConfirm(false)}
                onConfirm={() => {
                    payMutation();
                    setIsOpenConfirm(false);
                }}
                title="Xác nhận thanh toán"
                content={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.8rem', color: '#16a34a' }}>
                            {formatPrice(totalInvoiceMoney)}
                        </Typography>
                        <Box
                            component="img"
                            src={`https://img.vietqr.io/image/MB-0382587309-compact.png?amount=${totalInvoiceMoney}&addInfo=${encodeURIComponent(`Thanh toan ${invoice.tableName} - Gia Hung Quan`)}&accountName=${encodeURIComponent('NGUYEN VAN A')}`}
                            alt="QR Thanh toán"
                            sx={{ width: 220, height: 220, borderRadius: 2, border: '2px solid #e2e8f0' }}
                        />
                        <Typography sx={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
                            Quét mã QR bằng app Ngân hàng để thanh toán
                        </Typography>
                    </Box>
                }
                confirmText="ĐÃ NHẬN TIỀN"
                type="success"
            />
            <ConfirmDialog
                open={isOpenCancel}
                onClose={() => setIsOpenCancel(false)}
                onConfirm={() => {
                    cancelMutation(itemCancelId);
                    setIsOpenCancel(false);
                }}
                title="Xác nhận"
                content='Khách đổi ý, bạn chắc chắn muốn hủy món này?'
                type="success"
            />
            <ConfirmDialog
                open={isOpenDelete}
                onClose={() => setIsOpenDelete(false)}
                onConfirm={() => {
                    deleteInvoiceMutation();
                    setIsOpenDelete(false);
                }}
                title="Xác nhận"
                content='Bạn có chắc chắn muốn xóa hóa đơn này?'
                type="success"
            />
        </Box>
    );
};

export default InvoiceDetailScreen;
