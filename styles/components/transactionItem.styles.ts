import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  transactionItem: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 4,
  },
  transactionItemGrouped: {
    marginBottom: '5%',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionContent: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: '#ccc',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
});
