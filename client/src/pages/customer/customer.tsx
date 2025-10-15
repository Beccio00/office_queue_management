import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import API from '../../API/API';
import type { Service, Ticket } from '../../../../shared/types';
import './customer.css';

/**
 * Customer page component for ticket generation system
 * Allows users to select a service and generate a ticket
 */
const Customer = () => {
  const navigate = useNavigate();
  
  // State management
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch available services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await API.getAvailableServices();
        setServices(data);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  const serviceIcons = {
    D: 'fa-money-bill-wave',
    S: 'fa-box',
    A: 'fa-user-cog'
  } as const;

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setError(null);
  };

  const handleGetTicket = async () => {
    if (!selectedService) return;

    try {
      setLoading(true);
      setError(null);
      
      const ticketData = await API.createTicket(selectedService.id);
      
      setTicket({
        id: ticketData.id,
        serviceType: ticketData.serviceType,
        status: 'waiting',
        timestamp: new Date(ticketData.timestamp)
      });
    } catch (err) {
      console.error('Failed to create ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTicket(null);
    setSelectedService(null);
    setError(null);
  };

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
            <p className="lead text-secondary">Select the service you need</p>
          </div>

          {error && (
            <Row className="justify-content-center mb-4">
              <Col xs={12} md={8} lg={6}>
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                  {error}
                </Alert>
              </Col>
            </Row>
          )}

          {loading && (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

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
                      color: ticket.status === 'completed' ? '#2ecc71' : '#3498db',
                      margin: '15px 0',
                      display: 'block'
                    }}
                  />
                </div>
                {ticket.status === 'completed' ? (
                  <>
                    <h2 className="display-6 mb-4 text-success">{ticket.message}</h2>
                    <div className="mb-4">
                      <p className="h5 mb-3">Service: {selectedService?.name}</p>
                      <p className="mb-2 text-muted">Started: {ticket.timestamp.toLocaleTimeString()}</p>
                      <p className="mb-4 text-muted">Completed: {ticket.completionTime?.toLocaleTimeString()}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="display-6 mb-4">Your Ticket Number: <strong>{ticket.id}</strong></h2>
                    <div className="mb-4">
                      <p className="h5 mb-3 text-secondary">Service: {selectedService?.name}</p>
                      <p className="mb-2 text-muted">Time: {ticket.timestamp.toLocaleTimeString()}</p>
                      <p className="mb-4 text-muted">Status: {ticket.status === 'waiting' ? 'Waiting to be called' : 'Currently being served'}</p>
                    </div>
                  </>
                )}
                <Button 
                  variant={ticket.status === 'completed' ? 'outline-success' : 'outline-primary'}
                  size="lg"
                  className="px-5 py-3"
                  style={{ borderRadius: '10px' }}
                  onClick={handleReset}
                >
                  Get Another Ticket
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <Row className="justify-content-center">
          <Col xs={12} lg={8} xl={6}>
            <Row className="g-4">
              {services.map((service: Service) => (
                <Col key={service.id} xs={12} sm={6} md={4}>
                  <Card 
                    className={`h-100 border-0 shadow service-card ${
                      selectedService?.id === service.id ? 'selected' : ''
                    }`}
                    style={{ 
                      cursor: 'pointer',
                      borderRadius: '15px',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleServiceSelect(service)}
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
                            color: selectedService?.id === service.id ? '#3498db' : '#7f8c8d'
                          }}
                        />
                      </div>
                      <Card.Title className="h4 mb-3 text-center">{service.name}</Card.Title>
                      <Card.Text className="text-center text-muted">
                        ~{service.avgServiceTime} minutes
                      </Card.Text>
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
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating ticket...
              </>
            ) : (
              `Get Ticket for ${selectedService.name}`
            )}
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