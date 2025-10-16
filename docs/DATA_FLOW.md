# Display Real-time Update - Data Flow Diagram

## Complete Data Flow

### 1. Initial Connection Phase

```
┌──────────┐              ┌──────────┐              ┌──────────┐
│ Display  │              │  Server  │              │ Database │
│  Screen  │              │  Backend │              │          │
└──────────┘              └──────────┘              └──────────┘
     │                          │                          │
     │ 1. Establish WebSocket   │                          │
     │─────────────────────────>│                          │
     │                          │                          │
     │ 2. Join 'displays' room  │                          │
     │─────────────────────────>│                          │
     │                          │                          │
     │                          │ 3. Query initial data    │
     │                          │─────────────────────────>│
     │                          │                          │
     │                          │ 4. Return queue status   │
     │                          │<─────────────────────────│
     │                          │                          │
     │ 5. Send initial data     │                          │
     │<─────────────────────────│                          │
     │                          │                          │
     │ 6. Render UI with data   │                          │
     │                          │                          │
```

### 2. Officer Calling Customer Phase

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│ Officer  │         │  Server  │         │ Database │         │ Display  │
│   UI     │         │  Backend │         │          │         │  Screen  │
└──────────┘         └──────────┘         └──────────┘         └──────────┘
     │                    │                     │                     │
     │ ① Click            │                     │                     │
     │ "Call Next"        │                     │                     │
     │                    │                     │                     │
     │ ② POST             │                     │                     │
     │ /api/queue/next    │                     │                     │
     │───────────────────>│                     │                     │
     │                    │                     │                     │
     │                    │ ③ Query next ticket │                     │
     │                    │ SELECT * FROM       │                     │
     │                    │ tickets WHERE       │                     │
     │                    │ status='waiting'    │                     │
     │                    │ ORDER BY timestamp  │                     │
     │                    │ LIMIT 1             │                     │
     │                    │────────────────────>│                     │
     │                    │                     │                     │
     │                    │ ④ Return ticket A002│                     │
     │                    │<────────────────────│                     │
     │                    │                     │                     │
     │                    │ ⑤ Update ticket     │                     │
     │                    │ UPDATE tickets      │                     │
     │                    │ SET status='serving'│                     │
     │                    │ WHERE id='A002'     │                     │
     │                    │────────────────────>│                     │
     │                    │                     │                     │
     │                    │ ⑥ Update success    │                     │
     │                    │<────────────────────│                     │
     │                    │                     │                     │
     │                    │ ⑦ Query display data│                     │
     │                    │ (current, next,     │                     │
     │                    │  queue, counters)   │                     │
     │                    │────────────────────>│                     │
     │                    │                     │                     │
     │                    │ ⑧ Return full data  │                     │
     │                    │<────────────────────│                     │
     │                    │                     │                     │
     │ ⑨ Return to Officer│                     │                     │
     │<───────────────────│                     │                     │
     │                    │                     │                     │
     │ ⑩ Officer UI update│                     │                     │
     │ Show "Serving A002"│                     │                     │
     │                    │                     │                     │
     │                    │ ⑪ WebSocket broadcast│                    │
     │                    │ io.to('displays')   │                     │
     │                    │ .emit('queue-update',│                     │
     │                    │       displayData)  │                     │
     │                    │─────────────────────────────────────────>│
     │                    │                     │                     │
     │                    │                     │                     │ ⑫ Display receives
     │                    │                     │                     │ socket.on('queue-update')
     │                    │                     │                     │
     │                    │                     │                     │ ⑬ Update React state
     │                    │                     │                     │ setDisplayInfo(data)
     │                    │                     │                     │
     │                    │                     │                     │ ⑭ React re-renders
     │                    │                     │                     │ - Current: A002
     │                    │                     │                     │ - Counter: #1
     │                    │                     │                     │ - Next customers update
     │                    │                     │                     │
