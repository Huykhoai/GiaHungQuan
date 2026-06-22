import React from 'react';
import './Loading.css';

interface LoadingProps {
    message?: string;
    fullPage?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
    message = "Đang tải dữ liệu...",
    fullPage = false
}) => {
    const content = (
        <>
            <div className="spinner-wrapper">
                <div className="spinner-main"></div>
                <div className="spinner-inner"></div>
            </div>
            {message && <div className="loading-text">{message}</div>}
        </>
    );

    if (fullPage) {
        return (
            <div className="loading-overlay">
                {content}
            </div>
        );
    }

    return (
        <div className="loading-container-inline">
            {content}
        </div>
    );
};

export default Loading;
