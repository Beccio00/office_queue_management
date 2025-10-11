import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/layout';

const Home = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Customer',
      description: 'Get a ticket for your service',
      route: '/customer',
      variant: 'primary'
    },
    {
      title: 'Officer',
      description: 'Manage counter and serve customers',
      route: '/officer',
      variant: 'success'
    },
    {
      title: 'Manager',
      description: 'View statistics and manage services',
      route: '/manager',
      variant: 'info'
    }
  ] as const;

  return (
    <Layout>
      <Container fluid className="py-5">
        <Row className="justify-content-center">
          <Col xs={12} lg={8} xl={6}>
            <div className="text-center mb-5">
              <h1 className="display-4 mb-3">Welcome to Queue Management System</h1>
              <p className="lead" style={{ color: '#2c3e50' }}>Choose your role to access the system</p>
            </div>
            
            <Row className="justify-content-center g-4">
              {cards.map((card) => (
                <Col key={card.title} xs={12} sm={6} md={4}>
                  <Card 
                    className="h-100 border-0 bg-white shadow-lg"
                    style={{ 
                      transition: 'all 0.3s ease-in-out',
                      cursor: 'pointer',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      transform: 'translateY(0)',
                    }}
                    onClick={() => navigate(card.route)}
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
                      background: card.variant === 'primary' ? '#3498db' :
                                card.variant === 'success' ? '#2ecc71' : '#00bcd4'
                    }}></div>
                    <Card.Body className="d-flex flex-column p-4">
                      <div className="text-center mb-3">
                        <i className={`fas ${
                          card.title === 'Customer' ? 'fa-user-clock' :
                          card.title === 'Officer' ? 'fa-user-tie' : 'fa-chart-line'
                        } fs-1 mb-3`} style={{
                          color: card.variant === 'primary' ? '#3498db' :
                                card.variant === 'success' ? '#2ecc71' : '#00bcd4',
                          transition: 'transform 0.3s ease-in-out'
                        }}></i>
                      </div>
                      <Card.Title className="h4 mb-3 text-center">{card.title}</Card.Title>
                      <Card.Text className="text-center" style={{ color: '#7f8c8d' }}>{card.description}</Card.Text>
                      <Button
                        variant={card.variant}
                        size="lg"
                        className="w-100 mt-auto py-3"
                        style={{
                          background: card.variant === 'primary' ? '#3498db' :
                                    card.variant === 'success' ? '#2ecc71' : '#00bcd4',
                          border: 'none',
                          borderRadius: '10px'
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
    </Layout>
  );
};

export default Home;