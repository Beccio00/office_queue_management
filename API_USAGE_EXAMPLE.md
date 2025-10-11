# API Usage - Display Component

## 📍 Current API Implementation

### Display Component API Call

**File**: `client/src/pages/display/display.tsx` (Line 34)

```typescript
// ⭐ This code is ALREADY in the display component
const response = await fetch(`${apiBaseUrl}/api/display/status`);
const data = await response.json();
setDisplayInfo(data);
```

**What it does:**
- Calls `GET /api/display/status` every 10 seconds
- Updates the UI with fresh data from backend
- Falls back to sample data if API is not available

---

## 🔧 How to Test

### Option 1: API is Ready (Production)

When your backend implements the API:

1. **Start Backend Server**
```bash
cd server
npm run dev
# Backend running on http://localhost:3000
```

2. **Start Frontend**
```bash
cd client
npm run dev
# Frontend running on http://localhost:5173
```

3. **Open Display Page**
```
http://localhost:5173/display
```

4. **Check Browser Console**
You'll see:
```
📡 Fetching display data from: http://localhost:3000/api/display/status
✅ Received data: { currentTicket: {...}, nextTickets: [...], ... }
```

5. **Verify Real Data**
- Display should show data from your database
- Updates every 10 seconds automatically

---

### Option 2: API Not Ready (Current State)

**Currently the backend API is NOT implemented**, so:

1. **Open Display Page**
```
http://localhost:5173/display
```

2. **Check Browser Console**
You'll see:
```
📡 Fetching display data from: http://localhost:3000/api/display/status
❌ Error fetching display data: Failed to fetch
⚠️ Using sample data as fallback
```

3. **What Happens**
- Display tries to fetch from API
- API request fails (no backend)
- Falls back to hardcoded sample data
- Still works for UI testing!

---

## 🎯 Backend Implementation Needed

To make the API actually work, implement this endpoint in your backend:

### Express.js Example

```typescript
// server/src/routes/display.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ⭐ GET /api/display/status
router.get('/display/status', async (req, res) => {
  try {
    // 1. Get current serving ticket
    const currentTicket = await prisma.ticket.findFirst({
      where: { status: 'serving' },
      include: { counter: true }
    });

    // 2. Get next waiting tickets
    const nextTickets = await prisma.ticket.findMany({
      where: { status: 'waiting' },
      orderBy: { timestamp: 'asc' },
      take: 6
    });

    // 3. Get queue status by service type
    const queueStatus = await prisma.ticket.groupBy({
      by: ['serviceType'],
      where: { status: 'waiting' },
      _count: true
    });

    // 4. Get counter status
    const counters = await prisma.counter.findMany({
      include: {
        currentTicket: true
      }
    });

    // 5. Build response
    const response = {
      currentTicket: currentTicket ? {
        id: currentTicket.id,
        serviceType: currentTicket.serviceType,
        timestamp: currentTicket.createdAt,
        status: currentTicket.status,
        counterId: currentTicket.counterId
      } : null,
      
      nextTickets: nextTickets.map(t => ({
        id: t.id,
        serviceType: t.serviceType,
        timestamp: t.createdAt,
        status: t.status
      })),
      
      queueStatus: queueStatus.map(q => ({
        serviceType: q.serviceType,
        length: q._count,
        estimatedWaitTime: calculateWaitTime(q.serviceType, q._count)
      })),
      
      counters: counters.map(c => ({
        id: c.id,
        number: c.number,
        availableServices: c.availableServices,
        status: c.status,
        currentTicket: c.currentTicket?.id
      })),
      
      lastUpdated: new Date()
    };

    res.json(response);
    
  } catch (error) {
    console.error('Error fetching display status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### Add to Main Server

```typescript
// server/src/index.ts
import express from 'express';
import cors from 'cors';
import displayRoutes from './routes/display';

const app = express();

app.use(cors());
app.use(express.json());

// ⭐ Mount display routes
app.use('/api', displayRoutes);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

---

## 📊 Expected API Response Format

