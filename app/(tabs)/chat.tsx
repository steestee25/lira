
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';

// Import components
import ChatScreen from '@/components/ChatScreen';
import ProgressBar from '@/components/ProgressBar';

// Import utilities
import { SourcesDisplay } from '@/components/SourcesDisplay';
import { downloadModel } from '@/lib/downloadModel';
import { useTranslation } from '@/lib/i18n';
import {
  initializeLocalModels
} from '@/lib/modelStorage';
import { loadProficiencyLevelWithFallback } from '@/lib/questionnaireStorage';
import { retrieveRelevant } from '@/lib/retrieval';
import { appStyles } from '../../styles/components/chatStyles';

// Conditionally import native modules (only available on mobile)
let RNFS: any = null;
let initLlama: any = null;
let releaseAllLlama: any = null;

if (Platform.OS !== 'web') {
  RNFS = require('react-native-fs');
  const llamaModule = require('llama.rn');
  initLlama = llamaModule.initLlama;
  releaseAllLlama = llamaModule.releaseAllLlama;
}

// ===================== Question Categories =====================
type IconConfig = {
  library: 'Ionicons' | 'Feather' | 'AntDesign';
  name: string;
};

type Category = {
  id: string;
  name: string;
  nameEn: string;
  questions: string[];
  iconConfig: IconConfig;
};

const QUESTION_CATEGORIES: Category[] = [
  {
    id: 'generali',
    name: 'Generali',
    nameEn: 'General',
    iconConfig: { library: 'Ionicons', name: 'grid-outline' },
    questions: [
      'Su cosa si fonda una buona pianificazione finanziaria?',
      'Cosa devi assolutamente sapere prima di investire?',
      'Chi può prestare i servizi di investimento?',
      'Che cos\'è il trading algoritmico?',
      'Che cos\'è l\'abuso di informazioni privilegiate?',
    ],
  },
  {
    id: 'prodotti-finanziari',
    name: 'Prodotti finanziari',
    nameEn: 'Financial Products',
    iconConfig: { library: 'Feather', name: 'pie-chart' },
    questions: [
      'Cosa sono i fondi comuni?',
      'Cosa sono le azioni?',
      'Che cosa significa il termine criptovaluta?',
      'Le monete a corso legale e le criptovalute assolvono alle stesse funzioni?',
      'Chi acquista un\'obbligazione cosa fa?',
      'Chi è l\'emittente di un\'obbligazione?',
      'Che cosa indica la scadenza di un\'obbligazione?',
      'Cosa sono i prodotti derivati?',
      'Che cos\'è uno swap?',
    ],
  },
  {
    id: 'inflazione',
    name: 'Inflazione',
    nameEn: 'Inflation',
    iconConfig: { library: 'Feather', name: 'trending-up' },
    questions: [
      'Che cos\'è l\'inflazione?',
      'Qual è l\'effetto dell\'aumento dei tassi di interesse sui nuovi prestiti?',
      'Perché devo considerare l\'inflazione nella mia strategia di investimento?',
      'Perché dovrei seguire i movimenti dei tassi di interesse delle banche centrali?',
      'Puoi fornire un esempio dell\'effetto dell\'inflazione su un\'obbligazione a cedola fissa?',
    ],
  },
  {
    id: 'crisi',
    name: 'Crisi',
    nameEn: 'Crisis',
    iconConfig: { library: 'Feather', name: 'shield' },
    questions: [
      'Che cosa fu la crisi del 1929?',
      'Quali furono le cause remote della crisi del 1929?',
      'Qual è la sequenza tipica attraverso cui si sviluppa una crisi generata da una bolla speculativa?',
      'Qual è stato l\'impatto del Covid-19 sui mercati azionari a livello mondiale?',
    ],
  },
  {
    id: 'rischi',
    name: 'Rischi dell\'investimento',
    nameEn: 'Investment Risks',
    iconConfig: { library: 'Feather', name: 'alert-circle' },
    questions: [
      'Cosa deve fare l\'investitore prima di effettuare un investimento in strumenti finanziari?',
      'Qual è la differenza tra titoli di capitale e titoli di debito?',
      'Cosa si intende per rischio emittente?',
      'Che cos\'è il rischio di mercato?',
      'Qual è il rischio associato alla divisa in cui è denominato un investimento?',
      'Quando l\'investitore dovrebbe concludere un\'operazione avente ad oggetto strumenti finanziari derivati?',
    ],
  },
  {
    id: 'truffe',
    name: 'Truffe',
    nameEn: 'Scams',
    iconConfig: { library: 'AntDesign', name: 'alert' },
    questions: [
      'Qual è la costante nelle truffe finanziarie?',
      'Che cos\'è lo schema Ponzi?',
      'Fino a quando riesce a funzionare lo schema Ponzi?',
      'Quali sono i principali ingredienti della truffa utilizzati dal truffatore?',
    ],
  },
];

