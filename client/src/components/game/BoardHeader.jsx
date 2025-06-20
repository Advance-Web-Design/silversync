import { useGameContext } from '../../contexts/gameContext';
import Menu from '../Menu';
import * as BoardHeaderStyles from '../../styles/BoardStyle.js';

const BoardHeader = () => {
  const {  
    gameStarted, 
    startActors, 
  } = useGameContext();

  return (
  <div className={BoardHeaderStyles.backgroundStyle}>
    <header className={BoardHeaderStyles.gameHeaderStyle}>
      <Menu parentName={'BoardHeader'} />
      
      {/* Actor names display (if game started) */}
      {gameStarted && startActors && startActors[0] && startActors[1] && (
        <div className={BoardHeaderStyles.actorDisplayStyle}>
          <div className={BoardHeaderStyles.connectTextStyle}>CONNECT</div>
          <div className={BoardHeaderStyles.actorNameStyle}>{startActors[0].name.toUpperCase()}</div>
          <div className={BoardHeaderStyles.andTextStyle}>AND</div>
          <div className={BoardHeaderStyles.actorNameStyle}>{startActors[1].name.toUpperCase()}</div>
        </div>
      )}
    </header>
  </div>
  );
};

export default BoardHeader;