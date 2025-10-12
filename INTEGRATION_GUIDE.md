# Display Integration Guide - Real-time Data Flow

## Overview

This guide explains how the Display screen will receive real-time updates when officers call the next customer.

## Current Implementation vs Production

### Current (Demo Mode)
```typescript
// Static sample data that updates every 10 seconds
const sampleDisplayInfo: DisplayInfo = {
  currentTicket: { id: 'A001', ... },
  nextTickets: [...],
  // ...
};
setDisplayInfo(sampleDisplayInfo);
```

### Production (Real-time)
```typescript
// Real-time data from WebSocket or Server-Sent Events
websocket.on('queue-update', (data) => {
  setDisplayInfo(data);
});
```

---

## Recommended Approach: WebSocket

WebSocket provides bi-directional real-time communication, perfect for queue management.

### Architecture Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Officer   │         │   Backend   │         │   Display   │
│   (Web UI)  │         │  WebSocket  │         │   Screen    │
│             │         │   Server    │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
      │                       │                       │
      │ 1. Click "Call Next"  │                       │
      ├──────────────────────>│                       │
      │                       │                       │
      │                       │ 2. Broadcast Update   │
      │                       ├──────────────────────>│
      │                       │                       │
      │                       │                       │ 3. UI Updates
      │                       │                       │    Automatically
```

---

## Step-by-Step Integration

### Step 1: Backend WebSocket Server Setup

Install dependencies:
```bash
cd server
npm install ws socket.io
```

Create WebSocket server:
```typescript
// server/src/websocket.ts
import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Configure properly in production
      methods: ['GET', 'POST']
    }
  });

  // Store connected clients by room
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join display room
    socket.on('join-display', () => {
      socket.join('display-room');
      console.log('Display client joined');
    });

    // Join officer room
    socket.on('join-officer', (officerId) => {
      socket.join('officer-room');
      socket.join(`officer-${officerId}`);
      console.log(`Officer ${officerId} joined`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
```

### Step 2: Emit Events When Officer Calls Next Customer

```typescript
// server/src/services/queueService.ts
import { Server as SocketIOServer } from 'socket.io';

export class QueueService {
  constructor(private io: SocketIOServer) {}

  async callNextCustomer(counterId: number): Promise<Ticket> {
    // 1. Get next ticket from queue
    const nextTicket = await this.getNextFromQueue(counterId);
    
    // 2. Update ticket status to 'serving'
    await this.updateTicketStatus(nextTicket.id, 'serving', counterId);

    // 3. Get updated display information
    const displayInfo = await this.getDisplayInfo();

    // 4. Broadcast to all display screens
    this.io.to('display-room').emit('queue-update', displayInfo);

    // 5. Notify specific officer
    this.io.to(`officer-${counterId}`).emit('ticket-assigned', nextTicket);

    return nextTicket;
  }

  async completeService(ticketId: string): Promise<void> {
    // 1. Update ticket status to 'completed'
    await this.updateTicketStatus(ticketId, 'completed');

    // 2. Get updated display information
    const displayInfo = await this.getDisplayInfo();

    // 3. Broadcast to all display screens
    this.io.to('display-room').emit('queue-update', displayInfo);
  }

  private async getDisplayInfo(): Promise<DisplayInfo> {
    // Fetch current queue status from database
    const currentTicket = await this.getCurrentServingTicket();
    const nextTickets = await this.getNextTickets(6);
    const queueStatus = await this.getQueueStatus();
    const counters = await this.getCounterStatus();

    return {
      currentTicket,
      nextTickets,
      queueStatus,
      counters,
      lastUpdated: new Date()
    };
  }
}
```

### Step 3: Update Display Component (Client)

Install Socket.IO client:
```bash
cd client
npm install socket.io-client
```

Update `display.tsx`:
```typescript
// client/src/pages/display/display.tsx
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { DisplayInfo } from '../../types/index';

const Display = () => {
  const [displayInfo, setDisplayInfo] = useState<DisplayInfo | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Connect to WebSocket server
    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // 2. Handle connection events
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      // Join display room
      newSocket.emit('join-display');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // 3. Listen for queue updates
    newSocket.on('queue-update', (data: DisplayInfo) => {
      console.log('Received queue update:', data);
      setDisplayInfo(data);
    });

    // 4. Request initial data
    newSocket.on('connect', () => {
      newSocket.emit('request-display-data');
    });

    newSocket.on('display-data', (data: DisplayInfo) => {
      setDisplayInfo(data);
    });

    setSocket(newSocket);

    // 5. Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Optional: Fallback polling for when WebSocket fails
  useEffect(() => {
    if (!isConnected) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/display/status');
          const data = await response.json();
          setDisplayInfo(data);
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 10000); // Poll every 10 seconds as fallback

      return () => clearInterval(pollInterval);
    }
  }, [isConnected]);

  // ... rest of the component
};
```

### Step 4: Update Officer Component (Client)

```typescript
// client/src/pages/officer/officer.tsx
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const Officer = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);

  useEffect(() => {
    if (!currentOfficer) return;

    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      // Join officer room
      newSocket.emit('join-officer', currentOfficer.id);
    });

    newSocket.on('ticket-assigned', (ticket: Ticket) => {
      console.log('New ticket assigned:', ticket);
      setCurrentTicket(ticket);
      setCounterStatus('busy');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentOfficer]);

  const handleCallNextCustomer = async () => {
    if (!currentOfficer || counterStatus !== 'available') return;

    try {
      // Call API to get next customer
      const response = await fetch('/api/queue/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          counterId: currentOfficer.counterId
        })
      });

      const ticket = await response.json();
      
      // WebSocket will automatically update display screens
      // and notify this officer
      
    } catch (error) {
      console.error('Error calling next customer:', error);
    }
  };

  // ... rest of the component
};
```

---

## Alternative Approach: Server-Sent Events (SSE)

If you only need server-to-client communication (display screen doesn't send data), SSE is simpler.

### Backend (Express + SSE)

```typescript
// server/src/routes/sse.ts
import { Request, Response } from 'express';

