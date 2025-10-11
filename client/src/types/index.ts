// Definizione del tipo per un servizio
export type Service = {
    id: number;
    name: string;
    tag: string;
    serviceTime: number; // tempo medio in minuti
};

// Definizione del tipo per un ticket
export type Ticket = {
    id: string;
    serviceType: string;
    timestamp: Date;
    status: 'waiting' | 'serving' | 'completed';
};

// Definizione del tipo per un counter (sportello)
export type Counter = {
    id: number;
    number: number;
    availableServices: string[]; // array di tag dei servizi che può gestire
};

// Definizione del tipo per una coda
export type Queue = {
    serviceType: string;
    length: number;
    estimatedWaitTime: number; // in minuti
};

// Definizione del tipo per le statistiche
export type ServiceStats = {
    serviceType: string;
    customersServed: number;
    averageWaitTime: number;
};

// Definizione del tipo per un officer (impiegato)
export type Officer = {
    id: number;
    name: string;
    counterId: number;
    isAvailable: boolean;
};

// Definizione del tipo per il display pubblico
export type DisplayInfo = {
    currentTicket: Ticket | null;
    nextTickets: Ticket[];
    queueStatus: Queue[];
    counters: Counter[];
    lastUpdated: Date;
};