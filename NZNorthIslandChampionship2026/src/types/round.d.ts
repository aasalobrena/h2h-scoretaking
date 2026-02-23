interface Round {
  id: ActivityCode;
  format: RoundFormat;
  timeLimit: TimeLimit | null;
  cutoff: Cutoff | null;
  advancementCondition: AdvancementCondition | null;
  results: Result[];
  scrambleSetCount?: number;
  scrambleSets?: ScrambleSet[];
  extensions: Extension[];
}
