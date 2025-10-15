import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import API from '../../API/API';
import type { Service, Ticket } from '../../../../shared/types';

/**
 * Officer page component for queue management system
 * Allows officers to call next customer from their counter
 */
const Officer = () => {  
  // State management
  const [counterId, setCounterId] = useState<number | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [counterServices, setCounterServices] = useState<Service[]>([]);
  const [queueStatus, setQueueStatus] = useState<Array<{serviceTag: string, serviceName: string, queueLength: number}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch counter services and queue status when counter is selected
  useEffect(() => {
    if (!counterId) {
      setCounterServices([]);
      setQueueStatus([]);
      return;
    }

    const fetchCounterData = async () => {
      try {
        // Fetch queue status
        const response = await fetch(`http://localhost:3000/api/queue/status`);
        if (response.ok) {
          const status = await response.json();
          setQueueStatus(status.data || []);
        }

        // TODO: Fetch counter-specific services when API is available
        // For now, we fetch all services
        const services = await API.getAvailableServices();
        setCounterServices(services);
      } catch (err) {
        console.error('Error fetching counter data:', err);
      }
    };

    fetchCounterData();
    
    // Refresh queue status every 10 seconds
    const interval = setInterval(fetchCounterData, 10000);
    return () => clearInterval(interval);
  }, [counterId]);

  /**
   * Handles counter selection
   */
  const handleCounterSelect = (id: number) => {
    setCounterId(id);
    setCurrentTicket(null);
    setError(null);
    setCounterServices([]);
    setQueueStatus([]);
  };

  /**
   * Calls next customer from queue
   */
  const handleCallNextCustomer = async () => {
    if (!counterId) return;

    try {
      setLoading(true);
      setError(null);
      
      const ticketData = await API.callNextCustomer(counterId);
      
      setCurrentTicket({
        id: ticketData.code || ticketData.id,
        serviceType: ticketData.serviceType,
        status: 'serving',
        timestamp: new Date(ticketData.timestamp)
      });
    } catch (err) {
      console.error('Failed to call next customer:', err);
      setError(err instanceof Error ? err.message : 'No customers in queue');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Completes current ticket and optionally calls next
   */
  const handleCompleteService = async (callNext: boolean = false) => {
    if (!currentTicket) return;

    try {
      setLoading(true);
      setError(null);
      
      await API.completeTicket(currentTicket.id);
      
      setCurrentTicket(null);
      
      if (callNext) {
        // Call next customer after completing
        await handleCallNextCustomer();
      }
    } catch (err) {
      console.error('Failed to complete ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column vh-100 bg-light">
      <Header 
        isHomePage={false}
        isCustomerPage={false}
        isOfficerPage={true}
      />

      <main className="flex-grow-1">
        <Container fluid className="py-4">
          <Row className="justify-content-center">
            <Col xs={12} md={8} lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h2 className="mb-0">Officer Station</h2>
                </Card.Header>
                <Card.Body className="p-4">
                  {/* Counter Selection */}
                  <div className="mb-4">
                    <Form.Group>
                      <Form.Label>Select Counter</Form.Label>
                      <Form.Select 
                        value={counterId || ''} 
                        onChange={(e) => handleCounterSelect(Number(e.target.value))}
                        disabled={loading}
                      >
                        <option value="">Choose a counter...</option>
                        <option value="1">Counter 1</option>
                        <option value="2">Counter 2</option>
                        <option value="3">Counter 3</option>
                      </Form.Select>
                    </Form.Group>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  )}

                  {/* Current Ticket Display */}
                  {currentTicket && (
                    <Card className="mb-4 border-success">
                      <Card.Body>
                        <h4 className="text-success mb-3">Serving Customer</h4>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h2 className="mb-0">{currentTicket.id}</h2>
                            <p className="text-muted mb-0">Service: {currentTicket.serviceType}</p>
                          </div>
                          <Badge bg="success" style={{ fontSize: '1.2rem', padding: '10px 20px' }}>
                            In Service
                          </Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    {!currentTicket ? (
                      <Button 
                        variant="primary" 
                        size="lg"
                        onClick={handleCallNextCustomer}
                        disabled={!counterId || loading}
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Calling...
                          </>
                        ) : (
                          '📞 Call Next Customer'
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="success" 
                          size="lg"
                          onClick={() => handleCompleteService(false)}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Completing...
                            </>
                          ) : (
                            '✅ Complete Service'
                          )}
                        </Button>
                        <Button 
                          variant="info" 
                          size="lg"
                          onClick={() => handleCompleteService(true)}
                          disabled={loading}
                        >
                          ✅ Complete & Call Next
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Counter Services Info */}
                  {counterId && counterServices.length > 0 && (
                    <Card className="mt-4 bg-light">
                      <Card.Body>
                        <h6 className="mb-2">Counter {counterId} Services</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {counterServices.map(service => (
                            <Badge key={service.id} bg="secondary">
                              {service.tag} - {service.name}
                            </Badge>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Queue Status */}
                  {counterId && queueStatus.length > 0 && (
                    <Card className="mt-3 bg-light">
                      <Card.Body>
                        <h6 className="mb-3">Queue Status</h6>
                        {queueStatus.map(queue => (
                          <div key={queue.serviceTag} className="d-flex justify-content-between align-items-center mb-2">
                            <span>
                              <Badge bg="secondary" className="me-2">{queue.serviceTag}</Badge>
                              {queue.serviceName}
                            </span>
                            <Badge bg={queue.queueLength > 0 ? 'info' : 'secondary'}>
                              {queue.queueLength} waiting
                            </Badge>
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default Officer;
