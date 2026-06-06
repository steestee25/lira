// components/TransactionModal.js
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from "react";
import { FlatList, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import DatePicker from "react-native-ui-datepicker";

import * as Haptics from 'expo-haptics';
import { COLORS } from "../constants/color";
import { useTranslation } from "../lib/i18n";
import styles from "../styles/components/transactionModal.styles";
export default function TransactionModal({
    visible,
    mode = "add",
    transaction = null,
    onSave,
    onDelete,
    onCancel,
    categoryIcons,
    categoryColors,
    categoryLabels,
    incomeCategoryIcons,
    incomeCategoryColors,
    incomeCategoryLabels,
}) {
    const { width } = useWindowDimensions();
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Clothing");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isIncome, setIsIncome] = useState(false); // true = income, false = expense

    const { t } = useTranslation();

    useEffect(() => {
        if (transaction) {
            setName(transaction.name);
            setCategory(transaction.category);
            setAmount(Math.abs(transaction.amount).toString());
            setDate(new Date(transaction.date || Date.now()));
            setIsIncome(transaction.amount > 0); // If amount is positive, it's an income
        } else {
            setName("");
            setCategory("Clothing");
            setAmount("");
            setDate(new Date());
            setIsIncome(false); // Default: expense
        }
        setShowDatePicker(false);
    }, [transaction, visible]);

    useEffect(() => {
        const currentIcons = isIncome ? (incomeCategoryIcons || {}) : (categoryIcons || {});
        const keys = Object.keys(currentIcons);
        if (keys.length === 0) return;
        if (!currentIcons[category]) {
            setCategory(keys[0]);
        }
    }, [isIncome, categoryIcons, incomeCategoryIcons]);

    const currentIcons = isIncome ? (incomeCategoryIcons || {}) : (categoryIcons || {});
    const currentColors = isIncome ? (incomeCategoryColors || {}) : (categoryColors || {});
    const currentLabels = isIncome ? (incomeCategoryLabels || {}) : (categoryLabels || {});

    const handleSave = () => {
        if (!name || !amount) return;

        const numAmount = parseFloat(amount);
        const signedAmount = isIncome ? numAmount : -numAmount; // Positivo se entrata, negativo se uscita

        const currentIcons = isIncome ? (incomeCategoryIcons || {}) : (categoryIcons || {});
        const currentColors = isIncome ? (incomeCategoryColors || {}) : (categoryColors || {});

        const prepared = {
            ...transaction,
            name,
            category,
            amount: signedAmount,
            icon: currentIcons[category] || currentIcons[Object.keys(currentIcons)[0]] || '💰',
            color: currentColors[category] || currentColors[Object.keys(currentColors)[0]] || '#999999',
            date,
        };

        onSave(prepared);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent statusBarTranslucent={true} onRequestClose={onCancel}>
            <View style={[styles.modalOverlay, Platform.OS === 'web' && { justifyContent: 'center', alignItems: 'center' }]}>
                <Pressable style={styles.overlayFill} onPress={onCancel} />
                <View style={[
                    styles.bottomSheet, 
                    showDatePicker && { paddingBottom: 5 },
                    Platform.OS === 'web' && { maxWidth: 768, width: '90%', marginHorizontal: 'auto' }
                ]}>
                    <View style={styles.topRow}>
                        <Text style={styles.sheetTitle}>{(t ? t(isIncome ? (mode === "add" ? 'transactionModal.addIncomeTitle' : 'transactionModal.editIncomeTitle') : (mode === "add" ? 'transactionModal.addTitle' : 'transactionModal.editTitle')) : (isIncome ? (mode === "add" ? 'Nuova entrata' : 'Modifica entrata') : (mode === "add" ? 'Nuova transazione' : 'Modifica transazione')))}</Text>
                        <View style={styles.iconClose}>
                            <TouchableOpacity onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { }; onCancel(); }}>
                                <Ionicons name="close" size={20} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: showDatePicker ? 8 : 20 }}>
                        {/* Expenses/Income selector */}
                        <View style={{
                            flexDirection: 'row', borderRadius: 35,
                            backgroundColor: '#f5f5f5', padding: 4, marginBottom: '5%',
                        }}>
                            <TouchableOpacity
                                onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { }; setIsIncome(false); }}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    paddingHorizontal: 12,
                                    borderRadius: 25,
                                    backgroundColor: !isIncome ? '#ffffff' : 'transparent',
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <Ionicons name="stats-chart" size={16} color={!isIncome ? '#03A7A3' : '#999999'} />
                                    <Text style={{
                                        textAlign: 'center',
                                        fontWeight: !isIncome ? '600' : '500', 
                                        color: !isIncome ? '#03A7A3' : '#999999',
                                        fontSize: 14,
                                    }}>
                                        {t ? t('transactionModal.expense') : 'Expenses'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { }; setIsIncome(true); }}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    paddingHorizontal: 12,
                                    borderRadius: 25,
                                    backgroundColor: isIncome ? '#ffffff' : 'transparent',
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <Ionicons name="wallet" size={16} color={isIncome ? '#03A7A3' : '#999999'} />
                                    <Text style={{
                                        textAlign: 'center',
                                        fontWeight: isIncome ? '600' : '500', 
                                        color: isIncome ? '#03A7A3' : '#999999',
                                        fontSize: 14,
                                    }}>
                                        {t ? t('transactionModal.income') : 'Income'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 15 }}>
                            <Text style={styles.amountLabel}>{t('transactionModal.namePlaceholder')}</Text>
                            <TextInput 
                                style={[styles.input, { marginTop: 6, marginBottom: 0 }]} 
                                placeholder={t('transactionModal.namePlaceholder')} 
                                value={name} 
                                onChangeText={setName} 
                            />
                        </View>

                        <Text style={styles.label}>{t('transactionModal.category')}</Text>
                        <FlatList
                            style={{ marginBottom: 15 }}
                            data={Object.keys(currentIcons)}
                            horizontal
                            nestedScrollEnabled={true}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.categorySquare,
                                        category === item && {
                                            borderColor: currentColors[item] || '#999999',
                                        },
                                    ]}
                                    onPress={async () => { try { await Haptics.selectionAsync(); } catch (e) { }; setCategory(item); }}
                                >
                                    <Text style={styles.categorySquareEmoji}>
                                        {currentIcons[item]}
                                    </Text>
                                    <Text style={[
                                        styles.categorySquareLabel,
                                        category === item && {
                                            color: currentColors[item] || '#999999',
                                        }
                                    ]}>
                                        {currentLabels?.[item] || item}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item}
                            showsHorizontalScrollIndicator={false}
                        />

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15 }}>
                            {/* Amount field */}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.amountLabel}>{t('transactionModal.amount')}</Text>
                                <View style={[styles.amountInputContainer, { marginTop: 6 }]}>
                                    <TextInput
                                        style={styles.amountInputField}
                                        placeholder="0"
                                        value={amount}
                                        onChangeText={(text) => {
                                            let filtered = text.replace(/[^0-9.]/g, '');
                                            const parts = filtered.split('.');
                                            if (parts.length > 2) {
                                                filtered = parts[0] + '.' + parts.slice(1).join('');
                                            }
                                            setAmount(filtered);
                                        }}
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.amountCurrency}>€</Text>
                                </View>
                            </View>

                            {/* Date field */}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.amountLabel}>{t('transactionModal.date')}</Text>
                                <TouchableOpacity 
                                    style={[styles.dateButton, { marginTop: 6 }]}
                                    onPress={async () => { try { await Haptics.selectionAsync(); } catch (e) { }; setShowDatePicker(true); }}
                                >
                                    <Ionicons name="calendar-outline" size={24} color="black" />
                                    <Text style={styles.dateButtonText}>{date.toLocaleDateString(t('transactionModal.dateLocale'))}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {showDatePicker && (
                            <DatePicker
                                mode="single"
                                date={date}
                                firstDayOfWeek={1}
                                onChange={({ date }) => {
                                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) { }
                                    setDate(date);
                                    setShowDatePicker(false);
                                }}
                                styles={{
                                    selected: {
                                        backgroundColor: "#b3f0f0ff",
                                        borderColor: "rgba(102, 235, 235, 1)",
                                        borderWidth: 1,
                                        borderRadius: 100,
                                    },
                                    selected_label: { color: "white", fontWeight: "bold" },
                                }}
                            />
                        )}
                    </ScrollView>

                    <View style={[styles.buttonContainer, showDatePicker && { marginTop: 6, marginBottom: 12 }, { flexDirection: 'row', gap: 12 }]}>
                        <TouchableOpacity
                            style={[styles.button, { flex: 4 }]}
                            onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) { }; handleSave(); }}
                        >
                            <Text style={styles.buttonText}>{mode === "add" ? t('transactionModal.add') : t('common.save')}</Text>
                        </TouchableOpacity>
                        {mode === "edit" && transaction && (
                            <TouchableOpacity
                                style={[styles.button, { flex: 0.8, backgroundColor: COLORS.red }]}
                                onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) { }; if (onDelete) onDelete(transaction); }}
                            >
                                <FontAwesome6 name="trash-can" size={24} color={COLORS.white} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}
