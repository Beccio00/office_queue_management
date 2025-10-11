# Officer API Integration Guide

## 📍 Officer Component API Calls

The Officer component (`client/src/pages/officer/officer.tsx`) implements all officer-related API calls with fallback mechanisms.

---

## 🔐 1. Officer Login

**API**: `POST /api/officers/login`
**Line**: 50
**When**: Officer selects their profile to log in

### Frontend Code (Already Implemented)

```typescript
const handleLogin = async (officer: Officer) => {
  const response = await fetch(`${apiBaseUrl}/api/officers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officerId: officer.id,
      counterId: officer.counterId
    })
  });

  const loginData = await response.json();
  setCurrentOfficer(loginData.officer);
  setAvailableServices(loginData.availableServices);
  setCounterStatus('available');
};
```

### Backend Implementation Needed

```typescript
// server/src/routes/officer.ts
router.post('/officers/login', async (req, res) => {
  const { officerId, counterId } = req.body;

  try {
    // 1. Verify officer exists
    const officer = await prisma.officer.findUnique({
      where: { id: officerId }
    });

    if (!officer) {
      return res.status(404).json({ error: 'Officer not found' });
    }

    // 2. Get counter information
    const counter = await prisma.counter.findUnique({
      where: { id: counterId },
      include: { services: true }
    });

    // 3. Update officer status
    await prisma.officer.update({
      where: { id: officerId },
      data: { 
        isAvailable: true,
        counterId: counterId,
        lastLogin: new Date()
      }
    });

    // 4. Get available services for this counter
    const availableServices = counter?.services || [];

    res.json({
      officer: {
        id: officer.id,
        name: officer.name,
        counterId: counterId,
        isAvailable: true
      },
      availableServices: availableServices.map(s => ({
        id: s.id,
        name: s.name,
        tag: s.tag,
        serviceTime: s.estimatedTime
      })),
      counter: {
        id: counter.id,
        number: counter.number,
        availableServices: counter.availableServices
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## 📞 2. Call Next Customer

**API**: `POST /api/queue/next`
**Line**: 81
**When**: Officer clicks "Call Next Customer" button

### Frontend Code (Already Implemented)

```typescript
const handleCallNextCustomer = async () => {
  const response = await fetch(`${apiBaseUrl}/api/queue/next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      counterId: currentOfficer.counterId
    })
  });

  const nextTicket = await response.json();
  setCurrentTicket(nextTicket);
  setCounterStatus('busy');
};
```

### Backend Implementation Needed

```typescript
router.post('/queue/next', async (req, res) => {
  const { counterId } = req.body;

  try {
    // 1. Get counter's available services
    const counter = await prisma.counter.findUnique({
      where: { id: counterId }
    });

    if (!counter) {
      return res.status(404).json({ error: 'Counter not found' });
    }

    // 2. Find next waiting ticket for this counter's services
    const nextTicket = await prisma.ticket.findFirst({
      where: {
        status: 'waiting',
        serviceType: {
          in: counter.availableServices
        }
      },
      orderBy: {
        timestamp: 'asc' // Oldest first (FIFO)
      }
    });

    if (!nextTicket) {
      return res.status(404).json({ error: 'No customers in queue' });
    }

    // 3. Update ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id: nextTicket.id },
      data: {
        status: 'serving',
        counterId: counterId,
        calledAt: new Date()
      }
    });

    // 4. Update counter status
    await prisma.counter.update({
      where: { id: counterId },
      data: {
        status: 'busy',
        currentTicketId: updatedTicket.id
      }
    });

    // 5. Broadcast to display screens (if using WebSocket)
    // io.to('displays').emit('queue-update', await getDisplayInfo());

    res.json({
      id: updatedTicket.id,
      serviceType: updatedTicket.serviceType,
      timestamp: updatedTicket.timestamp,
      status: 'serving',
      counterId: counterId
    });

  } catch (error) {
    console.error('Call next error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## ✅ 3. Complete Service

**API**: `PUT /api/tickets/:id/complete`
**Line**: 137
**When**: Officer clicks "Complete Service" button

### Frontend Code (Already Implemented)

```typescript
const handleCompleteService = async () => {
  const response = await fetch(`${apiBaseUrl}/api/tickets/${currentTicket.id}/complete`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  });

  const completedTicket = await response.json();
  setCurrentTicket({ ...completedTicket, status: 'completed' });
  
  setTimeout(() => {
    setCurrentTicket(null);
    setCounterStatus('available');
  }, 1500);
};
```

### Backend Implementation Needed

```typescript
router.put('/tickets/:id/complete', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get ticket info
    const ticket = await prisma.ticket.findUnique({
      where: { id: id }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // 2. Update ticket status to completed
    const completedTicket = await prisma.ticket.update({
      where: { id: id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // 3. Update counter status to available
    if (ticket.counterId) {
      await prisma.counter.update({
        where: { id: ticket.counterId },
        data: {
          status: 'available',
          currentTicketId: null
        }
      });
    }

    // 4. Update statistics
    await prisma.serviceStats.upsert({
      where: { serviceType: ticket.serviceType },
      update: {
        customersServed: { increment: 1 },
        totalWaitTime: { 
          increment: calculateWaitTime(ticket.timestamp, ticket.calledAt) 
        }
      },
      create: {
        serviceType: ticket.serviceType,
        customersServed: 1,
        totalWaitTime: calculateWaitTime(ticket.timestamp, ticket.calledAt)
      }
    });

    // 5. Broadcast to display screens
    // io.to('displays').emit('queue-update', await getDisplayInfo());

    res.json({
      id: completedTicket.id,
      serviceType: completedTicket.serviceType,
      timestamp: completedTicket.timestamp,
      status: 'completed',
      completedAt: completedTicket.completedAt
    });

  } catch (error) {
    console.error('Complete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## 🔄 4. Toggle Counter Status

**API**: `PUT /api/counters/:id/status`
**Line**: 190
**When**: Officer manually changes counter availability

### Frontend Code (Already Implemented)

```typescript
const handleToggleAvailability = async () => {
  const newStatus = counterStatus === 'available' ? 'busy' : 'available';

  const response = await fetch(`${apiBaseUrl}/api/counters/${currentOfficer.counterId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: newStatus
    })
  });

  const updatedCounter = await response.json();
  setCounterStatus(newStatus);
};
```

### Backend Implementation Needed

```typescript
router.put('/counters/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Validate status
    if (!['available', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update counter status
    const updatedCounter = await prisma.counter.update({
      where: { id: parseInt(id) },
      data: {
        status: status,
        lastStatusChange: new Date()
      }
    });

    // Broadcast to display screens
    // io.to('displays').emit('queue-update', await getDisplayInfo());

    res.json({
      id: updatedCounter.id,
      number: updatedCounter.number,
      status: updatedCounter.status,
      availableServices: updatedCounter.availableServices
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## 🧪 Testing

### 1. Check API Calls in Browser Console

```
Officer logs in:
🔐 Officer logging in: John Smith
✅ Login successful: {...}

Officer calls next customer:
📞 Calling next customer for counter: 1
✅ Next customer assigned: { id: 'A002', ... }

Officer completes service:
✅ Completing service for ticket: A002
✅ Service completed: {...}

Officer toggles status:
🔄 Updating counter status to: busy
✅ Counter status updated: {...}
```

### 2. Network Tab Inspection

Open DevTools → Network tab, you'll see:
- `POST /api/officers/login` - Status 200
- `POST /api/queue/next` - Status 200
- `PUT /api/tickets/A002/complete` - Status 200
- `PUT /api/counters/1/status` - Status 200

---

## 🔧 Mock Server for Testing

Create `mock-officer-server.js`:

```javascript
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let ticketNumber = 1;

// Officer login
app.post('/api/officers/login', (req, res) => {
  const { officerId, counterId } = req.body;
  res.json({
    officer: {
      id: officerId,
      name: `Officer ${officerId}`,
      counterId: counterId,
      isAvailable: true
    },
    availableServices: [
      { id: 1, name: 'Money Deposit', tag: 'DEPOSIT', serviceTime: 5 },
      { id: 2, name: 'Package Shipping', tag: 'SHIPPING', serviceTime: 10 }
    ]
  });
});

// Call next customer
app.post('/api/queue/next', (req, res) => {
  const { counterId } = req.body;
  ticketNumber++;
  
  res.json({
    id: `A${String(ticketNumber).padStart(3, '0')}`,
    serviceType: ['DEPOSIT', 'SHIPPING', 'ACCOUNT'][ticketNumber % 3],
    timestamp: new Date(),
    status: 'serving',
    counterId: counterId
  });
});

// Complete service
app.put('/api/tickets/:id/complete', (req, res) => {
  const { id } = req.params;
  
  res.json({
    id: id,
    status: 'completed',
    completedAt: new Date()
  });
});

// Update counter status
app.put('/api/counters/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  res.json({
    id: parseInt(id),
    number: parseInt(id),
    status: status,
    availableServices: ['DEPOSIT', 'SHIPPING']
  });
});

app.listen(3000, () => {
  console.log('Mock officer server running on http://localhost:3000');
});
```

**Run it:**
```bash
node mock-officer-server.js
```

---

## 📊 Complete Workflow

```
1. Officer opens /officer page
   ↓
2. Selects profile → POST /api/officers/login
   ↓
3. Login successful → Counter is "available"
   ↓
4. Clicks "Call Next" → POST /api/queue/next
   ↓
5. Gets ticket A002 → Counter is "busy"
   ↓
6. Serves customer...
   ↓
7. Clicks "Complete" → PUT /api/tickets/A002/complete
   ↓
8. Service done → Counter is "available" again
   ↓
9. Can toggle status → PUT /api/counters/1/status
```

---

## ⚡ Real-time Display Updates

When officer calls next customer, Display screens should update automatically.

### Option 1: HTTP Polling (Current)
- Display polls `GET /api/display/status` every 10 seconds
- Delay: up to 10 seconds

### Option 2: WebSocket (Recommended)
```typescript
// In backend after calling next customer:
io.to('displays').emit('queue-update', await getDisplayInfo());
```
- Display updates instantly
- See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

---

## 📝 Summary

✅ **4 APIs implemented in Officer component:**
1. Login (line 50)
2. Call Next (line 81)
3. Complete Service (line 137)
4. Toggle Status (line 190)

✅ **All APIs have fallback mechanisms**
- Works without backend for UI testing
- Shows alert when API unavailable

✅ **Console logging for debugging**
- See all API calls in browser console
- Easy to verify integration

✅ **Ready for backend implementation**
- Clear API contracts
- Example backend code provided
- Mock server available for testing

---

Next steps:
1. Implement backend APIs using provided examples
2. Test with mock server
3. Upgrade to WebSocket for real-time updates
4. Add authentication/authorization
