import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import SyncStatus from "../../components/SyncStatus";
import TransactionModal from "../../components/TransactionModal";
import { styles } from "../../styles/home.styles";

import { useAuth } from '../../contexts/AuthContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useTranslation } from '../../lib/i18n';
import { supabase } from '../../lib/supabase';
import { syncWithSupabase } from '../../lib/syncOffline';
import { createTransaction, fetchExpensesByMonth, fetchIncomeByMonth, fetchUserTransactions, groupTransactionsByDay, updateTransaction } from '../../lib/transactions';
import { createTransactionWithOfflineSupport, fetchUserTransactionsWithOfflineSupport, updateTransactionWithOfflineSupport } from '../../lib/transactionsOffline';
import locales from '../../locales/locales.json';

import { COLORS } from '../../constants/color';
import { HORIZONTAL_GUTTER, RECAP_TOP } from '../../styles/spacing';

export default function Index() {

  const [selectedValue, setSelectedValue] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states (for update)
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingDayId, setEditingDayId] = useState(null);

  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [expenseData, setExpenseData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [filterType, setFilterType] = useState('expenses'); // 'expenses' | 'income'
  const [allTransactions, setAllTransactions] = useState([]); // Store all transactions
  const [isSyncing, setIsSyncing] = useState(false)

  const { session } = useAuth()
  const { isOnline, isLoading: networkLoading } = useNetworkStatus()

  const [profile, setProfile] = useState<any>(null);

  const { locale, t } = useTranslation();

  // categories loaded from locales.json (icon, color, label)
  const categoriesFromLocale: Record<string, any> = (locales as any)[locale]?.categories || {};
  const categoryIcons: Record<string, string> = Object.fromEntries(
    Object.entries(categoriesFromLocale).map(([k, v]) => [k, v.icon])
  );
  const categoryColors: Record<string, string> = Object.fromEntries(
    Object.entries(categoriesFromLocale).map(([k, v]) => [k, v.color])
  );
  const categoryLabels: Record<string, string> = Object.fromEntries(
    Object.entries(categoriesFromLocale).map(([k, v]) => [k, v.label])
  );
  // income categories (separate set)
  const incomeFromLocale: Record<string, any> = (locales as any)[locale]?.income || {};
  const incomeCategoryIcons: Record<string, string> = Object.fromEntries(
    Object.entries(incomeFromLocale).map(([k, v]) => [k, v.icon])
  );
  const incomeCategoryColors: Record<string, string> = Object.fromEntries(
    Object.entries(incomeFromLocale).map(([k, v]) => [k, v.color])
  );
  const incomeCategoryLabels: Record<string, string> = Object.fromEntries(
    Object.entries(incomeFromLocale).map(([k, v]) => [k, v.label])
  );

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.log('Error fetching profile:', error.message || error);
          return;
        }

        console.log('✓ Fetched profile:', data);
        setProfile(data || null);
      } catch (err) {
        console.log('Unexpected error fetching profile:', err);
      }
    };

    fetchProfile();
  }, [session]);

  // Fetch transactions on mount and when session user ID changes
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchTransactions = async () => {
      setIsLoadingTransactions(true);
      // Reset any selected chart month when reloading due to filter change
      setSelectedValue(null);
      setSelectedIndex(null);
      try {
        const transactions = await fetchUserTransactionsWithOfflineSupport(
          session.user.id,
          fetchUserTransactions
        );
        setAllTransactions(transactions);

        // Filtra transazioni in base a filterType
        const filteredTransactions = filterType === 'expenses'
          ? transactions.filter(t => t.amount < 0)
          : transactions.filter(t => t.amount > 0);

        const grouped = groupTransactionsByDay(filteredTransactions, categoryIcons, categoryColors, incomeCategoryIcons, incomeCategoryColors);
        setExpenseData(grouped);

        // Fetch dati del grafico in base a filterType
        const chartData = filterType === 'expenses'
          ? await fetchExpensesByMonth(session.user.id)
          : await fetchIncomeByMonth(session.user.id);

        const chartDataWithColors = chartData.map((item, index) => ({
          ...item,
          frontColor: selectedIndex === index ? '#ffffff' : '#8fe8e7ff',
        }));
        setChartData(chartDataWithColors);
      } catch (err) {
        console.error('Errore nel fetch delle transazioni:', err);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [session?.user?.id, filterType]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && !networkLoading && session?.user?.id && !isSyncing) {
      const performSync = async () => {
        setIsSyncing(true);
        try {
          const result = await syncWithSupabase(session.user.id);
          if (result.syncedCount > 0) {
            // Refresh transactions after sync
            const transactions = await fetchUserTransactionsWithOfflineSupport(
              session.user.id,
              fetchUserTransactions
            );
            setAllTransactions(transactions);
            const filteredTransactions = filterType === 'expenses'
              ? transactions.filter(t => t.amount < 0)
              : transactions.filter(t => t.amount > 0);
            const grouped = groupTransactionsByDay(filteredTransactions, categoryIcons, categoryColors, incomeCategoryIcons, incomeCategoryColors);
            setExpenseData(grouped);
            await refreshChart(session.user.id);
          }
        } catch (err) {
          console.error('Errore durante la sincronizzazione:', err);
        } finally {
          setIsSyncing(false);
        }
      };
      performSync();
    }
  }, [isOnline, networkLoading, session?.user?.id]);

  // Refresh chart helper (fetches monthly aggregates based on current filter)
  const refreshChart = async (userId) => {
    if (!userId) return;
    try {
      const chart = filterType === 'expenses'
        ? await fetchExpensesByMonth(userId)
        : await fetchIncomeByMonth(userId);

      const chartDataWithColors = chart.map((item, index) => ({
        ...item,
        frontColor: selectedIndex === index ? '#ffffff' : (index % 2 === 0 ? '#8fe8e7ff' : '#78ebe9ff'),
      }));
      setChartData(chartDataWithColors);
    } catch (err) {
      console.error('Errore aggiornamento grafico:', err);
    }
  };

  // Compute monthly aggregates from local transactions (last 6 months)
  const computeChartFromLocal = (transactions) => {
    try {
      const monthsData = {} as Record<string, number>;
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsData[monthKey] = 0;
      }

      (transactions || []).forEach((transaction) => {
        const amt = transaction.amount;
        const isMatch = filterType === 'expenses' ? amt < 0 : amt > 0;
        if (!isMatch) return;
        const txDate = new Date(transaction.date);
        const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthsData.hasOwnProperty(monthKey)) {
          monthsData[monthKey] += filterType === 'expenses' ? Math.abs(amt) : amt;
        }
      });

      const monthLabels = t('home.months');
      const chart = Object.entries(monthsData).map(([monthKey, total]) => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month) - 1;
        return { value: Math.round(total), label: monthLabels[monthIndex] }; 
      });

      const chartDataWithColors = chart.map((item, index) => ({
        ...item,
        frontColor: selectedIndex === index ? '#ffffff' : (index % 2 === 0 ? '#8fe8e7ff' : '#78ebe9ff'),
      }));
      setChartData(chartDataWithColors);
    } catch (err) {
      console.error('Errore nel calcolo grafico locale:', err);
    }
  };

  // Print user info for debugging
  console.log('User ID:', session?.user?.id)
  console.log('Email:', session?.user?.email)

  // Prepare chart data with alternating colors
  const data = chartData.length > 0 
    ? chartData.map((item, index) => ({
        ...item,
        frontColor: selectedIndex === index ? '#ffffff' : (index % 2 === 0 ? '#8fe8e7ff' : '#78ebe9ff'),
      }))
    : [
        { value: 0, label: 'No Data', frontColor: '#8fe8e7ff' },
      ];

  // Always sort days descending after updates
  const sortDaysDescending = (days) =>
    [...days].sort((a, b) => b.id - a.id);

  // ADD transaction
  const handleAddTransaction = async (newTransaction) => {
    if (!session?.user?.id) {
      console.error('User ID not available');
      return;
    }

    try {
      // Salva nel DB con supporto offline
      const savedTransaction = await createTransactionWithOfflineSupport(
        session.user.id,
        newTransaction.name,
        newTransaction.category,
        newTransaction.amount,
        newTransaction.date,
        createTransaction
      );

      if (!savedTransaction) {
        console.error('Errore nel salvataggio della transazione');
        return;
      }

      // Update local state
      const dayTimestamp = new Date(newTransaction.date);
      dayTimestamp.setHours(0, 0, 0, 0);
      const dayId = dayTimestamp.getTime();

      // Determine if this is income or expense based on amount sign
      const isIncome = savedTransaction.amount > 0;
      const currentIcons = isIncome ? incomeCategoryIcons : categoryIcons;
      const currentColors = isIncome ? incomeCategoryColors : categoryColors;

      const transactionWithUI = {
        ...savedTransaction,
        icon: currentIcons[savedTransaction.category] || '💰',
        color: currentColors[savedTransaction.category] || '#999999',
      };

      setExpenseData((prev) => {
        const existingDayIndex = prev.findIndex((day) => day.id === dayId);
        let updatedDays = [...prev];

        if (existingDayIndex >= 0) {
          updatedDays[existingDayIndex].transactions.unshift(transactionWithUI);
        } else {
          updatedDays.push({
            id: dayId,
            transactions: [transactionWithUI],
          });
        }

        return sortDaysDescending(updatedDays);
      });

      setModalVisible(false);
      // Update allTransactions and refresh chart
      setAllTransactions((prev) => [savedTransaction, ...(prev || [])]);
      setSelectedValue(null);
      setSelectedIndex(null);
      if (isOnline) {
        await refreshChart(session.user.id);
      } else {
        // Recompute chart locally including the newly saved offline transaction
        computeChartFromLocal([savedTransaction, ...(allTransactions || [])]);
      }
    } catch (err) {
      console.error('Errore in handleAddTransaction:', err);
    }
  };

  // EDIT transaction
  const handleEditTransaction = async (updatedTransaction) => {
    if (!updatedTransaction?.id) return;

    // Persist changes to DB first (con supporto offline)
    try {
      const saved = await updateTransactionWithOfflineSupport(
        updatedTransaction.id,
        {
          name: updatedTransaction.name,
          category: updatedTransaction.category,
          amount: updatedTransaction.amount,
          date: new Date(updatedTransaction.date),
        },
        updateTransaction
      );

      if (!saved) {
        console.error('Update DB failed');
        return;
      }

      // Build UI representation with icon/color
      const isIncome = saved.amount > 0;
      const icons = isIncome ? incomeCategoryIcons : categoryIcons;
      const colors = isIncome ? incomeCategoryColors : categoryColors;
      const savedWithUI = {
        ...saved,
        icon: icons[saved.category] || '💰',
        color: colors[saved.category] || '#999999',
      };

      const dayTimestamp = new Date(saved.date);
      dayTimestamp.setHours(0, 0, 0, 0);
      const newDayId = dayTimestamp.getTime();

      // Update local grouped state
      setExpenseData((prev) => {
        let updatedDays = [...prev];

        // Find old transaction location
        let oldDayIndex = -1;
        let transactionIndex = -1;

        updatedDays.forEach((day, dIndex) => {
          const tIndex = day.transactions.findIndex((t) => t.id === savedWithUI.id);
          if (tIndex !== -1) {
            oldDayIndex = dIndex;
            transactionIndex = tIndex;
          }
        });

        // If not found, just insert into correct day
        if (oldDayIndex === -1 || transactionIndex === -1) {
          const destDayIndex = updatedDays.findIndex((d) => d.id === newDayId);
          if (destDayIndex !== -1) {
            updatedDays[destDayIndex].transactions.unshift(savedWithUI);
          } else {
            updatedDays.push({ id: newDayId, transactions: [savedWithUI] });
          }
          return sortDaysDescending(updatedDays);
        }

        // Same day → replace
        if (updatedDays[oldDayIndex].id === newDayId) {
          updatedDays[oldDayIndex].transactions[transactionIndex] = savedWithUI;
          return sortDaysDescending(updatedDays);
        }

        // Date changed → remove from old day
        updatedDays[oldDayIndex].transactions.splice(transactionIndex, 1);
        if (updatedDays[oldDayIndex].transactions.length === 0) {
          updatedDays.splice(oldDayIndex, 1);
        }

        // Add to new day
        const newDayIndex = updatedDays.findIndex((d) => d.id === newDayId);
        if (newDayIndex !== -1) {
          updatedDays[newDayIndex].transactions.unshift(savedWithUI);
        } else {
          updatedDays.push({ id: newDayId, transactions: [savedWithUI] });
        }

        return sortDaysDescending(updatedDays);
      });

      // Update allTransactions cache
      setAllTransactions((prev) => (prev || []).map((t) => (t.id === savedWithUI.id ? savedWithUI : t)));

      // Reset selection and refresh chart (use local data when offline)
      setSelectedValue(null);
      setSelectedIndex(null);
      if (isOnline) {
        await refreshChart(session.user.id);
      } else {
        computeChartFromLocal((allTransactions || []).map((t) => (t.id === savedWithUI.id ? savedWithUI : t)));
      }

      setEditModalVisible(false);
    } catch (err) {
      console.error('Errore nell\'update della transazione:', err);
    }
  };

  const handleBarPress = async (item, index) => {
    try { await Haptics.selectionAsync(); } catch (e) {}
    if (selectedIndex === index) {
      // Se la stessa barra è cliccata, deseleziona
      setSelectedValue(null);
      setSelectedIndex(null);
    } else {
      // Seleziona nuova barra
      setSelectedValue(item.value);
      setSelectedIndex(index);
    }
  };

  const renderTransactionItem = ({ item: transaction, dayId }) => (
    <TouchableOpacity
      onPress={async () => {
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
        setEditingTransaction({ ...transaction, date: transaction.date || Number(dayId) });
        setEditingDayId(dayId);
        setEditModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: transaction.color + '20' }]}>
            <Text style={styles.transactionEmoji}>{transaction.icon}</Text>
          </View>
          <View>
            <Text style={styles.transactionName}>{transaction.name}</Text>
            <Text style={styles.transactionCategory}>
              {transaction.amount > 0 
                ? incomeCategoryLabels[transaction.category] || transaction.category
                : categoryLabels[transaction.category] || transaction.category}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            transaction.amount > 0 && { color: COLORS.green}
          ]}>
            {transaction.amount > 0 ? '+' : '−'}€{Math.abs(transaction.amount).toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Prepare greeting with translated text
  const greeting = t('home.greeting');
  const displayName = profile?.full_name || session?.user?.user_metadata?.full_name;
  const [beforeName, afterName] = greeting.split('{name}');

  const renderDaySection = ({ item: day }) => {
    const date = new Date(Number(day.id));

    // Convert timestamp string → Date → formatted string (localized)
    const localeTag = locale === 'it' ? 'it-IT' : 'en-GB';
    const formattedDate = date.toLocaleDateString(localeTag, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    
    // Capitalize first letter of month for better formatting
    const capitalizedDate = formattedDate.replace(/(\s)([a-z])/g, (match, space, letter) => space + letter.toUpperCase());

    // Get today's date (without time)
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const todayLabel = locale === 'it' ? 'Oggi' : 'Today';

    return (
      <View style={styles.daySection}>
        <Text style={styles.dayHeader}>{isToday ? todayLabel : capitalizedDate}</Text>
        {day.transactions.map((transaction) => (
          <View key={transaction.id}>
            {renderTransactionItem({ item: transaction, dayId: day.id })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.containerHeader}>
        <Text style={styles.textHelloMessage}>
          {beforeName}<Text style={{ fontWeight: "bold" }}>{displayName}</Text>{afterName}
        </Text>

        <View style={styles.iconSearch}>
          <Ionicons name="search-outline" size={26} color="#333" />
        </View>
      </View>

      {/* Sync Status Indicator */}
      <SyncStatus isOnline={isOnline} isSyncing={isSyncing} />

      {/* Expenses/Income selector */}
      <View style={{ flexDirection: 'row', marginTop: RECAP_TOP, marginHorizontal: HORIZONTAL_GUTTER, borderRadius: 35,
        backgroundColor: '#faf9f9ff', padding: 4 }}>
        <TouchableOpacity
          onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} ; setFilterType('expenses'); setSelectedValue(null); setSelectedIndex(null); }}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 35,
            backgroundColor: filterType === 'expenses' ? '#ffffff' : 'transparent',
            borderWidth: filterType === 'expenses' ? 0.5 : 0,
            borderColor: filterType === 'expenses' ? '#e0e0e0f1' : 'transparent',
          }}
        >
          <Text style={{ textAlign: 'center', 
            fontWeight: filterType === 'expenses' ? '600' : '400', color: COLORS.red }}>
            {t ? t('transactionModal.expense') : 'Expenses'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} ; setFilterType('income'); setSelectedValue(null); setSelectedIndex(null); }}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 35,
            backgroundColor: filterType === 'income' ? '#ffffff' : 'transparent',
            borderWidth: filterType === 'income' ? 0.5 : 0,
            borderColor: filterType === 'income' ? '#e0e0e0f1' : 'transparent',
          }}
        >
          <Text style={{ textAlign: 'center',
            fontWeight: filterType === 'income' ? '600' : '400', color: COLORS.green }}>
            {t ? t('transactionModal.income') : 'Income'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recapContainer}>
        <View style={styles.recapCard}>
          <View style={styles.recapCardExpensesContainer}>
            {(
              <Text style={styles.selectedValueText}>
                {selectedValue ? `${filterType === 'expenses' ? (t ? t('transactionModal.expense') : 'Expenses') : (t ? t('transactionModal.income') : 'Income')}: ${selectedValue}€` : (filterType === 'expenses' ? (t ? t('transactionModal.expense') : 'Expenses') : (t ? t('transactionModal.income') : 'Income'))}
              </Text>)}
          </View>
          <BarChart data={data} barBorderRadius={8} yAxisThickness={0} xAxisThickness={0} hideRules={true}
            hideYAxisText={true} noOfSections={1} height={125} xAxisLabelTextStyle={{ color: COLORS.white, fontWeight: 'bold' }} initialSpacing={10} onPress={handleBarPress} />
        </View>
      </View>

      <View style={styles.transactionsContainer}>
        <FlatList
          data={expenseData}
          renderItem={renderDaySection}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={{ alignItems: 'center' }}>
        {/* Add Transaction Modal */}
        <TransactionModal
          visible={modalVisible}
          mode="add"
          onCancel={() => setModalVisible(false)}
          onSave={handleAddTransaction}
          categoryIcons={categoryIcons}
          categoryColors={categoryColors}
          categoryLabels={categoryLabels}
          incomeCategoryIcons={incomeCategoryIcons}
          incomeCategoryColors={incomeCategoryColors}
          incomeCategoryLabels={incomeCategoryLabels}
        />
      </View>

      <View style={{ alignItems: 'center' }}>
        {/* Edit Transaction Modal */}
        <TransactionModal
          visible={editModalVisible}
          mode="edit"
          transaction={editingTransaction}
          onCancel={() => setEditModalVisible(false)}
          onSave={handleEditTransaction}
          categoryIcons={categoryIcons}
          categoryColors={categoryColors}
          categoryLabels={categoryLabels}
          incomeCategoryIcons={incomeCategoryIcons}
          incomeCategoryColors={incomeCategoryColors}
          incomeCategoryLabels={incomeCategoryLabels}
        />
      </View>

      {/* FAB Button */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        {/* FAB Assistente AI 
        <View style={[styles.fabButtonSmall, { marginBottom: 15 }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color={COLORS.white} />
        </View>*/}
        {/* FAB Add */}
        <TouchableOpacity
              style={styles.fabButton}
              onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch(e) {}; setModalVisible(true); }}
            >
          <Text>
            <Ionicons name="add" size={32} color={COLORS.white} />
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}