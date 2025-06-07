export const draggableNodeBaseStyle = "group absolute w-[120px] h-[180px] rounded-lg border-[3px] border-solid overflow-hidden cursor-grab origin-center shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-[box-shadow_0.2s_ease,transform_0.2s_ease] bg-[rgba(20,20,35,0.9)] select-none touch-none z-10 min-h-[180px] animate-[nodeAppear_0.3s_ease-out] hover:scale-[1.02] hover:shadow-[0_6px_15px_rgba(0,0,0,0.4)]";

export const startActorNodeStyle = "border-[5px] border-[gold] shadow-[0_4px_12px_rgba(255,215,0,0.7)]";

export const draggingNodeStyle = "shadow-[0_4px_20px_rgba(0,0,0,0.5)] scale(1.05)";
export const draggingTransitionOverrideStyle = "transition-none"; 

export const nodeContentWrapperStyle = "relative w-full h-full flex flex-col justify-center items-center pointer-events-none";

export const nodeImageContainerStyle = "flex-1 w-full overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.3)] h-auto min-h-[150px]";

export const nodeImageStyle = "w-full h-full block object-cover";

export const nodeImageFallbackStyle = "w-full h-full aspect-[2/3] bg-gray-700 text-white flex justify-center items-center text-2xl font-bold";

export const nodeNameOverlayStyle = "absolute bottom-0 left-0 right-0 p-[5px] bg-black/70 group-hover:bg-black/80 text-white text-xs font-semibold text-center whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 min-h-[20px] flex items-center justify-center";