import React, { useState } from 'react';
import { Box, Typography, Button, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff, SportsBar } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import axiosClient from '@/config/axiosClient';
import { RHFTextField } from '@/common/TextField/RHFTextField';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/ui/Notification/NotificationContext';

const LoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { showNotification } = useNotification();
    const [showPassword, setShowPassword] = useState(false);

    const methods = useForm({
        defaultValues: {
            username: '',
            password: ''
        }
    });

    const loginMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await axiosClient.post('/api/auth/login', data);
            return response.data;
        },
        onSuccess: (data: any) => {
            const { token, username } = data;
            login(token, {username: username});
            showNotification('success', 'Chào mừng bạn quay trở lại!', 'Đăng nhập thành công');
            navigate('/home');
        },
        onError: (error: any) => {
            if (error.response?.status === 401 || error.response?.status === 403) {
                showNotification('error', 'Tài khoản hoặc mật khẩu không chính xác!', 'Đăng nhập thất bại');
            } else {
                showNotification('error', error.response?.data?.message || 'Đăng nhập thất bại', 'Đăng nhập thất bại');
            }
        }
    });

    const onSubmit = (data: any) => {
        loginMutation.mutate(data);
    };

    return (
        <Box
            sx={{
                height: '96vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#121212',
                backgroundImage: 'radial-gradient(ellipse at center, #1b1b1b 0%, #0a0a0a 100%)',
                color: 'white',
            }}
        >
            <FormProvider {...methods}>
                <Box
                    component="form"
                    onSubmit={methods.handleSubmit(onSubmit)}
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        p: 4,
                        borderRadius: 4,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{ p: 2, backgroundColor: 'rgba(217, 119, 6, 0.15)', borderRadius: '50%', mb: 2 }}>
                        <SportsBar sx={{ fontSize: 48, color: '#f59e0b' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#fcd34d', letterSpacing: 1 }}>
                        GIA HƯNG QUÁN
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', mb: 4, opacity: 0.8 }}>
                        Hệ Thống Quản Lý Nội Bộ
                    </Typography>

                    <Box sx={{ width: '100%', mb: 2.5 }}>
                        <RHFTextField
                            name="username"
                            placeholder="Tên đăng nhập / Số điện thoại"
                            rules={{ required: "Vui lòng nhập tên đăng nhập" }}
                            props={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    color: 'black'
                                }
                            }}
                        />
                    </Box>

                    <Box sx={{ width: '100%', mb: 1 }}>
                        <RHFTextField
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mật khẩu"
                            rules={{ required: "Vui lòng nhập mật khẩu" }}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            }
                            props={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    color: 'black'
                                }
                            }}
                        />
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loginMutation.isPending}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 'bold',
                            fontSize: '14px',
                            backgroundColor: '#f59e0b',
                            color: 'black',
                            '&:hover': { backgroundColor: '#d97706' },
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                        }}
                    >
                        {loginMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'ĐĂNG NHẬP'}
                    </Button>
                </Box>
            </FormProvider>

            <Typography variant="caption" sx={{ mt: 5, color: '#71717a' }}>
                © 2026 Gia Hưng Quán POS Version 2.0
            </Typography>
        </Box>
    );
};

export default LoginScreen;
