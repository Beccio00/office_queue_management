import { useState } from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import Layout from '../../components/layout/layout';
import type { Service, Ticket } from '../../types/index';

const Customer = () => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  // Dati di esempio - questi verranno poi presi dal backend
  const sampleServices: Service[] = [
    {
      id: 1,
      name: 'Money Deposit',
      tag: 'DEPOSIT',
      serviceTime: 5
    },
    {
      id: 2,
      name: 'Package Shipping',
      tag: 'SHIPPING',
      serviceTime: 10
    },
    {
      id: 3,
      name: 'Account Management',
      tag: 'ACCOUNT',
      serviceTime: 15
    }
  ];

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleGetTicket = () => {
    if (!selectedService) return;

    // Simulazione della creazione di un ticket - questo verrà sostituito con una chiamata API
    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      serviceType: selectedService.tag,
      timestamp: new Date(),
      status: 'waiting'
    };
    
    console.log('Created ticket:', newTicket); // Per debug
    console.log('Selected service:', selectedService); // Per debug
    setTicket(newTicket);
  };

  return (
    <Layout>
      <div className="text-center mb-5">
        <h1 className="display-4 mb-3">Get Your Ticket</h1>
        <p className="lead" style={{ color: '#2c3e50' }}>Please select the service you need</p>
      </div>

      {ticket ? (
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card className="border-0 bg-white shadow-lg" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div className="card-decoration" style={{ height: '4px', background: '#2ecc71' }}></div>
              <Card.Body className="text-center p-5">
                <div className="mb-4" style={{ fontSize: '3.5rem' }}>
                  {ticket.serviceType === 'DEPOSIT' && (
                    <i 
                      className="fas fa-money-bill-wave" 
                      style={{ 
                        color: '#27ae60',
                        margin: '15px 0',
                        display: 'block'
                      }}
                    />
                  )}
                  {ticket.serviceType === 'SHIPPING' && (
                    <i 
                      className="fas fa-box" 
                      style={{ 
                        color: '#27ae60',
                        margin: '15px 0',
                        display: 'block'
                      }}
                    />
                  )}
                  {ticket.serviceType === 'ACCOUNT' && (
                    <i 
                      className="fas fa-user-cog" 
                      style={{ 
                        color: '#27ae60',
                        margin: '15px 0',
                        display: 'block'
                      }}
                    />
                  )}
                </div>
                <h2 className="display-6 mb-4">Your Ticket Number: <strong>{ticket.id}</strong></h2>
                <div className="mb-4">
                  <p className="h5 mb-3" style={{ color: '#2c3e50' }}>Service: {selectedService?.name}</p>
                  <p className="mb-2" style={{ color: '#7f8c8d' }}>Time: {ticket.timestamp.toLocaleTimeString()}</p>
                  <p className="mb-4" style={{ color: '#7f8c8d' }}>Estimated Wait Time: {selectedService?.serviceTime} minutes</p>
                  <Button 
                    variant="outline-success" 
                    size="lg"
                    className="px-5 py-3"
                    style={{ borderRadius: '10px' }}
                    onClick={() => {
                      setTicket(null);
                      setSelectedService(null);
                    }}
                  >
                    Get Another Ticket
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <Row className="justify-content-center">
          <Col xs={12} lg={8} xl={6}>
            <Row className="g-4">
              {sampleServices.map((service) => (
                <Col key={service.id} xs={12} sm={6} md={4}>
                  <Card 
                    className="h-100 border-0 bg-white shadow-lg"
                    style={{ 
                      transition: 'all 0.3s ease-in-out',
                      cursor: 'pointer',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      transform: 'translateY(0)',
                    }}
                    onClick={() => handleServiceSelect(service)}
                    onMouseEnter={(e) => {
                      const target = e.currentTarget;
                      target.style.transform = 'translateY(-10px)';
                      target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                      const icon = target.querySelector('i');
                      if (icon) {
                        icon.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget;
                      target.style.transform = 'translateY(0)';
                      target.style.boxShadow = '';
                      const icon = target.querySelector('i');
                      if (icon) {
                        icon.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <div className="card-decoration" style={{
                      height: '4px',
                      background: selectedService?.id === service.id ? '#3498db' : '#e0e0e0'
                    }}></div>
                    <Card.Body className="d-flex flex-column p-4">
                      <div className="text-center mb-3">
                        <i className={`fas ${
                          service.tag === 'DEPOSIT' ? 'fa-money-bill-wave' :
                          service.tag === 'SHIPPING' ? 'fa-box' : 'fa-user-cog'
                        } fs-1 mb-3`} style={{
                          color: selectedService?.id === service.id ? '#3498db' : '#7f8c8d',
                          transition: 'all 0.3s ease-in-out'
                        }}></i>
                      </div>
                      <Card.Title className="h4 mb-3 text-center">{service.name}</Card.Title>
                      <Card.Text className="text-center" style={{ color: '#7f8c8d' }}>
                        Average service time: {service.serviceTime} minutes
                      </Card.Text>
                      <Button
                        variant="outline-primary"
                        size="lg"
                        className="w-100 mt-auto py-3"
                        style={{
                          borderRadius: '10px',
                          background: selectedService?.id === service.id ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                          borderColor: '#3498db',
                          color: '#3498db',
                          fontWeight: selectedService?.id === service.id ? '600' : '400'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceSelect(service);
                        }}
                      >
                        Select Service
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      )}

      {selectedService && !ticket && (
        <div className="text-center mt-5">
          <Button 
            variant="success" 
            size="lg"
            className="px-5 py-3 shadow-sm"
            onClick={handleGetTicket}
          >
            Get Ticket for {selectedService.name}
          </Button>
        </div>
      )}
    </Layout>
  );
};

export default Customer;