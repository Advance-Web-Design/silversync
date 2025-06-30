export const draggableNodeBaseStyle = "group absolute w-[40px] h-[60px] sm:w-[60px] sm:h-[90px] md:w-[80px] md:h-[120px] lg:w-[100px] lg:h-[150px] rounded border sm:border-2 border-solid overflow-hidden cursor-grab origin-center shadow-[0_1px_4px_rgba(0,0,0,0.3)] sm:shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-[box-shadow_0.2s_ease,transform_0.2s_ease] bg-[rgba(20,20,35,0.9)] select-none touch-none z-10 animate-[nodeAppear_0.3s_ease-out] hover:scale-[1.02] hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)] sm:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]";

export const startActorNodeStyle = "border border-[gold] sm:border-2 sm:border-[gold] md:border-[3px] lg:border-[4px] shadow-[0_1px_6px_rgba(255,215,0,0.6)] sm:shadow-[0_2px_10px_rgba(255,215,0,0.6)]";

export const draggingNodeStyle = "shadow-[0_2px_12px_rgba(0,0,0,0.5)] scale(1.05)";
export const draggingTransitionOverrideStyle = "transition-none"; 

export const nodeContentWrapperStyle = "relative w-full h-full flex flex-col justify-center items-center pointer-events-none";

export const nodeImageContainerStyle = "flex-1 w-full overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.3)] sm:shadow-[0_1px_6px_rgba(0,0,0,0.3)] h-auto min-h-[45px] sm:min-h-[70px] md:min-h-[100px] lg:min-h-[120px]";

export const nodeImageStyle = "w-full h-full block object-cover";

export const nodeImageFallbackStyle = "w-full h-full aspect-[2/3] bg-gray-700 text-white flex justify-center items-center text-[8px] sm:text-sm md:text-lg lg:text-xl font-bold";

export const nodeNameOverlayStyle = "absolute bottom-0 left-0 right-0 p-0.5 sm:p-1 md:p-[3px] bg-black/70 group-hover:bg-black/80 text-white text-[6px] sm:text-[8px] md:text-[10px] font-semibold text-center whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 min-h-[10px] sm:min-h-[14px] md:min-h-[18px] flex items-center justify-center";

export const nodeTypeIndicatorStyle = "absolute top-0 right-0 sm:top-0.5 sm:right-0.5 md:top-1 md:right-1 bg-black/80 text-white text-[4px] sm:text-[6px] md:text-[8px] px-0.5 py-0 sm:px-0.5 sm:py-0.5 md:px-1 md:py-0.5 rounded font-bold";

export const nodeConnectionCountStyle = "absolute top-0 left-0 sm:top-0.5 sm:left-0.5 md:top-1 md:left-1 bg-blue-600/80 text-white text-[4px] sm:text-[6px] md:text-[8px] px-0.5 py-0 sm:px-0.5 sm:py-0.5 md:px-1 md:py-0.5 rounded-full font-bold min-w-[8px] sm:min-w-[12px] md:min-w-[16px] text-center";