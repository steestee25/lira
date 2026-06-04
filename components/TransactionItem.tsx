import { Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/color';
import { styles } from '../styles/components/transactionItem.styles';

type TransactionItemProps = {
  transaction: any;
  isGrouped?: boolean;
  showTime?: boolean;
  locale?: string;
  categoryLabels?: Record<string, string>;
  incomeCategoryLabels?: Record<string, string>;
  onPress?: () => void;
};

export default function TransactionItem({
  transaction,
  isGrouped = false,
  showTime = false,
  locale = 'it',
  categoryLabels = {},
  incomeCategoryLabels = {},
  onPress,
}: TransactionItemProps) {
  const isIncome = transaction.amount > 0;
  const categoryLabel = isIncome
    ? incomeCategoryLabels[transaction.category] || transaction.category
    : categoryLabels[transaction.category] || transaction.category;

  const timeLabel = showTime
    ? new Date(transaction.date).toLocaleTimeString(locale === 'it' ? 'it-IT' : 'en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.transactionItem, isGrouped && styles.transactionItemGrouped]}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: transaction.color + '20' }]}> 
            <Text style={styles.transactionEmoji}>{transaction.icon}</Text>
          </View>
          <View style={styles.transactionContent}>
            <Text style={styles.transactionName}>{transaction.name}</Text>
            <Text style={styles.transactionCategory}>{categoryLabel}</Text>
            {timeLabel ? <Text style={styles.transactionTime}>{timeLabel}</Text> : null}
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, isIncome && { color: COLORS.green }]}> 
            {isIncome ? '+' : '−'}€{Math.abs(transaction.amount).toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
