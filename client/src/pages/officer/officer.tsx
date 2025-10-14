import { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import type { Service, Ticket, Counter, Officer as OfficerType } from '../../../../shared/types';

/**
 * Officer page component for queue management system
 * Allows officers to manage their counter and serve customers
 */
const Officer = () => {
  // State management for officer operations
  const [currentOfficer, setCurrentOfficer] = useState<OfficerType | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [counterStatus, setCounterStatus] = useState<'available' | 'busy' | 'offline'>('offline');

  // Sample data (will be replaced with API calls)
  const sampleOfficers: OfficerType[] = [
    { id: 1, name: 'John Smith', counterId: 1, isAvailable: true },
    { id: 2, name: 'Sarah Johnson', counterId: 2, isAvailable: true },
    { id: 3, name: 'Mike Wilson', counterId: 3, isAvailable: false }
  ];

  const sampleServices: Service[] = [
    { id: 1, name: 'Money Deposit', tag: 'DEPOSIT', serviceTime: 5 },
    { id: 2, name: 'Package Shipping', tag: 'SHIPPING', serviceTime: 10 },
    { id: 3, name: 'Account Management', tag: 'ACCOUNT', serviceTime: 15 }
  ];

  const sampleCounters: Counter[] = [
    { id: 1, number: 1, availableServices: ['DEPOSIT', 'ACCOUNT'] },
    { id: 2, number: 2, availableServices: ['SHIPPING', 'DEPOSIT'] },
    { id: 3, number: 3, availableServices: ['ACCOUNT', 'SHIPPING'] }
  ];

  /**
   * Handles officer login
   * ⭐ Calls API: POST /api/officers/login
   */
  const handleLogin = async (officer: OfficerType) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
      console.log('🔐 Officer logging in:', officer.name);
      
      // ⭐ Call API for officer authentication
      const response = await fetch(`${apiBaseUrl}/officers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId: officer.id,
          counterId: officer.counterId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const loginData = await response.json();
      console.log('✅ Login successful:', loginData);

      // Update state with authenticated officer data
      setCurrentOfficer(loginData.officer || officer);
      setIsLoggedIn(true);
      setCounterStatus('available');
      
      // Set available services
      if (loginData.availableServices) {
        setAvailableServices(loginData.availableServices);
      } else {
        // Fallback to local calculation
        const counter = sampleCounters.find(c => c.id === officer.counterId);
        if (counter) {
          const services = sampleServices.filter(s => 
            counter.availableServices.includes(s.tag)
          );
          setAvailableServices(services);
        }
      }

    } catch (error) {
      console.error('❌ Error logging in:', error);
      
      // ⚠️ Fallback: Login locally if API fails
      console.warn('Using fallback login');
      setCurrentOfficer(officer);
      setIsLoggedIn(true);
      setCounterStatus('available');
      
      // Set available services based on counter
      const counter = sampleCounters.find(c => c.id === officer.counterId);
      if (counter) {
        const services = sampleServices.filter(s => 
          counter.availableServices.includes(s.tag)
        );
        setAvailableServices(services);
      }
    }
  };

  /**
   * Handles officer logout
   */
  const handleLogout = () => {
    setCurrentOfficer(null);
    setIsLoggedIn(false);
    setCurrentTicket(null);
    setCounterStatus('offline');
    setAvailableServices([]);
  };

  /**
   * Calls next customer from queue
   
   * ⭐ Calls API: POST /api/queue/next
   */
  const handleCallNextCustomer = async () => {
    if (!currentOfficer) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
      // 
      if (currentTicket) {
        console.log('✅ Auto-completing current ticket:', currentTicket.id);
        
        try {
          await fetch(`${apiBaseUrl}/tickets/${currentTicket.id}/complete`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            }
          });
        } catch (error) {
          console.warn('Failed to complete current ticket:', error);
        }
      }
      
      console.log('📞 Calling next customer for counter:', currentOfficer.counterId);
      
      // ⭐ Call API to get next customer
      const response = await fetch(`${apiBaseUrl}/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          counterId: currentOfficer.counterId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message === 'No customers waiting in queue') {
          alert('No customers waiting in queue');
          setCurrentTicket(null);
          setCounterStatus('available');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const ticketData = await response.json();
      console.log('✅ Next customer assigned:', ticketData);

      // Format the ticket data correctly
      const nextTicket: Ticket = {
        id: ticketData.code || ticketData.id,
        serviceType: ticketData.serviceType,
        timestamp: new Date(ticketData.timestamp),
        status: 'serving'
      };

      // Update state
      setCurrentTicket(nextTicket);
      setCounterStatus('busy');

    } catch (error) {
      console.error('❌ Error calling next customer:', error);
      
      // ⚠️ Fallback: Generate ticket locally if API fails
      console.warn('Using fallback ticket generation');
      const fallbackTicket: Ticket = {
        id: `A${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        serviceType: availableServices[0]?.tag || 'DEPOSIT',
        timestamp: new Date(),
        status: 'serving'
      };
      
      setCurrentTicket(fallbackTicket);
      setCounterStatus('busy');
      
      alert('API not available. Using demo mode.');
    }
  };

  /**
   * Completes current customer service
   * ⭐ This function has been automated and is now auto-completed in handleCallNextCustomer
   * Code preserved for future reference if needed
   */
  /* 
  const handleCompleteService = async () => {
    if (!currentTicket) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
      console.log('✅ Completing service for ticket:', currentTicket.id);
      
      // ⭐ Call API to mark ticket as completed
      const response = await fetch(`${apiBaseUrl}/tickets/${currentTicket.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const completedTicket = await response.json();
      console.log('✅ Service completed:', completedTicket);

      // Update local state
      setCurrentTicket({ ...completedTicket, status: 'completed' as const });
      
      // Reset after a short delay
      setTimeout(() => {
        setCurrentTicket(null);
        setCounterStatus('available');
      }, 1500);

    } catch (error) {
      console.error('❌ Error completing service:', error);
      
      // ⚠️ Fallback: Complete locally if API fails
      console.warn('Using fallback completion');
      const completedTicket = { ...currentTicket, status: 'completed' as const };
      setCurrentTicket(completedTicket);
      
      setTimeout(() => {
        setCurrentTicket(null);
        setCounterStatus('available');
      }, 1500);
    }
  };
  */

  /**
   * Toggles counter availability
   * ⭐ Calls API: PUT /api/counters/:id/status
   */
  const handleToggleAvailability = async () => {
    if (!currentOfficer || currentTicket) return; // Can't change status while serving

    const newStatus = counterStatus === 'available' ? 'busy' : 'available';

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
      console.log('🔄 Updating counter status to:', newStatus);
      
      // ⭐ Call API to update counter status
      const response = await fetch(`${apiBaseUrl}/counters/${currentOfficer.counterId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedCounter = await response.json();
      console.log('✅ Counter status updated:', updatedCounter);

      // Update local state
      setCounterStatus(newStatus);

    } catch (error) {
      console.error('❌ Error updating counter status:', error);
      
      // ⚠️ Fallback: Update locally if API fails
      console.warn('Using fallback status update');
      setCounterStatus(newStatus);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column vh-100 bg-light" style={{ 
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <Header 
        isHomePage={false}
        isCustomerPage={false}
        isOfficerPage={true}
        onBack={() => navigate(-1)}
      />

      {/* Main content */}
      <main className="flex-grow-1">
        <Container fluid className="py-4">
          {!isLoggedIn ? (
            // Login Section
            <Row className="justify-content-center">
              <Col xs={12} md={8} lg={6}>
                <div className="text-center mb-4">
                  <h1 className="display-5 mb-3">Officer Login</h1>
                  <p className="lead text-secondary">Select your profile to access the counter</p>
                </div>
                
                <Row className="g-3">
                  {sampleOfficers.map((officer) => (
                    <Col key={officer.id} xs={12} sm={6}>
                      <Card 
                        className="h-100 border-0 bg-white shadow-sm"
                        style={{ 
                          cursor: 'pointer',
                          borderRadius: '10px',
                          border: officer.isAvailable ? '2px solid #2ecc71' : '2px solid #e74c3c'
                        }}
                        onClick={() => officer.isAvailable && handleLogin(officer)}
                      >
                        <Card.Body className="text-center p-4">
                          <i className="fas fa-user-tie fs-1 mb-3" 
                             style={{ color: officer.isAvailable ? '#2ecc71' : '#e74c3c' }}></i>
                          <Card.Title className="h5 mb-2">{officer.name}</Card.Title>
                          <Card.Text className="text-muted mb-3">
                            Counter #{officer.counterId}
                          </Card.Text>
                          <Badge 
                            bg={officer.isAvailable ? 'success' : 'danger'}
                            className="px-3 py-2"
                          >
                            {officer.isAvailable ? 'Available' : 'Busy'}
                          </Badge>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          ) : (
            // Officer Dashboard
            <Row className="g-4">
              {/* Officer Info Card */}
              <Col xs={12} md={4}>
                <Card className="border-0 bg-white shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="text-center mb-4">
                      <i className="fas fa-user-tie fs-1 mb-3" style={{ color: '#2ecc71' }}></i>
                      <h4 className="mb-2">{currentOfficer?.name}</h4>
                      <p className="text-muted">Counter #{currentOfficer?.counterId}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h6 className="mb-3">Counter Status</h6>
                      <Badge 
                        bg={counterStatus === 'available' ? 'success' : 
                            counterStatus === 'busy' ? 'warning' : 'secondary'}
                        className="fs-6 px-3 py-2"
                      >
                        {counterStatus === 'available' ? 'Available' :
                         counterStatus === 'busy' ? 'Busy' : 'Offline'}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <h6 className="mb-3">Available Services</h6>
                      {availableServices.map((service) => (
                        <Badge key={service.id} bg="info" className="me-2 mb-2">
                          {service.name}
                        </Badge>
                      ))}
                    </div>

                    <Button 
                      variant="outline-danger" 
                      className="w-100"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              {/* Current Customer Card */}
              <Col xs={12} md={4}>
                <Card className="border-0 bg-white shadow-sm h-100">
                  <Card.Body className="p-4">
                    <h5 className="mb-4">Current Customer</h5>
                    
                    {currentTicket ? (
                      <div className="text-center">
                        <div className="mb-4">
                          <i className="fas fa-ticket-alt fs-1 mb-3" style={{ color: '#3498db' }}></i>
                          <h2 className="display-6 mb-3">{currentTicket.id}</h2>
                          <p className="h5 text-secondary mb-3">
                            Service: {currentTicket.serviceType}
                          </p>
                          <p className="text-muted mb-4">
                            Called at: {currentTicket.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        
                        <Button 
                          variant="primary" 
                          size="lg"
                          className="w-100"
                          onClick={handleCallNextCustomer}
                        >
                          <i className="fas fa-arrow-right me-2"></i>
                          Complete & Call Next
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <i className="fas fa-user-clock fs-1 mb-3" style={{ color: '#95a5a6' }}></i>
                        <p className="text-muted mb-4">No customer being served</p>
                        
                        <Button 
                          variant="primary" 
                          size="lg"
                          className="w-100"
                          onClick={handleCallNextCustomer}
                        >
                          <i className="fas fa-phone me-2"></i>
                          Call Next Customer
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Counter Controls Card */}
              <Col xs={12} md={4}>
                <Card className="border-0 bg-white shadow-sm h-100">
                  <Card.Body className="p-4">
                    <h5 className="mb-4">Counter Controls</h5>
                    
                    <div className="d-grid gap-3">
                      <Button 
                        variant={counterStatus === 'available' ? 'warning' : 'success'}
                        size="lg"
                        onClick={handleToggleAvailability}
                        disabled={!!currentTicket}
                      >
                        {counterStatus === 'available' ? 'Set Busy' : 'Set Available'}
                      </Button>
                      
                      <Button 
                        variant="outline-info"
                        size="lg"
                        disabled
                      >
                        View Queue Status
                      </Button>
                    </div>

                    <Alert variant="info" className="mt-4">
                      <small>
                        <i className="fas fa-info-circle me-2"></i>
                        Use the middle button to call and serve customers.
                      </small>
                    </Alert>
                    
                    {currentTicket && (
                      <Alert variant="success" className="mt-3">
                        <small>
                          <i className="fas fa-user-check me-2"></i>
                          Serving customer. Click button when done to call next.
                        </small>
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Officer;
