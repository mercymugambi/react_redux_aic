// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from '../src/components/Navbar'; // Assuming you have a Navbar component
import Home from '../src/components/Home'; // Import your Home component
import Devotions from '../src/components/Devotions'; // Import your Devotions component
import AboutUs from '../src/components/AboutUs'; // Import your AboutUs component

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
