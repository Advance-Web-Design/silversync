///conection content Style
export const connectionsContentBaseStyle = "text-center overflow-y-auto px-1 sm:px-4 pb-1 sm:pb-4 max-h-[calc(100vh-100px)] sm:max-h-[calc(100vh-160px)]";
export const connectionsContentDarkStyle = "bg-[rgba(10,10,26,0.95)] text-white";
export const connectionsContentLightStyle = "bg-[rgba(255,255,255,0.5)] text-black";
//no-connection
export const noConnectionBaseStyle = "mx-auto p-2 sm:p-8 italic text-xs sm:text-base";
export const noConnectionDarkStyle = "text-[rgba(255,255,255,0.5)]";
export const noConnectionLightStyle = "text-[rgba(0,0,0,0.5)]";

////conection Item Style
export const connectionItemBaseStyle = "flex rounded-md p-1 sm:p-2 transition-all duration-200 ease-in-out border hover:scale-105 cursor-pointer";

// Dark mode
export const connectionItemDarkStyle = "bg-[rgba(0,0,0,0.2)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] text-white";
// Light mode
export const connectionItemLightStyle = "bg-[rgba(245,245,245,0.95)] border-[rgba(0,0,0,0.08)] hover:bg-[rgba(0,0,0,0.04)] text-black";

// Already on board
export const alreadyOnBoardDarkStyle = "bg-[rgba(255,215,0,0.05)] border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,255,255,0.05)]";
export const alreadyOnBoardLightStyle = " border-blue-700 hover:bg-[rgba(0,0,0,0.03)]";

export const connectionItemGuestAppearanceStyle = "border-l-2 sm:border-l-[3px] border-dashed border-l-[rgba(255,215,0,0.5)]";

export const connectionImageStyle = "w-6 h-[36px] sm:w-10 sm:h-[60px] mr-1 sm:mr-2 flex-shrink-0 rounded overflow-hidden relative";

export const connectionImageImgStyle = "w-full h-full object-cover";

export const guestBadgeStyle = "absolute top-0 right-0 bg-[rgba(255,215,0,0.8)] text-black text-[6px] sm:text-[8px] px-0.5 sm:px-1 py-0 sm:py-0.5 rounded-bl font-bold";

export const connectionInfoStyle = "flex-grow flex flex-col justify-between overflow-hidden";

export const connectionTitleStyle = "font-medium whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-[0.9rem]";

export const connectionDetailBaseStyle = "text-[10px] sm:text-[0.8rem] mt-0.5 sm:mt-[2px] mb-0.5 sm:mb-[6px] whitespace-nowrap overflow-hidden text-ellipsis";
export const connectionDetailDarkStyle = "text-[rgba(255,255,255,0.6)]";
export const connectionDetailLightStyle = "text-[rgba(0,0,0,0.6)]";

export const addConnectionButtonStyle = "bg-[rgba(46,204,113,0.2)] text-[rgba(46,204,113,0.9)] border border-[rgba(46,204,113,0.5)] rounded-[3px] py-0.5 px-0.5 sm:py-[3px] sm:px-1.5 text-[8px] sm:text-[11px] cursor-pointer transition-all duration-200 ease-in-out self-start mt-auto hover:bg-[rgba(46,204,113,0.3)] hover:text-[rgba(46,204,113,1)] hover:scale-110";

export const onBoardIndicatorBaseStyle = "mx-auto text-[8px] sm:text-[10px] py-0.5 px-0.5 sm:px-[5px] rounded-[3px] inline-block self-start mt-auto hover:scale-105 transition-transform duration-200 ease-in-out border";

export const onBoardIndicatorDarkStyle = "text-[rgba(255,215,0,0.8)] border-[rgba(255,215,0,0.5)] bg-[rgba(255,215,0,0.07)]";
export const onBoardIndicatorLightStyle = "text-black border-[rgba(180,140,0,0.25)] bg-[rgba(255,255,0,0.45)]";

///connection Section Style
export const connectionSectionStyle = "my-1 sm:my-4";

export const connectionSectionH3BaseStyle = "mb-1 sm:mb-3 text-xs sm:text-base border-b pb-0.5 sm:pb-1.5";
export const connectionSectionH3DarkStyle = "text-[rgba(255,255,255,0.9)] border-b border-[rgba(255,255,255,0.1)]";
export const connectionSectionH3LightStyle = "text-[rgba(0,0,0,0.85)] border-b border-[rgba(0,0,0,0.12)]";

export const connectionsGridStyle = "grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-1 sm:gap-3";

// connection panel style
export const connectionsPanelBaseStyle = "fixed top-[40px] sm:top-[60px] right-1 sm:right-[10px] w-[98vw] sm:w-[480px] max-w-[98vw] sm:max-w-[90vw] max-h-[calc(100vh-60px)] sm:max-h-[calc(100vh-100px)] rounded-lg z-[100] flex flex-col animate-slide-in shadow-[0_8px_24px_rgba(0,0,0,0.5)]";
export const connectionsPanelDarkStyle = "bg-[rgba(10,10,26,0.95)] border border-[rgba(255,215,0,0.4)] text-white";
export const connectionsPanelLightStyle = "bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.12)] text-black";

export const connectionsHeaderBaseStyle = "flex justify-between items-center py-1 sm:py-3 px-1.5 sm:px-4 sticky top-0 z-[2] rounded-t-lg border-b";
export const connectionsHeaderDarkStyle = "bg-[rgba(10,10,26,0.97)] border-b border-[rgba(255,215,0,0.2)]";
export const connectionsHeaderLightStyle = "bg-[rgba(255,255,255,0.5)] border-b border-black";

export const connectionsHeaderH2BaseStyle = "m-0 mx-auto text-sm sm:text-[1.2rem] whitespace-nowrap overflow-hidden text-ellipsis max-w-[80%] sm:max-w-[85%]";
export const connectionsHeaderH2DarkStyle = "text-[gold]";
export const connectionsHeaderH2LightStyle = "text-yellow-500";

export const closeButtonBaseStyle = "bg-transparent border-none text-lg sm:text-[22px] cursor-pointer p-0 w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ";
export const closeButtonDarkStyle = "text-white hover:bg-[rgba(255,255,255,0.1)] hover:text-white"; 
export const closeButtonLightStyle = "text-black hover:bg-[rgba(0,0,0,0.05)] hover:text-black";
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