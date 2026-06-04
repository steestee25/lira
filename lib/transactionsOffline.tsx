import { checkNetworkState } from '../hooks/useNetworkStatus';
import {
    addToSyncQueue,
    clearSyncQueueForTransaction,
    deleteTransactionOffline,
    getOfflineTransactionById,
    getOfflineTransactions,
    saveTransactionOffline,
} from './offlineStorage';

/**
 * Genera un UUID v4
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Inserisce una nuova transazione con supporto offline
 * Se offline: salva su SQLite e aggiunge a sync queue
 * Se online: salva su Supabase e SQLite
 */
export const createTransactionWithOfflineSupport = async (
  userId: string,
  name: string,
  category: string,
  amount: number,
  date: Date,
  onlineCreateFn: (userId: string, name: string, category: string, amount: number, date: Date) => Promise<any>
): Promise<any | null> => {
  try {
    // Verifica lo stato di rete
    const isOnline = await checkNetworkState();

    // Prepara il timestamp della data
    const storeDate = new Date(date.getTime());
    storeDate.setHours(12, 0, 0, 0);

    // Genera un UUID v4 valido
    const transactionId = generateUUID();

    // Prepara l'oggetto transazione
    const transactionData = {
      id: transactionId,
      user_id: userId,
      name,
      category,
      amount,
      date: storeDate.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isOnline) {
      console.log('🟢 ONLINE - Creazione transazione su Supabase...');
      // Salva su Supabase
      const result = await onlineCreateFn(userId, name, category, amount, date);

      if (result) {
        // Salva anche su SQLite per cache
        await saveTransactionOffline(result);
        console.log('✓ Transazione creata online e salvata in cache locale');
        return result;
      } else {
        // Se Supabase fallisce, salva offline e aggiungi a sync queue
        console.warn('⚠️  Creazione su Supabase fallita, salvataggio offline...');
        await saveTransactionOffline(transactionData);
        await addToSyncQueue(transactionId, 'create', transactionData);
        return transactionData;
      }
    } else {
      console.log('🔴 OFFLINE - Creazione transazione in cache locale...');
      // Salva su SQLite
      const success = await saveTransactionOffline(transactionData);

      if (success) {
        // Aggiungi a sync queue
        await addToSyncQueue(transactionId, 'create', transactionData);
        console.log('✓ Transazione salvata offline, sarà sincronizzata quando torni online');
        return transactionData;
      } else {
        console.error('❌ Errore nel salvataggio offline');
        return null;
      }
    }
  } catch (err) {
    console.error('Errore in createTransactionWithOfflineSupport:', err);
    return null;
  }
};

/**
 * Aggiorna una transazione con supporto offline
 */
export const updateTransactionWithOfflineSupport = async (
  transactionId: string,
  updates: {
    name?: string;
    category?: string;
    amount?: number;
    date?: Date;
  },
  onlineUpdateFn: (transactionId: string, updates: any) => Promise<any>
): Promise<any | null> => {
  try {
    const isOnline = await checkNetworkState();

    // Normalizza la data se presente
    const updateData: any = { ...updates };
    if (updates.date) {
      const dCopy = new Date(updates.date.getTime());
      dCopy.setHours(12, 0, 0, 0);
      updateData.date = dCopy.toISOString();
    }

    if (isOnline) {
      console.log('🟢 ONLINE - Aggiornamento transazione su Supabase...');
      // Aggiorna su Supabase
      const result = await onlineUpdateFn(transactionId, updateData);

      if (result) {
        // Aggiorna anche su SQLite
        await saveTransactionOffline(result);
        console.log('✓ Transazione aggiornata online');
        return result;
      } else {
        // Se Supabase fallisce, salva offline
        console.warn('⚠️  Aggiornamento su Supabase fallito, salvataggio offline...');
        await addToSyncQueue(transactionId, 'update', updateData);
        return null;
      }
    } else {
      console.log('🔴 OFFLINE - Aggiornamento transazione in cache locale...');
      // Salva su cache locale e restituisci l'oggetto aggiornato per UI immediata
      try {
        const existing = await getOfflineTransactionById(transactionId);
        const merged = existing
          ? { ...existing, ...updateData, updated_at: new Date().toISOString() }
          : { id: transactionId, ...updateData, updated_at: new Date().toISOString() };

        await saveTransactionOffline(merged);
        await addToSyncQueue(transactionId, 'update', updateData);
        console.log('✓ Transazione aggiornata offline (cache aggiornata), sarà sincronizzata quando torni online');
        return merged;
      } catch (err) {
        console.error("Errore durante l'update offline:", err);
        await addToSyncQueue(transactionId, 'update', updateData);
        return { id: transactionId, ...updateData } as any;
      }
    }
  } catch (err) {
    console.error('Errore in updateTransactionWithOfflineSupport:', err);
    return null;
  }
};

