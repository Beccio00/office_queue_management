import { Navbar, Container, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container className="d-flex justify-content-between align-items-center">
        <Navbar.Brand as={Link} to="/">
          Office Queue Management
        </Navbar.Brand>
        <div className="d-flex align-items-center">
          <Navbar.Toggle aria-controls="basic-navbar-nav" className="me-2" />
          {!isHomePage && (
            <Button
              variant="outline-light"
              onClick={() => navigate(-1)}
            >
              Back &larr;
            </Button>
          )}
        </div>
      </Container>
    </Navbar>
  );
};

export default Header;