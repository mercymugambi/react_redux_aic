// rfce
import React from 'react'

function Navbar() {
  return (
    <nav className='bg-blue p-6'>
        <div className='flex items-center justify-between'>
          {/* logo */}
          <div className='text-white text-2xl font-bold'>
            <ul className='hidden md:flex space-x-4'>
              <li><a href='#Home' className='text-white'>Home</a></li>
             
            </ul>
          </div>
        </div>
    </nav>
  )
}

export default Navbar