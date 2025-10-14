const SERVER_URL = 'http://localhost:3000';

export const API = {
  // Customer APIs
  createTicket: async (serviceId: number) => {
    const response = await fetch(`${SERVER_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ serviceId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create ticket');
    }

    return response.json();
  },

  getAvailableServices: async () => {
    const response = await fetch(`${SERVER_URL}/api/services`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch services');
    }

    return response.json();
  },

  // Officer APIs
  callNextCustomer: async (counterId: number) => {
    const response = await fetch(`${SERVER_URL}/api/queue/next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ counterId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'No customers in queue');
    }

    return response.json();
  },

  completeTicket: async (ticketCode: string) => {
    const response = await fetch(`${SERVER_URL}/api/tickets/${ticketCode}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to complete ticket');
    }

    return response.json();
  }
};

export default API;