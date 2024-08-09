// rfce
import React, {useState} from 'react'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () =>{
    setIsMenuOpen(!isMenuOpen)
  }

  console.log(isMenuOpen)
  return (
    <nav className='bg-blue p-6'>
        <div className='flex items-center justify-between'>
          {/* logo */}
            <div className='text-white text-2xl font-bold'>Aic Kabuku</div>
            
            <div className='md:hidden'>
              <button className='text-white' onClick={toggleMenu}>
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
              </button>
          </div>
          {/* desktop navbar */}
          <ul className='hidden md:flex space-x-4'>
              <li><a href='#home' className='text-white'>Home</a></li>
              <li><a href='#about' className='text-white'>About Us</a></li>
              {/* include location and Leadership */}
              <li><a href='#devotion' className='text-white'>Devotions</a></li>
              <li><a href='#events' className='text-white'>Events</a></li>
              <li><a href='#gallery' className='text-white'>Gallery</a></li>
              <li><a href='#giving' className='text-white'>Giving</a></li>
              <li><a href='#contact' className='text-white'>Contact Us</a></li>
          </ul>
        </div>
         {/* Mobile Version */}
         {isMenuOpen ? (
              <ul className='flex-col md:hidden' >
              <li className='py-2'><a href='#home' className='text-white'>Home</a></li>
              <li className='py-2'><a href='#about' className='text-white'>About Us</a></li>
              <li className='py-2'><a href='#devotion' className='text-white'>Devotions</a></li>
              <li className='py-2'><a href='#events' className='text-white'>Events</a></li>
              <li className='py-2'><a href='#gallery' className='text-white'>Gallery</a></li>
              <li className='py-2'><a href='#giving' className='text-white'>Giving</a></li>
              <li className='py-2'><a href='#contact' className='text-white'>Contact Us</a></li>
          </ul>
         ):null }
         
    </nav>
  )
}

export default Navbar