import { Container } from 'react-bootstrap';

/**
 * Footer component that displays the application footer
 * Shows copyright information with consistent styling
 */
const Footer = () => {
  return (
    <footer 
      className="text-light py-3 text-center mt-auto shadow-sm" 
      style={{ 
        background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)'
      }}
    >
      <Container>
        <small>Office Queue Management System © 2025</small>
      </Container>
    </footer>
  );
};

export default Footer;