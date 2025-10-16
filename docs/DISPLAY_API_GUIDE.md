# Display API Usage Guide

This document explains how to integrate and use the Display (Public Display Screen) API in your frontend application. Based on the actual implementation in `client/src/pages/display/display.tsx`.

## 📋 Table of Contents

- [API Overview](#api-overview)
- [Data Type Definitions](#data-type-definitions)
- [API Endpoint Details](#api-endpoint-details)
- [Complete Implementation Example](#complete-implementation-example)
- [Environment Configuration](#environment-configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## API Overview

The Display API is used to show real-time queue management system status on public display screens, including:
- Currently serving ticket number
- Next tickets waiting to be served
- Queue status for each service type
- Counter status and available services

**Implementation Location:** `client/src/pages/display/display.tsx`

## Data Type Definitions

### DisplayInfo
```typescript
type DisplayInfo = {
    currentTicket: Ticket | null;      // Currently serving ticket
    nextTickets: Ticket[];             // List of next tickets waiting
    queueStatus: Queue[];              // Queue status for each service type
    counters: Counter[];               // Counter status information
    lastUpdated: Date;                 // Last update timestamp
}
```

### Ticket
```typescript
type Ticket = {
    id: string;                        // Ticket ID (e.g., A001)
    serviceType: string;               // Service type (DEPOSIT/SHIPPING/ACCOUNT)
    timestamp: Date;                   // Ticket issue time
    status: 'waiting' | 'serving' | 'completed';  // Ticket status
}
```

### Queue
```typescript
type Queue = {
    serviceType: string;               // Service type
    length: number;                    // Queue length
    estimatedWaitTime: number;         // Estimated wait time (minutes)
}
```

### Counter
```typescript
type Counter = {
    id: number;                        // Counter ID
    number: number;                    // Counter number
    availableServices: string[];       // List of service types this counter can handle
}
```

## API Endpoint Details

### GET /api/display/status

⭐ **Main API** - Implemented in `display.tsx` line 34

Retrieves all information needed for the public display screen.

#### Request

```http
GET /api/display/status
```

**No request parameters required**

#### Response

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "currentTicket": {
    "id": "A001",
    "serviceType": "DEPOSIT",
    "timestamp": "2025-10-12T10:30:00.000Z",
    "status": "serving"
  },
  "nextTickets": [
    {
      "id": "A002",
      "serviceType": "SHIPPING",
      "timestamp": "2025-10-12T10:25:00.000Z",
      "status": "waiting"
    },
    {
      "id": "A003",
      "serviceType": "ACCOUNT",
      "timestamp": "2025-10-12T10:20:00.000Z",
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
    },
    {
      "serviceType": "ACCOUNT",
      "length": 3,
      "estimatedWaitTime": 20
    }
  ],
  "counters": [
    {
      "id": 1,
      "number": 1,
      "availableServices": ["DEPOSIT", "ACCOUNT"]
    },
    {
      "id": 2,
      "number": 2,
      "availableServices": ["SHIPPING", "DEPOSIT"]
    },
    {
      "id": 3,
      "number": 3,
      "availableServices": ["ACCOUNT", "SHIPPING"]
    }
  ],
  "lastUpdated": "2025-10-12T10:35:00.000Z"
}
```

#### Update Frequency

⏱️ **Automatic polling every 10 seconds** (see `display.tsx` line 117)

## Complete Implementation Example

Below is the complete implementation code based on `display.tsx`:

### 1. Import Required Dependencies

```typescript
import { useState, useEffect } from 'react';
import type { DisplayInfo } from '../../types/index';
```

### 2. State Management

```typescript
const Display = () => {
  const [displayInfo, setDisplayInfo] = useState<DisplayInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // ... component logic
};
```

### 3. Core Function to Fetch Display Data

```typescript
const fetchDisplayData = async () => {
  try {
    // Get API base URL (supports environment variable configuration)
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    
    console.log('📡 Fetching display data from:', `${apiBaseUrl}/display/status`);
    
    // ⭐ Call GET /api/display/status API
    const response = await fetch(`${apiBaseUrl}/display/status`);
    
    // Check response status
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Parse JSON response
    const data = await response.json();
    console.log('✅ Received data:', data);
    
    // Convert date strings to Date objects
    const parsedData: DisplayInfo = {
      ...data,
      currentTicket: data.currentTicket ? {
        ...data.currentTicket,
        timestamp: new Date(data.currentTicket.timestamp)
      } : null,
      nextTickets: data.nextTickets.map((ticket: any) => ({
        ...ticket,
        timestamp: new Date(ticket.timestamp)
      })),
      lastUpdated: new Date(data.lastUpdated || new Date())
    };
    
    setDisplayInfo(parsedData);
    
  } catch (error) {
    console.error('❌ Error fetching display data:', error);
    
    // ⚠️ Fallback: Use sample data
    console.warn('Using sample data as fallback');
    const sampleDisplayInfo: DisplayInfo = {
      // ... sample data
    };
    setDisplayInfo(sampleDisplayInfo);
  }
};
```

### 4. Setup Automatic Polling

```typescript
useEffect(() => {
  // Fetch data immediately
  fetchDisplayData();

  // ⭐ Poll for updates every 10 seconds
  const interval = setInterval(fetchDisplayData, 10000);

  // Cleanup timer
  return () => clearInterval(interval);
}, []);
```

### 5. Real-time Clock Update

```typescript
useEffect(() => {
  // Update time every second
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

## Environment Configuration

### Create Environment Variable File

Create a `.env` file in the `client/` directory:

```env
# API base URL
VITE_API_BASE_URL=http://localhost:3000/api

# WebSocket URL (for future use)
VITE_WS_URL=ws://localhost:3000

# Refresh interval (milliseconds) - Optional, defaults to 10000ms
VITE_REFRESH_INTERVAL=10000
```

### Using Environment Variables in Code

```typescript
// Get API base URL, use default if not set
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Build complete API endpoint
const endpoint = `${apiBaseUrl}/display/status`;
```

## Error Handling

### 1. HTTP Error Handling

```typescript
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
```

**Possible Status Codes:**
- `200` - Success
- `404` - API endpoint not found
- `500` - Internal server error
- `503` - Service unavailable

### 2. Network Error Handling

```typescript
try {
  const response = await fetch(endpoint);
  // ... process response
} catch (error) {
  console.error('❌ Error fetching display data:', error);
  
  // Use fallback (sample data)
  setDisplayInfo(sampleDisplayInfo);
}
```

### 3. Data Parsing Error Handling

```typescript
// Ensure date fields are properly parsed
const parsedData: DisplayInfo = {
  ...data,
  currentTicket: data.currentTicket ? {
    ...data.currentTicket,
    timestamp: new Date(data.currentTicket.timestamp)
  } : null,
  nextTickets: data.nextTickets.map((ticket: any) => ({
    ...ticket,
    timestamp: new Date(ticket.timestamp)
  })),
  lastUpdated: new Date(data.lastUpdated || new Date())
};
```

## Best Practices

### 1. Use Polling Mechanism

✅ **Implemented** - Automatic data refresh every 10 seconds

```typescript
const interval = setInterval(fetchDisplayData, 10000);
```

### 2. Provide Fallback Strategy

✅ **Implemented** - Use sample data when API is unavailable

```typescript
catch (error) {
  console.warn('Using sample data as fallback');
  setDisplayInfo(sampleDisplayInfo);
}
```

### 3. Data Type Conversion

✅ **Implemented** - Convert date strings from JSON to Date objects

```typescript
timestamp: new Date(data.currentTicket.timestamp)
```

### 4. Loading State Display

✅ **Implemented** - Show loading animation while data is being fetched

```typescript
if (!displayInfo) {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
      <div className="text-center text-white">
        <i className="fas fa-spinner fa-spin fs-1 mb-3"></i>
        <h3>Loading Display...</h3>
      </div>
    </div>
  );
}
```

### 5. Console Logging

✅ **Implemented** - Detailed logs for debugging

```typescript
console.log('📡 Fetching display data from:', endpoint);
console.log('✅ Received data:', data);
console.error('❌ Error fetching display data:', error);
console.warn('Using sample data as fallback');
```

## Performance Optimization Suggestions

### 1. Use WebSocket Instead of Polling

Future implementation can use WebSocket connections for real-time updates:

```typescript
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setDisplayInfo(data);
};
```

### 2. Conditional Rendering Optimization

```typescript
// Re-render only when data changes
const displayMemo = useMemo(() => displayInfo, [displayInfo]);
```

### 3. Debouncing

```typescript
// Prevent frequent API calls
const debouncedFetch = debounce(fetchDisplayData, 1000);
```

## Troubleshooting

### Issue 1: CORS Error

**Symptom:** `Access-Control-Allow-Origin` error

**Solution:** Ensure backend has CORS enabled

```typescript
// Backend configuration example
app.use(cors({
  origin: 'http://localhost:5173'
}));
```

### Issue 2: Connection Refused

**Symptom:** `ERR_CONNECTION_REFUSED`

**Checklist:**
- ✓ Is the backend server running?
- ✓ Is the API port correct (default 3000)?
- ✓ Is a firewall blocking the connection?

### Issue 3: Data Format Mismatch

**Symptom:** TypeScript type errors

**Solution:** Verify API response format matches the `DisplayInfo` type

```typescript
// Use type guard
function isDisplayInfo(data: any): data is DisplayInfo {
  return data && 
         'currentTicket' in data &&
         'nextTickets' in data &&
         'queueStatus' in data;
}
```

## Example Output

### Console Logs (Success)

```
📡 Fetching display data from: http://localhost:3000/api/display/status
✅ Received data: {currentTicket: {…}, nextTickets: Array(4), queueStatus: Array(3), …}
```

### Console Logs (Failure, Using Fallback)

```
📡 Fetching display data from: http://localhost:3000/api/display/status
❌ Error fetching display data: TypeError: Failed to fetch
⚠️ Using sample data as fallback
```

## Related Files

- **Implementation File:** `client/src/pages/display/display.tsx`
- **Type Definitions:** `client/src/types/index.ts`
- **Environment Configuration:** `client/.env`

---

#### Display APIs
```
GET /api/display/status  ⭐ Already used in display.tsx (line 34)
- Get current display information
- Called every 10 seconds to refresh display
- Response: DisplayInfo
- Example: fetch('http://localhost:3000/api/display/status')

GET /api/queue/status
- Get queue status for all services
- Response: Queue[]
```

**Current Implementation:**
The Display component (`client/src/pages/display/display.tsx`) already calls `GET /api/display/status` every 10 seconds. When backend is not ready, it falls back to sample data.

### Integration Steps

1. **Replace Sample Data**
   - Update `sampleServices`, `sampleOfficers`, `sampleCounters` arrays
   - Replace with actual API calls using fetch or axios

2. **Implement Authentication**
   - Add JWT token handling for officer login
   - Implement session management

3. **Real-time Updates**
   - Use WebSocket connections for live updates
   - Implement Server-Sent Events (SSE) for display screen

4. **Error Handling**
   - Add try-catch blocks for API calls
   - Implement user-friendly error messages

### Example API Integration

```typescript
// Example: Fetching services
const fetchServices = async (): Promise<Service[]> => {
  try {
    const response = await fetch('/api/services');
    if (!response.ok) throw new Error('Failed to fetch services');
    return await response.json();
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Example: Creating a ticket
const createTicket = async (serviceType: string): Promise<Ticket> => {
  try {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serviceType }),
    });
    if (!response.ok) throw new Error('Failed to create ticket');
    return await response.json();
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};
```

## Configuration

### Environment Variables
Create a `.env` file in the client directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
VITE_REFRESH_INTERVAL=30000
```

### Customization

#### Styling
- Modify theme colors in component files
- Update Bootstrap classes for different layouts
- Customize Font Awesome icons

#### Business Logic
- Adjust service types and processing times
- Modify queue algorithms
- Update counter assignment logic

## Deployment

### Development
```bash
npm run dev