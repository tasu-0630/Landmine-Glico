import { useState } from 'react';
import { GameState, Hand, Player } from '../types/game';

interface Props {
  state: GameState;
  onSelectHand: (player: Player, hand: Hand) => void;
  onSelectSpecialSteps: (steps: 3 | 6) => void;
  onCheckMines: () => void;
}

export const JankenPhase = ({ state, onSelectHand, onSelectSpecialSteps, onCheckMines }: Props) => {
  const [selectedHand, setSelectedHand] = useState<Hand | null>(null);

  const isP1Turn = state.phase === 'JANKEN_P1';
  const isAnimation = state.phase === 'ANIMATION';
  const isSpecialDraw = state.phase === 'SPECIAL_DRAW_CHOICE';

  const currentPlayer = isP1Turn ? 1 : 2;

  const handleConfirmHand = () => {
    if (!selectedHand) return;
    onSelectHand(currentPlayer, selectedHand);
    setSelectedHand(null);
  };

  if (isSpecialDraw) {
    return (
      <div className="janken-container">
        <h2>特別ルール発動！</h2>
        <p>5回連続あいこ！ {state.specialWinner}Pは進む段数を選んでください。</p>
        <div className="special-choice">
          <button className="btn primary-btn" onClick={() => onSelectSpecialSteps(3)}>3段進む</button>
          <button className="btn primary-btn" onClick={() => onSelectSpecialSteps(6)}>6段進む</button>
        </div>
      </div>
    );
  }

  if (isAnimation) {


    const isP1Winner = (state.p1Hand === 'G' && state.p2Hand === 'C') ||
                       (state.p1Hand === 'C' && state.p2Hand === 'P') ||
                       (state.p1Hand === 'P' && state.p2Hand === 'G');
    const isDraw = state.p1Hand === state.p2Hand;

    return (
      <div className="janken-container">
        <h2>結果発表</h2>
        <div className="result-detail">
          {state.specialWinner ? (
            <p><strong>特別ルールより{state.specialWinner}Pの勝利です！進む段数({(state.pendingP1Steps ?? 0) > 0 ? state.pendingP1Steps : state.pendingP2Steps})を選択。</strong></p>
          ) : (
            <>
              <p>1P: {state.p1Hand === 'G' ? 'グー(3)' : state.p1Hand === 'C' ? 'チョキ(6)' : 'パー(6)'}</p>
              <p>2P: {state.p2Hand === 'G' ? 'グー(3)' : state.p2Hand === 'C' ? 'チョキ(6)' : 'パー(6)'}</p>
              <br/>
              {isDraw ? (
                <p><strong>あいこです！</strong></p>
              ) : (
                <p><strong>{isP1Winner ? '1P' : '2P'}の勝ち！</strong></p>
              )}
            </>
          )}
        </div>
        <div className="action-area">
          {state.winner ? (
            <p>ゲーム終了！</p>
          ) : (
            <button className="btn primary-btn" onClick={onCheckMines}>
              {isDraw && !state.specialWinner ? 'もう一度' : '階段を上る'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="janken-container">
      <h2>{currentPlayer}Pの手番</h2>
      <p>出す手を決めてください。</p>
      
      <div className="hands-selector">
        <button 
          className={`hand-btn ${selectedHand === 'G' ? 'selected' : ''}`} 
          onClick={() => setSelectedHand('G')}
        >
          ✊ グー (3)
        </button>
        <button 
          className={`hand-btn ${selectedHand === 'C' ? 'selected' : ''}`} 
          onClick={() => setSelectedHand('C')}
        >
          ✌️ チョキ (6)
        </button>
        <button 
          className={`hand-btn ${selectedHand === 'P' ? 'selected' : ''}`} 
          onClick={() => setSelectedHand('P')}
        >
          ✋ パー (6)
        </button>
      </div>

      <div className="confirm-area">
        <button 
          className="btn primary-btn" 
          onClick={handleConfirmHand} 
          disabled={!selectedHand}
        >
          決定
        </button>
      </div>
    </div>
  );
};