const clients: Set<Response> = new Set();

export function setupSSE(app: Express) {
  app.get('/api/stream/display', (req: Request, res: Response) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add client to set
    clients.add(res);

    // Send initial data
    const initialData = getDisplayInfo();
    res.write(`data: ${JSON.stringify(initialData)}\n\n`);

    // Remove client on disconnect
    req.on('close', () => {
      clients.delete(res);
    });
  });
}

// Broadcast to all clients
export function broadcastQueueUpdate(data: DisplayInfo) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    client.write(message);
  });
}
```

### Frontend (Display with SSE)

```typescript
// client/src/pages/display/display.tsx
useEffect(() => {
  const eventSource = new EventSource('/api/stream/display');

  eventSource.onmessage = (event) => {
    const data: DisplayInfo = JSON.parse(event.data);
    setDisplayInfo(data);
  };

  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}, []);
```

---

## Data Flow Example

### Scenario: Officer Calls Next Customer

**1. Officer clicks "Call Next Customer" button**
```typescript
// Officer component
handleCallNextCustomer() 
  → POST /api/queue/next
```

**2. Backend processes request**
```typescript
// Backend QueueService
async callNextCustomer(counterId) {
  // Get next ticket from database
  const ticket = await db.getNextTicket(counterId);
  
  // Update ticket status
  await db.updateTicket(ticket.id, { 
    status: 'serving',
    counterId: counterId,
    calledAt: new Date()
  });
  
  // Get updated display info
  const displayInfo = await getDisplayInfo();
  
  // Broadcast via WebSocket
  io.to('display-room').emit('queue-update', displayInfo);
  
  return ticket;
}
```

**3. Display screen receives update**
```typescript
// Display component
socket.on('queue-update', (data) => {
  setDisplayInfo(data);
  // UI automatically re-renders with new data
});
```

**4. UI updates automatically**
- Currently Serving shows new ticket
- Next Customers list updates
- Queue status updates
- Counter status changes

---

## Environment Configuration

Create `.env` file:
```env
# Client (.env in client directory)
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000

# Server (.env in server directory)
PORT=3000
WS_PORT=3000
DATABASE_URL=your_database_url
```

---

## Error Handling & Reconnection

```typescript
// Robust WebSocket connection with auto-reconnect
const connectWebSocket = () => {
  const socket = io(WS_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    timeout: 5000
  });

  socket.on('connect', () => {
    console.log('Connected');
    setConnectionStatus('connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
    setConnectionStatus('disconnected');
    
    if (reason === 'io server disconnect') {
      // Server disconnected, manually reconnect
      socket.connect();
    }
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('Reconnect attempt:', attemptNumber);
    setConnectionStatus('reconnecting');
  });

  socket.on('reconnect_failed', () => {
    console.log('Reconnection failed');
    setConnectionStatus('failed');
    // Fallback to polling
  });

  return socket;
};
```

---

## Testing Real-time Updates

### Local Testing

1. **Start backend server**
```bash
cd server
npm run dev
```

2. **Start frontend**
```bash
cd client
npm run dev
```

3. **Open multiple browser windows**
   - Window 1: Officer page (`http://localhost:5173/officer`)
   - Window 2: Display page (`http://localhost:5173/display`)

4. **Test the flow**
   - Login as officer in Window 1
   - Click "Call Next Customer"
   - Watch Window 2 update automatically

---

## Performance Considerations

### For Display Screens

1. **Connection Pooling**: Display screens should maintain persistent WebSocket connections
2. **Auto-reconnect**: Implement reconnection logic for network failures
3. **Fallback Polling**: Use REST API polling as backup when WebSocket fails
4. **Data Caching**: Cache last known state to show during disconnection

### For Backend

1. **Room-based Broadcasting**: Use Socket.IO rooms to target specific clients
2. **Rate Limiting**: Prevent spam updates (debounce/throttle)
3. **Data Compression**: Use compression for large payloads
4. **Horizontal Scaling**: Use Redis adapter for multi-server setup

```typescript
// Redis adapter for scaling
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

---

## Summary

### Key Points

✅ **WebSocket is recommended** for bi-directional real-time communication

✅ **Display screens join a "room"** and receive broadcasts when queue updates

✅ **Officer actions trigger broadcasts** to all connected display screens

✅ **Automatic UI updates** - React re-renders when state changes

✅ **Fallback to polling** if WebSocket connection fails

✅ **Connection status monitoring** for reliability

### Next Steps

1. Implement WebSocket server in backend
2. Add Socket.IO client to display and officer components
3. Create QueueService with broadcast logic
4. Add connection status indicators
5. Test with multiple simultaneous connections
6. Deploy with proper CORS and security settings

---

For more details, see:
- Socket.IO documentation: https://socket.io/docs/
- React hooks with WebSocket: https://socket.io/how-to/use-with-react
