import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleItemClick = (item) => {
    setActiveItem(item);
    setIsMenuOpen(false);
    navigate(`/${item === 'home' ? '' : item}`);
  };

  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === '/') {
      setActiveItem('home');
    } else {
      setActiveItem(currentPath.slice(1));
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMenuOpen]);

  return (
    <nav className='navbar fixed top-0 left-0 right-0 bg-white py-0 shadow-md z-50' style={{ borderRadius: '0', padding: '20px 40px' }}>
      <div className='flex items-center justify-between' style={{ borderRadius: '0' }}>
        <div className='flex items-center'>
          <img src="/assets/aicLogo.png" alt="AICLogo" className="logo-img" />
          <div className='text-black text-2xl font-bold ml-2'>AIC Kabuku</div>
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
                  e.preventDefault();
                  handleItemClick(item);
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
        <div className='fixed inset-0 bg-white z-50 flex flex-col items-center justify-start w-full h-auto pt-0' style={{ borderRadius: '0', padding: '0' }}>
          <div className='shadow-md flex items-center justify-between w-full px-10 py-4' style={{ borderRadius: '0', padding: '20px 40px' }}>
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

          <ul className='flex flex-center flex-col space-y-2 mt-0 w-full px-4'>
            {['home', 'about', 'devotions', 'events', 'gallery', 'giving', 'contact'].map((item) => (
              <li key={item}>
                <a
                  href={`#${item}`}
                  className={`text-gray-light ${activeItem === item ? 'text-red' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleItemClick(item);
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
