import prisma from './prismaClient';
import { EnqueueResult } from '../interfaces/enqueue';

/*  Coda divisa per servizi, implementata come una mappa in-memory che associa a ogni 
`serviceType` un array di code di ticket  */

class QueueManager {

  private static instance: QueueManager | null = null;
  private queues: Map<number, string[]> = new Map();

  private constructor() {}

  /*    Inizializza la coda per un certo servizio prendendo dal DB i code dei ticket WAITING di quel servizio    */
  private async ensureQueueLoaded(serviceId: number) {
    if (this.queues.has(serviceId)) return;

    const waitingTickets = await prisma.ticket.findMany({
      where: {
        serviceId,
        status: 'WAITING'
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        code: true
      }
    });

    this.queues.set(serviceId, waitingTickets.map(t => t.code));
  }
  
  /*    Restituisce l'istanza del singleton    */
  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /*    Inserisce un nuovo ticket nella coda per il suo tipo di servizio    */
  async enqueue(serviceId: number): Promise<EnqueueResult> {

    // verifica che il tipo di servizio esista
    const service = await prisma.service.findUnique({ 
        where: { id: serviceId } 
    });
    if (!service) throw new Error('Service type not found');

    // genera il codice del ticket
    const ticketCode = await this.generateTicketCode(service.tag);

    // inizializza la coda per questo serviceType
    await this.ensureQueueLoaded(service.id);

    // calcolo la posizione in coda del nuovo ticket
    const queue = this.queues.get(service.id) || [];
    const position = queue.length + 1;

    // aggiorna la coda in-memory
    queue.push(ticketCode);
    this.queues.set(service.id, queue);
    
    return ({
      code: ticketCode,
      positionInQueue: position,
      queueLength: queue.length
    });
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
        service: {
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

}

// esportiamo l'istanza singleton pronta all'uso
export const queueManager = QueueManager.getInstance();
