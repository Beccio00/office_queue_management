import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './home.css';

type RoleCard = {
  title: string;
  description: string;
  route: string;
  variant: 'primary' | 'success' | 'info';
  icon: string;
};

const Home = () => {
  const navigate = useNavigate();
  
  const availableRoles: RoleCard[] = [
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
    }
  ];

  return (
    <div className="d-flex flex-column vh-100 bg-light" style={{ 
      fontFamily: "'Inter', sans-serif"
    }}>
      <Header 
        isHomePage={true}
        isCustomerPage={false}
        onBack={() => navigate(-1)}
      />
      <main className="flex-grow-1">
        <Container fluid className="py-5">
          <Row className="justify-content-center">
            <Col xs={12} lg={8} xl={6}>
            <div className="text-center mb-5">
              <h1 className="display-4 mb-3">Queue Management System</h1>
              <p className="lead text-secondary">Select your role</p>
            </div>
            
            <Row className="justify-content-center g-4">
              {availableRoles.map((card) => (
                <Col key={card.title} xs={12} sm={6}>
                  <Card 
                    className="h-100 border-0 shadow role-card"
                    style={{ 
                      cursor: 'pointer',
                      borderRadius: '15px'
                    }}
                    onClick={() => navigate(card.route)}
                  >
                    <div style={{
                      height: '4px',
                      background: card.variant === 'primary' ? '#3498db' : '#2ecc71'
                    }}></div>
                    <Card.Body className="d-flex flex-column p-4">
                      <div className="text-center mb-3">
                        <i className={`fas ${card.icon} fs-1 mb-3`} 
                           style={{
                             color: card.variant === 'primary' ? '#3498db' : '#2ecc71'
                           }}></i>
                      </div>
                      <Card.Title className="h4 mb-3 text-center">{card.title}</Card.Title>
                      <Card.Text className="text-center text-secondary">
                        {card.description}
                      </Card.Text>
                      <Button
                        variant={card.variant}
                        size="lg"
                        className="w-100 mt-auto py-3 border-0"
                        style={{
                          borderRadius: '10px',
                          background: card.variant === 'primary' ? '#3498db' : '#2ecc71'
                        }}
                      >
                        Enter
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
      <Footer />
    </div>
  );
};

export default Home;