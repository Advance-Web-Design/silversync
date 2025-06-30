export const gameHeaderStyle = "absolute top-0 left-0 right-0 py-1 px-2 sm:py-2 sm:px-3 md:py-3 md:px-5 z-[100] bg-transparent flex justify-between items-center";

export const logoContainerStyle = "text-sm sm:text-xl md:text-2xl absolute top-1 sm:top-2 md:top-[15px] left-0 right-0 flex flex-col items-center justify-center pointer-events-none";

export const starLogoStyle = "text-[gold] text-sm sm:text-xl md:text-2xl mb-[-1px] sm:mb-[-2px] md:mb-[-5px]";

export const gameTitleStyle = "text-[gold] text-sm sm:text-lg md:text-[22px] lg:text-[28px] m-0 font-semibold [text-shadow:0_0_8px_rgba(255,215,0,0.4)]";

export const actorDisplayStyle ="absolute top-0 left-0 right-0 flex flex-col sm:flex-row gap-1 sm:gap-2 md:gap-4 justify-center items-center text-white text-[10px] sm:text-xs md:text-base lg:text-lg font-semibold pt-2 sm:pt-3 md:pt-5 z-30 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]";

export const connectTextStyle =
  "px-1 py-0.5 sm:px-2 sm:py-1 rounded bg-white bg-clip-text text-transparent font-bold tracking-wide uppercase shadow-md text-[10px] sm:text-xs md:text-sm";

export const actorNameStyle ="text-yellow-300 font-extrabold px-2 py-1 rounded bg-[rgba(255,215,0,0.08)] shadow-[0_2px_8px_rgba(255,215,0,0.18)] border border-yellow-200/40";
export const actorNameBaseStyle = "font-extrabold px-1 py-0.5 sm:px-2 sm:py-1 rounded border text-[10px] sm:text-xs md:text-sm";
export const actorNameDarkStyle = "bg-[rgba(255,215,0,0.08)] text-yellow-300 shadow-[0_2px_8px_rgba(255,215,0,0.18)] border border-yellow-200/40";
export const actorNameLightStyle = "bg-[rgba(0,215,255,0.08)] text-[#F7AD2F] shadow-[0_2px_8px_rgba(0,215,255,0.18)] border border-[#F7AD2F]/40";
// #F7AD2F-orange goody , 

export const TextStyle ="mx-1 sm:mx-2 text-sm sm:text-lg md:text-xl lg:text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,255,255,0.18)] uppercase tracking-wider";  

export const gameBoardContainerStyle = "relative w-full h-screen bg-[#0a0a1a] bg-cover overflow-hidden flex justify-center items-center bg-[url('/game-bg2.png'),_radial-gradient(circle,_rgba(20,20,35,1)_0%,_rgba(10,10,26,1)_100%)]";
export const gameBoardContainerBaseStyle = "relative w-full min-h-screen max-h-screen bg-cover overflow-hidden flex justify-center items-center touch-none";

export const gameBoardContainerDarkStyle =
  "bg-[#0a0a1a] bg-[url('/game-bg3-1.svg'),_radial-gradient(circle,_rgba(20,20,35,1)_0%,_rgba(10,10,26,1)_100%)]";

export const gameBoardContainerLightStyle =
  "bg-[#f8fafc] bg-[url('/game-bg2.svg'),_radial-gradient(circle,_rgba(255,255,255,1)_0%,_rgba(220,230,245,1)_100%)]";

export const zoomWrapperStyle = "w-full h-full relative overflow-hidden touch-none min-h-screen";

export const zoomContentBaseStyle = "relative origin-center transition-transform duration-100 ease-in-out min-w-full min-h-full";

export const zoomIndicatorStyle = "absolute top-1 right-1 sm:top-2 sm:right-2 md:top-3 md:right-3 bg-white/90 text-black text-[10px] sm:text-xs md:text-sm py-0.5 px-1 sm:py-1 sm:px-2 md:py-1.5 md:px-3 rounded-md font-medium z-50 backdrop-blur-sm hidden sm:block";