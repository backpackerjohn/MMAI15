import { db } from './firebase';
import { doc, writeBatch } from 'firebase/firestore';

/**
 * Performs a batched write to Firestore to save multiple pieces of user data at once.
 * @param userId - The ID of the authenticated user.
 * @param dataToMigrate - An object where keys are the document IDs (matching localStorage keys)
 *                        and values are the data to be stored.
 */
export const batchWriteLocalData = async (userId: string, dataToMigrate: Record<string, any>) => {
    if (!db) throw new Error("Firestore is not initialized.");

    const batch = writeBatch(db);

    for (const key in dataToMigrate) {
        const value = dataToMigrate[key];
        // Don't migrate null/undefined values, as they can cause issues.
        if (value !== null && value !== undefined) {
            // Each key from localStorage becomes a document in the user's `appData` collection.
            const docRef = doc(db, 'users', userId, 'appData', key);
            // The data is wrapped in a 'data' field for consistency and easier retrieval.
            batch.set(docRef, { data: value });
        }
    }

    // Commit all writes to Firestore as a single atomic operation.
    await batch.commit();
};