import { useState, useCallback } from 'react';
import { GameState, Player, Hand, WIN_STEPS, LogMessage, GamePhase } from '../types/game';

const INITIAL_STATE: GameState = {
  phase: 'TITLE',
  p1Pos: 0,
  p2Pos: 0,
  p1Mines: [],
  p2Mines: [],
  p1TempMines: [],
  p2TempMines: [],
  overlapMines: [],
  p1Hand: null,
  p2Hand: null,
  drawCount: 0,
  lastDrawHand: null,
  p1ArrivalTurn: 0,
  p2ArrivalTurn: 0,
  currentTurn: 1,
  logs: [{ id: 'init', text: '1Pは地雷を3つ設置してください。(1〜45段)', type: 'info' }],
  winner: null,
  soundEffect: null,
  specialWinner: null,
};

const MAX_STEPS = 46;

export const useGameLogic = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const addLog = (text: string, type: LogMessage['type'] = 'info') => {
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, { id: Math.random().toString(36).substring(7), text, type }],
    }));
  };

  const setSound = (soundEffect: 'boom' | 'buzzer' | null) => {
    setState((prev) => ({ ...prev, soundEffect }));
  };

  const startGame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'SETUP_P1'
    }));
  }, []);

  const setMines = useCallback((player: Player, selectedMines: number[]) => {
    if (selectedMines.length !== 3) {
      addLog('地雷は必ず3つ選んでください。', 'alert');
      return;
    }

    setState((prev) => {
      if (player === 1) {
        return {
          ...prev,
          p1TempMines: selectedMines,
          phase: 'SETUP_P2',
          logs: [...prev.logs, { id: Date.now().toString(), text: '2Pは地雷を3つ設置してください。(1〜45段)', type: 'info' }]
        };
      } else {
        // P2が設置完了後、重複チェック
        const p1Set = new Set(prev.p1TempMines);
        const p2Set = new Set(selectedMines);
        const overlaps = [...p1Set].filter(x => p2Set.has(x));

        if (overlaps.length > 0) {
          // 被った地雷だけをTempから外し、被った数だけ再設定させる
          const newP1Temp = prev.p1TempMines.filter(m => !overlaps.includes(m));
          const newP2Temp = selectedMines.filter(m => !overlaps.includes(m));

          return {
            ...prev,
            p1TempMines: newP1Temp,
            p2TempMines: newP2Temp,
            overlapMines: overlaps,
            phase: 'SETUP_RESOLVE_P1',
            logs: [
              ...prev.logs,
              { id: Date.now().toString(), text: `【地雷かぶり！】 ${overlaps.join(', ')} 段目の設定が被りました！`, type: 'alert' },
              { id: Date.now().toString() + '1', text: `1Pは被った数(${overlaps.length}個)だけ選び直してください。`, type: 'info' }
            ]
          };
        }

        // 重複なしならゲーム開始
        return {
          ...prev,
          p1Mines: prev.p1TempMines,
          p2Mines: selectedMines,
          p1TempMines: [],
          p2TempMines: [],
          phase: 'JANKEN_P1',
          logs: [
            ...prev.logs,
            { id: Date.now().toString(), text: '地雷の設置が完了しました！', type: 'success' },
            { id: Date.now().toString() + '1', text: '1Pはじゃんけんの手を選んでください。', type: 'info' }
          ]
        };
      }
    });
  }, []);

  const resolveMines = useCallback((player: Player, selectedMines: number[]) => {
    setState((prev) => {
      const neededCount = prev.overlapMines.length;
      if (selectedMines.length !== neededCount) return prev;

      if (player === 1) {
        return {
          ...prev,
          p1TempMines: [...prev.p1TempMines, ...selectedMines],
          phase: 'SETUP_RESOLVE_P2',
          logs: [
            ...prev.logs,
            { id: Date.now().toString(), text: `2Pは被った数(${neededCount}個)だけ選び直してください。`, type: 'info' }
          ]
        };
      } else {
        const fullP1Mines = prev.p1TempMines;
        const fullP2Mines = [...prev.p2TempMines, ...selectedMines];

        // 再設定してもまた被った場合のチェック
        const p1Set = new Set(fullP1Mines);
        const p2Set = new Set(fullP2Mines);
        const newOverlaps = [...p1Set].filter(x => p2Set.has(x));

        if (newOverlaps.length > 0) {
          const newP1Temp = fullP1Mines.filter(m => !newOverlaps.includes(m));
          const newP2Temp = fullP2Mines.filter(m => !newOverlaps.includes(m));
          return {
            ...prev,
            p1TempMines: newP1Temp,
            p2TempMines: newP2Temp,
            overlapMines: newOverlaps,
            phase: 'SETUP_RESOLVE_P1',
            logs: [
              ...prev.logs,
              { id: Date.now().toString(), text: `【再度かぶり！】 ${newOverlaps.join(', ')} 段目の設定がまた被りました！`, type: 'alert' },
              { id: Date.now().toString() + '1', text: `1Pは被った数(${newOverlaps.length}個)だけ選び直してください。`, type: 'info' }
            ]
          };
        }

        return {
          ...prev,
          p1Mines: fullP1Mines,
          p2Mines: fullP2Mines,
          p1TempMines: [],
          p2TempMines: [],
          overlapMines: [],
          phase: 'JANKEN_P1',
          logs: [
            ...prev.logs,
            { id: Date.now().toString(), text: '地雷の設置が完了しました！', type: 'success' },
            { id: Date.now().toString() + '1', text: '1Pはじゃんけんの手を選んでください。', type: 'info' }
          ]
        };
      }
    });
  }, []);

  const processJankenLogic = useCallback((currentP1Hand: Hand, currentP2Hand: Hand) => {
    setState((prev) => {
      let newDrawCount = prev.drawCount;
      let newLastDrawHand = prev.lastDrawHand;
      let newLogs = [...prev.logs];

      const p1HandName = currentP1Hand === 'G' ? 'グー(3)' : currentP1Hand === 'C' ? 'チョキ(6)' : 'パー(6)';
      const p2HandName = currentP2Hand === 'G' ? 'グー(3)' : currentP2Hand === 'C' ? 'チョキ(6)' : 'パー(6)';
      newLogs.push({ id: Date.now().toString(), text: `【結果】1P: ${p1HandName} vs 2P: ${p2HandName}`, type: 'info' });

      // じゃんけん判定
      if (currentP1Hand === currentP2Hand) {
        // あいこ
        if (currentP1Hand === newLastDrawHand) {
          newDrawCount += 1;
        } else {
          newDrawCount = 1;
          newLastDrawHand = currentP1Hand;
        }
        newLogs.push({ id: Date.now().toString() + '1', text: `あいこです！（連続${newDrawCount}回目）`, type: 'info' });

        if (newDrawCount >= 5) {
          // 5回連続あいこ特別ルール
          newLogs.push({ id: Date.now().toString() + '2', text: '【特別ルール】同じ手で5回連続あいこになりました！', type: 'alert' });
          let specialWinner: Player | null = null;
          if (prev.p1Pos > prev.p2Pos) {
            specialWinner = 1;
          } else if (prev.p2Pos > prev.p1Pos) {
            specialWinner = 2;
          } else {
            specialWinner = prev.p1ArrivalTurn <= prev.p2ArrivalTurn ? 1 : 2;
          }
          newLogs.push({ id: Date.now().toString() + '3', text: `${specialWinner}Pの勝利です！進む段数(3or6)を選んでください。`, type: 'success' });
          return {
            ...prev,
            p2Hand: currentP2Hand,
            logs: newLogs,
            drawCount: 0,
            lastDrawHand: null,
            phase: 'SPECIAL_DRAW_CHOICE',
            specialWinner
          };
        }

        // 5回連続あいこ以外はここでANIMATIONへ
        return {
          ...prev,
          p2Hand: currentP2Hand,
          drawCount: newDrawCount,
          lastDrawHand: newLastDrawHand,
          logs: newLogs,
          phase: 'ANIMATION',
          pendingP1Steps: 0,
          pendingP2Steps: 0,
          pendingP1ArrivalTurn: prev.p1ArrivalTurn,
          pendingP2ArrivalTurn: prev.p2ArrivalTurn
        };
      } else {
        // 勝敗決着
        newDrawCount = 0;
        newLastDrawHand = null;
        let winner: Player | null = null;

        if (
          (currentP1Hand === 'G' && currentP2Hand === 'C') ||
          (currentP1Hand === 'C' && currentP2Hand === 'P') ||
          (currentP1Hand === 'P' && currentP2Hand === 'G')
        ) {
          winner = 1;
        } else {
          winner = 2;
        }

        const winHand = winner === 1 ? currentP1Hand : currentP2Hand;
        const steps = WIN_STEPS[winHand];

        newLogs.push({ id: Date.now().toString() + '1', text: `${winner}Pの勝ち！ ${steps}段進みます。`, type: 'success' });

        return {
          ...prev,
          p2Hand: currentP2Hand,
          drawCount: newDrawCount,
          lastDrawHand: newLastDrawHand,
          logs: newLogs,
          phase: 'ANIMATION',
          pendingP1Steps: winner === 1 ? steps : 0,
          pendingP2Steps: winner === 2 ? steps : 0,
          pendingP1ArrivalTurn: winner === 1 ? prev.currentTurn : prev.p1ArrivalTurn,
          pendingP2ArrivalTurn: winner === 2 ? prev.currentTurn : prev.p2ArrivalTurn
        };
      }
    });
  }, []);

  const selectHand = useCallback((player: Player, hand: Hand) => {
    setState((prev) => {
      if (player === 1) {
        return {
          ...prev,
          p1Hand: hand,
          phase: 'JANKEN_P2',
          logs: [...prev.logs, { id: Date.now().toString(), text: '2Pはじゃんけんの手を選んでください。', type: 'info' }]
        };
      } else {
        // P2が手を選んだ時点で、勝敗判定とログ出力を自動実行する
        setTimeout(() => processJankenLogic(prev.p1Hand!, hand), 0);
        return prev;
      }
    });
  }, [processJankenLogic]);

  const selectSpecialSteps = useCallback((steps: 3 | 6) => {
    setState((prev) => {
      if (prev.phase !== 'SPECIAL_DRAW_CHOICE' || !prev.specialWinner) return prev;

      return {
        ...prev,
        pendingP1Steps: prev.specialWinner === 1 ? steps : 0,
        pendingP2Steps: prev.specialWinner === 2 ? steps : 0,
        pendingP1ArrivalTurn: prev.specialWinner === 1 ? prev.currentTurn : prev.p1ArrivalTurn,
        pendingP2ArrivalTurn: prev.specialWinner === 2 ? prev.currentTurn : prev.p2ArrivalTurn,
        logs: [
          ...prev.logs,
          { id: Date.now().toString(), text: `${prev.specialWinner}Pが${steps}段進みました！`, type: 'info' }
        ],
        drawCount: 0,
        lastDrawHand: null,
        currentTurn: prev.currentTurn + 1,
        phase: 'ANIMATION' // この後UIで地雷判定へ
      };
    });
  }, []);

  const checkMinesAndFinishTurn = useCallback(() => {
    setState((prev) => {
      // 階段を上る移動を反映
      let newP1Pos = Math.min(prev.p1Pos + (prev.pendingP1Steps || 0), MAX_STEPS);
      let newP2Pos = Math.min(prev.p2Pos + (prev.pendingP2Steps || 0), MAX_STEPS);
      let newP1Arrival = prev.pendingP1ArrivalTurn || prev.p1ArrivalTurn;
      let newP2Arrival = prev.pendingP2ArrivalTurn || prev.p2ArrivalTurn;

      let newLogs = [...prev.logs];
      let soundToPlay: 'boom' | 'buzzer' | null = null;
      let newPhase: GamePhase = 'JANKEN_P1';
      let gameWinner: Player | null = null;
      
      let nextP1Mines = [...prev.p1Mines];
      let nextP2Mines = [...prev.p2Mines];

      // 1Pの地雷踏み判定 (移動があった場合のみ)
      if (prev.pendingP1Steps && prev.pendingP1Steps > 0) { 
        if (nextP2Mines.includes(newP1Pos)) {
            newLogs.push({ id: Date.now().toString() + 'p1m1', text: 'ボオン！ 1Pが相手の地雷を踏んでしまった！(被弾: 10段後退)', type: 'effect' });
            nextP2Mines = nextP2Mines.filter(m => m !== newP1Pos);
            newP1Pos = Math.max(0, newP1Pos - 10);
            soundToPlay = 'boom';
        } else if (nextP1Mines.includes(newP1Pos)) {
            newLogs.push({ id: Date.now().toString() + 'p1m2', text: 'ブィィィン 1Pが自身の地雷を踏んだ。(ミス: ペナルティなし)', type: 'effect' });
            if (!soundToPlay) soundToPlay = 'buzzer';
        }
      }

      // 2Pの地雷踏み判定 (移動があった場合のみ)
      if (prev.pendingP2Steps && prev.pendingP2Steps > 0) { 
        if (nextP1Mines.includes(newP2Pos)) {
            newLogs.push({ id: Date.now().toString() + 'p2m1', text: 'ボオン！ 2Pが相手の地雷を踏んでしまった！(被弾: 10段後退)', type: 'effect' });
            nextP1Mines = nextP1Mines.filter(m => m !== newP2Pos);
            newP2Pos = Math.max(0, newP2Pos - 10);
            soundToPlay = 'boom';
        } else if (nextP2Mines.includes(newP2Pos)) {
            newLogs.push({ id: Date.now().toString() + 'p2m2', text: 'ブィィィン 2Pが自身の地雷を踏んだ。(ミス: ペナルティなし)', type: 'effect' });
            if (!soundToPlay) soundToPlay = 'buzzer';
        }
      }

      // ゴール判定
      if (newP1Pos >= MAX_STEPS && newP2Pos >= MAX_STEPS) {
        if (newP1Arrival <= newP2Arrival) {
          gameWinner = 1;
          newLogs.push({ id: Date.now().toString() + 'w1', text: '1Pがゴールに到達しました！1Pの優勝！', type: 'success' });
        } else {
          gameWinner = 2;
          newLogs.push({ id: Date.now().toString() + 'w2', text: '2Pがゴールに到達しました！2Pの優勝！', type: 'success' });
        }
        newPhase = 'RESULT';
      } else if (newP1Pos >= MAX_STEPS) {
        gameWinner = 1;
        newPhase = 'RESULT';
        newLogs.push({ id: Date.now().toString() + 'w1', text: '1Pがゴールに到達しました！1Pの優勝！', type: 'success' });
      } else if (newP2Pos >= MAX_STEPS) {
        gameWinner = 2;
        newPhase = 'RESULT';
        newLogs.push({ id: Date.now().toString() + 'w2', text: '2Pがゴールに到達しました！2Pの優勝！', type: 'success' });
      } else {
        newLogs.push({ id: Date.now().toString() + 'next', text: '--- 次のターン ---', type: 'info' });
        newLogs.push({ id: Date.now().toString() + 'next2', text: '1Pはじゃんけんの手を選んでください。', type: 'info' });
      }

      return {
        ...prev,
        p1Pos: newP1Pos,
        p2Pos: newP2Pos,
        p1ArrivalTurn: newP1Arrival,
        p2ArrivalTurn: newP2Arrival,
        p1Mines: nextP1Mines,
        p2Mines: nextP2Mines,
        p1Hand: null,
        p2Hand: null,
        phase: newPhase,
        winner: gameWinner,
        logs: newLogs,
        soundEffect: soundToPlay,
        specialWinner: null,
        pendingP1Steps: 0,
        pendingP2Steps: 0,
        pendingP1ArrivalTurn: 0,
        pendingP2ArrivalTurn: 0
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    startGame,
    setMines,
    resolveMines,
    selectHand,
    selectSpecialSteps,
    checkMinesAndFinishTurn,
    setSound,
    resetGame,
  };
};
