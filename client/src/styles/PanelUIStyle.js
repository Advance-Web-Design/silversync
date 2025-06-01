// This file contains the styles for the Panel UI component in a React application.

// It defines the styles for the panel that appears at the bottom of the screen,
export const panelUIStyle = "fixed bottom-2.5 left-0 right-0 w-[90%] mx-auto bg-[rgba(10,10,26,0.95)] border border-[rgba(255,215,0,0.3)] rounded-lg p-4 z-[100] shadow-[0_5px_20px_rgba(0,0,0,0.5)] text-white h-[70px] max-h-[70px] overflow-y-auto transition-all duration-300 ease-in-out";
//panel-ui-with-results
export const panelUIWithResultsStyle = "h-[300px] max-h-[300px]";
//search-form
export const searchFormStyle = "flex mb-4 mx-auto sticky w-[40%] top-0 bg-[rgba(10,10,26,0.95)] pb-2.5 z-[2]";
//in-game-search-input
export const searchInputStyle = "flex-grow px-2.5 py-2 border border-[rgba(255,255,255,0.2)] bg-[rgba(0,0,0,0.5)] text-white rounded-l-sm outline-none focus:border-[rgba(255,215,0,0.5)]";

//in-game-search-button
export const searchButtonBaseStyle = "bg-[rgba(255,215,0,0.8)] border-none text-black px-3 py-2 rounded-r-sm cursor-pointer font-bold transition-colors duration-200 ease-in-out";
export const searchButtonInteractiveStyle = "hover:enabled:bg-[gold] disabled:bg-[rgba(255,215,0,0.3)] disabled:cursor-not-allowed";
//combines the base and interactive styles for the search button
export const searchButtonStyle = `${searchButtonBaseStyle} ${searchButtonInteractiveStyle}`;


//in-game-search-no-results
export const searchNoResultsStyle = "text-center p-4 text-[rgba(255,255,255,0.7)] italic w-full";

//in-game-search-loading
export const searchLoadingStyle = "text-center text-[rgba(255,255,255,0.7)] my-4 italic";

//in-game-search-results
export const searchResultsStyle = "mt-2.5 flex flex-wrap gap-2.5 justify-start";

//in-game-search-result-item
// Base result item styles
export const resultItemBaseStyle = "flex  items-center p-1.5 bg-[rgba(0,0,0,0.2)] rounded border border-[rgba(255,255,255,0.1)] transition-colors duration-200 ease-in-out w-[calc(33.33%-10px)] min-w-[150px] flex-shrink-0";
// Hover state
export const resultItemHoverStyle = "hover:bg-[rgba(255,255,255,0.05)]";
// Exact match modifier
export const resultItemExactMatchStyle = "bg-[rgba(255,215,0,0.1)] border-l-[3px] border-l-[gold]";
// Can connect modifier
export const resultItemCanConnectStyle = "border-l-[3px] border-l-[rgba(46,204,113,0.7)]";
// Combined base style with hover
export const resultItemStyle = `${resultItemBaseStyle} ${resultItemHoverStyle}`;

//in-game-result-image
// Styles for the result image container
export const resultImageStyle = "w-[30px] h-[38px] mr-2 overflow-hidden rounded-sm flex-shrink-0";
// Image styles
export const resultImageImgStyle = "w-full h-full object-cover";

//in-game-result-info
export const resultInfoStyle = "flex-grow overflow-hidden text-sm";

// Result title
export const resultTitleStyle = "font-medium whitespace-nowrap overflow-hidden text-ellipsis";

//in-game-result-type
export const resultTypeStyle = "text-xs text-[rgba(255,255,255,0.6)]";

//in-game-add-button
export const addButtonStyle = "bg-[rgba(46,204,113,0.2)] text-[rgba(46,204,113,0.9)] border border-[rgba(46,204,113,0.5)] rounded-sm px-1.5 py-0.5 text-[11px] cursor-pointer transition-all duration-200 ease-in-out ml-1 hover:bg-[rgba(46,204,113,0.3)] hover:text-[rgba(46,204,113,1)]";


