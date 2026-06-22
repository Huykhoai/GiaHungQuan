import React, { useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { TableData, MenuItemData } from '../types';
import { useNavigate } from 'react-router-dom';
import './AdminScreen.css';
import { useMutation, useQuery } from '@tanstack/react-query';
import Loading from '@/ui/Loading/Loading';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

const AdminScreen: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'menu' | 'table'>('menu');

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [newTableName, setNewTableName] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');

    const tablesRef = collection(db, 'tables');
    const menuRef = collection(db, 'menuItems');

    const { data: tables, isLoading: isLoadingTables, refetch: refetchTables } = useQuery({
        queryKey: ['tables', activeTab],
        queryFn: async () => {
            const tableSnap = await getDocs(tablesRef);
            return tableSnap.docs.sort((a, b) => a.data().name.localeCompare(b.data().name)).map(d => ({ id: d.id, ...d.data() } as TableData));
        },
        enabled: activeTab === 'table'
    })

    const { data: menuItems, isLoading: isLoadingMenuItems, refetch: refetchMenuItems } = useQuery({
        queryKey: ['menuItems', activeTab],
        queryFn: async () => {
            const menuSnap = await getDocs(menuRef);
            return menuSnap.docs.sort((a, b) => a.data().name.localeCompare(b.data().name)).map(d => ({ id: d.id, ...d.data() } as MenuItemData));
        },
        enabled: activeTab === 'menu'
    })

    const handleOpenDialog = (item?: any) => {
        setIsDialogOpen(true);
        if (item && item.id) {
            setEditingId(item.id);
            if (activeTab === 'table') {
                setNewTableName(item.name);
            } else {
                setNewItemName(item.name);
                setNewItemPrice(String(item.price));
            }
        } else {
            setEditingId(null);
            setNewTableName('');
            setNewItemName('');
            setNewItemPrice('');
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingId(null);
    };

    const { mutateAsync: handleSubmit, isPending } = useMutation({
        mutationFn: async (e: React.FormEvent) => {
            e.preventDefault();
            if (activeTab === 'table') {
                if (!newTableName.trim()) return;
                if (editingId) {
                    const tableDocRef = doc(db, 'tables', editingId);
                    return await runTransaction(db, async (transaction) => {
                        const sfDoc = await transaction.get(tableDocRef);
                        if (!sfDoc.exists()) throw new Error("Bàn không tồn tại!");
                        transaction.update(tableDocRef, { name: newTableName });
                    });
                }
                return await addDoc(tablesRef, { name: newTableName });
            } else {
                if (!newItemName.trim() || !newItemPrice) return;
                if (editingId) {
                    const menuDocRef = doc(db, 'menuItems', editingId);
                    return await runTransaction(db, async (transaction) => {
                        const sfDoc = await transaction.get(menuDocRef);
                        if (!sfDoc.exists()) throw new Error("Món ăn không tồn tại!");
                        transaction.update(menuDocRef, { name: newItemName, price: Number(newItemPrice) });
                    });
                }
                return await addDoc(menuRef, { name: newItemName, price: Number(newItemPrice) });
            }
        },
        onSuccess: () => {
            handleCloseDialog();
            refetchTables();
            refetchMenuItems();
        },
        onError: () => {
            window.alert("Lỗi khi thêm dữ liệu")
        }
    })

    const handleDeleteTable = async (id: string) => {
        if (window.confirm("Bạn có chắc muốn xóa bàn này?")) {
            await deleteDoc(doc(db, 'tables', id));
            refetchTables();
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (window.confirm("Bạn có chắc muốn xóa món này?")) {
            await deleteDoc(doc(db, 'menuItems', id));
            refetchMenuItems();
        }
    };

    return (
        <div className="admin-container">
            {/* Header */}
            <div className="admin-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <span>Quản Lý Quán</span>
            </div>

            {/* Tabs */}
            <div className="tabs-header">
                <button
                    className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
                    onClick={() => setActiveTab('menu')}
                >
                    Menu Món Ăn
                </button>
                <button
                    className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                    onClick={() => setActiveTab('table')}
                >
                    Danh Sách Bàn
                </button>
            </div>

            {/* Content */}
            <div className="list-container">
                {(isLoadingTables || isLoadingMenuItems || isPending) && <Loading message="Đang tải..." />}
                {activeTab === 'menu' ? (
                    menuItems?.map(m => (
                        <div className="list-item" key={m.id}>
                            <div className="item-info">
                                <h4>{m.name}</h4>
                                <span>{m.price.toLocaleString()} VNĐ</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="edit-btn" onClick={() => handleOpenDialog(m)}>
                                    Sửa
                                </button>
                                <button className="delete-btn" onClick={() => m.id && handleDeleteItem(m.id)}>
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    tables?.map(t => (
                        <div className="list-item" key={t.id}>
                            <div className="item-info">
                                <h4>{t.name}</h4>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="edit-btn" onClick={() => handleOpenDialog(t)}>
                                    Sửa
                                </button>
                                <button className="delete-btn" onClick={() => t.id && handleDeleteTable(t.id)}>
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))
                )}

                {/* Empty States */}
                {activeTab === 'menu' && menuItems?.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>Chưa có món ăn nào trong menu.</p>
                )}
                {activeTab === 'table' && tables?.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>Chưa có bàn nào được tạo.</p>
                )}
            </div>

            {/* Floating Action Button */}
            <button className="fab-btn" onClick={() => handleOpenDialog()}>
                +
            </button>

            {/* MUI Dialog */}
            <Dialog open={isDialogOpen} onClose={isPending ? undefined : handleCloseDialog} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {activeTab === 'table' ? (editingId ? 'Sửa Bàn' : 'Thêm Bàn Mới') : (editingId ? 'Sửa Món' : 'Thêm Món Mới')}
                </DialogTitle>
                <DialogContent dividers>
                    {activeTab === 'table' ? (
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Tên bàn (vd: Bàn 1)"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={newTableName}
                            onChange={e => setNewTableName(e.target.value)}
                        />
                    ) : (
                        <>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Tên món (vd: Bia Tiger)"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                sx={{ mb: 2, mt: 1 }}
                            />
                            <TextField
                                margin="dense"
                                label="Giá bán (VNĐ)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={newItemPrice}
                                onChange={e => setNewItemPrice(e.target.value)}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button disabled={isPending} onClick={handleCloseDialog} color="inherit">Hủy</Button>
                    <Button disabled={isPending}
                        onClick={handleSubmit as any}
                        variant="contained"
                        color="primary"
                        disableElevation>{isPending ? "Đang lưu..." : "Lưu"}</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AdminScreen;