```

## Detailed Step Explanation

### Officer Side Flow

```javascript
// Step 1: User clicks button
<Button onClick={handleCallNextCustomer}>
  Call Next Customer
</Button>

// Step 2: Send HTTP request
const handleCallNextCustomer = async () => {
  const response = await fetch('/api/queue/next', {
    method: 'POST',
    body: JSON.stringify({ counterId: 1 })
  });
  
  const ticket = await response.json();
  
  // Step 3: Update local state
  setCurrentTicket(ticket);
};
```

### Backend Side Flow

```javascript
// Step 4: Receive request
app.post('/api/queue/next', async (req, res) => {
  const { counterId } = req.body;
  
  // Step 5: Get next ticket from database
  const nextTicket = await db.tickets.findFirst({
    where: { status: 'waiting' },
    orderBy: { timestamp: 'asc' }
  });
  
  // Step 6: Update ticket status
  await db.tickets.update({
    where: { id: nextTicket.id },
    data: { 
      status: 'serving',
      counterId: counterId,
      calledAt: new Date()
    }
  });
  
  // Step 7: Get complete Display data
  const displayData = {
    currentTicket: nextTicket,
    nextTickets: await getNextTickets(),
    queueStatus: await getQueueStatus(),
    counters: await getCounterStatus(),
    lastUpdated: new Date()
  };
  
  // Step 8: Broadcast to all Displays via WebSocket
  io.to('displays').emit('queue-update', displayData);
  
  // Step 9: Return response to Officer
  res.json(nextTicket);
});
```

### Display Side Flow

```javascript
// Step 10: Display listens to WebSocket messages
useEffect(() => {
  const socket = io('http://localhost:3000');
  
  // Join room after connection
  socket.on('connect', () => {
    socket.emit('join-display');
  });
  
  // Step 11: Listen for queue updates
  socket.on('queue-update', (data) => {
    console.log('Received update:', data);
    
    // Step 12: Update React state
    setDisplayInfo(data);
    
    // Step 13: React automatically re-renders UI
    // No extra code needed, React detects state changes
  });
  
  return () => socket.close();
}, []);

// Step 14: Render UI
return (
  <div>
    <h1>Currently Serving</h1>
    <h2>{displayInfo.currentTicket.id}</h2>
    <p>Please go to Counter #{displayInfo.currentTicket.counterId}</p>
  </div>
);
```

## Multiple Display Synchronization

```
┌──────────┐
│ Display1 │────┐
└──────────┘    │
                │
┌──────────┐    │     ┌──────────┐        ┌──────────┐
│ Display2 │────┼────>│  Server  │<───────│ Officer  │
└──────────┘    │     │(WebSocket)│       └──────────┘
                │     └──────────┘
┌──────────┐    │           │
│ Display3 │────┘           │ Broadcast to all
└──────────┘                │ clients in
                            │ 'displays' room
                            ↓
                     All Displays update simultaneously
```

### Room Mechanism

```javascript
// Backend - Socket.IO Room Management
io.on('connection', (socket) => {
  
  // Display joins displays room
  socket.on('join-display', () => {
    socket.join('displays');
    console.log('Display joined, clients in room:', 
                io.sockets.adapter.rooms.get('displays').size);
  });
  
  // Officer joins officer room
  socket.on('join-officer', (officerId) => {
    socket.join('officer-room');
    socket.join(`officer-${officerId}`); // Individual room
  });
});

