import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import './HowToPlay.css';

function HowToPlay() {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex justify-center items-center z-[1000]">
          <div className="bg-white p-5 rounded-lg shadow-lg relative w-4/5 max-w-lgb h-1/5 border-4 border-[#9ab0c3]">
            <button className="absolute top-[10px] right-[10px] bg-transparent border-none cursor-pointer text-[#666] hover:text-black" onClick={handleClose}>
              <CloseIcon />
            </button>
            <div className="mt-5 text-center">
              <h2>How to Play</h2>
              <p>Welcome to Connect the Shows! This game challenges you to find connections between TV shows and movies through actors.</p>
              <p>1. Select actors that connect different shows</p>
              <p>2. Build a path between shows using common actors</p>
              <p>3. Try to make connections with the fewest steps!</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HowToPlay;