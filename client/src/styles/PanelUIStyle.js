
//export const panelUIStyle = "fixed bottom-2 sm:bottom-2.5 left-0 right-0 w-[95%] sm:w-[90%] mx-auto bg-[rgba(10,10,26,0.95)] border border-[rgba(255,215,0,0.3)] rounded-lg p-2 sm:p-4 z-[100] shadow-[0_5px_20px_rgba(0,0,0,0.5)] text-white h-[60px] sm:h-[70px] max-h-[60px] sm:max-h-[70px] overflow-y-auto transition-all duration-300 ease-in-out";
export const panelUIbaseStyle = "fixed bottom-2 sm:bottom-2.5 left-0 right-0 w-[95%] sm:w-[90%] mx-auto  border  rounded-lg p-2 sm:p-4 z-[100] shadow-[0_5px_20px_rgba(0,0,0,0.5)]  h-[60px] sm:h-[70px] max-h-[60px] sm:max-h-[70px] overflow-y-auto transition-all duration-300 ease-in-out";
export const panelUiLightStyle = "bg-[rgba(255,255,255,0.75)] border border-[rgba(0,0,0,0.1)] text-black shadow-[0_5px_20px_rgba(0,0,0,0.1)]";
export const panelUiDarkStyle = "bg-[rgba(10,10,26,0.95)] border border-[rgba(255,215,0,0.3)] text-white shadow-[0_5px_20px_rgba(0,0,0,0.5)]";
//panel-ui-with-results
export const panelUIWithResultsStyle = "h-[250px] sm:h-[300px] max-h-[250px] sm:max-h-[300px]";
//search-form
//export const searchFormStyle = "flex mb-2 sm:mb-4 mx-auto sticky w-full sm:w-[60%] md:w-[40%] top-0 bg-[rgba(10,10,26,0.95)] pb-2 sm:pb-2.5 z-[2]";
export const searchFormBaseStyle = "flex mb-2 sm:mb-4 mx-auto sticky w-full sm:w-[60%] md:w-[40%] top-0 z-[2]";
export const searchFormLightStyle = "bg-[rgba(255,255,255,0.75)]";
export const searchFormDarkStyle = "bg-[rgba(10,10,26,0.95)]";
//in-game-search-input
//export const searchInputStyle = "flex-grow px-2 py-1.5 sm:px-2.5 sm:py-2 border border-[rgba(255,255,255,0.2)] bg-[rgba(0,0,0,0.5)] text-white rounded-l-sm outline-none focus:border-[rgba(255,215,0,0.5)] text-sm sm:text-base";
export const searchInputBaseStyle = "flex-grow px-2 py-1.5 sm:px-2.5 sm:py-2 border border-[rgba(255,255,255,0.2)] bg-[rgba(0,0,0,0.5)]  rounded-l-sm outline-none focus:border-[rgba(255,215,0,0.5)] text-sm sm:text-base";
export const searchInputLightStyle = "bg-[rgba(255,255,255,0.9)] text-black border border-[rgba(0,0,0,0.1)] focus:border-[rgba(0,0,0,0.3)]";
export const searchInputDarkStyle = "bg-[rgba(10,10,26,0.95)] text-white border border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,215,0,0.5)]";

//in-game-search-button
export const searchButtonBaseStyle = "bg-[gold] border-none text-black px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-r-sm cursor-pointer font-bold transition-colors duration-200 ease-in-out text-sm sm:text-base";
export const searchButtonInteractiveStyle = "hover:enabled:bg-[rgba(255,215,0,0.8)] disabled:bg-[rgba(255,215,0,0.3)] disabled:cursor-not-allowed";
//combines the base and interactive styles for the search button
export const searchButtonStyle = `${searchButtonBaseStyle} ${searchButtonInteractiveStyle}`;


//in-game-search-no-results
export const searchNoResultsStyle = "text-center p-2 sm:p-4 text-[rgba(255,255,255,0.7)] italic w-full text-sm sm:text-base";

//in-game-search-loading
export const searchLoadingStyle = "text-center text-[rgba(255,255,255,0.7)] my-2 sm:my-4 italic text-sm sm:text-base";

//in-game-search-results
export const searchResultsStyle = "text-center mt-2 sm:mt-2.5 flex flex-wrap gap-1.5 sm:gap-2.5 justify-start";

//in-game-search-result-item
// Base result item styles
export const resultItemBaseStyle = "flex items-center p-1 sm:p-1.5 rounded border transition-colors duration-200 ease-in-out w-full sm:w-[calc(50%-5px)] md:w-[calc(33.33%-10px)] min-w-[140px] sm:min-w-[150px] flex-shrink-0";


export const resultItemDarkStyle = "bg-[rgba(0,0,0,0.2)] border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.05)]";
export const resultItemLightStyle = "bg-[rgba(255,255,255,0.8)] border-[rgba(0,0,0,0.08)] text-black hover:bg-[rgba(0,0,0,0.04)]";

// Exact match modifier
export const resultItemExactMatchStyle = "bg-[rgba(255,215,0,0.1)] border-l-2 sm:border-l-[3px] border-l-[gold]";
// Can connect modifier
export const resultItemCanConnectStyle = "border-l-2 sm:border-l-[3px] border-l-[rgba(46,204,113,0.7)]";

//in-game-result-image
// Styles for the result image container
export const resultImageStyle = "w-[24px] h-[30px] sm:w-[30px] sm:h-[38px] mr-1.5 sm:mr-2 overflow-hidden rounded-sm flex-shrink-0";
// Image styles
export const resultImageImgStyle = "w-full h-full object-cover";

//in-game-result-info
export const resultInfoStyle = "flex-grow overflow-hidden text-xs sm:text-sm";

// Result title
export const resultTitleStyle = "font-medium whitespace-nowrap overflow-hidden text-ellipsis";

//in-game-result-type
export const resultTypeStyle = "text-[10px] sm:text-xs";
export const resultTypeLightStyle = "text-[rgba(0,0,0,0.6)]";
export const resultTypeDarkStyle = "text-[rgba(255,255,255,0.6)]";

//in-game-add-button
export const addButtonBaseStyle = "border rounded-sm px-1 py-0.5 sm:px-1.5 text-[10px] sm:text-[11px] cursor-pointer transition-all duration-200 ease-in-out ml-1";
// Dark mode
export const addButtonDarkStyle = "bg-[rgba(46,204,113,0.2)] text-[rgba(46,204,113,0.9)] border-[rgba(46,204,113,0.5)] hover:bg-[rgba(46,204,113,0.3)] hover:text-[rgba(46,204,113,1)]";
// Light mode
export const addButtonLightStyle = "bg-[rgba(46,204,113,0.75)] text-gray-900 border-[rgba(46,204,113,0.3)] hover:bg-[rgba(46,204,113,0.45)] hover:text-gray-600";


