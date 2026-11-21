import { err, ok, type Result } from "./result.ts";

export interface ClaimState {
  /** Dispositivo que ya tomó este nombre, si alguno. */
  readonly ownerDeviceId: string | null;
  /** Participante que este dispositivo ya tomó en el mismo evento, si alguno. */
  readonly deviceParticipantId: string | null;
}

export type ClaimDecision = "claim" | "already_mine";
export type ClaimError = "name_taken" | "already_claimed";

/** Decide si un dispositivo puede tomar un nombre (RF-4, RF-5, RF-6). */
export const decideClaim =
  (deviceId: string, participantId: string) =>
  (state: ClaimState): Result<ClaimDecision, ClaimError> => {
    if (state.ownerDeviceId === deviceId) return ok("already_mine");
    if (state.ownerDeviceId !== null) return err("name_taken");
    if (state.deviceParticipantId !== null && state.deviceParticipantId !== participantId)
      return err("already_claimed");
    return ok("claim");
  };
