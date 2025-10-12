# Queue Management System - Customer API Documentation

This document describes the REST APIs required for the Customer Ticket Management System.

## Base URL
The base URL for all API endpoints is: `http://localhost:3000/api` (configurable via `VITE_API_BASE_URL` environment variable)

## Available Endpoints

### 1. Service Management

#### GET /services
Retrieves list of available services that customers can select.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Money Deposit",
    "tag": "DEPOSIT"
  },
  {
    "id": 2,
    "name": "Package Shipping",
    "tag": "SHIPPING"
  },
  {
    "id": 3,
    "name": "Account Management",
    "tag": "ACCOUNT"
  }
]
```

### 2. Ticket Management

#### POST /tickets/request
Creates a new ticket request for a service.

**Request Body:**
```json
{
  "serviceType": "DEPOSIT"  // Service tag (DEPOSIT, SHIPPING, ACCOUNT)
}
```

**Response:**
```json
{
  "requestId": "REQ123",   // Unique request ID
  "ticketNumber": "A123",  // Assigned ticket number
  "serviceType": "DEPOSIT",
  "status": "waiting",     // waiting, serving, completed
  "timestamp": "2025-10-12T10:30:00Z"
}
```

#### GET /tickets/{requestId}
Retrieves the current status of a ticket.

**Parameters:**
- requestId: The request ID received from the POST call

**Response:**
```json
{
  "requestId": "REQ123",
  "ticketNumber": "A123",
  "serviceType": "DEPOSIT",
  "status": "completed",   // waiting, serving, completed
  "timestamp": "2025-10-12T10:30:00Z",
  "completionTime": "2025-10-12T10:45:00Z",  // present only if status is "completed"
  "message": "Service completed successfully! 👍"  // message shown to the customer
}
```

### 3. Real-time Updates

To receive real-time updates about the ticket status, a WebSocket endpoint is available:

```
ws://localhost:3000/ws/tickets/{requestId}
```

The server will send updates when:
- The ticket status changes (waiting -> serving -> completed)
- The service is completed

## Error Handling

## Error Handling

All endpoints should return appropriate HTTP status codes:

- 200: Success
- 201: Created (for POST requests)
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Error responses should include a message:

```json
{
  "error": "Invalid service type provided",
  "code": "INVALID_SERVICE",
  "details": "Service type must be one of: DEPOSIT, SHIPPING, ACCOUNT"
}
```

## Demo Mode

When APIs are not available, the frontend implements a fallback demo mode that:
- Generates random ticket IDs
- Calculates estimated wait times based on service type:
  - DEPOSIT: 3-8 minutes
  - SHIPPING: 8-15 minutes
  - ACCOUNT: 10-20 minutes
- Shows an alert to inform users that the system is running in demo mode
- Maintains data consistency within the current session

## Rate Limiting

API endpoints should implement rate limiting to prevent abuse:
- Customer endpoints: 60 requests per minute
- Officer endpoints: 120 requests per minute
- Management endpoints: 60 requests per minute