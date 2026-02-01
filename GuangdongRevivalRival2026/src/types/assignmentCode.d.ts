type DefinedAssignmentCode =
  | "competitor"
  | "staff-judge"
  | "staff-scrambler"
  | "staff-runner"
  | "staff-dataentry"
  | "staff-announcer";
type AssignmentCode = DefinedAssignmentCode | string;
