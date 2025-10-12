# Office Queue Management System

## Overview

This is a comprehensive queue management system for office environments, featuring customer ticket generation, officer management, and real-time public display functionality.

## Features Implemented

### OQ-23 Customer UI Design ✅
- Customer ticket generation interface
- Service selection and ticket creation
- Real-time ticket display

### OQ-31 Officer UI Design ✅
- Officer login and authentication
- Counter management and status control
- Customer service workflow
- Real-time queue monitoring

### OQ-44 Client UI Update ✅
- **Customer Turn Notification**: Shows when it's your turn and which counter to go to
- **Queue Position Display**: Shows your position in line and estimated wait time
- **Counter Directions**: Clear indication of which counter is serving and where to go
- **Real-time Updates**: Auto-refreshes every 10 seconds for current information
- **Visual Queue Status**: Progress bars and color-coded service types

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Header.tsx          # Navigation header
│   │   └── Footer.tsx          # Application footer
│   ├── pages/
│   │   ├── home/
│   │   │   └── home.tsx        # Landing page with role selection
│   │   ├── customer/
│   │   │   └── customer.tsx    # Customer ticket generation
│   │   ├── officer/
│   │   │   └── officer.tsx     # Officer management interface
│   │   └── display/
│   │       └── display.tsx     # Public display screen
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   └── App.tsx                 # Main application routing
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd office_queue_management
```

2. Install client dependencies
```bash
cd client
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage Guide

### 1. Home Page
Access the main landing page where users can select their role:
- **Customer**: Generate tickets for services
- **Officer**: Manage counter and serve customers
- **Manager**: View statistics (placeholder for future implementation)

### 2. Customer Interface (`/customer`)
- Select from available services (Money Deposit, Package Shipping, Account Management)
- Generate a ticket with unique ID
- View estimated wait time
- Get another ticket if needed

### 3. Officer Interface (`/officer`)

#### Login Process
1. Select your officer profile from available officers
2. System will load your assigned counter and available services
3. Set your counter status (Available/Busy)

#### Daily Operations
- **Call Next Customer**: Retrieve next customer from queue
- **Complete Service**: Mark current customer service as completed
- **Toggle Availability**: Switch between Available and Busy status
- **View Queue Status**: Monitor current queue lengths (placeholder)

#### Officer Features
- Real-time counter status display
- Service completion tracking
- Customer ticket management
- Counter availability controls

### 4. Public Display (`/display`)
**User Story Implementation**: "As a customer I want to know when my turn comes and where to go"

#### Key Features:
- **Turn Notification**: Large display shows when your ticket number is called
- **Counter Directions**: Clear "Please go to Counter #X" message
- **Position Tracking**: Shows your position in the next 6 customers
- **Wait Time Estimates**: Real-time wait times for each service type
- **Visual Queue Status**: Progress bars showing queue length
- **Counter Locations**: Physical directions to each counter
- **Real-time Updates**: Auto-refreshes every 10 seconds

#### Customer Experience:
1. **Check Your Position**: Look for your ticket number in "Next Customers" section
2. **Monitor Wait Time**: See estimated wait time for your service type
3. **Get Called**: When your number appears in "Currently Serving"
4. **Follow Directions**: Go to the indicated counter number
5. **Visual Guidance**: Color-coded service types and progress indicators

## Real-time Data Integration

### 📚 Documentation

**Want to know how Display screens automatically update when officers call customers?**

- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Complete WebSocket Integration Guide
  - WebSocket vs SSE vs Polling comparison
  - Complete backend and frontend code examples
  - Error handling and reconnection strategies
  - Performance optimization and scaling solutions

- **[EXAMPLE_IMPLEMENTATION.md](./EXAMPLE_IMPLEMENTATION.md)** - Quick Start Examples
  - Simplified implementation code
  - Quick comparison of three approaches
  - Common questions and answers
  - Testing step instructions

- **[docs/DATA_FLOW.md](./docs/DATA_FLOW.md)** - Visualized Data Flow
  - Detailed flowcharts and timelines
  - Complete officer call customer process
  - Multiple display synchronization mechanism
  - Room management and broadcast principles

