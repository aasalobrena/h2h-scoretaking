interface RankingQualification {
  whenDate: string;
  type: "ranking";
  resultType: RankingType;
  level: number;
}
interface AttemptResultQualification {
  when: string;
  type: "attemptResult";
  resultType: RankingType;
  level: AttemptResult;
}
interface AnyResultQualificiation {
  when: string;
  type: "anyResult";
  resultType: RankingType;
  level: AttemptResult;
}
type Qualification =
  | RankingQualification
  | AttemptResultQualification
  | AnyResultQualificiation;
