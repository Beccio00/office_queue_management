import { Container, Button, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isCustomerPage = location.pathname === '/customer';
  
  const getHeaderContent = () => {
    if (isCustomerPage) {
      return (
        <>
          <i className="fas fa-user-clock fs-3 me-3" style={{ color: 'white' }}></i>
          <h1 className="m-0 h3" style={{ color: 'white' }}>Customer</h1>
        </>
      );
    }
    return (
      <>
        <h1 className="m-0 h3" style={{ color: 'white' }}>Queue Management</h1>
      </>
    );
  };

  const handleBack = () => {
    // Se c'è un ticket visualizzato, resetta lo stato invece di navigare
    const ticketElement = document.querySelector('.alert-success');
    if (ticketElement) {
      // Simula il click sul pulsante "Get Another Ticket"
      const getAnotherButton = ticketElement.querySelector('button');
      if (getAnotherButton) {
        getAnotherButton.click();
        return;
      }
    }
    // Altrimenti usa la navigazione normale
    navigate(-1);
  };

  return (
    <div className="d-flex flex-column vh-100" style={{ 
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter', sans-serif"
      }}>
      <nav style={{ 
        background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <Container>
          <Row className="align-items-center py-3">
            <Col xs={12} lg={{ span: 8, offset: 2 }} className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                {getHeaderContent()}
              </div>
              {!isHomePage ? (
                <Button
                  variant="outline-light"
                  className="shadow-sm"
                  onClick={handleBack}
                >
                  Back &larr;
                </Button>
              ) : (
                <div></div>
              )}
            </Col>
          </Row>
        </Container>
      </nav>
      <main className="flex-grow-1 d-flex flex-column">
        <Container fluid className="flex-grow-1 d-flex flex-column py-4">
          {children}
        </Container>
      </main>
      <footer className="text-light py-3 text-center mt-auto" style={{ 
        background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)',
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <Container>
          <small>Office Queue Management System © 2025</small>
        </Container>
      </footer>
    </div>
  );
};

export default Layout;