import { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import type { Service, Ticket } from '../../types/index';

/**
 * Customer page component for ticket generation system
 * Allows users to select a service and generate a ticket
 */
const Customer = () => {
  // State management for service selection and ticket generation
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  // Sample services data (will be replaced with API call)
  const sampleServices: Service[] = [
    { id: 1, name: 'Money Deposit', tag: 'DEPOSIT', serviceTime: 5 },
    { id: 2, name: 'Package Shipping', tag: 'SHIPPING', serviceTime: 10 },
    { id: 3, name: 'Account Management', tag: 'ACCOUNT', serviceTime: 15 }
  ];

  /**
   * Maps service tags to their corresponding icons
   */
  const serviceIcons = {
    DEPOSIT: 'fa-money-bill-wave',
    SHIPPING: 'fa-box',
    ACCOUNT: 'fa-user-cog'
  } as const;

  /**
   * Handles service selection
   */
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  /**
   * Generates a new ticket for the selected service
   * Will be replaced with actual API call
   */
  const handleGetTicket = () => {
    if (!selectedService) return;

    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      serviceType: selectedService.tag,
      timestamp: new Date(),
      status: 'waiting'
    };
    
    setTicket(newTicket);
  };

  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column vh-100 bg-light" style={{ 
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <Header 
        isHomePage={false}
        isCustomerPage={true}
        onBack={() => navigate(-1)}
      />

      {/* Main content */}
      <main className="flex-grow-1">
        <Container fluid className="py-5">
          <div className="text-center mb-5">
            <h1 className="display-4 mb-3">Get Your Ticket</h1>
            <p className="lead text-secondary">Please select the service you need</p>
          </div>

          {ticket ? (
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card className="border-0 bg-white shadow-lg" 
                  style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div style={{ height: '4px', background: '#2ecc71' }}></div>
              <Card.Body className="text-center p-5">
                <div className="mb-4" style={{ fontSize: '3.5rem' }}>
                  <i 
                    className={`fas ${serviceIcons[ticket.serviceType as keyof typeof serviceIcons]}`}
                    style={{ 
                      color: '#2ecc71',
                      margin: '15px 0',
                      display: 'block'
                    }}
                  />
                </div>
                <h2 className="display-6 mb-4">Your Ticket Number: <strong>{ticket.id}</strong></h2>
                <div className="mb-4">
                  <p className="h5 mb-3 text-secondary">Service: {selectedService?.name}</p>
                  <p className="mb-2 text-muted">Time: {ticket.timestamp.toLocaleTimeString()}</p>
                  <p className="mb-4 text-muted">Estimated Wait Time: {selectedService?.serviceTime} minutes</p>
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
                      cursor: 'pointer',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      transform: 'translateY(0)',
                      transition: 'all 0.3s ease-in-out'
                    }}
                    onClick={() => handleServiceSelect(service)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-10px)';
                      const icon = e.currentTarget.querySelector('i');
                      if (icon) icon.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      const icon = e.currentTarget.querySelector('i');
                      if (icon) icon.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{
                      height: '4px',
                      background: selectedService?.id === service.id ? '#3498db' : '#e0e0e0'
                    }}></div>
                    <Card.Body className="d-flex flex-column p-4">
                      <div className="text-center mb-3">
                        <i 
                          className={`fas ${serviceIcons[service.tag as keyof typeof serviceIcons]} fs-1 mb-3`}
                          style={{
                            color: selectedService?.id === service.id ? '#3498db' : '#7f8c8d',
                            transition: 'all 0.3s ease-in-out'
                          }}
                        />
                      </div>
                      <Card.Title className="h4 mb-3 text-center">{service.name}</Card.Title>
                      <Card.Text className="text-center text-muted">
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
        </Container>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Customer;