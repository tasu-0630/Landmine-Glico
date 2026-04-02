import { useEffect, useRef } from 'react';
import { GameState } from '../types/game';

interface Props {
  state: GameState;
}

export const StairsBoard = ({ state }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 初回マウント時に一番下（0段目）までスクロールさせる
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // プレイヤー位置が変わったときに移動先が見えるようにスクロールする
  useEffect(() => {
    if (!containerRef.current) return;
    // 両プレイヤーの山側から上の位置（iの順序が山上からなので、位置が大きいほど上にある）
    // 両者の小さい方（階段が下の方）が見えるようにスクロール
    const lowerPos = Math.min(state.p1Pos, state.p2Pos);
    const totalSteps = 47; // 0-46
    // lowerPosが0のときは一番下までスクロール
    const scrollRatio = 1 - (lowerPos / (totalSteps - 1));
    const containerHeight = containerRef.current.scrollHeight - containerRef.current.clientHeight;
    containerRef.current.scrollTop = scrollRatio * containerHeight;
  }, [state.p1Pos, state.p2Pos]);

  const renderStairs = () => {
    const stairs = [];
    for (let i = 46; i >= 0; i--) {
      const isP1Here = state.p1Pos === i;
      const isP2Here = state.p2Pos === i;
      
      let mineIndicator = '';
      if (state.phase.startsWith('SETUP')) {
        if (state.phase === 'SETUP_P1' && state.p1TempMines.includes(i)) mineIndicator = '💣';
        if (state.phase === 'SETUP_P2' && state.p2TempMines.includes(i)) mineIndicator = '💣';
      } else {
        // 開発・デバッグ用途として自身の地雷を薄く表示するのもあり
        // プレイヤー切り替え制なので、画面には現在操作中の人のみ出すなどが理想
      }

      stairs.push(
        <div key={i} className={`stair-step ${i === 46 ? 'goal' : ''} ${i === 0 ? 'start' : ''}`}>
          <div className="step-number">{i === 0 ? 'スタート(0)' : i === 46 ? 'ゴール(46)' : i}</div>
          <div className="step-content">
            {isP1Here && <span className="player p1">1P</span>}
            {isP2Here && <span className="player p2">2P</span>}
            {/* 保留中の移動先をうすく表示することもできるが今回は指定通り押下後にのみ変える */}
            {mineIndicator && <span className="mine-icon">{mineIndicator}</span>}
          </div>
        </div>
      );
    }
    return stairs;
  };

  return (
    <div className="stairs-board">
      <div className="stairs-scroll-container" ref={containerRef}>
        {renderStairs()}
      </div>
    </div>
  );
};
