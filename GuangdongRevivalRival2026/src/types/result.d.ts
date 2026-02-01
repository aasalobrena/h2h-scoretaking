interface Result {
  personId: RegistrantId;
  ranking: number | null;
  attempts: Attempt[];
  best: AttemptResult;
  average: AttemptResult;
}
