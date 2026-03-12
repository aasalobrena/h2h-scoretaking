interface Competition {
    formatVersion: string;
    id: string;
    name: string;
    shortName: string;
    persons: Person[];
    events: Event[];
    schedule: Schedule;
    series: Series[];
    competitorLimit: number | null;
    extensions: Extension[];
    registrationInfo: RegistrationInfo;
}
