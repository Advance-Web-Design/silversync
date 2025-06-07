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
      {/* Logo and title */}
      <div className={BoardHeaderStyles.logoContainerStyle}>
        <span className={BoardHeaderStyles.starLogoStyle}>★</span> 
        <h1 className={BoardHeader.gameTitleStyle}>Connect the Shows</h1>
      </div>
      
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