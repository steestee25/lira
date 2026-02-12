import { GoogleGenAI } from '@google/genai'
import * as Haptics from 'expo-haptics'
// LinearGradient removed: advice cards will use plain backgroundColor
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native'
import { PieChart } from 'react-native-gifted-charts'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS } from '../../constants/color'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../lib/i18n'
import { fetchExpensesByCategoryLast3Months, fetchExpensesByCategoryLastMonth, fetchExpensesByCategoryLastYear } from '../../lib/transactions'
import locales from '../../locales/locales.json'
import { HEADER_TOP, HORIZONTAL_GUTTER } from '../../styles/spacing'

const { width } = Dimensions.get('window')

type PeriodType = 'month' | '3months' | 'year'

export default function Advices() {
  const ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY })
  const { session, loading: authLoading } = useAuth()
  const [pieData, setPieData] = useState<{ value: number; color: string; gradientCenterColor?: string; label: string }[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [filteredAdvice, setFilteredAdvice] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>('month')
  const [enableLLM, setEnableLLM] = useState(true)

  const { locale, t } = useTranslation()
  const [refreshing, setRefreshing] = useState(false)
  const insets = useSafeAreaInsets()

  // Derive category colors from locales so colors stay consistent with Home
  const categoriesFromLocale: Record<string, any> = (locales as any)[locale]?.categories || {}
  const categoryColors: Record<string, string[]> = Object.fromEntries(
    Object.entries(categoriesFromLocale).map(([k, v]) => [k, [v.color, v.color]])
  )

  // Use FontAwesome icon names for advice cards (kept minimal)
  const categoryIcons: Record<string, string> = {
    Svago: 'beer',
    Cibo: 'utensils',
    Trasporti: 'bus',
    Bollette: 'file-invoice-dollar',
  }

  // Aliases to map Italian/other local category names to canonical keys used in `locales.categories`
  const categoryAlias: Record<string, string> = {
    svago: 'Entertainment',
    cibo: 'Food & Drink',
    trasporti: 'Public Transport',
    bollette: 'Bills',
    abbigliamento: 'Clothing',
    spesa: 'Groceries',
    ristorante: 'Restaurant'
  }

  const appendHexOpacity = (hex: string, alpha = '20') => {
    if (!hex || typeof hex !== 'string') return hex;
    if (hex.length === 7 && hex.startsWith('#')) return `${hex}${alpha}`;
    // If already has alpha or not a standard hex, return original
    return hex;
  }

  const hexToRgba = (hex: string, alpha = 0.125) => {
    if (!hex || typeof hex !== 'string') return hex;
    // Normalize #RRGGBB
    if (hex.startsWith('#') && (hex.length === 7 || hex.length === 9)) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return hex
  }

  // Hardcoded advice items used when a pie slice is selected
  useEffect(() => {
    const hardcodedAdvice = [
      { text: "Se riduci del 12% le spese per le consegne, risparmierai circa 18€/settimana; così potrai permetterti l'iPhone 15 che desideravi in ~9 mesi.", category: 'Svago' },
      { text: "Se salti la palestra questo mese, risparmierai 50€; è abbastanza per un weekend fuori porta.", category: 'Svago' },
    ]

    setFilteredAdvice(hardcodedAdvice)
  }, [])

  useEffect(() => {
    fetchAndSetData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, period])

  const fetchAndSetData = async () => {
    if (!session?.user) return
    try {
      setLoading(true)

      let result
      if (period === 'month') {
        result = await fetchExpensesByCategoryLastMonth(session.user.id)
      } else if (period === '3months') {
        result = await fetchExpensesByCategoryLast3Months(session.user.id)
      } else {
        result = await fetchExpensesByCategoryLastYear(session.user.id)
      }

      // Log grezzo del risultato del fetch (utile per debug Supabase)
      console.log('advices: raw fetch result:', result)
      // Se la funzione di fetch ritorna l'oggetto standard { data, error }, loggali separatamente
      try {
        if (result && typeof result === 'object') {
          // @ts-ignore
          if ('data' in result) console.log('advices: fetch data:', result.data)
          // @ts-ignore
          if ('error' in result) console.log('advices: fetch error:', result.error)
        }
      } catch (e) {
        console.log('advices: unable to inspect fetch result shape', e)
      }

      const rows = (result || [])
      if (rows.length === 0) {
        setPieData([])
        setFilteredAdvice([])
        setSelectedIndex(null)
        return
      }

      const maxIndex = rows.reduce((acc: number, cur: any, i: number) => (cur.total > (rows[acc]?.total || 0) ? i : acc), 0)
      const mapped = rows.map((r: any, idx: number) => {
        const base = (categoryColors[r.category] && categoryColors[r.category][0]) || '#CCCCCC'
        const gradBase = (categoryColors[r.category] && categoryColors[r.category][1]) || base
        const color = hexToRgba(base, 0.125)
        const gradient = hexToRgba(gradBase, 0.125)
        const localizedLabel = (categoriesFromLocale[r.category] && categoriesFromLocale[r.category].label) || r.category
        const item: any = { value: r.total, color, gradientCenterColor: gradient, label: localizedLabel, key: r.category }
        if (idx === maxIndex) item.focused = true
        return item
      })

      setPieData(mapped)
      // Don't set selectedIndex - keep it null to show all categories in legend
      // User can click to filter to specific category
      setSelectedIndex(null)

      const advice = [
        { text: "Se riduci del 12% le spese per le consegne, risparmierai circa 18€/settimana; così potrai permetterti l'iPhone 15 che desideravi in ~9 mesi.", category: 'Svago' },
        { text: "Se salti la palestra questo mese, risparmierai 50€; è abbastanza per un weekend fuori porta.", category: 'Svago' },
        { text: "Se ti rechi al lavoro con un abbonamento per i trasporti pubblici, risparmierai 30€/mese; è abbastanza per una gita nel weekend.", category: 'Trasporti' },
        { text: "Se riduci del 10% le uscite settimanali al bar, risparmierai 20€/mese; così potrai avere un fondo emergenze di 500€ in ~6 mesi.", category: 'Cibo' }
      ]
      // Show all advice initially, user will filter by clicking

      // --- Prepare a compact summary to send to LLM ---
      const summarizeExpenses = (rows: any[], period: PeriodType) => {
        const total = rows.reduce((s: number, r: any) => s + (r.total ?? 0), 0)
        const count = rows.length
        const avg = count ? total / count : 0

        // Top categories by total
        const byCat: Record<string, number> = {}
        rows.forEach((r: any) => { byCat[r.category] = (byCat[r.category] || 0) + (r.total ?? 0) })
        const topCategories = Object.entries(byCat)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 6)
          .map(([k, v]) => ({ category: k, total: v, pct: total ? Math.round((v / total) * 100) : 0 }))

        // Simple monthly aggregates if rows contain month/date info
        const monthly: Record<string, number> = {}
        rows.forEach((r: any) => {
          const m = r.month || (r.date ? (new Date(r.date)).toISOString().slice(0, 7) : 'unknown')
          monthly[m] = (monthly[m] || 0) + (r.total ?? 0)
        })

        // Small sample of transactions (if available)
        const samples = rows.slice(0, 20).map((r: any) => ({ date: r.date, amount: r.total ?? r.amount, category: r.category, description: r.description || r.merchant }))

        return { total, count, avg, topCategories, monthly: Object.entries(monthly).sort(), samples }
      }

      const callAdviceEndpoint = async (summary: any, period: PeriodType) => {
        // Direct call to Google Gemini like in chat.tsx
        try {
          const prompt = `Sei un consulente finanziario personale che fornisce consigli pratici e concisi in italiano. Riceverai questo oggetto JSON riepilogativo delle spese. Genera un array JSON di 3-6 consigli azionabili, ciascuno con testo breve e la categoria suggerita. Rispondi SOLO con JSON: { "advices": [ { "text": "...", "category": "..." }, ... ] }\n\nSummary: ${JSON.stringify(summary)}\nPeriod: ${period}`

          const contents = [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ]

          const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents
          })

          const text = result?.text || (result?.outputs && result.outputs[0]?.content?.map((c: any) => c.text).join('')) || ''
          console.log('advices: Gemini raw output:', text)

          // Try parse JSON from the model output
          try {
            const parsed = JSON.parse(text)
            if (Array.isArray(parsed.advices)) return parsed.advices
          } catch (e) {
            // If not valid JSON, try to extract a JSON substring
            const start = text.indexOf('{')
            const end = text.lastIndexOf('}')
            if (start !== -1 && end !== -1 && end > start) {
              try {
                const maybe = JSON.parse(text.slice(start, end + 1))
                if (Array.isArray(maybe.advices)) return maybe.advices
              } catch (e2) {
                console.log('advices: failed to parse JSON from Gemini output', e2)
              }
            }
          }
        } catch (e) {
          console.error('advices: error calling Gemini', e)
        }

        // Local fallback: generate concise advices from top categories
        const fallback = (s: any) => {
          const adv: any[] = []
          const tops = s.topCategories || []
          for (let i = 0; i < Math.min(4, tops.length); i++) {
            const t = tops[i]
            adv.push({ text: `Riduci del 10% le spese in ${t.category}, risparmieresti circa ${Math.round((t.pct || 0) * (s.total / 100))}€ al mese.`, category: t.category })
          }
          if (adv.length === 0) adv.push({ text: 'Controlla le spese non ricorrenti e imposta un budget mensile per le categorie più volatili.', category: 'General' })
          return adv
        }

        return fallback(summary)
      }

      const summary = summarizeExpenses(rows, period)

      // Only call LLM when no specific category slice is selected (all categories)
      if (selectedIndex === null) {
        try {
          setLoading(true)
          if (enableLLM) {
            const generated = await callAdviceEndpoint(summary, period)
            if (generated && generated.length) setFilteredAdvice(generated)
            else setFilteredAdvice(advice)
          } else {
            console.log('advices: LLM disabled by toggle, using fallback advice')
            setFilteredAdvice([
              {
                text: `Questo è un **costo significativo**. Potresti considerare di ridurre questo importo.\nConsigli: **pianifica un budget** per l'intrattenimento, sceglio attività gratuite (parchi, biblioteche, eventi gratuiti, ...).`,
                category: 'Svago'
              },
              {
                text: `Questo è un costo **relativamente contenuto**.\nConsigli: prima di acquistare, verifica cosa hai già nel guardaroba e se l'acquisto è davvero necessario; privilegia capi versatili o di seconda mano per ridurre la spesa.`,
                category: 'Abbigliamento'
              },
              {
                text: `Questo è un **costo importante**.\nConsigli: valuta alternative più economiche (bicicletta, percorsi alternativi) o verifica se l'abbonamento è davvero conveniente per il tuo utilizzo.`,
                category: 'Trasporti'
              },
              {
                text: `Questo è un **costo contenuto**.\nConsigli: analizza la spesa alimentare per **evitare sprechi** e **pianifica i pasti**.`,
                category: 'Spesa'
              },

            ])
          }
        } catch (e) {
          console.error('advices: error generating advices from LLM', e)
          setFilteredAdvice(advice)
        }
      } else {
        setFilteredAdvice(advice)
      }
    } catch (err) {
      console.error('Errore fetch advices chart:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchAndSetData()
  }

  const renderStyledText = (text: string) => {
    const parts = text.split(
      /(\*\*.*?\*\*|\d+%|\d+\s?€|\d+\s?(?:settimana|settimane|mese|mesi)|\d+\s?€\/(?:mese|settimana))/gi
    )

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={i} style={{ fontWeight: '700' }}>
            {part.replace(/\*\*/g, '')}
          </Text>
        )
      }

      if (/\d/.test(part)) {
        return (
          <Text key={i} style={{ fontWeight: '700', color: '#0B6623' }}>
            {part}
          </Text>
        )
      }

      return <Text key={i}>{part}</Text>
    })
  }


  const renderDot = (color: string) => <View style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: color, marginRight: 10 }} />

  const getCategoryKeyFromLabel = (label: string) => {
    if (!label) return null
    const b = label.toString().toLowerCase().trim()
    // check alias map first
    if (categoryAlias[b]) return categoryAlias[b]
    const entries = Object.entries(categoriesFromLocale)
    for (const [k, v] of entries) {
      const lab = (v && v.label) ? String(v.label).toLowerCase().trim() : ''
      if (!lab) continue
      if (lab === b || lab.includes(b) || b.includes(lab) || k.toLowerCase() === b) return k
    }
    return null
  }

  const getCategoryBaseColor = (keyOrLabel: string) => {
    if (!keyOrLabel) return '#CCCCCC'
    // try direct key
    if (categoryColors[keyOrLabel] && categoryColors[keyOrLabel][0]) return categoryColors[keyOrLabel][0]
    // try mapping from localized label to key
    const mapped = getCategoryKeyFromLabel(keyOrLabel)
    if (mapped && categoryColors[mapped] && categoryColors[mapped][0]) return categoryColors[mapped][0]
    return '#CCCCCC'
  }

  const handlePiePress = (slice: any, index: number) => {
    // For demo purposes we filter hardcoded advice by category
    const advice = [
      { text: "Se riduci del 12% le spese per le consegne, risparmierai circa 18€/settimana; così potrai permetterti l'iPhone 15 che desideravi in ~9 mesi.", category: 'Svago' },
      { text: "Se salti la palestra questo mese, risparmierai 50€; è abbastanza per un weekend fuori porta.", category: 'Svago' },
      { text: "Se ti rechi al lavoro con un abbonamento per i trasporti pubblici, risparmierai 30€/mese; è abbastanza per una gita nel weekend.", category: 'Trasporti' },
      { text: "Se riduci del 10% le uscite settimanali al bar, risparmierai 20€/mese; così potrai avere un fondo emergenze di 500€ in ~6 mesi.", category: 'Cibo' }
    ]

    // Toggle selection on same index and update pieData focused flags
    const sliceKey = slice?.key || getCategoryKeyFromLabel(slice?.label) || slice?.label

    if (selectedIndex === index) {
      setSelectedIndex(null)
      setPieData((prev) => prev.map((p) => ({ ...p, focused: false })))
      setFilteredAdvice(advice)
    } else {
      setSelectedIndex(index)
      setPieData((prev) => prev.map((p, i) => ({ ...p, focused: i === index })))
      // Filter advice by matching category key or localized label
      setFilteredAdvice(advice.filter(a => {
        const cat = a.category
        return cat === sliceKey || cat === slice.label || getCategoryKeyFromLabel(cat) === sliceKey
      }))
    }
  }

  const renderLegendComponent = () => (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
        {(selectedIndex !== null ? [pieData[selectedIndex]].filter(Boolean) : pieData).map((p) => (
          <View key={p.label} style={{ flexDirection: 'row', alignItems: 'center', width: 150, marginRight: 12, marginBottom: 6 }}>
            {renderDot(p.color)}<Text style={{ color: 'black' }}>{p.label}: {Math.round((p.value / Math.max(1, pieData.reduce((s, x) => s + x.value, 0))) * 100)}%</Text>
          </View>
        ))}
      </View>
    </>
  )

  if (authLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white, paddingTop: HEADER_TOP, paddingBottom: insets.bottom + 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: HORIZONTAL_GUTTER, justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: "#333", fontSize: 34, fontWeight: 'bold' }}>{t ? t('tabs.analysis') : 'Advices'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ marginRight: 8, color: '#333' }}>{enableLLM ? 'AI: On' : 'AI: Off'}</Text>
          <Switch
            value={enableLLM}
            onValueChange={(v) => { console.log('advices: enableLLM ->', v); setEnableLLM(v) }}
            trackColor={{ false: '#767577', true: COLORS.primary }}
            thumbColor={enableLLM ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Period Toggle */}
      <View style={{
        flexDirection: 'row', marginTop: 15, marginHorizontal: HORIZONTAL_GUTTER, borderRadius: 35,
        backgroundColor: '#faf9f9ff', padding: 4
      }}>
        <TouchableOpacity
          onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { }; setPeriod('month'); setSelectedIndex(null); }}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 35,
            backgroundColor: period === 'month' ? '#ffffff' : 'transparent',
            borderWidth: period === 'month' ? 0.5 : 0,
            borderColor: period === 'month' ? '#e0e0e0f1' : 'transparent',
          }}
        >
          <Text style={{
            textAlign: 'center',
            fontWeight: period === 'month' ? '600' : '400', color: "#333"
          }}>
            {t ? t('advicesLabels.lastMonth') : 'Last Month'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { }; setPeriod('3months'); setSelectedIndex(null); }}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 35,
            backgroundColor: period === '3months' ? '#ffffff' : 'transparent',
            borderWidth: period === '3months' ? 0.5 : 0,
            borderColor: period === '3months' ? '#e0e0e0f1' : 'transparent',
          }}
        >
          <Text style={{
            textAlign: 'center',
            fontWeight: period === '3months' ? '600' : '400', color: "#333"
          }}>
            {t ? t('advicesLabels.threeMonths') : '3 Months'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { }; setPeriod('year'); setSelectedIndex(null); }}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 35,
            backgroundColor: period === 'year' ? '#ffffff' : 'transparent',
            borderWidth: period === 'year' ? 0.5 : 0,
            borderColor: period === 'year' ? '#e0e0e0f1' : 'transparent',
          }}
        >
          <Text style={{
            textAlign: 'center',
            fontWeight: period === 'year' ? '600' : '400', color: "#333"
          }}>
            {t ? t('advicesLabels.lastYear') : 'Last Year'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingHorizontal: HORIZONTAL_GUTTER }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <PieChart
            data={pieData.map((p, i) => ({ ...p, onPress: () => handlePiePress(p, i) }))}
            donut
            showGradient={false}
            sectionAutoFocus
            focusOnPress
            extraRadiusForFocused={10}
            radius={90}
            innerRadius={60}
            innerCircleColor={'#F5F5F5'}
            centerLabelComponent={() => <View />}
          />
          {renderLegendComponent()}
        </View>

        {filteredAdvice && filteredAdvice.length > 0 && (
          <View style={{ marginBottom: insets.bottom + 16 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 15 }}>{t ? t('advicesLabels.advices') : 'Consigli'}</Text>
            {filteredAdvice.map((item, index) => {
              const catKey = getCategoryKeyFromLabel(item.category) || item.category
              const emoji = (categoriesFromLocale[catKey] && categoriesFromLocale[catKey].icon) || '💡'
              const baseColor = getCategoryBaseColor(item.category)
              return (
                <View
                  key={index}
                  style={{
                    backgroundColor: appendHexOpacity(baseColor || '#CCCCCC', '20'),
                    borderRadius: 12,
                    padding: 15,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: hexToRgba(baseColor, 0.3), justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text>
                      {renderStyledText(item.text)}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </View>
  )
}