// Broadcast to specific room
io.to('displays').emit('queue-update', data);  // Only Display receives
io.to('officer-room').emit('notification', msg); // Only Officer receives
```

## Data Structure

### DisplayInfo Data Format

```typescript
{
  currentTicket: {
    id: "A002",
    serviceType: "SHIPPING",
    timestamp: "2025-10-12T04:07:04.000Z",
    status: "serving",
    counterId: 1
  },
  nextTickets: [
    { id: "A003", serviceType: "ACCOUNT", status: "waiting" },
    { id: "A004", serviceType: "DEPOSIT", status: "waiting" },
    { id: "A005", serviceType: "SHIPPING", status: "waiting" },
    { id: "A006", serviceType: "ACCOUNT", status: "waiting" }
  ],
  queueStatus: [
    { serviceType: "DEPOSIT", length: 8, estimatedWaitTime: 15 },
    { serviceType: "SHIPPING", length: 5, estimatedWaitTime: 25 },
    { serviceType: "ACCOUNT", length: 3, estimatedWaitTime: 20 }
  ],
  counters: [
    { 
      id: 1, 
      number: 1, 
      availableServices: ["DEPOSIT", "ACCOUNT"],
      status: "serving",
      currentTicket: "A002"
    },
    { 
      id: 2, 
      number: 2, 
      availableServices: ["SHIPPING", "DEPOSIT"],
      status: "available"
    },
    { 
      id: 3, 
      number: 3, 
      availableServices: ["ACCOUNT", "SHIPPING"],
      status: "available"
    }
  ],
  lastUpdated: "2025-10-12T04:12:10.000Z"
}
```

## Timeline Example

```
Timeline (milliseconds)
│
0ms   │ Officer clicks "Call Next" button
      │
10ms  │ HTTP request reaches backend
      │
15ms  │ Database query starts
      │
25ms  │ Database returns ticket A002
      │
30ms  │ Update ticket status to 'serving'
      │
40ms  │ Build complete DisplayInfo data
      │
45ms  │ WebSocket broadcast message
      │
50ms  │ Display1 receives message ← Almost simultaneously
      │ Display2 receives message
      │ Display3 receives message
      │
52ms  │ All Displays' React state updated
      │
55ms  │ All Displays' UI re-render completed
      │
60ms  │ HTTP response returns to Officer
      │
65ms  │ Officer UI updates
      │
      ↓
```

**Total Latency: ~50-60 milliseconds** ⚡

## Reconnection Mechanism

```
┌──────────┐                    ┌──────────┐
│ Display  │                    │  Server  │
└──────────┘                    └──────────┘
     │                                │
     │ ① Normal connection            │
     │<──────────────────────────────>│
     │                                │
     │ ② Network disconnected         │
     │xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     │                                
     │ ③ Auto reconnect (Attempt 1)   
     │────────────────────────────────>
     │                                
     │ ④ Reconnection failed          
     │                                
     │ ⑤ Auto reconnect (Attempt 2, 1s delay)
     │────────────────────────────────>
     │                                │
     │ ⑥ Reconnection successful      │
     │<──────────────────────────────>│
     │                                │
     │ ⑦ Rejoin room                  │
     │────────────────────────────────>│
     │                                │
     │ ⑧ Receive latest data          │
     │<────────────────────────────────│
     │                                │
     │ ⑨ Continue listening           │
     │                                │
```

### Reconnection Configuration

```javascript
const socket = io('http://localhost:3000', {
  reconnection: true,           // Enable auto-reconnect
  reconnectionDelay: 1000,      // Reconnect delay 1 second
  reconnectionAttempts: 10,     // Maximum 10 attempts
  timeout: 5000                 // Connection timeout 5 seconds
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnection successful, attempts:', attemptNumber);
  // Rejoin room
  socket.emit('join-display');
});

socket.on('reconnect_failed', () => {
  console.log('Reconnection failed, enabling fallback');
  // Enable HTTP polling as fallback
  startPolling();
});
```

## Summary

### Key Points

✅ **WebSocket provides real-time bidirectional communication**
✅ **Room mechanism enables precise broadcasting**
✅ **React state management triggers UI updates**
✅ **Auto-reconnect ensures reliability**
✅ **Entire process latency <100ms**

### Advantages

- ⚡ **Real-time** - No delay, instant updates
- 🔄 **Auto-sync** - All Displays update simultaneously
- 💪 **High reliability** - Auto-reconnect, fallback mechanism
- 📊 **Scalable** - Supports unlimited Display screens
- 🎯 **Precise push** - Room mechanism avoids broadcast waste
