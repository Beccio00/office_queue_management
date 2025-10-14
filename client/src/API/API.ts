const SERVER_URL = 'http://localhost:3000';

export const API: {
  createTicket: (serviceId: number) => Promise<any>;
  getAvailableServices: () => Promise<any>;
} = {} as any;

API.createTicket = async (serviceId: number) => {
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
}

API.getAvailableServices = async () => {
  const response = await fetch(`${SERVER_URL}/api/tickets/services`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch services');
  }

  return response.json();
}