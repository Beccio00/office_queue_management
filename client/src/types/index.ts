// Type definition for a service
export type Service = {
    id: number;
    name: string;
    tag: string;
    serviceTime: number; // average time in minutes
};

// Type definition for a ticket
export type Ticket = {
    id: string;                // Unique ticket ID (e.g. A123)
    serviceType: string;       // Requested service type (service tag)
    timestamp: Date;           // Request date/time
    status: 'waiting' | 'serving' | 'completed';  // Ticket status
    completionTime?: Date;     // Completion date/time (optional)
    message?: string;          // Status/completion message (optional)
};

// Type definition for a counter
export type Counter = {
    id: number;
    number: number;
    availableServices: string[]; // array of service tags that this counter can handle
};

// Type definition for a queue
export type Queue = {
    serviceType: string;
    length: number;
    estimatedWaitTime: number; // in minutes
};

// Type definition for service statistics
export type ServiceStats = {
    serviceType: string;
    customersServed: number;
    averageWaitTime: number;
};

// Type definition for an officer
export type Officer = {
    id: number;
    name: string;
    counterId: number;
    isAvailable: boolean;
};

// Type definition for the public display
export type DisplayInfo = {
    currentTicket: Ticket | null;
    nextTickets: Ticket[];
    queueStatus: Queue[];
    counters: Counter[];
    lastUpdated: Date;
};