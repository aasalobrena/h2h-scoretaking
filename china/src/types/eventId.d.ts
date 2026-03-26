type CurrentEventId =
  | "222"
  | "333"
  | "444"
  | "555"
  | "666"
  | "777"
  | "333bf"
  | "333fm"
  | "333oh"
  | "clock"
  | "minx"
  | "pyram"
  | "skewb"
  | "sq1"
  | "444bf"
  | "555bf"
  | "333mbf";
type DeprecatedEventId = "magic" | "mmagic" | "333mbo" | "333ft";
type EventId = CurrentEventId | DeprecatedEventId;
