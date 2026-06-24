import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useWebSocket = (topic: string, onMessage: (message: any) => void) => {
    const clientRef = useRef<Client | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const socketUrl = import.meta.env.VITE_API_URL + '/ws';

        const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                setConnected(true);
                client.subscribe(topic, (message) => {
                    onMessage(message.body);
                });
            },
            onDisconnect: () => {
                setConnected(false);
            },
            reconnectDelay: 5000,
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, [topic]); // We avoid adding onMessage to dependency array to prevent unnecessary reconnects, 
    // but make sure onMessage is wrapped in useCallback in the component.

    return { connected };
};
