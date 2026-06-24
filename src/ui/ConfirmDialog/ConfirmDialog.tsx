import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    IconButton,
    Zoom,
    alpha
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Button from '@/common/Button/Button';
export type ConfirmDialogType = 'info' | 'warning' | 'error' | 'success';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    content: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmDialogType;
    loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    content,
    onClose,
    onConfirm,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    type = 'info',
    loading = false
}) => {

    const getConfig = () => {
        switch (type) {
            case 'warning':
                return {
                    color: '#f59e0b',
                    icon: <WarningAmberRoundedIcon sx={{ fontSize: 40 }} />,
                    bg: alpha('#f59e0b', 0.1)
                };
            case 'error':
                return {
                    color: '#ef4444',
                    icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 40 }} />,
                    bg: alpha('#ef4444', 0.1)
                };
            case 'success':
                return {
                    color: '#10b981',
                    icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 40 }} />,
                    bg: alpha('#10b981', 0.1)
                };
            default:
                return {
                    color: '#6366f1',
                    icon: <InfoOutlinedIcon sx={{ fontSize: 40 }} />,
                    bg: alpha('#6366f1', 0.1)
                };
        }
    };

    const config = getConfig();

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            TransitionComponent={Zoom}
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    padding: '8px',
                    maxWidth: '440px',
                    width: '100%',
                    overflow: 'hidden'
                }
            }}
        >
            {!loading && (
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        color: '#94a3b8',
                        '&:hover': { bgcolor: '#f1f5f9', color: '#1e293b' }
                    }}
                >
                    <CloseRoundedIcon />
                </IconButton>
            )}

            <DialogTitle sx={{ px: 2, pt: 2, pb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: config.bg,
                            color: config.color,
                        }}
                    >
                        {config.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 4, pb: 2 }}>
                <Typography
                    variant="body1"
                    sx={{
                        color: '#64748b',
                        textAlign: 'center',
                        lineHeight: 1.6,
                        fontWeight: 500
                    }}
                >
                    {content}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 2, pb: 2, pt: 1, gap: 5, justifyContent: 'center' }}>
                <Button
                    onClick={onClose}
                    disabled={loading}
                    variant='outline'
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                >
                    {loading ? 'Đang xử lý...' : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default React.memo(ConfirmDialog);
