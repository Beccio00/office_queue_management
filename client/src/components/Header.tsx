import { Container, Button, Row, Col } from 'react-bootstrap';

interface HeaderProps {
  isHomePage: boolean;
  isCustomerPage: boolean;
  isOfficerPage?: boolean;
}

const Header = ({ isHomePage, isCustomerPage, isOfficerPage}: HeaderProps) => {
  const getHeaderContent = () => {
    if (isCustomerPage) {
      return (
        <>
          <i className="fas fa-user-clock fs-3 me-3 text-white"></i>
          <h1 className="m-0 h3 text-white">Customer</h1>
        </>
      );
    }
    if (isOfficerPage) {
      return (
        <>
          <i className="fas fa-user-tie fs-3 me-3 text-white"></i>
          <h1 className="m-0 h3 text-white">Officer</h1>
        </>
      );
    }
    return <h1 className="m-0 h3 text-white">Queue Management</h1>;
  };

  return (
    <nav className="shadow-sm" style={{ 
      background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)'
    }}>
      <Container>
        <Row className="align-items-center py-3">
          <Col xs={12} lg={{ span: 8, offset: 2 }} className="d-flex justify-content-between align-items-center">
            {/* Title and optional icon */}
            <div className="d-flex align-items-center">
              {getHeaderContent()}
            </div>
          </Col>
        </Row>
      </Container>
    </nav>
  );
};

export default Header;