/**
 * Cancella una transazione con supporto offline
 */
export const deleteTransactionWithOfflineSupport = async (
  transactionId: string,
  onlineDeleteFn: (transactionId: string) => Promise<boolean>
): Promise<boolean> => {
  try {
    const isOnline = await checkNetworkState();

    if (isOnline) {
      console.log('🟢 ONLINE - Cancellazione transazione su Supabase...');
      // Cancella su Supabase
      const success = await onlineDeleteFn(transactionId);

      if (success) {
        // Cancella anche da SQLite
        await deleteTransactionOffline(transactionId);
        // Pulisci la sync queue
        await clearSyncQueueForTransaction(transactionId);
        console.log('✓ Transazione cancellata online');
        return true;
      } else {
        // Se Supabase fallisce, marca offline
        console.warn('⚠️  Cancellazione su Supabase fallita, salvataggio offline...');
        await addToSyncQueue(transactionId, 'delete', {});
        return false;
      }
    } else {
      console.log('🔴 OFFLINE - Cancellazione transazione in cache locale...');
      // Cancella dalla cache locale SUBITO
      await deleteTransactionOffline(transactionId);
      // Aggiungi a sync queue per sincronizzare la cancellazione quando online
      await addToSyncQueue(transactionId, 'delete', {});
      console.log('✓ Transazione cancellata offline, sarà sincronizzata quando torni online');
      return true;
    }
  } catch (err) {
    console.error('Errore in deleteTransactionWithOfflineSupport:', err);
    return false;
  }
};

/**
 * Fetch transazioni con fallback offline
 * Se online: recupera da Supabase
 * Se offline: recupera da SQLite
 */
export const fetchUserTransactionsWithOfflineSupport = async (
  userId: string,
  onlineFetchFn: (userId: string) => Promise<any[]>
): Promise<any[]> => {
  try {
    const isOnline = await checkNetworkState();

    if (isOnline) {
      console.log('🟢 ONLINE - Recupero transazioni da Supabase...');
      const remoteTransactions = await onlineFetchFn(userId);

      if (remoteTransactions && remoteTransactions.length > 0) {
        // Salva in SQLite come cache
        for (const tx of remoteTransactions) {
          await saveTransactionOffline(tx);
        }
        console.log('✓ Transazioni recuperate online e salvate in cache');
        return remoteTransactions;
      } else {
        // Se Supabase non ritorna nulla, usa cache offline
        console.warn('⚠️  Nessuna transazione da Supabase, usando cache offline...');
        const cachedTransactions = await getOfflineTransactions(userId);
        return cachedTransactions;
      }
    } else {
      console.log('🔴 OFFLINE - Recupero transazioni da cache locale...');
      const cachedTransactions = await getOfflineTransactions(userId);
      console.log(`✓ Recuperate ${cachedTransactions.length} transazioni dalla cache offline`);
      return cachedTransactions;
    }
  } catch (err) {
    console.error('Errore in fetchUserTransactionsWithOfflineSupport:', err);
    // Fallback a offline
    const cachedTransactions = await getOfflineTransactions(userId);
    return cachedTransactions;
  }
};
