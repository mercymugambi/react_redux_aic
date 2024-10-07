import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleItemClick = (item) => {
    setActiveItem(item);
    setIsMenuOpen(false);

    // Navigate to the respective route
    navigate(`/${item === 'home' ? '' : item}`);
  };

  return (
    <nav className='navbar fixed top-0 left-0 right-0 bg-white py-4 px-10 border border-white shadow-md z-50'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <img src="/assets/aicLogo.png" alt="AICLogo" className="logo-img" />
          <div className='text-black text-2xl font-bold'>AIC Kabuku</div>
        </div>
        <div className='md:hidden'>
          <button className='text-gray-dark' onClick={toggleMenu}>
            {isMenuOpen ? (
              <svg
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                viewBox='0 0 24 24'
                className='w-6 h-6'
              >
                <path d='M6 18L18 6M6 6l12 12'></path>
              </svg>
            ) : (
              <svg
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                viewBox='0 0 24 24'
                className='w-6 h-6'
              >
                <path d='M4 6h16M4 12h16M4 18h16'></path>
              </svg>
            )}
          </button>
        </div>

        {/* Desktop Navbar */}
        <ul className='hidden md:flex space-x-4'>
          {['home', 'about', 'devotions', 'events', 'gallery', 'giving', 'contact'].map((item) => (
            <li key={item}>
              <a
                href={`#${item}`}
                className={`text-gray-light ${activeItem === item ? 'text-red' : ''}`}
                onClick={(e) => {
                  e.preventDefault(); // Prevent default anchor behavior
                  handleItemClick(item); // Call the handleItemClick
                }}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Version */}
      {isMenuOpen && (
        <div className='fixed inset-0 bg-white z-50 flex flex-col items-center justify-center'>
          
          <div className='shadow-md flex items-center justify-between absolute top-4 right-4 w-full max-w-md px-4'>
            <div className='flex items-center'>
              <img src="/assets/aicLogo.png" alt="AICLogo" className="logo-img" />
              <div className='text-black text-2xl font-bold ml-2'>AIC Kabuku</div>
            </div>
            <button className='text-gray-dark' onClick={toggleMenu}>
              <svg
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                viewBox='0 0 24 24'
                className='w-6 h-6'
              >
                <path d='M6 18L18 6M6 6l12 12'></path>
              </svg>
            </button>
          </div>

          <ul className='flex flex-col space-y-4 mt-16'>
            {['home', 'about', 'devotions', 'events', 'gallery', 'giving', 'contact'].map((item) => (
              <li key={item}>
                <a
                  href={`#${item}`}
                  className={`text-gray-light ${activeItem === item ? 'text-red' : ''}`}
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default anchor behavior
                    handleItemClick(item); // Call the handleItemClick
                  }}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
