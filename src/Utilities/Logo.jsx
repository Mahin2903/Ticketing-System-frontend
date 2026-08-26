import React from 'react';
import JustLogo from '../images/JUST.png'

const Logo = () => {
    return (
        <div className='flex items-center gap-4'>
            <img className='h-16 w-16 shadow-lg rounded-4xl' src={JustLogo} alt="Logo" />
        <span
              className="hidden sm:block font-semibold text-white/90 text-sm tracking-wide group-hover:text-white transition-colors"
              style={{ letterSpacing: '0.03em' }}
            >
              JUST <span className='text-green-600'>TICKETING</span> <span className='text-red-600'>PORTAL</span>
            </span>
        </div>
    );
};

export default Logo;