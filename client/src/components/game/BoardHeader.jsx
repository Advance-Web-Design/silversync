import { useGameContext } from '../../contexts/gameContext';
import Menu from '../Menu';
import * as BoardHeaderStyles from '../../styles/BoardStyle.js';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const BoardHeader = () => {
  const {  
    gameStarted, 
    startActors, 
  } = useGameContext();
  const { isLightMode } = useTheme();
  return (
  <div >
    <header className={BoardHeaderStyles.gameHeaderStyle}>
      <Menu parentName={'BoardHeader'} />
      
      {/* Actor names display (if game started) */}
      {gameStarted && startActors && startActors[0] && startActors[1] && (
        <div className={BoardHeaderStyles.actorDisplayStyle}>
          <div className={BoardHeaderStyles.TextStyle}>CONNECT</div>
          <div className={BoardHeaderStyles.actorNameBaseStyle + " " + (isLightMode? BoardHeaderStyles.actorNameLightStyle : BoardHeaderStyles.actorNameDarkStyle)}>{startActors[0].name.toUpperCase()}</div>
          <div className={BoardHeaderStyles.TextStyle}>AND</div>
          <div className={BoardHeaderStyles.actorNameBaseStyle + " " + (isLightMode? BoardHeaderStyles.actorNameLightStyle : BoardHeaderStyles.actorNameDarkStyle)}>{startActors[1].name.toUpperCase()}</div>
        </div>
      )}
    </header>
  </div>
  );
};

export default BoardHeader;