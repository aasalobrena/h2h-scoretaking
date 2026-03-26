interface Event {
  id: EventId;
  rounds: Round[];
  competitorLimit?: number | null;
  qualification?: Qualification | null;
  extensions: Extension[];
}
