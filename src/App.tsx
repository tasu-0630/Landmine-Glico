import { useEffect, useRef } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { SetupPhase } from './components/SetupPhase';
import { JankenPhase } from './components/JankenPhase';
import { StairsBoard } from './components/StairsBoard';
import './App.css';

function App() {
  const {
    state,
    startGame,
    setMines,
    resolveMines,
    selectHand,
    selectSpecialSteps,
    checkMinesAndFinishTurn,
  } = useGameLogic();

  const logsEndRef = useRef<HTMLDivElement>(null);
  const phaseAreaRef = useRef<HTMLDivElement>(null);

  // ログが追加されたら自動スクロール
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.logs]);

  // UI状態（フェーズ、手番など）が進行したときに右上の欄を一番上にスクロール
  useEffect(() => {
    phaseAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.phase, state.p1Hand, state.p2Hand, state.currentTurn]);

  // 効果音再生
  useEffect(() => {
    if (state.soundEffect === 'boom') {
      // 本来は new Audio('boom.mp3').play() など
      console.log('🔊 ボオン！');
    } else if (state.soundEffect === 'buzzer') {
      // 本来は new Audio('buzzer.mp3').play() など
      console.log('🔊 ブィィィン');
    }
  }, [state.soundEffect]);

  const renderPhaseContent = () => {
    if (state.phase === 'TITLE') {
      return (
        <div className="title-container">
          <h2>ルール説明</h2>
          <div className="rules-text">
            <ul>
              <li><strong>「地雷グリコ」</strong>は2人用のジャンケンゲームです。</li>
              <li>「グー」で勝てば3段、「チョキ」「パー」で勝てば6段進みます。</li>
              <li>先に46段目（ゴール）に到達したプレイヤーの勝利です。</li>
              <li>ゲーム開始前に、各プレイヤーは0段目と46段目を除いた好きな3つの段に<strong>地雷</strong>を仕掛けます。（被った場合はその段だけ選び直します）</li>
              <li>相手の地雷を踏んでしまうと「ボオン！」と爆発し、10段下がるペナルティを受けます。踏まれた相手の地雷は消滅します。</li>
              <li>自分の地雷を踏んでも「ミス」となりペナルティはありません。自分が仕掛けた地雷は何度踏んでも残り続けます。</li>
              <li>同じ手による「あいこ」が5回以上連続した場合、ゴールに近いプレイヤーが3段か6段を選んで進むことができます。（同じ段なら先に着いた方が優先）</li>
            </ul>
          </div>
          <button className="btn primary-btn start-btn" onClick={startGame}>ゲーム開始！</button>
        </div>
      );
    }

    if (state.phase.startsWith('SETUP')) {
      return (
        <SetupPhase 
          state={state} 
          onSelectMines={setMines} 
          onResolveMines={resolveMines} 
        />
      );
    }

    if (state.phase.startsWith('JANKEN') || state.phase === 'ANIMATION' || state.phase === 'SPECIAL_DRAW_CHOICE') {
      return (
        <JankenPhase 
          state={state}
          onSelectHand={selectHand}
          onSelectSpecialSteps={selectSpecialSteps}
          onCheckMines={checkMinesAndFinishTurn}
        />
      );
    }

    if (state.phase === 'RESULT') {
      return (
        <div className="janken-container">
          <h2>🎉 {state.winner}P 優勝！ 🎉</h2>
          <div className="action-area">
            <button className="btn primary-btn" onClick={() => window.location.reload()}>もういちど遊ぶ</button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>地雷グリコ</h1>
      </header>
      
      <main className="game-main">
        {state.phase !== 'TITLE' && (
          <div className="left-panel">
            <StairsBoard state={state} key={`stairs-${state.p1Pos}-${state.p2Pos}`} />
          </div>
        )}
        
        <div className="right-panel" style={{ flex: state.phase === 'TITLE' ? 'none' : 1, width: state.phase === 'TITLE' ? '100%' : 'auto' }}>
          <div className="phase-area" ref={phaseAreaRef}>
            {renderPhaseContent()}
          </div>
          
          {state.phase !== 'TITLE' && (
            <div className="log-area">
              <h3>メッセージ</h3>
              <div className="log-list">
                {state.logs.map(log => (
                  <div key={log.id} className={`log-item log-${log.type}`}>
                    {log.text}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
