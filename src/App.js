
// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from '../src/components/Navbar'; // Navbar component
import Home from '../src/components/Home'; // Home component
import Devotions from '../src/components/Devotions'; // Devotions component
import AboutUs from '../src/components/AboutUs'; // AboutUs component

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar /> {/* Include your Navbar component */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/devotions" element={<Devotions />} />
          <Route path="/about" element={<AboutUs />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
