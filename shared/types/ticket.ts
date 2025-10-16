// Type definition for a ticket
export type Ticket = {
    id: string;                // Unique ticket ID (e.g. A123)
    serviceType: string;       // Requested service type (service tag)
    timestamp: Date;           // Request date/time
    status: 'waiting' | 'serving' | 'completed';  // Ticket status
    completionTime?: Date;     // Completion date/time (optional)
    message?: string;          // Status/completion message (optional)
};
