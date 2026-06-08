export type CurveType = 'bezier' | 'straight' | 'step';

export interface Connection {
  id: string;
  sourceBlockId: string;
  sourcePointId: string;
  targetBlockId: string;
  targetPointId: string;
  curveType: CurveType;
  color: string;
  strokeWidth: number;
}
