import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import type { DisplayInfo } from '../../types/index';

/**
 * Public display component for queue management system
 * Shows real-time queue status and current serving information
 * Designed for display on public screens
 */
const Display = () => {
  // State management for display information
  const [displayInfo, setDisplayInfo] = useState<DisplayInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ⭐ Fetch real-time data from API
  useEffect(() => {
    const fetchDisplayData = async () => {
      try {
        // Get API base URL from environment variable or use default
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        
        console.log('📡 Fetching display data from:', `${apiBaseUrl}/display/status`);
        
        // ⭐ Call GET /api/display/status API
        const response = await fetch(`${apiBaseUrl}/display/status`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Received data:', data);
        
        // Convert date strings to Date objects
        const parsedData: DisplayInfo = {
          ...data,
          currentTicket: data.currentTicket ? {
            ...data.currentTicket,
            timestamp: new Date(data.currentTicket.timestamp)
          } : null,
          nextTickets: data.nextTickets.map((ticket: any) => ({
            ...ticket,
            timestamp: new Date(ticket.timestamp)
          })),
          lastUpdated: new Date(data.lastUpdated || new Date())
        };
        
        setDisplayInfo(parsedData);
        
      } catch (error) {
        console.error('❌ Error fetching display data:', error);
        
        // ⚠️ Fallback to sample data if API is not available
        console.warn('Using sample data as fallback');
        const sampleDisplayInfo: DisplayInfo = {
          currentTicket: {
            id: 'A001',
            serviceType: 'DEPOSIT',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            status: 'serving'
          },
          nextTickets: [
            {
              id: 'A002',
              serviceType: 'SHIPPING',
              timestamp: new Date(Date.now() - 10 * 60 * 1000),
              status: 'waiting'
            },
            {
              id: 'A003',
              serviceType: 'ACCOUNT',
              timestamp: new Date(Date.now() - 15 * 60 * 1000),
              status: 'waiting'
            },
            {
              id: 'A004',
              serviceType: 'DEPOSIT',
              timestamp: new Date(Date.now() - 20 * 60 * 1000),
              status: 'waiting'
            },
            {
              id: 'A005',
              serviceType: 'SHIPPING',
              timestamp: new Date(Date.now() - 25 * 60 * 1000),
              status: 'waiting'
            }
          ],
          queueStatus: [
            { serviceType: 'DEPOSIT', length: 8, estimatedWaitTime: 15 },
            { serviceType: 'SHIPPING', length: 5, estimatedWaitTime: 25 },
            { serviceType: 'ACCOUNT', length: 3, estimatedWaitTime: 20 }
          ],
          counters: [
            { id: 1, number: 1, availableServices: ['DEPOSIT', 'ACCOUNT'] },
            { id: 2, number: 2, availableServices: ['SHIPPING', 'DEPOSIT'] },
            { id: 3, number: 3, availableServices: ['ACCOUNT', 'SHIPPING'] }
          ],
          lastUpdated: new Date()
        };
        setDisplayInfo(sampleDisplayInfo);
      }
    };

    // Initial load - fetch data immediately
    fetchDisplayData();

    // ⭐ Poll API every 10 seconds for updates
    const interval = setInterval(fetchDisplayData, 10000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Maps service types to their corresponding colors
   */
  const getServiceColor = (serviceType: string) => {
    const colors = {
      DEPOSIT: '#3498db',
      SHIPPING: '#e67e22',
      ACCOUNT: '#9b59b6'
    };
    return colors[serviceType as keyof typeof colors] || '#95a5a6';
  };

  /**
   * Maps service types to their corresponding icons
   */
  const getServiceIcon = (serviceType: string) => {
    const icons = {
      DEPOSIT: 'fa-money-bill-wave',
      SHIPPING: 'fa-box',
      ACCOUNT: 'fa-user-cog'
    };
    return icons[serviceType as keyof typeof icons] || 'fa-question';
  };

  if (!displayInfo) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
        <div className="text-center text-white">
          <i className="fas fa-spinner fa-spin fs-1 mb-3"></i>
          <h3>Loading Display...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="vh-100 bg-dark text-white d-flex flex-column" style={{ 
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="bg-primary py-2">
        <Container fluid>
          <Row className="align-items-center">
            <Col xs={6}>
              <h1 className="h3 mb-0">
                <i className="fas fa-building me-2"></i>
                Office Queue Management
              </h1>
            </Col>
            <Col xs={6} className="text-end">
              <div className="fs-5">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="small text-light">
                {currentTime.toLocaleDateString()}
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Main Content */}
      <Container fluid className="py-3 flex-grow-1" style={{ overflow: 'auto' }}>
        <Row className="g-3" style={{ height: '100%' }}>
          {/* Current Serving Section */}
          <Col xs={12} lg={6}>
            <Card className="border-0 bg-white text-dark h-100">
              <Card.Body className="p-3">
                <h5 className="text-center mb-3">
                  <i className="fas fa-user-check me-2 text-success"></i>
                  Currently Serving
                </h5>
                
                {displayInfo.currentTicket ? (
                  <div className="text-center">
                    <i 
                      className={`fas ${getServiceIcon(displayInfo.currentTicket.serviceType)} fs-2 mb-2`}
                      style={{ color: getServiceColor(displayInfo.currentTicket.serviceType) }}
                    ></i>
                    <h1 className="display-3 mb-2 text-primary fw-bold">
                      {displayInfo.currentTicket.id}
                    </h1>
                    <h5 className="text-secondary mb-2">
                      {displayInfo.currentTicket.serviceType}
                    </h5>
                    
                    {/* Show which counter is serving */}
                    <div className="alert alert-info mb-2 py-2">
                      <i className="fas fa-desktop me-2"></i>
                      <strong>Please go to Counter #1</strong>
                    </div>
                    
                    <p className="text-muted small mb-0">
                      Started at: {displayInfo.currentTicket.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <i className="fas fa-user-clock fs-1 mb-2 text-muted"></i>
                    <h5 className="text-muted">No customer being served</h5>
                    <p className="text-muted small">Please wait for your ticket to be called</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Next Customers Section */}
          <Col xs={12} lg={6}>
            <Card className="border-0 bg-white text-dark h-100">
              <Card.Body className="p-3">
                <h5 className="text-center mb-3">
                  <i className="fas fa-users me-2 text-info"></i>
                  Next Customers
                </h5>
                
                <div className="row g-2">
                  {displayInfo.nextTickets.slice(0, 4).map((ticket, index) => (
                    <div key={ticket.id} className="col-6">
                      <div 
                        className="p-2 rounded text-center"
                        style={{ 
                          backgroundColor: index === 0 ? '#e8f5e8' : '#f8f9fa',
                          border: index === 0 ? '2px solid #2ecc71' : '1px solid #dee2e6'
                        }}
                      >
                        <i 
                          className={`fas ${getServiceIcon(ticket.serviceType)} fs-5 mb-1`}
                          style={{ color: getServiceColor(ticket.serviceType) }}
                        ></i>
                        <div className="fw-bold fs-6">{ticket.id}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{ticket.serviceType}</div>
                        {index === 0 && (
                          <Badge bg="success" className="mt-1" style={{ fontSize: '0.7rem' }}>Next</Badge>
                        )}
                        {index > 0 && (
                          <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                            Position: #{index + 1}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Additional waiting customers info */}
                <div className="mt-2">
                  <div className="alert alert-warning py-2 mb-0">
                    <i className="fas fa-clock me-1"></i>
                    <strong style={{ fontSize: '0.85rem' }}>Please wait for your ticket number to be called</strong>
                    <br />
                    <small style={{ fontSize: '0.75rem' }}>Your position will be shown above when you're next</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Queue Status Section */}
          <Col xs={12} lg={6}>
            <Card className="border-0 bg-white text-dark h-100">
              <Card.Body className="p-3">
                <h5 className="text-center mb-3">
                  <i className="fas fa-chart-bar me-2 text-warning"></i>
                  Queue Status & Wait Times
                </h5>
                
                <div className="row g-2">
                  {displayInfo.queueStatus.map((queue) => (
                    <div key={queue.serviceType} className="col-12">
                      <div className="p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center">
                            <i 
                              className={`fas ${getServiceIcon(queue.serviceType)} me-2`}
                              style={{ color: getServiceColor(queue.serviceType), fontSize: '0.9rem' }}
                            ></i>
                            <span className="fw-bold" style={{ fontSize: '0.9rem' }}>{queue.serviceType}</span>
                          </div>
                          <Badge bg="primary" style={{ fontSize: '0.75rem' }}>
                            {queue.length} waiting
                          </Badge>
                        </div>
                        <div className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>
                          <i className="fas fa-clock me-1"></i>
                          Wait time: <strong>{queue.estimatedWaitTime} min</strong>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${Math.min((queue.length / 10) * 100, 100)}%`,
                              backgroundColor: getServiceColor(queue.serviceType)
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* General instructions */}
                <div className="mt-2">
                  <div className="alert alert-info py-2 mb-0">
                    <i className="fas fa-info-circle me-1"></i>
                    <strong style={{ fontSize: '0.85rem' }}>How to check your position:</strong>
                    <br />
                    <small style={{ fontSize: '0.75rem' }}>Look for your ticket number in "Next Customers" above</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Counter Status Section */}
          <Col xs={12} lg={6}>
            <Card className="border-0 bg-white text-dark h-100">
              <Card.Body className="p-3">
                <h5 className="text-center mb-3">
                  <i className="fas fa-desktop me-2 text-danger"></i>
                  Counter Status & Directions
                </h5>
                
                <div className="row g-2">
                  {displayInfo.counters.map((counter) => (
                    <div key={counter.id} className="col-12">
                      <div className="p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center">
                            <i className="fas fa-desktop me-2 text-primary" style={{ fontSize: '0.9rem' }}></i>
                            <span className="fw-bold" style={{ fontSize: '0.9rem' }}>Counter #{counter.number}</span>
                          </div>
                          <Badge bg={counter.id === 1 ? "warning" : "success"} style={{ fontSize: '0.75rem' }}>
                            {counter.id === 1 ? "Serving" : "Available"}
                          </Badge>
                        </div>
                        <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                          Services: {counter.availableServices.join(', ')}
                        </div>
                        {counter.id === 1 && (
                          <div className="alert alert-warning py-1 mb-0">
                            <i className="fas fa-arrow-right me-1"></i>
                            <strong style={{ fontSize: '0.8rem' }}>Serving: A001</strong>
                          </div>
                        )}
                        {counter.id !== 1 && (
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            <i className="fas fa-check-circle me-1 text-success"></i>
                            Ready to serve
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Directions */}
                <div className="mt-2">
                  <div className="alert alert-success py-2 mb-0">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    <strong style={{ fontSize: '0.85rem' }}>Counter Locations:</strong>
                    <br />
                    <small style={{ fontSize: '0.75rem' }}>Counter #1: Left | Counter #2: Center | Counter #3: Right</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <div className="bg-secondary py-1">
        <Container fluid>
          <div className="text-center text-white">
            <small style={{ fontSize: '0.75rem' }}>
              Last updated: {displayInfo.lastUpdated.toLocaleTimeString()} | 
              Auto-refresh every 10 seconds
            </small>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default Display;

