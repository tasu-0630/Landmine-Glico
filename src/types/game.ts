export type Player = 1 | 2;
export type Hand = 'G' | 'C' | 'P'; // G: グー(3), C: チョキ(6), P: パー(6)

export const WIN_STEPS = {
  G: 3,
  C: 6,
  P: 6,
} as const;

export type GamePhase =
  | 'TITLE'               // ルール説明とゲーム開始前
  | 'SETUP_P1'            // P1が地雷を設置
  | 'SETUP_P2'            // P2が地雷を設置
  | 'SETUP_RESOLVE_P1'    // P1が被った数だけ再設定
  | 'SETUP_RESOLVE_P2'    // P2が被った数だけ再設定
  | 'JANKEN_P1'           // P1がじゃんけんの手を選択
  | 'JANKEN_P2'           // P2がじゃんけんの手を選択
  | 'ANIMATION'           // 勝敗結果や移動、地雷判定を表示するフェーズ
  | 'SPECIAL_DRAW_CHOICE' // 5連続あいこ時の段数選択フェーズ
  | 'RESULT';             // 勝敗決定後

export type LogMessage = {
  id: string;
  text: string;
  type: 'info' | 'effect' | 'alert' | 'success';
};

export type GameState = {
  phase: GamePhase;
  p1Pos: number;
  p2Pos: number;
  p1Mines: number[];
  p2Mines: number[];
  p1TempMines: number[];
  p2TempMines: number[];
  overlapMines: number[]; // 被った地雷の場所
  p1Hand: Hand | null;
  p2Hand: Hand | null;
  drawCount: number;
  lastDrawHand: Hand | null;
  p1ArrivalTurn: number;
  p2ArrivalTurn: number;
  currentTurn: number;
  logs: LogMessage[];
  winner: Player | null;
  soundEffect: 'boom' | 'buzzer' | null;
  specialWinner: Player | null;
  pendingP1Steps?: number;
  pendingP2Steps?: number;
  pendingP1ArrivalTurn?: number;
  pendingP2ArrivalTurn?: number;
};
