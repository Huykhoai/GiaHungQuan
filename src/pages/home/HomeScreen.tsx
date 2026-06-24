import React from 'react';
import { Box, Typography, Card, CardContent, CardActionArea, IconButton, Avatar, AppBar, Toolbar } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import StorefrontIcon from '@mui/icons-material/Storefront';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';

const HomeScreen: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        {
            title: 'Giao Diện Phục Vụ',
            description: 'Dành cho nhân viên order và quản lý bàn',
            icon: <RoomServiceIcon sx={{ fontSize: 60, color: '#3b82f6' }} />,
            path: '/staff',
            color: 'rgba(59, 130, 246, 0.1)'
        },
        {
            title: 'Màn Hình Bếp',
            description: 'Quản lý các món đang làm, báo hoàn thành',
            icon: <RestaurantMenuIcon sx={{ fontSize: 60, color: '#ef4444' }} />,
            path: '/kitchen',
            color: 'rgba(239, 68, 68, 0.1)'
        },
        {
            title: 'Quản Trị Quán',
            description: 'Thêm/sửa danh sách bàn và menu đồ ăn đồ uống',
            icon: <StorefrontIcon sx={{ fontSize: 60, color: '#8b5cf6' }} />,
            path: '/admin',
            color: 'rgba(139, 92, 246, 0.1)'
        }
    ];

    return (
        <Box sx={{ minHeight: 'calc(100vh - 48px)', backgroundColor: '#f8fafc' }}>
            <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: '#f59e0b', mr: 1.5, fontWeight: 'bold' }}>
                            GH
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 800, lineHeight: 1.2 }}>
                                GIA HƯNG QUÁN
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                Xin chào, {user?.username || 'Quản lý'}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleLogout} sx={{ color: '#ef4444' }}>
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto', mt: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: '#1e293b' }}>
                    Hệ Thống Phân Hệ
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {navItems.map((item, index) => (
                        <Card
                            key={index}
                            elevation={0}
                            sx={{
                                borderRadius: 4,
                                border: '1px solid #e2e8f0',
                                '&:hover': {
                                    borderColor: item.color.replace('0.1', '0.5'),
                                    boxShadow: `0 10px 25px -5px ${item.color}`
                                }
                            }}
                        >
                            <CardActionArea onClick={() => navigate(item.path)} sx={{ p: 2, display: 'flex', justifyContent: 'flex-start' }}>
                                <Box sx={{ p: 2, borderRadius: 3, bgcolor: item.color, display: 'flex', mr: 3 }}>
                                    {item.icon}
                                </Box>
                                <CardContent sx={{ flex: 1, p: 0, '&:last-child': { pb: 0 } }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                                        {item.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                                        {item.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default HomeScreen;
