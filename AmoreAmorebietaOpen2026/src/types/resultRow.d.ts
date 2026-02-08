type EmptyResultRow = [number, number];
type FullResultRow = [number, number, RegistrantId, ...AttemptResult[]];
type ResultRow = EmptyResultRow | FullResultRow;