```json
{
  "currentTicket": {
    "id": "A001",
    "serviceType": "DEPOSIT",
    "timestamp": "2025-10-12T04:07:04.000Z",
    "status": "serving",
    "counterId": 1
  },
  "nextTickets": [
    {
      "id": "A002",
      "serviceType": "SHIPPING",
      "timestamp": "2025-10-12T04:08:15.000Z",
      "status": "waiting"
    },
    {
      "id": "A003",
      "serviceType": "ACCOUNT",
      "timestamp": "2025-10-12T04:09:22.000Z",
      "status": "waiting"
    }
  ],
  "queueStatus": [
    {
      "serviceType": "DEPOSIT",
      "length": 8,
      "estimatedWaitTime": 15
    },
    {
      "serviceType": "SHIPPING",
      "length": 5,
      "estimatedWaitTime": 25
    }
  ],
  "counters": [
    {
      "id": 1,
      "number": 1,
      "availableServices": ["DEPOSIT", "ACCOUNT"],
      "status": "serving",
      "currentTicket": "A001"
    },
    {
      "id": 2,
      "number": 2,
      "availableServices": ["SHIPPING", "DEPOSIT"],
      "status": "available",
      "currentTicket": null
    }
  ],
  "lastUpdated": "2025-10-12T04:12:10.000Z"
}
```

---

## 🧪 Test with Mock Server

If you don't have the backend ready, create a simple mock:

### Quick Mock Server (Node.js)

```javascript
// mock-server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

let ticketCounter = 1;

app.get('/api/display/status', (req, res) => {
  // Simulate dynamic data
  const currentId = `A${String(ticketCounter).padStart(3, '0')}`;
  ticketCounter = (ticketCounter % 999) + 1;
  
  res.json({
    currentTicket: {
      id: currentId,
      serviceType: ['DEPOSIT', 'SHIPPING', 'ACCOUNT'][Math.floor(Math.random() * 3)],
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'serving',
      counterId: 1
    },
    nextTickets: Array.from({ length: 4 }, (_, i) => ({
      id: `A${String(ticketCounter + i).padStart(3, '0')}`,
      serviceType: ['DEPOSIT', 'SHIPPING', 'ACCOUNT'][Math.floor(Math.random() * 3)],
      timestamp: new Date(Date.now() - (10 + i * 5) * 60 * 1000),
      status: 'waiting'
    })),
    queueStatus: [
      { serviceType: 'DEPOSIT', length: Math.floor(Math.random() * 10), estimatedWaitTime: 15 },
      { serviceType: 'SHIPPING', length: Math.floor(Math.random() * 10), estimatedWaitTime: 25 },
      { serviceType: 'ACCOUNT', length: Math.floor(Math.random() * 10), estimatedWaitTime: 20 }
    ],
    counters: [
      { id: 1, number: 1, availableServices: ['DEPOSIT', 'ACCOUNT'] },
      { id: 2, number: 2, availableServices: ['SHIPPING', 'DEPOSIT'] },
      { id: 3, number: 3, availableServices: ['ACCOUNT', 'SHIPPING'] }
    ],
    lastUpdated: new Date()
  });
});

app.listen(3000, () => {
  console.log('Mock server running on http://localhost:3000');
});
```

**Run it:**
```bash
node mock-server.js
```

Now the Display page will fetch dynamic (mock) data every 10 seconds! 🎉

---

## 🔍 Debugging

### Check if API is being called

1. Open Display page: `http://localhost:5173/display`
2. Open Browser DevTools (F12)
3. Go to **Console** tab
4. Look for logs:
   ```
   📡 Fetching display data from: http://localhost:3000/api/display/status
   ✅ Received data: {...}  // Success
   OR
   ❌ Error fetching display data: ...  // Failed
   ```

### Check Network Requests

1. Open Browser DevTools (F12)
2. Go to **Network** tab
3. Reload page
4. Look for request to `/api/display/status`
5. Check:
   - Status code (should be 200)
   - Response data
   - Request frequency (every 10 seconds)

---

## 📝 Summary

✅ **Display component ALREADY calls the API**
- File: `client/src/pages/display/display.tsx`
- API: `GET /api/display/status`
- Frequency: Every 10 seconds

⚠️ **Backend API needs to be implemented**
- See example code above
- Or use mock server for testing

🎯 **How it works:**
```
Display loads
  ↓
Fetch from API (10s interval)
  ↓
API returns data → Update UI ✅
API fails → Use fallback sample data ⚠️
```

🔄 **When Officer calls next customer:**
```
Officer clicks button
  ↓
Backend updates database
  ↓
Display's next poll (within 10s)
  ↓
Gets updated data
  ↓
UI refreshes automatically ✨
```

---

**Note:** For truly real-time updates (< 1 second), use WebSocket instead of polling. See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for WebSocket implementation.