// ===================== Main Chat Component =====================

export default function Chat(): React.JSX.Element {
  type Message = {
    role: 'system' | 'user' | 'assistant';
    content: string;
    sources?: { id: string; text: string; metadata?: { source_title?: string; source_url?: string; answer?: string } }[];
  };

  const { resetMessages, rag } = useLocalSearchParams();
  const ragParam = Array.isArray(rag) ? rag[0] : rag;
  const { locale } = useTranslation();

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={appStyles.container}>
        <Text style={appStyles.title}>Web platform not fully supported yet</Text>
      </SafeAreaView>
    );
  }

  const INITIAL_CONVERSATION: Message[] = [
    {
      role: 'system',
      content: `Sei un assistente esperto in finanza personale e mercati finanziari. Rispondi sempre in italiano. Se la domanda non è in italiano rispondi che non puoi rispondere.
      Quando ti vengono forniti documenti recuperati, usa solo le informazioni in essi contenute per rispondere alla domanda dell'utente.
      Fornisci una spiegazione completa e chiara, senza interromperti a metà frase.
      Se le informazioni non sono sufficienti per rispondere, dì onestamente che non hai abbastanza dati.
      Non inventare dettagli né fornire consigli di investimento specifici.`,
    },
  ];

  //const MODEL_ALIAS = 'Smollm3-3B-q4';
  //const MODEL_REPO = 'Stee201/gguf-server-smollm3';
  //const MODEL_CACHE_NAME = 'smollm3-custom.q4_k_m.gguf';
  const MODEL_ALIAS = 'Gemma3-1B-Mine';
  const MODEL_REPO = 'Stee201/gguf-server-q';
  const MODEL_CACHE_NAME = 'Gemma3-1B-Mine.gguf';

  const [conversation, setConversation] = useState<Message[]>(INITIAL_CONVERSATION);
  const [userInput, setUserInput] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [context, setContext] = useState<any>(null);
  const [isPreparingModel, setIsPreparingModel] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isInitializingModels, setIsInitializingModels] = useState<boolean>(true);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'conversation' | 'preparing'>('preparing');

  const [ragEnabled, setRagEnabled] = useState<boolean>(true);
  const [ragPhase, setRagPhase] = useState<'idle' | 'fetching' | 'reasoning' | 'generating' | 'complete'>('idle');
  const [streamingText, setStreamingText] = useState<string>('');
  const [retrievedDocs, setRetrievedDocs] = useState<{ id: string; text: string; metadata?: { source_title?: string; source_url?: string; answer?: string } }[]>([]);
  const [selectedSources, setSelectedSources] = useState<{ id: string; text: string; metadata?: { source_title?: string; source_url?: string; answer?: string } }[]>([]);
  const [showSources, setShowSources] = useState<boolean>(false);
  const [sourcesSheetVisible, setSourcesSheetVisible] = useState<boolean>(false);
  const [webViewVisible, setWebViewVisible] = useState<boolean>(false);
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [webViewTitle, setWebViewTitle] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showQuestionsModal, setShowQuestionsModal] = useState<boolean>(false);

  // Helper function to render icons
  const renderIcon = (iconConfig: IconConfig, color: string) => {
    const size = 20;
    switch (iconConfig.library) {
      case 'Ionicons':
        return <Ionicons name={iconConfig.name as any} size={size} color={color} />;
      case 'Feather':
        return <Feather name={iconConfig.name as any} size={size} color={color} />;
      case 'AntDesign':
        return <AntDesign name={iconConfig.name as any} size={size} color={color} />;
    }
  };

  function formatTitleFromUrl(urlStr: string | null): string {
    if (!urlStr) return 'Anteprima';
    try {
      const url = new URL(urlStr);
      const pathname = url.pathname.split('/').filter(p => p.length > 0);
      const last = pathname[pathname.length - 1] || '';
      if (!last) return (url.hostname || 'Anteprima').replace(/^www\./, '').toUpperCase();
      const words = last.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      return words.join(' ');
    } catch (e) {
      return 'Anteprima';
    }
  }
  const [proficiencyLevel, setProficiencyLevel] = useState<string>('intermediate');
  const isSendingRef = useRef(false);
  const isInitializedRef = useRef(false);

  const mockSources = [
    {
      id: 'chunk-1',
      text: 'Bilancio mensile di maggio con spese per alimenti, trasporti e abbonamenti.',
      metadata: {
        source_title: 'Report mensile spese',
        source_url: 'https://example.com/report-mensile',
        answer: 'Suddivisione delle spese mensili per categorie primarie.',
      },
    },
    {
      id: 'chunk-2',
      text: 'Consigli per ridurre le uscite superflue e aumentare il risparmio.',
      metadata: {
        source_title: 'Guida al risparmio',
        source_url: 'https://example.com/guida-risparmio',
        answer: 'Strategie pratiche per tagliare costi e mettere da parte soldi.',
      },
    },
    {
      id: 'chunk-3',
      text: 'Statistiche sui movimenti bancari, evidenziando trasferimenti ricorrenti.',
      metadata: {
        source_title: 'Analisi movimenti',
        source_url: 'https://example.com/analisi-movimenti',
        answer: 'Frequenza e volume dei pagamenti ricorrenti nel periodo selezionato.',
      },
    },
    {
      id: 'chunk-4',
      text: 'Elenco delle fonti finanziarie con note su rendimento e costi associati.',
      metadata: {
        source_title: 'Fonte finanziaria',
        source_url: 'https://example.com/fonte-finanziaria',
        answer: 'Paragone tra prodotti di investimento e costi di gestione.',
      },
    },
    {
      id: 'chunk-5',
      text: 'Suggerimento per ottimizzare l’abbonamento telefonico e le utility.',
      metadata: {
        source_title: 'Ottimizzazione bollette',
        source_url: 'https://example.com/ottimizzazione',
        answer: 'Azioni consigliate per ridurre le bollette e i costi telefonici.',
      },
    },
    {
      id: 'chunk-6',
      text: 'Raccomandazioni per la pianificazione di un fondo emergenze.',
      metadata: {
        source_title: 'Fondo emergenze',
        source_url: 'https://example.com/fondo-emergenze',
        answer: 'Passi per costruire un fondo di emergenza a tre mesi.',
      },
    },
  ];

  // Listen for reset messages from header button
  useEffect(() => {
    if (resetMessages) {
      setConversation(INITIAL_CONVERSATION);
      setUserInput('');
      setStreamingText('');
      setRagPhase('idle');
      setShowSources(false);
      setRetrievedDocs([]);
    }
  }, [resetMessages]);

  useEffect(() => {
    setRagEnabled(ragParam !== '0');
    setRagPhase('idle');
  }, [ragParam]);

  useEffect(() => {
    const initModels = async () => {
      try {
        const models = await initializeLocalModels();

        const existingModel = models.find(m => m.modelName === MODEL_ALIAS);
        if (existingModel) {
          const loaded = await loadModel(existingModel.modelName);
          if (loaded) {
            setCurrentPage('conversation');
            return;
          }
        }

        await downloadAndLoadModel();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Errore durante l\'inizializzazione del modello.';
        setModelLoadError(errorMessage);
        console.error('Error initializing models:', error);
      } finally {
        setIsInitializingModels(false);
        setIsPreparingModel(false);
      }
    };

    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      initModels();
    }
  }, []);

  // Load proficiency level from user profile (con fallback a Supabase)
  useEffect(() => {
    const loadUserProficiency = async () => {
      const level = await loadProficiencyLevelWithFallback();
      if (level) {
        setProficiencyLevel(level);
        console.log('✓ Proficiency level caricato:', level);
      } else {
        console.warn('Proficiency level non trovato, usando default: intermediate');
        setProficiencyLevel('intermediate');
      }
    };

    loadUserProficiency();
  }, []);

  const fetchGgufFileFromRepo = async (): Promise<string> => {
    const response = await axios.get(`https://huggingface.co/api/models/${MODEL_REPO}`);
    if (!response.data?.siblings) {
      throw new Error('Invalid Hugging Face API response.');
    }

    const ggufFiles = response.data.siblings.filter(
      (file: { rfilename: string }) => file.rfilename.endsWith('.gguf'),
    );

    if (ggufFiles.length === 0) {
      throw new Error('Nessun file .gguf trovato nel repository del modello.');
    }

    return ggufFiles[0].rfilename;
  };

  const downloadAndLoadModel = async () => {
    setIsPreparingModel(true);
    setProgress(0);
    setModelLoadError(null);

    try {
      const modelFile = await fetchGgufFileFromRepo();
      const downloadUrl = `https://huggingface.co/${MODEL_REPO}/resolve/main/${modelFile}`;

      const destPath = await downloadModel(
        MODEL_CACHE_NAME,
        downloadUrl,
        progress => setProgress(progress),
        false,
        MODEL_ALIAS,
      );

      if (!destPath) {
        throw new Error('Percorso di download non valido.');
      }

      await initializeLocalModels();

      const loaded = await loadModel(MODEL_CACHE_NAME);
      if (!loaded) {
        throw new Error('Errore durante il caricamento del modello dopo il download.');
      }

      setCurrentPage('conversation');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto durante il download o caricamento del modello.';
      setModelLoadError(errorMessage);
      Alert.alert('Errore modello', errorMessage);
      console.error('Error downloading or loading model:', error);
    } finally {
      setIsPreparingModel(false);
    }
  };

  const retryModelInit = async () => {
    setModelLoadError(null);
    setIsPreparingModel(true);
    await downloadAndLoadModel();
  };

  // Helper: Get proficiency instruction
  const getProficiencyInstruction = (): string => {
    switch (proficiencyLevel) {
      case 'base':
        return 'L\'utente ha conoscenze base di finanza. Usa spiegazioni semplici e esempi pratici. Evita termini tecnici o complessi.';
      case 'advanced':
        return 'L\'utente ha conoscenze avanzate di finanza personale. Evita spiegazioni eccessivamente basilari, puoi usare termini tecnici e spiegazioni più approfondite.';
      default:
        return 'L\'utente ha conoscenze di finanza intermedie. Puoi introdurre alcuni termini tecnici, ma sempre accompagnati da una spiegazione.';
    }
  };

  const handleSendMessage = async (message?: string) => {
    if (isSendingRef.current) {
      return;
    }
    isSendingRef.current = true;

    const messageToSend = message || userInput.trim();
    console.log('handleSendMessage:', JSON.stringify(messageToSend));

    if (!context) {
      isSendingRef.current = false;
      Alert.alert('Model Not Loaded', 'Please load the model first.');
      return;
    }

    if (!messageToSend) {
      isSendingRef.current = false;
      Alert.alert('Input Error', 'Please enter a message.');
      return;
    }

    const isFirstQuestion = conversation.length === 1; // only system message

    const newConversation: Message[] = [
      ...conversation,
      { role: 'user', content: messageToSend },
    ];

    setConversation(newConversation);
    if (!message) {
      setUserInput('');
    }
    setIsGenerating(true);
    setShowSources(false);
    setSourcesSheetVisible(false);
    setSelectedSources([]);
    setStreamingText('');

    try {
      let retrievedDocsData: { id: string; text: string; metadata?: { source_title?: string; source_url?: string; answer?: string } }[] = [];

      if (ragEnabled) {
        setRagPhase('fetching');
        setRetrievedDocs([]);

        try {
          retrievedDocsData = await retrieveRelevant(messageToSend, { k: 6, minScore: 0.05 });
          setRetrievedDocs(retrievedDocsData);
        } catch (error) {
          console.warn('Retrieval failed:', error);
        }

        setRagPhase('reasoning');
      } else {
        setRagPhase('reasoning');
      }

      const messagesForModel: Message[] = [];
      let systemMessage = 'You are a helpful assistant.';

      if (newConversation[0]) {
        systemMessage = `${newConversation[0].content}\n\n`;
      }

      const maxDocs = 6;
      const trimmedDocs = retrievedDocsData.slice(0, maxDocs);
      if (ragEnabled && trimmedDocs.length) {
        const safeRetrievedText = trimmedDocs
          .map((doc, index) => {
            return `DOCUMENTO ${index + 1}:\n${doc.text}`;
          })
          .join('\n\n');

        systemMessage = `Sei un assistente di finanza personale. ${getProficiencyInstruction()}

          REGOLE: Rispondi SOLO usando i documenti seguenti. Non inventare. Non dare consigli specifici di investimento. Rispondi in italiano in modo conciso.

          ${safeRetrievedText}`;

        //systemMessage = `Sei un assistente esperto di finanza personale che risponde ESCLUSIVAMENTE sulla base dei documenti forniti.
        //${getProficiencyInstruction()}
        //GUARDRAILS OBBLIGATORI:
        //- Se la domanda non riguarda la finanza personale o gli argomenti nei documenti, dì che non puoi rispondere
        //- Non dare MAI consigli di investimenti finanziari specifici (es: "compra questo", "vendi quello")
        //- Fornisci solo informazioni educative sulla finanza
        //REGOLE OBBLIGATORIE:
        //1. RIPETI letteralmente dai documenti
        //2. NON INVENTARE NULLA che non sia nei documenti  
        //3. Se un documento dice X, ripeti esattamente X
        //4. La risposta DEVE essere COMPLETA - copia TUTTI i dettagli disponibili
        //5. Rispondi in ITALIANO usando la massima lunghezza possibile
        //6. GENERA la risposta in base al livello di competenza dell'utente (base, intermedio, avanzato) - vedi istruzioni sopra
        //DOCUMENTI DISPONIBILI:
        //${safeRetrievedText}
        //
        //RISPOSTA: `;
      }

      messagesForModel.push({ role: 'system', content: systemMessage });
      const recentConversation = newConversation.slice(1);
      const recentTrimmed = recentConversation.slice(-6);

      if (recentTrimmed.length > 0 && recentTrimmed[0].role === 'assistant') {
        recentTrimmed.shift();
      }

      messagesForModel.push(...recentTrimmed);

      console.log('===== FULL PROMPT SENT TO MODEL =====');
      console.log('Proficiency Level:', proficiencyLevel);
      console.log('System Message:', systemMessage);
      console.log('Full Messages Array:', JSON.stringify(messagesForModel, null, 2));
      console.log('===== END PROMPT =====');

      setRagPhase('generating');
      const stopWords = [
        '</s>',
        '<|end|>',
        '<|im_end|>',
        '<|eot_id|>',
      ];

      let fullResponse = '';
      const result = await context.completion(
        {
          messages: messagesForModel,
          n_predict: 2048,
          stop: stopWords,
          temperature: 0.1,
          top_p: 0.95,
          repeat_penalty: 1.2,
          repeat_last_n: 128,
          
        },
        (data: { token: string }) => {
          const { token } = data;
          if (token) {
            fullResponse += token;
            setStreamingText(fullResponse);
            console.log('Streaming token:', token);
          }
        },
      );
      console.log('Full generated response:', fullResponse);

      if (result && result.text) {
        const finalResponse = result.text.trim();
        console.log('Final response text:', finalResponse);
        setConversation(prev => [
          ...prev,
          { role: 'assistant', content: finalResponse, sources: retrievedDocsData },
        ]);
        setStreamingText('');
        setRagPhase('complete');
        setShowSources(true);
      } else {
        throw new Error('No response from the model.');
      }
    } catch (error) {
      Alert.alert(
        'Error During Inference',
        error instanceof Error ? error.message : 'An unknown error occurred.',
      );
    } finally {
      setIsGenerating(false);
      isSendingRef.current = false;
    }
  };

  const loadModel = async (modelName: string) => {
    try {
      const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;

      console.log('[LoadModel] Attempting to load:', modelName);
      console.log('[LoadModel] Path:', destPath);

      const fileExists = await RNFS.exists(destPath);
      if (!fileExists) {
        Alert.alert('Error Loading Model', 'The model file does not exist at: ' + destPath);
        return false;
      }

      const fileStats = await RNFS.stat(destPath);
      console.log('[LoadModel] File size:', fileStats.size, 'bytes');

      if (fileStats.size < 100000) {
        Alert.alert('Error Loading Model', 'Model file is too small (' + fileStats.size + ' bytes). May be corrupted.');
        return false;
      }

      if (context) {
        await releaseAllLlama();
        setContext(null);
        setConversation(INITIAL_CONVERSATION);
      }

      console.log('[LoadModel] Initializing llama with model...');
      const llamaContext = await initLlama({
        model: destPath,
        use_mlock: true,
        n_ctx: 2048,      // was 4096 — halved, loads faster
        n_gpu_layers: 1,
        n_threads: 4,     // add this — helps on mobile CPUs
      });

      console.log('[LoadModel] Success! Context created');
      setContext(llamaContext);
      Alert.alert('Model Loaded', 'The model was successfully loaded.');
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('[LoadModel] Error:', errorMsg);
      console.error('[LoadModel] Full error:', error);

      Alert.alert(
        'Error Loading Model',
        errorMsg + '\n\nTip: Some model quantizations may not be supported. Try Q4_K_M or Q5_K_M versions.'
      );
      return false;
    }
  };

  return (
    <SafeAreaView style={appStyles.container}>
      <View style={appStyles.content}>
        {(isPreparingModel || isInitializingModels) && (
          <View style={appStyles.card}>
            <Text style={appStyles.subtitle}>Preparazione del modello</Text>
            <Text style={appStyles.subtitle2}>{MODEL_ALIAS}</Text>
            <ProgressBar progress={progress} />
            {modelLoadError ? (
              <Text style={appStyles.errorText}>{modelLoadError}</Text>
            ) : null}
            {modelLoadError ? (
              <Text style={appStyles.retryText} onPress={retryModelInit}>
                Tocca per riprovare
              </Text>
            ) : null}
          </View>
        )}

        {!isPreparingModel && !isInitializingModels && currentPage === 'conversation' && context && (
          <>
            {/* Chip delle categorie */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={appStyles.categoriesContainer}
              contentContainerStyle={appStyles.categoriesContent}
            >
              {QUESTION_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    appStyles.categoryChip,
                    selectedCategory === category.id && appStyles.categoryChipActive
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setShowQuestionsModal(true);
                  }}
                >
                  <View style={appStyles.chipIconContainer}>
                    {renderIcon(category.iconConfig, selectedCategory === category.id ? '#FFFFFF' : '#1E293B')}
                  </View>
                  <Text
                    style={[
                      appStyles.categoryChipText,
                      selectedCategory === category.id && appStyles.categoryChipTextActive
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ChatScreen
              conversation={conversation}
              userInput={userInput}
              onUserInputChange={setUserInput}
              onSendMessage={() => handleSendMessage()}
              isGenerating={isGenerating}
              streamingText={streamingText}
              showSourcesButton={showSources && retrievedDocs.length > 0}
              answerPhase={ragPhase}
              isFirstQuestion={conversation.length === 1}
              onOpenSources={(sources) => {
                setSelectedSources(sources.map(source => ({ ...source })));
                setSourcesSheetVisible(true);
              }}
            />

            <Modal
              visible={sourcesSheetVisible}
              transparent
              animationType="slide"
              statusBarTranslucent
              onRequestClose={() => {
                setSourcesSheetVisible(false);
                setSelectedSources([]);
              }}
            >
              <View style={appStyles.sheetOverlay}>
                <TouchableOpacity
                  style={appStyles.sheetOverlayTouchable}
                  activeOpacity={1}
                  onPress={() => {
                    setSourcesSheetVisible(false);
                    setSelectedSources([]);
                  }}
                />
                <View style={appStyles.sheetContainer}>
                  <View style={appStyles.sheetHeader}>
                    <View style={appStyles.sheetTitleRow}>
                      <View style={appStyles.sheetTitleContainer}>
                        <Text style={appStyles.sheetTitle}>Fonti recuperate</Text>
                        <Text style={appStyles.sheetCount}>{selectedSources.length}</Text>
                      </View>
                      <View style={appStyles.iconClose}>
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            } catch (e) {
                              // ignore haptic failure
                            }
                            setSourcesSheetVisible(false);
                            setSelectedSources([]);
                          }}
                        >
                          <Ionicons name="close" size={20} color="#333" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  <View style={appStyles.sheetContent}>
                    <SourcesDisplay sources={selectedSources} visible={sourcesSheetVisible} onOpenUrl={(url) => {
                      if (url) {
                        setWebViewUrl(url);
                        setWebViewTitle(formatTitleFromUrl(url));
                        setWebViewVisible(true);
                      }
                    }} />
                  </View>
                </View>
              </View>
            </Modal>
            <Modal
              visible={webViewVisible}
              transparent
              animationType="slide"
              statusBarTranslucent={true}
              onRequestClose={() => setWebViewVisible(false)}
            >
              <View style={appStyles.sheetOverlay}>
                <TouchableOpacity
                  style={appStyles.sheetOverlayTouchable}
                  activeOpacity={1}
                  onPress={() => setWebViewVisible(false)}
                />
                <View style={[appStyles.sheetContainer, appStyles.webViewModalContainer]}>
                  <View style={appStyles.sheetTitleRow}>
                    <View style={appStyles.sheetTitleContainer}>
                      <Text style={appStyles.sheetTitle}>{webViewTitle || 'Anteprima'}</Text>
                    </View>
                    <View style={appStyles.iconClose}>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          } catch (e) {}
                          setWebViewVisible(false);
                        }}
                      >
                        <Ionicons name="close" size={20} color="#333" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={appStyles.webViewBody}>
                    {webViewUrl ? (
                      <View style={appStyles.webViewInner}>
                        <WebView source={{ uri: webViewUrl }} style={appStyles.webview} />
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </Modal>

            {/* Modal per visualizzare le domande della categoria */}
            <Modal
              visible={showQuestionsModal}
              animationType="fade"
              transparent={true}
              statusBarTranslucent={true}
              onRequestClose={() => {
                setShowQuestionsModal(false);
                setSelectedCategory(null);
              }}
            >
              <TouchableOpacity
                style={appStyles.modalOverlay}
                activeOpacity={1}
                onPress={() => {
                  setShowQuestionsModal(false);
                  setSelectedCategory(null);
                }}
              >
                <TouchableOpacity
                  style={appStyles.questionsModalContent}
                  activeOpacity={1}
                  onPress={() => { }}
                >
                  {/* Header del modal */}
                  {selectedCategory && QUESTION_CATEGORIES.find(c => c.id === selectedCategory) && (
                    <View style={appStyles.modalHeader}>
                      <View style={appStyles.headerWithBadge}>
                        <View style={appStyles.categorySquareIcon}>
                          {renderIcon(QUESTION_CATEGORIES.find(c => c.id === selectedCategory)!.iconConfig, '#1E293B')}
                        </View>
                        <Text style={appStyles.modalTitle}>
                          {QUESTION_CATEGORIES.find(c => c.id === selectedCategory)!.name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setShowQuestionsModal(false);
                          setSelectedCategory(null);
                        }}
                        style={appStyles.closeButton}
                      >
                        <Feather name="x" size={24} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Lista delle domande */}
                  {selectedCategory && (
                    <ScrollView style={appStyles.questionsListContainer}>
                      {QUESTION_CATEGORIES.find(c => c.id === selectedCategory)?.questions.map(
                        (question, index) => (
                          <TouchableOpacity
                            key={index}
                            style={appStyles.questionItem}
                            onPress={() => {
                              handleSendMessage(question);
                              setShowQuestionsModal(false);
                              setSelectedCategory(null);
                            }}
                          >
                            <Text style={appStyles.questionText}>{question}</Text>
                            <Feather name="arrow-right" size={16} color="#0F172A" />
                          </TouchableOpacity>
                        )
                      )}
                    </ScrollView>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          </>
        )}

        {!isPreparingModel && !isInitializingModels && !context && modelLoadError && (
          <View style={appStyles.card}>
            <Text style={appStyles.subtitle}>Impossibile caricare il modello.</Text>
            <Text style={appStyles.errorText}>{modelLoadError}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}