interface RankingAdvancement {
  type: "ranking";
  level: number;
}
interface PercentAdvancement {
  type: "percent";
  level: number;
}
interface ResultAdvancement {
  type: "attemptResult";
  level: AttemptResult;
}
type AdvancementCondition =
  | RankingAdvancement
  | PercentAdvancement
  | ResultAdvancement;
