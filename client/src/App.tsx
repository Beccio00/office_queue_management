import { Routes, Route } from 'react-router-dom';
import Home from './pages/home/home';
import Customer from './pages/customer/customer';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customer" element={<Customer />} />
      </Routes>
    </div>
  );
}

export default App
