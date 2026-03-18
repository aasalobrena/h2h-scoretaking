type RegistrantId = number;
interface Person {
  registrantId: RegistrantId;
  name: string;
  wcaUserId: number;
  wcaId?: string | null;
  countryIso2: string;
  gender?: "m" | "f" | "o";
  birthdate?: string;
  email?: string;
  avatar?: Avatar | null;
  roles?: Role[];
  registration?: Registration | null;
  assignments?: Assignment[];
  personalBests?: PersonalBest[];
  extensions: Extension[];
}
