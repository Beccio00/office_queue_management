import { Routes, Route } from 'react-router-dom';
import Home from './pages/home/home';
import Customer from './pages/customer/customer';
import Officer from './pages/officer/officer';
import Display from './pages/display/display';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customer" element={<Customer />} />
        <Route path="/officer" element={<Officer />} />
        <Route path="/display" element={<Display />} />
      </Routes>
    </div>
  );
}

export default App