- **[API_USAGE_EXAMPLE.md](./API_USAGE_EXAMPLE.md)** - Display API Usage Examples
  - How Display component calls APIs
  - Backend API implementation examples
  - Quick testing with mock server
  - API response format and debugging methods

- **[OFFICER_API_GUIDE.md](./OFFICER_API_GUIDE.md)** - Officer API Integration Guide 🆕
  - Detailed explanation of 4 Officer API calls
  - Login, call next, complete service, status toggle
  - Complete backend implementation examples
  - Mock server and testing methods

- **[API_IMPLEMENTATION_STATUS.md](./API_IMPLEMENTATION_STATUS.md)** - API Implementation Status Overview 📊
  - All implemented frontend API calls
  - Backend API implementation checklist
  - Priority sorting and implementation suggestions
  - Testing methods and related documentation index

### ⚡ Quick Summary

**Frontend API Integration Status:**
- ✅ Display component: 1 API integrated
- ✅ Officer component: 4 APIs integrated
- ⚠️ Customer component: 2 APIs pending

**All frontend APIs have fallback mechanisms**, can demonstrate UI functionality when backend is not ready.

When Officer clicks "Call Next Customer":
1. Frontend calls `POST /api/queue/next` (line 81)
2. Backend updates database
3. **Broadcasts to all Display screens via WebSocket** ⭐
4. Display receives message and updates UI automatically
5. Entire process takes <100ms

## API Integration Guide

### Data Types

The system uses the following TypeScript interfaces:

```typescript
// Service definition
interface Service {
  id: number;
  name: string;
  tag: string;
  serviceTime: number; // in minutes
}

// Ticket information
interface Ticket {
  id: string;
  serviceType: string;
  timestamp: Date;
  status: 'waiting' | 'serving' | 'completed';
}

// Counter information
interface Counter {
  id: number;
  number: number;
  availableServices: string[];
}

// Officer information
interface Officer {
  id: number;
  name: string;
  counterId: number;
  isAvailable: boolean;
}

// Queue status
interface Queue {
  serviceType: string;
  length: number;
  estimatedWaitTime: number; // in minutes
}

// Display information
interface DisplayInfo {
  currentTicket: Ticket | null;
  nextTickets: Ticket[];
  queueStatus: Queue[];
  counters: Counter[];
  lastUpdated: Date;
}
```

### API Endpoints (To Be Implemented)

#### Customer APIs
<!-- ```
GET /api/services
- Returns available services
- Response: Service[]

POST /api/tickets
- Creates new ticket
- Body: { serviceType: string }
- Response: Ticket
``` -->

#### Officer APIs
```
POST /api/officers/login  ⭐ Already used in officer.tsx (line 50)
- Officer authentication
- Body: { officerId: number, counterId: number }
- Response: { officer: Officer, availableServices: Service[] }
- Called when officer selects their profile

POST /api/queue/next  ⭐ Already used in officer.tsx (line 81)
- Get next customer in queue
- Body: { counterId: number }
- Response: Ticket
- Called when officer clicks "Call Next Customer"

PUT /api/tickets/:id/complete  ⭐ Already used in officer.tsx (line 137)
- Mark ticket as completed
- Response: Ticket
- Called when officer clicks "Complete Service"

PUT /api/counters/:id/status  ⭐ Already used in officer.tsx (line 190)
- Update counter status
- Body: { status: 'available' | 'busy' | 'offline' }
- Response: Counter
- Called when officer toggles availability
```

**Current Implementation:**
The Officer component (`client/src/pages/officer/officer.tsx`) calls all officer-related APIs:
- Login: Line 50
- Call Next: Line 81  
- Complete Service: Line 137
- Update Status: Line 190

When backend is not ready, it falls back to local operations.

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
```

### Production Build
```bash
npm run build
npm run preview
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 5173
   npx kill-port 5173
   ```

2. **Dependencies Issues**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript Errors**
   ```bash
   npm run type-check
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Note**: This system currently uses sample data for demonstration purposes. Replace with actual API integration for production use.
