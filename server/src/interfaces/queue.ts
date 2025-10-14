// Interface for calling next customer
export interface NextCustomerRequest {
  counterId: number;
}

export interface NextCustomerResponse {
  success: boolean;
  ticket?: {
    id: string;
    code: string;
    serviceType: string;
    timestamp: Date;
    status: string;
  };
  message?: string;
}

// Interface for completing ticket service
export interface CompleteTicketRequest {
  ticketId: string;
}

export interface CompleteTicketResponse {
  success: boolean;
  ticket?: {
    id: string;
    code: string;
    status: string;
    completionTime: Date;
  };
  message?: string;
}

