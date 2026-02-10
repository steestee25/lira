// components/TransactionModal.js
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
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
    onCancel,
    categoryIcons,
    categoryColors,
    categoryLabels,
    incomeCategoryIcons,
    incomeCategoryColors,
    incomeCategoryLabels,
}) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Clothing");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isIncome, setIsIncome] = useState(false); // true = entrata, false = uscita

    const { t } = useTranslation();

    useEffect(() => {
        if (transaction) {
            setName(transaction.name);
            setCategory(transaction.category);
            setAmount(Math.abs(transaction.amount).toString());
            setDate(new Date(transaction.date || Date.now()));
            setIsIncome(transaction.amount > 0); // Se amount è positivo, è un'entrata
        } else {
            setName("");
            setCategory("Clothing");
            setAmount("");
            setDate(new Date());
            setIsIncome(false); // Default: uscita
        }
        setShowDatePicker(false);
    }, [transaction, visible]);

    // Quando cambia isIncome o cambiano le mappe delle categorie, assicuriamoci
    // che la categoria selezionata esista nel set corrente; altrimenti selezioniamo il primo.
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
            <View style={styles.modalOverlay}>
                <Pressable style={styles.overlayFill} onPress={onCancel} />
                <View style={[styles.bottomSheet, showDatePicker && { paddingBottom: 5 }] }>
                    {/* Top row: small x */}
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
                            backgroundColor: '#faf9f9ff', padding: 4, marginBottom: 5
                        }}>
                            <TouchableOpacity
                                onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { }; setIsIncome(false); }}
                                style={{
                                    flex: 1,
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    borderRadius: 35,
                                    backgroundColor: !isIncome ? '#ffffff' : 'transparent',
                                    borderWidth: !isIncome ? 0.5 : 0,
                                    borderColor: !isIncome ? '#e0e0e0f1' : 'transparent',
                                }}
                            >
                                <Text style={{
                                    textAlign: 'center',
                                    fontWeight: !isIncome ? '600' : '400', color: COLORS.red
                                }}>
                                    {t ? t('transactionModal.expense') : 'Expenses'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { }; setIsIncome(true); }}
                                style={{
                                    flex: 1,
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    borderRadius: 35,
                                    backgroundColor: isIncome ? '#ffffff' : 'transparent',
                                    borderWidth: isIncome ? 0.5 : 0,
                                    borderColor: isIncome ? '#e0e0e0f1' : 'transparent',
                                }}
                            >
                                <Text style={{
                                    textAlign: 'center',
                                    fontWeight: isIncome ? '600' : '400', color: COLORS.green
                                }}>
                                    {t ? t('transactionModal.income') : 'Income'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput style={styles.input} placeholder={t('transactionModal.namePlaceholder')} value={name} onChangeText={setName} />

                        <Text style={styles.label}>{t('transactionModal.category')}</Text>
                        <FlatList
                            style={{ marginBottom: 15 }}
                            data={Object.keys(currentIcons)}
                            horizontal
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.categoryItem,
                                        category === item && {
                                            backgroundColor: (currentColors[item] || '#999999') + 45,
                                            borderColor: (currentColors[item] || '#999999') + 90,
                                        },
                                    ]}
                                    onPress={async () => { try { await Haptics.selectionAsync(); } catch (e) { }; setCategory(item); }}
                                >
                                    <Text style={[{ fontSize: 14, color: "#333" }, category === item && styles.categoryItemSelected]}>
                                        {currentIcons[item]} {currentLabels?.[item] || item}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item}
                            showsHorizontalScrollIndicator={false}
                        />

                        <View style={styles.amountRow}>
                            <Text style={styles.amountLabel}>{t('transactionModal.amount')}</Text>
                            <TextInput
                                style={styles.amountInput}
                                placeholder="€"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={{ marginBottom: 5 }}>
                            <View style={styles.dateRow}>
                                <Text style={styles.amountLabel}>{t('transactionModal.date')}</Text>
                                <TouchableOpacity style={styles.dateButton} onPress={async () => { try { await Haptics.selectionAsync(); } catch (e) { }; setShowDatePicker(true); }}>
                                    <Text style={styles.dateButtonText}>{date.toLocaleDateString(t('transactionModal.dateLocale'))}</Text>
                                </TouchableOpacity>
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
                        </View>
                    </ScrollView>

                    <View style={[styles.buttonContainer, showDatePicker && { marginTop: 6, marginBottom: 12 }]}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) { }; handleSave(); }}
                        >
                            <Text style={styles.buttonText}>{mode === "add" ? t('transactionModal.add') : t('common.save')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
