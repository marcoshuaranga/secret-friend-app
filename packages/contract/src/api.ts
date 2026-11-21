/** Formas de las respuestas de la API, compartidas por el Worker y la web. */

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "NAME_TAKEN"
  | "ALREADY_CLAIMED"
  | "NOT_CLAIMED"
  | "UNAUTHORIZED"
  | "TOO_MANY_ATTEMPTS";

export interface ApiError {
  readonly error: ApiErrorCode;
  readonly issues?: readonly { readonly path: string; readonly message: string }[];
}

export interface EventSummary {
  readonly id: string;
  readonly token: string;
  readonly name: string;
  readonly date: string | null;
  readonly budget: string | null;
}

export interface PublicParticipant {
  readonly id: string;
  readonly name: string;
  readonly taken: boolean;
}

export interface PublicEvent extends EventSummary {
  readonly participants: readonly PublicParticipant[];
  readonly me: { readonly participantId: string; readonly revealed: boolean } | null;
  readonly isAdmin: boolean;
}

export interface CreatedEvent {
  readonly id: string;
  readonly token: string;
}

export interface ClaimResult {
  readonly participantId: string;
}

export interface DrawResult {
  /** Mi amigo secreto. */
  readonly receiver: string;
  /** Los demás participantes (sin mí), para armar el carrete de la ruleta. */
  readonly others: readonly string[];
  /** `true` si ya lo había visto antes: entonces no se muestra la ruleta. */
  readonly alreadyRevealed: boolean;
}

export interface MyEvents {
  readonly created: readonly EventSummary[];
  readonly joined: readonly (EventSummary & { readonly participantName: string })[];
}

export interface RecoveryCandidate {
  readonly id: string;
  readonly name: string;
  readonly date: string | null;
}

export interface AdminParticipant {
  readonly id: string;
  readonly name: string;
  readonly claimed: boolean;
  readonly revealed: boolean;
}

export interface AdminView extends EventSummary {
  readonly participants: readonly AdminParticipant[];
  readonly expiresAt: number;
}
