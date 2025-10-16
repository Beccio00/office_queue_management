// Type definition for a counter
export type Counter = {
    id: number;
    number: number;
    availableServices: string[]; // array of service tags that this counter can handle
    currentTicket?: string | null; // code of the ticket currently being served
    status?: 'available' | 'busy' | 'offline';
};
