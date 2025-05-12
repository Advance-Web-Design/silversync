import { useGameContext } from '../../contexts/gameContext';
import Menu from '../Menu';

const BoardHeader = () => {
  const {  
    gameStarted, 
    startActors, 
  } = useGameContext();

  return (
    <header className="game-header">
      <Menu parentName={'BoardHeader'} />
      {/* Logo and title */}
      <div className="logo-container">
        <span className="star-logo">★</span>
        <h1 className="game-title">Connect the Shows</h1>
      </div>
      
      {/* Actor names display (if game started) */}
      {gameStarted && startActors && startActors[0] && startActors[1] && (
        <div className="actors-display">
          <div className="connect-text">CONNECT</div>
          <div className="actor-name">{startActors[0].name.toUpperCase()}</div>
          <div className="and-text">AND</div>
          <div className="actor-name">{startActors[1].name.toUpperCase()}</div>
        </div>
      )}
    </header>
  );
};

export default BoardHeader;