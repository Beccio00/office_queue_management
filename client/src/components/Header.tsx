import { Container, Button, Row, Col } from 'react-bootstrap';

/**
 * Props for the Header component
 */
interface HeaderProps {
  /** Flag indicating if current page is home page */
  isHomePage: boolean;
  /** Flag indicating if current page is customer page */
  isCustomerPage: boolean;
  /** Callback function for back button click */
  onBack: () => void;
}

/**
 * Header component that displays the navigation bar
 * Shows different content based on current page and provides navigation
 */
const Header = ({ isHomePage, isCustomerPage, onBack }: HeaderProps) => {
  /**
   * Renders the header content based on current page
   * Shows customer icon + title for customer page
   * Shows only title for other pages
   */
  const getHeaderContent = () => {
    if (isCustomerPage) {
      return (
        <>
          <i className="fas fa-user-clock fs-3 me-3 text-white"></i>
          <h1 className="m-0 h3 text-white">Customer</h1>
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
            {/* Back button - hidden on home page */}
            {!isHomePage && (
              <Button
                variant="outline-light"
                className="shadow-sm"
                onClick={onBack}
              >
                Back &larr;
              </Button>
            )}
          </Col>
        </Row>
      </Container>
    </nav>
  );
};

export default Header;