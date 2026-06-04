import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTranslation } from '../lib/i18n';
import locales from '../locales/locales.json';
import { styles } from '../styles/components/searchTransactions.styles';
import TransactionItem from './TransactionItem';
import TransactionModal from './TransactionModal';

type SearchTransactionsScreenProps = {
  visible: boolean;
  onClose: () => void;
  transactions: any[];
  categoryLabels: Record<string, string>;
  incomeCategoryLabels: Record<string, string>;
  categoryIcons: Record<string, string>;
  categoryColors: Record<string, string>;
  incomeCategoryIcons: Record<string, string>;
  incomeCategoryColors: Record<string, string>;
  onEditTransaction?: (transaction: any) => void;
  onSaveTransaction?: (transaction: any) => void;
  onDeleteTransaction?: (transaction: any) => void;
};

export default function SearchTransactionsScreen({
  visible,
  onClose,
  transactions = [],
  categoryLabels = {},
  incomeCategoryLabels = {},
  categoryIcons = {},
  categoryColors = {},
  incomeCategoryIcons = {},
  incomeCategoryColors = {},
  onEditTransaction,
  onSaveTransaction,
  onDeleteTransaction,
}: SearchTransactionsScreenProps) {
  const [searchEditingTransaction, setSearchEditingTransaction] = useState<any | null>(null);
  const [searchEditModalVisible, setSearchEditModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | null>(null);
  const { locale, t } = useTranslation();

  // Enrich transactions with icon and color
  const enrichedTransactions = transactions.map((tx: any) => {
    const isIncome = tx.amount > 0;
    const icons = isIncome ? incomeCategoryIcons : categoryIcons;
    const colors = isIncome ? incomeCategoryColors : categoryColors;
    
    return {
      ...tx,
      icon: icons[tx.category] || '💰',
      color: colors[tx.category] || '#999999',
    };
  });

  // Calculate available months
  const getAvailableMonths = () => {
    if (enrichedTransactions.length === 0) return [];
    
    const dates = enrichedTransactions.map(tx => new Date(tx.date));
    const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const oldestMonth = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
    const today = new Date();
    
    const months = [];
    let current = new Date(today.getFullYear(), today.getMonth(), 1);
    
    while (current >= oldestMonth) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth(),
      });
      current.setMonth(current.getMonth() - 1);
    }
    
    return months.reverse();
  };

  const availableMonths = getAvailableMonths();

  // Filter transactions based on search text and selected month
  let filteredTransactions = searchText.trim()
    ? enrichedTransactions.filter((tx) =>
        tx.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : enrichedTransactions;

  // Filter by selected month
  if (selectedMonth) {
    filteredTransactions = filteredTransactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === selectedMonth.year &&
             txDate.getMonth() === selectedMonth.month;
    });
  }

  // Group transactions by day
  const groupedByDay = filteredTransactions.reduce<Array<{ id: number; transactions: any[] }>>((acc, tx) => {
    const date = new Date(tx.date);
    date.setHours(0, 0, 0, 0);
    const dayId = date.getTime();

    const existing = acc.find((group) => group.id === dayId);
    if (existing) {
      existing.transactions.push(tx);
    } else {
      acc.push({
        id: dayId,
        transactions: [tx],
      });
    }
    return acc;
  }, []);

  // Sort days descending (most recent first)
  groupedByDay.sort((a, b) => b.id - a.id);

  const renderDaySection = ({ item: day }: { item: { id: number; transactions: any[] } }) => {
    const date = new Date(Number(day.id));
    const localeTag = locale === 'it' ? 'it-IT' : 'en-GB';
    const formattedDate = date.toLocaleDateString(localeTag, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const capitalizedDate = formattedDate.replace(/(\s)([a-z])/g, (match, space, letter) =>
      space + letter.toUpperCase()
    );

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const todayLabel = locale === 'it' ? 'Oggi' : 'Today';

    return (
      <View style={styles.daySection}>
        <Text style={styles.dayHeader}>{isToday ? todayLabel : capitalizedDate}</Text>
        <View style={styles.dayGroup}>
          {day.transactions.map((transaction: any, index: number) => (
            <View key={transaction.id}>
              <TransactionItem
                transaction={transaction}
                isGrouped={day.transactions.length > 1 && index < day.transactions.length - 1}
                showTime={true}
                locale={locale}
                categoryLabels={categoryLabels}
                incomeCategoryLabels={incomeCategoryLabels}
                onPress={() => {
                  if (onEditTransaction) {
                    onEditTransaction(transaction);
                  } else {
                    setSearchEditingTransaction(transaction);
                    setSearchEditModalVisible(true);
                  }
                }}
              />
            </View>
          ))}

          
        </View>
      </View>
    );
  };

  const handleSaveFromModal = (tx: any) => {
    if (onSaveTransaction) {
      onSaveTransaction(tx);
    }
    setSearchEditModalVisible(false);
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.container, Platform.OS === 'web' && { maxWidth: 768, width: '90%', alignSelf: 'center' }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={async () => {
              try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
              onClose();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t ? t('search.title') : 'Transazioni'}</Text>
          <View style={styles.placeholderButton} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t ? t('search.placeholder') : 'Cerca'}
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="done"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Month Selector */}
        {availableMonths.length > 0 && (
          <View style={styles.monthSelectorContainer}>
            <FlatList
              data={availableMonths}
              renderItem={({ item: month }) => {
                const monthNames = ((locales as any)[locale]?.home?.months as string[]) ||
                  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                
                const label = `${monthNames[month.month]} ${month.year}`;
                const isSelected = selectedMonth && 
                  selectedMonth.year === month.year && 
                  selectedMonth.month === month.month;

                return (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch (e) {}
                      setSelectedMonth(isSelected ? null : month);
                    }}
                    style={[
                      styles.monthButton,
                      isSelected && styles.monthButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.monthButtonText,
                      isSelected && styles.monthButtonTextActive
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => `${item.year}-${item.month}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthSelectorContent}
            />
          </View>
        )}

        {/* Transactions List */}
        <View style={styles.listContainer}>
          {groupedByDay.length > 0 ? (
            <FlatList
              data={groupedByDay}
              renderItem={renderDaySection}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {t ? t('search.noResults') : 'Nessuna transazione trovata'}
              </Text>
            </View>
          )}
        </View>
        {searchEditingTransaction && (
          <TransactionModal
            visible={searchEditModalVisible}
            mode="edit"
            transaction={searchEditingTransaction}
            onSave={handleSaveFromModal}
            onDelete={onDeleteTransaction}
            onCancel={() => setSearchEditModalVisible(false)}
            categoryIcons={categoryIcons}
            categoryColors={categoryColors}
            categoryLabels={categoryLabels}
            incomeCategoryIcons={incomeCategoryIcons}
            incomeCategoryColors={incomeCategoryColors}
            incomeCategoryLabels={incomeCategoryLabels}
          />
        )}
      </View>
    </Modal>
  );
}
