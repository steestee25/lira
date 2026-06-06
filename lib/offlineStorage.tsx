import AsyncStorage from '@react-native-async-storage/async-storage';
import { DBTransaction } from './transactions';

const OFFLINE_TRANSACTIONS_KEY = 'offline_transactions';
const SYNC_QUEUE_KEY = 'sync_queue';

/**
 * Save a transaction offline, to be synced later when online
 */
export const saveTransactionOffline = async (
  transaction: DBTransaction
): Promise<boolean> => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
    const transactions = existing ? JSON.parse(existing) : {};
    
    transactions[transaction.id] = transaction;
    
    await AsyncStorage.setItem(
      OFFLINE_TRANSACTIONS_KEY,
      JSON.stringify(transactions)
    );
    
    console.log('✓ Transazione salvata offline:', transaction.id);
    return true;
  } catch (err) {
    console.error('Errore nel salvataggio offline:', err);
    return false;
  }
};

/**
 * Fetch all offline transactions for a given user
 */
export const getOfflineTransactions = async (userId: string): Promise<DBTransaction[]> => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
    if (!existing) return [];
    
    const transactions = JSON.parse(existing);
    const userTransactions = Object.values(transactions).filter(
      (tx: any) => tx.user_id === userId
    ) as DBTransaction[];
    
    return userTransactions;
  } catch (err) {
    console.error('Errore nel recupero transazioni offline:', err);
    return [];
  }
};

/**
 * Fetch a single offline transaction by ID
 */
export const getOfflineTransactionById = async (transactionId: string): Promise<DBTransaction | null> => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
    if (!existing) return null;

    const transactions = JSON.parse(existing);
    const tx = transactions[transactionId];
    return tx || null;
  } catch (err) {
    console.error('Errore nel recupero transazione offline per id:', err);
    return null;
  }
};

/**
 * Add an operation to the synchronization queue
 */
export const addToSyncQueue = async (
  transactionId: string,
  operation: 'create' | 'update' | 'delete',
  transactionData: any
): Promise<boolean> => {
  try {
    const existing = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    
    queue.push({
      id: `sync_${Date.now()}_${Math.random()}`,
      transactionId,
      operation,
      data: transactionData,
      createdAt: new Date().toISOString(),
    });
    
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    
    console.log(`✓ Operazione aggiunta a sync queue: ${operation}`);
    return true;
  } catch (err) {
    console.error('Errore nell\'aggiunta alla sync queue:', err);
    return false;
  }
};

/**
 * Fetch the synchronization queue
 */
export const getPendingSyncQueue = async (): Promise<any[]> => {
  try {
    const existing = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    
    console.log(`✓ Recuperate ${queue.length} operazioni pendenti`);
    return queue;
  } catch (err) {
    console.error('Errore nel recupero della sync queue:', err);
    return [];
  }
};

/**
 * Remove an item from the synchronization queue by its ID
 */
export const removeSyncQueueItem = async (queueItemId: string): Promise<boolean> => {
  try {
    const existing = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (!existing) return true;
    
    const queue = JSON.parse(existing);
    const filtered = queue.filter((item: any) => item.id !== queueItemId);
    
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    
    console.log('✓ Item rimosso da sync queue:', queueItemId);
    return true;
  } catch (err) {
    console.error('Errore nella rimozione da sync queue:', err);
    return false;
  }
};

/**
 * Delete an offline transaction by ID
 */
export const deleteTransactionOffline = async (transactionId: string): Promise<boolean> => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
    if (!existing) return true;
    
    const transactions = JSON.parse(existing);
    delete transactions[transactionId];
    
    await AsyncStorage.setItem(
      OFFLINE_TRANSACTIONS_KEY,
      JSON.stringify(transactions)
    );
    
    console.log('✓ Transazione eliminata offline:', transactionId);
    return true;
  } catch (err) {
    console.error('Errore nella cancellazione offline:', err);
    return false;
  }
};

/**
 * Clear the synchronization queue for a specific transaction (e.g., after successful sync)
 */
export const clearSyncQueueForTransaction = async (transactionId: string): Promise<boolean> => {
  try {
    const existing = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (!existing) return true;
    
    const queue = JSON.parse(existing);
    const filtered = queue.filter((item: any) => item.transactionId !== transactionId);
    
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    
    console.log('✓ Sync queue pulita per:', transactionId);
    return true;
  } catch (err) {
    console.error('Errore nella pulizia della sync queue:', err);
    return false;
  }
};
