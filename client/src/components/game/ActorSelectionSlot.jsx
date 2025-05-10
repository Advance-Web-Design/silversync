import React, { useState, useEffect, useRef } from 'react';
import ActorSearchInterface from './ActorSearchInterface';

const ActorSelectionSlot = ({
  index,
  isLoading,
  currentActorSearchResultsFromContext,
  onSelectActorCallback,
  searchPageNumFromContext,
  searchTotalPagesFromContext,
  onLoadMoreCallback,
  onRandomizeCallback,
  searchActorsCallback,
  updateSearchTermInContextCallback,
  initialSearchTermFromContext,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(initialSearchTermFromContext || '');
  const searchInputRef = useRef(null);
  const searchTimer = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (initialSearchTermFromContext !== localSearchTerm && !isFocused) {
      setLocalSearchTerm(initialSearchTermFromContext || '');
    }
  }, [initialSearchTermFromContext, isFocused, localSearchTerm]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setLocalSearchTerm(term);
    updateSearchTermInContextCallback(term, index);

    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (term.trim() !== '') {
        searchActorsCallback(term, index);
      }
    }, 500); // 500ms debounce
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      if (searchInputRef.current && searchInputRef.current.parentElement) {
        const searchResultsContainer = searchInputRef.current.parentElement.querySelector('.actor-search-results');
        if (searchResultsContainer && searchResultsContainer.contains(document.activeElement)) {
          return;
        }
      }
      setIsFocused(false);
    }, 150);
  };
  
  const handleSelectActor = (actorId) => {
    onSelectActorCallback(actorId, index);
    setLocalSearchTerm(''); 
    updateSearchTermInContextCallback('', index);
    setIsFocused(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  return (
    <ActorSearchInterface
      index={index} 
      isLoading={isLoading}
      localSearchTerm={localSearchTerm}
      onSearchChange={handleSearchChange}
      onInputFocus={handleInputFocus}
      onInputBlur={handleInputBlur}
      searchInputRef={searchInputRef}
      activeInputIndex={isFocused ? index : -1} 
      actorSearchResultsList={currentActorSearchResultsFromContext}
      onSelectActor={handleSelectActor}
      actorSearchPageNum={searchPageNumFromContext}
      actorSearchTotalPagesNum={searchTotalPagesFromContext}
      onLoadMore={() => onLoadMoreCallback(index)}
      onRandomize={() => onRandomizeCallback(index)}
    />
  );
};

export default ActorSelectionSlot;