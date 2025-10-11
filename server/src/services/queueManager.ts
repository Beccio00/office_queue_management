import prisma from './prismaClient';

/*  Coda divisa per servizi, implementata come una mappa in-memory che associa a ogni 
`serviceTypeId` un array di id di ticket  */

/*  Tipo locale che descrive il valore restituito da `enqueue`  */
interface EnqueueResult {
  id: string;
  ticketCode: string;
  serviceTypeId: string;
  positionInQueue: number;
  queueLength: number;
  createdAt: Date;
}

class QueueManager {

  private static instance: QueueManager | null = null;
  private queues: Map<string, string[]> = new Map();

  private constructor() {}

  /*    Inizializza la coda per un certo servizio prendendo dal DB gli id dei ticket WAITING di quel servizio    */
  private async ensureQueueLoaded(serviceTypeId: string) {
    if (this.queues.has(serviceTypeId)) return;

    const waitingTickets: Array<{ id: string }> = await prisma.ticket.findMany({
      where: {
        serviceTypeId,
        status: 'WAITING'
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true
      }
    });


    this.queues.set(serviceTypeId, waitingTickets.map(t => t.id));
  }
  
  /*    Restituisce l'istanza del singleton    */
  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /*    Inserisce un nuovo ticket nella coda per il suo tipo di servizio    */
  async enqueue(serviceTypeId: string): Promise<EnqueueResult> {

    // verifica che il tipo di servizio esista
    const serviceType = await prisma.serviceType.findUnique({ 
        where: { id: serviceTypeId } 
    });
    if (!serviceType) throw new Error('Service type not found');

    // genera il codice del ticket
    const ticketCode = await this.generateTicketCode(serviceType.tag);

    // inizializza la coda per questo serviceType
    await this.ensureQueueLoaded(serviceTypeId);

    // calcolo la posizione in coda del nuovo ticket
    const queue = this.queues.get(serviceTypeId) || [];
    const position = queue.length + 1;

    // crea il ticket nel database
    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        serviceTypeId,
        status: 'WAITING'
      },
      include: {
        serviceType: true
      }
    });

    // aggiorna la coda in-memory
    queue.push(ticket.id);
    this.queues.set(serviceTypeId, queue);

    return {
      id: ticket.id,
      ticketCode: ticket.ticketCode,
      serviceTypeId: ticket.serviceTypeId,
      positionInQueue: position,
      queueLength: queue.length,
      createdAt: ticket.createdAt
    };
  }

  /**
   * Genera il codice del ticket secondo il formato:
   * TAG-YYYYMMDD-sequenza (sequenza giornaliera padded a 3 cifre)
   * Questa funzione usa il conteggio dei ticket creati oggi con lo stesso tag.
   */
  private async generateTicketCode(serviceTag: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); //extract only YYYYMMDD

    // conteggio dei ticket di oggi per questo servizio
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayTicketsCount = await prisma.ticket.count({
      where: {
        serviceType: {
          tag: serviceTag
        },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const sequenceNumber = (todayTicketsCount + 1).toString().padStart(3, '0');
    return `${serviceTag}-${dateStr}-${sequenceNumber}`;
  }

  // Restituisce la lunghezza della coda
  async getQueueLength(serviceTypeId: string): Promise<number> {
    /*
    return await prisma.ticket.count({
      where: {
        serviceTypeId,
        status: 'WAITING'
      }
    });
    */
    return (this.queues.get(serviceTypeId) || []).length;
  }
}

// esportiamo l'istanza singleton pronta all'uso
export const queueManager = QueueManager.getInstance();
