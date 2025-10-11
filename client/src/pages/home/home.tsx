import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

// Theme colors used across the application
const themeColors = {
  primary: '#3498db',
  success: '#2ecc71',
  info: '#00bcd4',
  text: '#2c3e50',
  subText: '#7f8c8d',
} as const;

/**
 * Home component that serves as the landing page of the Queue Management System.
 * It displays three role-based access cards: Customer, Officer, and Manager.
 */
const Home = () => {
  const navigate = useNavigate();

  // Define card configurations for different user roles
  // Define card configurations for each user role with their respective properties
  const cards = [
    {
      title: 'Customer',
      description: 'Get a ticket for your service',
      route: '/customer',
      variant: 'primary',
      icon: 'fa-user-clock'
    },
    {
      title: 'Officer',
      description: 'Manage counter and serve customers',
      route: '/officer',
      variant: 'success',
      icon: 'fa-user-tie'
    },
    {
      title: 'Manager',
      description: 'View statistics and manage services',
      route: '/manager',
      variant: 'info',
      icon: 'fa-chart-line'
    }
  ] as const;

  return (
    <div className="d-flex flex-column vh-100 bg-light" style={{ 
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <Header 
        isHomePage={true}
        isCustomerPage={false}
        onBack={() => navigate(-1)}
      />

      {/* Main content */}
      <main className="flex-grow-1">
        <Container fluid className="py-5">
          <Row className="justify-content-center">
            <Col xs={12} lg={8} xl={6}>
              {/* Welcome header section */}
            <div className="text-center mb-5">
              <h1 className="display-4 mb-3">Welcome to Queue Management System</h1>
              <p className="lead text-secondary">Choose your role to access the system</p>
            </div>
            
            {/* Grid of role selection cards */}
            <Row className="justify-content-center g-4">
              {cards.map((card) => (
                <Col key={card.title} xs={12} sm={6} md={4}>
                  <Card 
                    className="h-100 border-0 bg-white shadow-lg transition-all"
                    style={{ 
                      cursor: 'pointer',
                      borderRadius: '15px',
                      transform: 'translateY(0)',
                      transition: 'all 0.3s ease-in-out'
                    }}
                    onClick={() => navigate(card.route)}
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
                    {/* Card top border decoration */}
                    <div style={{
                      height: '4px',
                      background: card.variant === 'primary' ? '#3498db' :
                                card.variant === 'success' ? '#2ecc71' : '#00bcd4'
                    }}></div>
                    <Card.Body className="d-flex flex-column p-4">
                      {/* Role icon */}
                      <div className="text-center mb-3">
                        <i className={`fas ${card.icon} fs-1 mb-3`} 
                           style={{
                             color: card.variant === 'primary' ? '#3498db' :
                                   card.variant === 'success' ? '#2ecc71' : '#00bcd4',
                             transition: 'transform 0.3s ease-in-out'
                           }}></i>
                      </div>
                      {/* Role title and description */}
                      <Card.Title className="h4 mb-3 text-center">{card.title}</Card.Title>
                      <Card.Text className="text-center text-secondary">
                        {card.description}
                      </Card.Text>
                      {/* Action button */}
                      <Button
                        variant={card.variant}
                        size="lg"
                        className="w-100 mt-auto py-3 border-0"
                        style={{
                          borderRadius: '10px',
                          background: card.variant === 'primary' ? '#3498db' :
                                    card.variant === 'success' ? '#2ecc71' : '#00bcd4'
                        }}
                      >
                        Enter as {card.title}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;