import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AppBar, Toolbar, Typography, Box, Card, CardContent,
    ToggleButton, ToggleButtonGroup, Chip, Container,
    Button
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import IconButton from '@mui/material/IconButton';
import axiosClient from '../config/axiosClient';
import Loading from '@/ui/Loading/Loading';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

type ViewMode = 'BY_DISH' | 'BY_TABLE';

const KitchenScreen: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<ViewMode>('BY_TABLE');

    const { data: rawPendingItems, isLoading } = useQuery({
        queryKey: ['pendingItems'],
        queryFn: async () => (await axiosClient.get('/api/invoices/items/pending')).data
    });
    const playBeep = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.type = 'sine';

            // 3 tiếng beep liên tiếp, mỗi tiếng 0.25s
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.6, ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime + 0.25);

            oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.35);
            gain.gain.setValueAtTime(0.6, ctx.currentTime + 0.35);
            gain.gain.setValueAtTime(0, ctx.currentTime + 0.6);

            oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.7);
            gain.gain.setValueAtTime(0.6, ctx.currentTime + 0.7);
            gain.gain.setValueAtTime(0, ctx.currentTime + 1.0);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 1.1);
        } catch (e) {
            console.log('Audio not available:', e);
        }
    };

    useWebSocket('/topic/kitchen', (message) => {
        if (message === 'NEW_ORDER' || message === 'ITEM_CANCELLED' || message === 'ITEM_SERVED') {
            queryClient.invalidateQueries({ queryKey: ['pendingItems'] });
            if (message === 'NEW_ORDER') {
                playBeep();
            }
        }
    });

    const groupedByDish = useMemo(() => {
        if (!rawPendingItems) return [];
        const groups: Record<number, any> = {};
        rawPendingItems.forEach((item: any) => {
            const timeString = item.createdAt || item.updatedAt || new Date().toISOString();
            const itemTime = new Date(timeString).getTime();

            if (!groups[item.menuItemId]) {
                groups[item.menuItemId] = {
                    menuItemId: item.menuItemId,
                    name: item.name,
                    totalQuantity: 0,
                    details: [],
                    oldestTime: itemTime
                };
            }
            groups[item.menuItemId].totalQuantity += item.quantity;
            groups[item.menuItemId].details.push(item);

            if (itemTime < groups[item.menuItemId].oldestTime) {
                groups[item.menuItemId].oldestTime = itemTime;
            }
        });
        return Object.values(groups).sort((a: any, b: any) => a.oldestTime - b.oldestTime);
    }, [rawPendingItems]);

    const groupedByTable = useMemo(() => {
        if (!rawPendingItems) return [];
        const groups: Record<string, any> = {};
        rawPendingItems.forEach((item: any) => {
            const timeString = item.createdAt || item.updatedAt || new Date().toISOString();
            const itemTime = new Date(timeString).getTime();

            if (!groups[item.tableName]) {
                groups[item.tableName] = {
                    tableName: item.tableName,
                    items: [],
                    oldestTime: itemTime,
                    invoiceId: item.invoiceId
                };
            }
            groups[item.tableName].items.push(item);

            if (itemTime < groups[item.tableName].oldestTime) {
                groups[item.tableName].oldestTime = itemTime;
            }
        });
        return Object.values(groups).sort((a: any, b: any) => a.oldestTime - b.oldestTime);
    }, [rawPendingItems]);

    if (isLoading) return <Loading fullPage message="Đang tải dữ liệu Bếp..." />;

    return (
        <Box sx={{ minHeight: 'calc(100vh - 64px)', backgroundColor: '#0f172a' }}>
            <AppBar position="sticky" elevation={4} sx={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button color="inherit" onClick={() => navigate('/home')} sx={{ minWidth: 0, mr: 1, p: 0, fontWeight: 'bold', color: '#2563eb' }}>
                        <ArrowBackIosNewIcon sx={{ fontSize: 18, mr: 0.5 }} />🍳BẾP
                    </Button>

                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, val) => val && setViewMode(val)}
                        sx={{ bgcolor: '#334155', borderRadius: 2 }}
                    >
                        <ToggleButton value="BY_DISH" sx={{ color: '#cbd5e1', '&.Mui-selected': { bgcolor: '#3b82f6', color: 'white' } }}>
                            <RestaurantMenuIcon sx={{ mr: 1 }} /> GOM MÓN
                        </ToggleButton>
                        <ToggleButton value="BY_TABLE" sx={{ color: '#cbd5e1', '&.Mui-selected': { bgcolor: '#10b981', color: 'white' } }}>
                            <TableRestaurantIcon sx={{ mr: 1 }} /> GOM BÀN
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Toolbar>
            </AppBar>

            <Container maxWidth={false} sx={{ mt: 3, pb: 5 }}>
                {rawPendingItems?.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 10 }}>
                        <Typography variant="h4" sx={{ color: '#475569', fontWeight: 'bold' }}>
                            🎉 QUÁN ĐANG RẢNH - CHƯA CÓ ĐƠN NÀO!
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>

                        {/* HIỂN THỊ: GOM THEO MÓN */}
                        {viewMode === 'BY_DISH' && groupedByDish.map((dish: any) => (
                            <Card key={dish.menuItemId} sx={{ backgroundColor: '#1e293b', borderRadius: 3, border: '1px solid #334155', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, borderBottom: '1px solid #334155', pb: 1.5 }}>
                                        <Typography variant="h6" sx={{ color: '#facc15', fontWeight: 900 }}>
                                            {dish.name}
                                        </Typography>
                                        <Chip label={`TỔNG: x${dish.totalQuantity}`} sx={{ bgcolor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', height: 32 }} />
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {dish.details.map((d: any, idx: number) => {
                                            const timeString = d.createdAt || d.updatedAt || new Date().toISOString();
                                            const waitMins = formatDistanceToNow(new Date(timeString), { addSuffix: true, locale: vi });
                                            return (
                                                <Box key={idx} sx={{ bgcolor: '#0f172a', p: 1.5, borderRadius: 2, borderLeft: `4px solid ${'#3b82f6'}` }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                                                            {d.tableName} <span style={{ color: '#94a3b8' }}>• x{d.quantity}</span>
                                                        </Typography>
                                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                                                            <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} /> {waitMins}
                                                        </Typography>
                                                    </Box>
                                                    {d.note && (
                                                        <Typography sx={{ color: '#f59e0b', fontSize: '0.9rem', fontStyle: 'italic', mt: 0.5, fontWeight: 600 }}>
                                                            ⚠️ {d.note}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )
                                        })}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}

                        {/* HIỂN THỊ: GOM THEO BÀN */}
                        {viewMode === 'BY_TABLE' && groupedByTable.map((table: any) => (
                            <Card key={table.tableName} sx={{ backgroundColor: '#1e293b', borderRadius: 3, border: '1px solid #334155', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, borderBottom: '1px dashed #334155', pb: 1.5 }}>
                                        <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 900 }}>
                                            {table.tableName}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => navigate(`/invoice/${table.invoiceId}`)}
                                            sx={{ bgcolor: '#334155', color: 'white', '&:hover': { bgcolor: '#475569' } }}
                                        >
                                            <ArrowForwardIcon fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {table.items.map((item: any, idx: number) => {
                                            const timeString = item.createdAt || item.updatedAt || new Date().toISOString();
                                            const waitMins = formatDistanceToNow(new Date(timeString), { addSuffix: true, locale: vi });
                                            return (
                                                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#0f172a', p: 1.5, borderRadius: 2 }}>
                                                    <Box>
                                                        <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                                                            {item.name} <span style={{ color: '#94a3b8' }}>• x{item.quantity}</span>
                                                        </Typography>
                                                        {item.note && (
                                                            <Typography sx={{ color: '#f59e0b', fontSize: '0.85rem', fontStyle: 'italic', mt: 0.5 }}>
                                                                LƯU Ý: {item.note}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                        {waitMins}
                                                    </Typography>
                                                </Box>
                                            )
                                        })}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}

                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default KitchenScreen;
