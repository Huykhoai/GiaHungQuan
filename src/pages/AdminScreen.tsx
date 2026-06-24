import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import {
    Box, AppBar, Toolbar, Typography, IconButton, Tabs, Tab,
    Card, CardContent, Fab, Dialog, DialogTitle, DialogContent,
    DialogActions, InputAdornment
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import axiosClient from '../config/axiosClient';
import { useNotification } from '../ui/Notification/NotificationContext';
import Loading from '@/ui/Loading/Loading';
import { RHFTextField } from '@/common/TextField/RHFTextField';
import Button from '@/common/Button/Button';
import './AdminScreen.css';

const AdminScreen: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [tabIndex, setTabIndex] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const methods = useForm({
        defaultValues: { name: '', price: '' }
    });

    const { handleSubmit, reset, setValue } = methods;

    const { data: menuItems, isLoading: loadingMenu, refetch: refetchMenu } = useQuery({
        queryKey: ['menuItems'],
        queryFn: async () => (await axiosClient.get('/api/menu-items')).data
    });

    const { data: tables, isLoading: loadingTables, refetch: refetchTables } = useQuery({
        queryKey: ['diningTables'],
        queryFn: async () => (await axiosClient.get('/api/dining-tables')).data
    });

    const openDialog = (item?: any) => {
        if (item) {
            setEditingId(item.id);
            setValue('name', item.name);
            if (tabIndex === 0) setValue('price', item.price.toString());
        } else {
            setEditingId(null);
            reset();
        }
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        reset();
    };

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            const isMenu = tabIndex === 0;
            const url = isMenu ? '/api/menu-items' : '/api/dining-tables';
            const payload = isMenu ? { name: data.name, price: Number(data.price), category: 'Đồ ăn' } : { name: data.name };

            if (editingId) {
                return axiosClient.put(`${url}/${editingId}`, payload);
            } else {
                return axiosClient.post(url, payload);
            }
        },
        onSuccess: () => {
            showNotification('success', 'Thành công', 'Đã lưu thông tin');
            closeDialog();
            tabIndex === 0 ? refetchMenu() : refetchTables();
        },
        onError: (err: any) => {
            showNotification('error', 'Thất bại', err.response?.data?.message || 'Có lỗi xảy ra');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const url = tabIndex === 0 ? `/api/menu-items/${id}` : `/api/dining-tables/${id}`;
            return axiosClient.delete(url);
        },
        onSuccess: () => {
            showNotification('success', 'Đã xóa', 'Xóa thành công');
            tabIndex === 0 ? refetchMenu() : refetchTables();
        }
    });

    const onSubmit = (data: any) => {
        saveMutation.mutate(data);
    };

    const isLoading = loadingMenu || loadingTables || saveMutation.isPending || deleteMutation.isPending;

    return (
        <Box sx={{ minHeight: 'cacl(100vh - 100px)', bgcolor: '#f1f5f9'}}>
            <AppBar position="sticky" elevation={1} sx={{ top: 0, zIndex: 1100 }}>
                <Toolbar sx={{ bgcolor: 'white', color: '#0f172a' }}>
                    <IconButton edge="start" color="inherit" onClick={() => navigate('/home')}>
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', textAlign: 'center' }}>
                        Quản Trị Hệ Thống
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} variant="fullWidth">
                    <Tab label="Menu Món Ăn" sx={{ fontWeight: 'bold' }} />
                    <Tab label="Danh Sách Bàn" sx={{ fontWeight: 'bold' }} />
                </Tabs>
            </Box>

            <Box sx={{ p: 2 }}>
                {isLoading && <Loading message='Đang tải...' />}

                {tabIndex === 0 ? (
                    menuItems?.map((m: any) => (
                        <div className="list-item" key={m.id}>
                            <div className="item-info">
                                <h4>{m.name}</h4>
                                <span>{m.price.toLocaleString()} VNĐ</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="edit-btn" onClick={() => openDialog(m)}>
                                    Sửa
                                </button>
                                <button className="delete-btn" >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    tables?.map((t: any) => (
                        <Card key={t.id} sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '16px !important' }}>
                                <Typography sx={{ fontWeight: 'bold', fontSize: 16 }}>{t.name}</Typography>
                                <Box>
                                    <IconButton color="primary" onClick={() => openDialog(t)}><EditIcon /></IconButton>
                                    <IconButton color="error" onClick={() => { if (window.confirm('Xóa bàn này?')) deleteMutation.mutate(t.id) }}><DeleteIcon /></IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>

            <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={() => openDialog()}>
                <AddIcon />
            </Fab>

            <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
                <FormProvider {...methods}>
                    <DialogTitle sx={{ fontWeight: 'bold' }}>
                        {tabIndex === 0 ? (editingId ? 'Sửa Món Ăn' : 'Thêm Món Mới') : (editingId ? 'Sửa Bàn' : 'Thêm Bàn Mới')}
                    </DialogTitle>
                    <DialogContent dividers>
                        <RHFTextField
                            name="name"
                            rules={{ required: 'Tên không được bỏ trống' }}
                            placeholder={tabIndex === 0 ? 'Tên món' : 'Tên bàn'}
                            fullWidth
                            startAdornment={<InputAdornment position="start"><AssignmentIcon /></InputAdornment>}
                        />
                        {tabIndex === 0 && (
                            <RHFTextField
                                name="price"
                                rules={{ required: 'Giá không được bỏ trống' }}
                                placeholder="Giá bán (VNĐ)"
                                fullWidth
                                isNumber
                                props={{ mt: 3 }}
                                startAdornment={<InputAdornment position="start"><MonetizationOnIcon /></InputAdornment>}
                            />
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button variant='outline' onClick={closeDialog}>Hủy</Button>
                        <Button variant='primary' disabled={saveMutation.isPending} onClick={handleSubmit(onSubmit)}>{saveMutation.isPending ? 'Đang lưu...' : 'Lưu Lại'}</Button>
                    </DialogActions>
                </FormProvider>
            </Dialog>
        </Box>
    );
};

export default AdminScreen;
