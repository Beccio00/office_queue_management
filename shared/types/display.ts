import type { Ticket }  from './ticket';
import type { Queue } from './queue';
import type { Counter } from './counter';

// Type definition for the public display
export type DisplayInfo = {
    currentTicket: Ticket | null;
    nextTickets: Ticket[];
    queueStatus: Queue[];
    counters: Counter[];
    lastUpdated: Date;
};
