///conection content Style
export const connectionsContentStyle = "text-center overflow-y-auto px-2 sm:px-4 pb-2 sm:pb-4 max-h-[calc(100vh-140px)] sm:max-h-[calc(100vh-160px)]";

//no-connection
export const noConnectionsStyle = "mx-auto text-[rgba(255,255,255,0.5)] p-4 sm:p-8 italic text-sm sm:text-base";

////conection Item Style
export const connectionItemStyle = "flex bg-[rgba(0,0,0,0.2)] rounded-md p-1.5 sm:p-2 transition-all duration-200 ease-in-out border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] hover:scale-105 cursor-pointer";

export const alreadyOnBoardStyle = "flex bg-[rgba(255,215,0,0.05)] rounded-md p-1.5 sm:p-2 transition-all duration-200 ease-in-out border border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:scale-105 cursor-pointer";

export const connectionItemGuestAppearanceStyle = "border-l-2 sm:border-l-[3px] border-dashed border-l-[rgba(255,215,0,0.5)]";

export const connectionImageStyle = "w-8 h-[48px] sm:w-10 sm:h-[60px] mr-1.5 sm:mr-2 flex-shrink-0 rounded overflow-hidden relative";

export const connectionImageImgStyle = "w-full h-full object-cover";

export const guestBadgeStyle = "absolute top-0 right-0 bg-[rgba(255,215,0,0.8)] text-black text-[7px] sm:text-[8px] px-0.5 sm:px-1 py-0 sm:py-0.5 rounded-bl font-bold";

export const connectionInfoStyle = "flex-grow flex flex-col justify-between overflow-hidden";

export const connectionTitleStyle = "font-medium whitespace-nowrap overflow-hidden text-ellipsis text-sm sm:text-[0.9rem]";

export const connectionDetailStyle = "text-[0.75rem] sm:text-[0.8rem] text-[rgba(255,255,255,0.6)] mt-0.5 sm:mt-[2px] mb-1 sm:mb-[6px] whitespace-nowrap overflow-hidden text-ellipsis";

export const addConnectionButtonStyle = "bg-[rgba(46,204,113,0.2)] text-[rgba(46,204,113,0.9)] border border-[rgba(46,204,113,0.5)] rounded-[3px] py-0.5 px-1 sm:py-[3px] sm:px-1.5 text-[10px] sm:text-[11px] cursor-pointer transition-all duration-200 ease-in-out self-start mt-auto hover:bg-[rgba(46,204,113,0.3)] hover:text-[rgba(46,204,113,1)] hover:scale-110";

export const onBoardIndicatorStyle = "mx-auto text-[9px] sm:text-[10px] text-[rgba(255,215,0,0.8)] border border-[rgba(255,215,0,0.5)] py-0.5 px-1 sm:px-[5px] rounded-[3px] inline-block self-start mt-auto hover:scale-105 transition-transform duration-200 ease-in-out";


///connection Section Style
export const connectionSectionStyle = "my-2 sm:my-4";

export const connectionSectionH3Style = "mb-2 sm:mb-3 text-sm sm:text-base text-[rgba(255,255,255,0.9)] border-b border-[rgba(255,255,255,0.1)] pb-1 sm:pb-1.5";

export const connectionsGridStyle = "grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2 sm:gap-3";

// connection panel style
export const connectionsPanelStyle = "fixed top-[50px] sm:top-[60px] right-1 sm:right-[10px] w-[95vw] sm:w-[480px] max-w-[95vw] sm:max-w-[90vw] max-h-[calc(100vh-80px)] sm:max-h-[calc(100vh-100px)] bg-[rgba(10,10,26,0.95)] border border-[rgba(255,215,0,0.4)] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] text-white z-[100] flex flex-col animate-slide-in";

export const connectionsHeaderStyle = "flex justify-between items-center py-2 sm:py-3 px-2.5 sm:px-4 border-b border-[rgba(255,215,0,0.2)] sticky top-0 bg-[rgba(10,10,26,0.97)] z-[2] rounded-t-lg";

export const connectionsHeaderH2Style = "m-0 mx-auto text-base sm:text-[1.2rem] text-[gold] whitespace-nowrap overflow-hidden text-ellipsis max-w-[80%] sm:max-w-[85%]";

export const closeButtonStyle = "bg-transparent border-none text-[rgba(255,255,255,0.7)] text-xl sm:text-[22px] cursor-pointer p-0 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] hover:text-white";

//// connection line style
export const connectionsLayerStyle = "absolute top-0 left-0 w-full h-full pointer-events-none z-[5]";

// Base connection line styles (applied via style prop since SVG stroke properties aren't available in Tailwind)
export const connectionLineBaseStyle = {
  stroke: "rgba(255, 255, 255, 1)",
  strokeWidth: 2,
};

// Guest appearance line styles
export const connectionLineGuestStyle = {
  stroke: "rgba(255, 215, 0, 0.4)",
  strokeDasharray: "5,5",
  strokeWidth: 2,
};

// Completed connection line styles
export const connectionLineCompletedStyle = {
  stroke: "rgba(255, 215, 0, 0.8)",
  strokeWidth: 3,
  filter: "drop-shadow(0 0 3px rgba(255, 215, 0, 0.7))",
};