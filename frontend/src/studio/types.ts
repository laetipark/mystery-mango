export type ClassicGameType = 'GOMOKU' | 'REVERSI' | 'CHECKERS';
export type GameType = 'MURDER_MYSTERY' | 'TABLETOP' | 'YACHT' | ClassicGameType;
export const gameTypeNames: Record<GameType, string> = { MURDER_MYSTERY: '머더미스터리', TABLETOP: '자유 테이블', YACHT: '요트 주사위', GOMOKU: '자유 오목', REVERSI: '리버시', CHECKERS: '체커' };
export function isClassic(type: GameType): type is ClassicGameType {
  return type === 'GOMOKU' || type === 'REVERSI' || type === 'CHECKERS';
}
export const classicColors = { boardColor: '#d9ad6a', lightSquareColor: '#f4e4c1', darkSquareColor: '#486b46', firstPieceColor: '#242a27', secondPieceColor: '#fffaf0' };
export type Value = string | number | boolean | null | Value[] | { [key: string]: Value };
export type Data = { [key: string]: Value };
export interface CanvasNode {
  id: string;
  kind: 'TEXT' | 'IMAGE' | 'RECT' | 'ELLIPSE' | 'MATERIAL';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  text: string;
  fontSize: number;
  assetId: string | null;
  locked: boolean;
  hidden: boolean;
  bindingType: 'NONE' | 'ROLE' | 'CLUE' | 'TARGET';
  bindingId: string;
}
export interface Scene {
  id: string;
  name: string;
  kind?: 'SCENE' | 'ROLE' | 'CLUE';
  referenceId?: string;
  phaseIds?: string[];
  width: number;
  height: number;
  background: string;
  bgmAssetId: string | null;
  nodes: CanvasNode[];
}
export interface CardLayoutNode {
  id: string;
  kind: 'TEXT' | 'IMAGE' | 'RECT' | 'ELLIPSE';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill?: string;
  text?: string;
  fontSize?: number;
  assetId?: string | null;
  locked?: boolean;
  hidden?: boolean;
}
export interface CardDesign {
  width: number;
  height: number;
  background: string;
  nodes: Omit<CardLayoutNode, 'id' | 'locked' | 'hidden'>[];
}
export type CardFaceDesign = CardDesign;
export interface CardLayout {
  id: string;
  name: string;
  width: number;
  height: number;
  front: { background: string; nodes: CardLayoutNode[] };
  back: { background: string; nodes: CardLayoutNode[] };
}
export interface TableCardDefinition {
  id: string;
  name: string;
  text: string;
  assetId?: string | null;
  layoutId?: string | null;
}
export interface TableObjectDefinition extends TableCardDefinition {
  kind: 'CARD' | 'TOKEN' | 'DICE' | 'COUNTER';
  backAssetId?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
  faceUp: boolean;
  sides?: number;
  value?: number;
}
export interface TableDeckDefinition {
  id: string;
  name: string;
  backAssetId?: string | null;
  backLayoutId?: string | null;
  x: number;
  y: number;
  cards: TableCardDefinition[];
}
export interface TableDefinition {
  objects: TableObjectDefinition[];
  decks: TableDeckDefinition[];
}
export interface Document extends Record<string, unknown> {
  gameType: GameType;
  engineId: string;
  title: string;
  slug: string;
  supportedPlayerCounts: number[];
  presentation: { scenes: Scene[]; cardLayouts?: CardLayout[] };
  tabletop?: TableDefinition;
}
export interface Work {
  id: string;
  scenarioId: string;
  revision: number;
  document: Document;
  versions: { id: string; version: number; status: string; reviewStatus?: string; reviewNote?: string }[];
  updatedAt: string;
}
export interface StarterTemplate {
  id: string;
  blank: boolean;
  title: string;
  description: string;
  gameType: GameType;
  playerCounts: number[];
  customizable: string[];
  rulesSummary: string;
}
export interface Asset {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}
export interface Issue {
  path: string;
  code: string;
  message: string;
  severity: string;
}
export interface BoardObject {
  faceDesign?: CardDesign;
  id: string;
  kind: 'CARD' | 'TOKEN' | 'DICE' | 'COUNTER';
  name?: string;
  text?: string;
  assetId?: string | null;
  backAssetId?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
  faceUp: boolean;
  ownerSeat: number | null;
  sides?: number;
  value?: number;
}
export interface TableState {
  objects: BoardObject[];
  decks: { id: string; name: string; backAssetId?: string | null; backDesign?: CardDesign; x: number; y: number; count: number }[];
  hands: { seat: number; count: number }[];
  turnSeat: number;
  finished: boolean;
}
export interface YachtState {
  appearance?: { diceColor: string; pipColor: string; scoreboardColor: string };
  dice: number[];
  held: boolean[];
  rollsRemaining: number;
  turnSeat: number;
  scores: { seat: number; categories: Record<string, number | null>; upperTotal: number; bonus: number; rank?: number | null; forfeited?: boolean; total: number }[];
  availableScores: Record<string, number>;
  finished: boolean;
  winners: number[];
}
export interface ClassicState {
  turnSeat: number;
  finished: boolean;
  activeSeats: number[];
  board: number[][];
  legalMoves: { fromRow?: number; fromCol?: number; row: number; col: number }[];
  winners: number[];
  draw: boolean;
  endReason: string | null;
  forcedFrom: { row: number; col: number } | null;
  counts: number[];
  appearance: typeof classicColors;
}
export interface SceneState {
  scene: Scene | null;
  availableScenes: { id: string; name: string }[];
  canChangeScene?: boolean;
  layouts: Scene[];
}
export interface BoardSnapshot extends SceneState {
  abortVotes?: number;
  abortRequired?: number;
  canRequestAbort?: boolean;
  resultKind?: string;
  id: string;
  gameType: GameType;
  status: string;
  stateVersion: number;
  serverTime: string;
  participants: { userId: string; displayName: string; seat: number; active: boolean }[];
  mySeat: number;
  hostId: string;
  state: TableState | YachtState | ClassicState;
}
export interface SandboxSnapshot extends SceneState {
  id: string;
  gameType: GameType;
  stateVersion: number;
  seat: number;
  capacity?: number;
  state: TableState | YachtState | ClassicState | Data;
}
export type SendAction = (type: string, payload?: Record<string, unknown>) => Promise<void>;
export function assetUrl(id: string, context?: { gameId?: string; sandboxId?: string }) {
  return `/api/v1/assets/${encodeURIComponent(id)}${context ? `?${new URLSearchParams(context)}` : ''}`;
}
