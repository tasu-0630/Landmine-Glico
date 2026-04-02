import { useState } from 'react';
import { Player, GameState } from '../types/game';

interface Props {
  state: GameState;
  onSelectMines: (player: Player, mines: number[]) => void;
  onResolveMines: (player: Player, mines: number[]) => void;
}

export const SetupPhase = ({ state, onSelectMines, onResolveMines }: Props) => {
  const [selected, setSelected] = useState<number[]>([]);

  const isResolvingP1 = state.phase === 'SETUP_RESOLVE_P1';
  const isResolvingP2 = state.phase === 'SETUP_RESOLVE_P2';
  const isResolving = isResolvingP1 || isResolvingP2;

  const playerNum = (state.phase === 'SETUP_P1' || isResolvingP1) ? 1 : 2;
  const targetCount = isResolving ? state.overlapMines.length : 3;
  
  // すでに確定している地雷は選べないようにする
  const alreadySetMines = playerNum === 1 ? state.p1TempMines : state.p2TempMines;

  const handleToggle = (step: number) => {
    // 既に確定済みの段はクリック無効
    if (alreadySetMines.includes(step)) return;

    if (selected.includes(step)) {
      setSelected(selected.filter(n => n !== step));
    } else if (selected.length < targetCount) {
      setSelected([...selected, step]);
    }
  };

  const handleConfirm = () => {
    if (selected.length !== targetCount) return;
    
    if (isResolving) {
      onResolveMines(playerNum, selected);
    } else {
      onSelectMines(playerNum, selected);
    }
    setSelected([]);
  };

  return (
    <div className="setup-container">
      <h2>{isResolving ? `再設定フェーズ (${playerNum}P)` : `${playerNum}P 地雷設置`}</h2>
      <p>1〜45段の中で地雷を置きたい段を{targetCount}つ選んでください。</p>
      {isResolving && <p style={{color: '#ffcc00'}}>※被った段: {state.overlapMines.join(', ')}</p>}
      
      <div className="mine-selector">
        {Array.from({ length: 45 }, (_, i) => i + 1).map(step => {
          const isAlreadySet = alreadySetMines.includes(step);
          return (
            <button
              key={step}
              className={`step-btn ${selected.includes(step) ? 'selected' : ''} ${isAlreadySet ? 'disabled' : ''}`}
              onClick={() => handleToggle(step)}
              disabled={isAlreadySet}
              style={isAlreadySet ? { backgroundColor: '#222', borderColor: '#444', color: '#666', cursor: 'not-allowed' } : {}}
            >
              {step}
            </button>
          );
        })}
      </div>
      
      <div className="confirm-area">
        <p>選択中: {selected.join(', ') || 'なし'} ({selected.length}/{targetCount})</p>
        <button 
          onClick={handleConfirm} 
          disabled={selected.length !== targetCount}
          className="btn primary-btn"
        >
          決定
        </button>
      </div>
    </div>
  );
};
