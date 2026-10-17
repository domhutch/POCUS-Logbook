import type { EncryptedBackupPayload } from "../domain/encrypted-backup";

/**
 * Transport contract for remote backup providers. Implementations only handle
 * opaque encrypted payloads; serialization, encryption, decryption, and restore
 * validation stay in the application backup service.
 */
export interface EncryptedBackupProvider<Authorization> {
  upload(
    authorization: Authorization,
    payload: EncryptedBackupPayload,
  ): Promise<{ modifiedAt?: string }>;
  downloadLatest(authorization: Authorization): Promise<{
    payload: EncryptedBackupPayload;
    name: string;
    modifiedAt?: string;
  }>;
}
