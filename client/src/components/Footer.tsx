import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer 
      className="text-light py-3 text-center mt-auto shadow-sm" 
      style={{ 
        background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)'
      }}
    >
      <Container>
        <small>Office Queue Management System</small>
      </Container>
    </footer>
  );
};

export default Footer;