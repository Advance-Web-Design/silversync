
export const sidebarOverlayStyle = "fixed inset-0 w-full h-full bg-black/50 z-[1000] flex justify-end";

export const sidebarStyle = "w-[350px] h-full bg-white shadow-[-2px_0_5px_rgba(0,0,0,0.1)] animate-slideIn overflow-y-auto flex flex-col";

export const sidebarHeaderStyle = "flex justify-between items-center p-[15px] border-b border-[#eaeaea] bg-[#f8f8f8] sticky top-0 z-10";

export const sidebarHeaderH3Style = "m-0 text-lg text-[#333]"; // text-lg is 18px

export const closeBtnStyle = "bg-transparent border-none text-2xl cursor-pointer p-0 text-[#555] hover:text-black";

export const sidebarContentStyle = "p-[15px] flex-1 overflow-y-auto";

export const entityTypeSectionStyle = "mb-5 bg-[#f9f9f9] rounded-md overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1)]";

export const entityTypeSectionH4BaseStyle = "m-0 py-[10px] px-[15px] text-[#333] text-base font-bold border-b border-[#ddd]"; // text-base is 16px

// Specific H4 styles
export const entityTypeSectionH4PersonStyle = `${entityTypeSectionH4BaseStyle} bg-[#3f51b5] text-white`;
export const entityTypeSectionH4MovieStyle = `${entityTypeSectionH4BaseStyle} bg-[#e91e63] text-white`;
export const entityTypeSectionH4TvStyle = `${entityTypeSectionH4BaseStyle} bg-[#009688] text-white`;

export const searchEntitiesListStyle = "flex flex-col gap-2 p-[10px]";

export const searchEntityItemStyle = "flex items-center p-2 rounded bg-white transition-all duration-200 ease-in-out border-l-[3px] border-[#4caf50] cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_5px_rgba(0,0,0,0.1)] hover:bg-[#f0f8ff]";

export const searchEntityImageStyle = "w-[60px] h-[80px] mr-[10px] overflow-hidden flex-shrink-0 rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.2)]";

export const searchEntityImageImgStyle = "w-full h-full object-cover rounded-[3px]";

export const searchEntityInfoStyle = "flex-1";

export const searchEntityTitleStyle = "font-bold mb-[5px] text-[#333]";

export const searchEntityTypeStyle = "text-[0.9em] text-[#666] flex items-center";

export const guestTagStyle = "text-[#ff9800] ml-[5px]";

export const addToBoardButtonStyle = "bg-[#4caf50] text-white border-none py-[6px] px-3 rounded text-[0.9rem] cursor-pointer transition-colors duration-200 ml-[10px] hover:bg-[#3c9f40]";

export const searchEntitiesLoadingStyle = "flex justify-center items-center h-[100px] text-[#666]";

export const noEntitiesMessageStyle = "text-center p-[30px_15px] text-[#666] bg-[#f9f9f9] rounded-md mt-5";

export const noEntitiesMessagePStyle = "m-[5px_0]";

export const sourceNodeIndicatorStyle = "text-[0.8em] text-[#888] mt-[3px] italic";
