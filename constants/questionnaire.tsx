// constants/questionnaire.ts

export interface QuestionOption {
    label: string
    value: string
}

export interface Question {
    key: string
    title: string
    options: QuestionOption[]
    answer: string | string[] | null
    multiple?: boolean
    correctAnswer?: string
}

export function localizeQuestions(
    questions: Question[],
    t: (path: string) => string,
): Question[] {
    return questions.map((question) => ({
        ...question,
        title: t(`questionnaire.${question.key}.title`),
        options: question.options.map((option) => ({
            ...option,
            label: t(`questionnaire.${question.key}.options.${option.value}`),
        })),
    }))
}

export const onboardingQuestions: Question[] = [
    // ---------------- 2.1 CONTESTO ----------------
    {
        key: 'context',
        title: 'Quale situazione ti descrive meglio?',
        options: [
            { label: 'Studente', value: 'student' },
            { label: 'Dipendente', value: 'employee' },
            { label: 'Freelance / Imprenditore', value: 'freelancer' },
            { label: 'In cerca di lavoro', value: 'jobseeker' },
            { label: 'Altro', value: 'other' },
        ],
        answer: null,
    },

    {
        key: 'money_management',
        title: 'Come gestisci attualmente le tue finanze personali?',
        options: [
            {
                label: 'Non le tengo sotto controllo',
                value: 'no_tracking',
            },
            {
                label: 'Traccio le spese in modo informale (note, memoria)',
                value: 'informal_tracking',
            },
            {
                label: 'Uso fogli di calcolo o app di budgeting',
                value: 'structured_tracking',
            },
            {
                label: 'Pianifico e rivedo attivamente le mie finanze',
                value: 'active_planning',
            },
        ],
        answer: null,
    },

    // ---------------- 2.2 AUTOVALUTAZIONE ----------------
    {
        key: 'selfEval',
        title: 'Come valuteresti le tue conoscenze di finanza personale?',
        options: [
            { label: 'Molto basse', value: 'very_low' },
            { label: 'Basse', value: 'low' },
            { label: 'Nella media', value: 'average' },
            { label: 'Buone', value: 'good' },
            { label: 'Molto buone', value: 'very_good' },
        ],
        answer: null,
    },

    {
        key: 'reading',
        title: 'Con quale frequenza consumi contenuti finanziari (articoli, video, libri)?',
        options: [
            { label: 'Quasi mai', value: 'never' },
            { label: 'A volte', value: 'sometimes' },
            { label: 'Spesso', value: 'often' },
        ],
        answer: null,
    },

    // ---------------- 2.2 MINI-QUIZ ----------------
    {
        key: 'quiz1',
        title:
            'Se stipuli un prestito a tasso fisso, cosa succede alla rata mensile se i tassi di interesse di mercato aumentano?',
        options: [
            { label: 'Aumenta', value: 'increase' },
            { label: 'Diminuisce', value: 'decrease' },
            { label: 'Rimane uguale', value: 'same' },
            { label: 'Non lo so', value: 'unknown' },
        ],
        answer: null,
        correctAnswer: 'same',
    },

    {
        key: 'quiz2',
        title: 'Un ETF è:',
        options: [
            { label: 'Un conto di deposito bancario', value: 'deposit_account' },
            {
                label: 'Un fondo quotato in borsa che replica un indice',
                value: 'etf_fund',
            },
            { label: 'Un tipo di carta di credito', value: 'credit_card' },
            { label: 'Non lo so', value: 'unknown' },
        ],
        answer: null,
        correctAnswer: 'etf_fund',
    },

    {
        key: 'quiz3',
        title:
            'Se investi 1.000 € con un rendimento annuo del 5%, reinvestendo gli interessi ogni anno, dopo 10 anni avresti circa:',
        options: [
            { label: '1.500 €', value: '1500' },
            { label: '1.630 €', value: '1630' },
            { label: '2.000 €', value: '2000' },
            { label: 'Non lo so', value: 'unknown' },
        ],
        answer: null,
        correctAnswer: '1630',
    },

    {
        key: 'quiz4',
        title:
            'Se l’inflazione è costantemente più alta del tasso di interesse del tuo conto di risparmio, qual è la principale conseguenza nel tempo?',
        options: [
            {
                label: 'Il tuo denaro perde valore reale, anche se il saldo aumenta',
                value: 'lose_real_value',
            },
            {
                label: 'Il tuo denaro mantiene lo stesso potere d’acquisto',
                value: 'same_power',
            },
            {
                label: 'Perdi denaro solo se il saldo diminuisce',
                value: 'lose_only_if_down',
            },
            { label: 'Non lo so', value: 'unknown' },
        ],
        answer: null,
        correctAnswer: 'lose_real_value',
    },

    {
        key: 'quiz5',
        title:
            'In quale situazione la diversificazione aiuta di meno?',
        options: [
            {
                label: 'Quando gli asset sono fortemente correlati',
                value: 'high_correlation',
            },
            {
                label: 'Quando si investe nel lungo periodo',
                value: 'long_term',
            },
            {
                label: 'Quando si investono piccole somme regolarmente',
                value: 'small_amounts',
            },
            { label: 'Non lo so', value: 'unknown' },
        ],
        answer: null,
        correctAnswer: 'high_correlation',
    },

    // ---------------- 2.3 OBIETTIVI, TEMPO, DENARO, RISCHIO ----------------
    {
        key: 'goal',
        title: 'Qual è il tuo principale obiettivo finanziario in questo momento?',
        options: [
            { label: 'Capire i concetti base della finanza', value: 'basics' },
            { label: 'Migliorare il budgeting e risparmiare di più', value: 'budgeting' },
            { label: 'Iniziare a investire', value: 'investing' },
            { label: 'Pianificare un obiettivo specifico (viaggio, casa, ecc.)', value: 'specific' },
            { label: 'Altro', value: 'other' },
        ],
        answer: [],
        multiple: true,
    },
    {
        key: 'income',
        title: 'Quale fascia descrive meglio il tuo reddito netto mensile?',
        options: [
            { label: '< 1.000 €', value: 'lt_1000' },
            { label: '1.000-2.000 €', value: '1000_2000' },
            { label: '2.000-3.000 €', value: '2000_3000' },
            { label: '> 3.000 €', value: 'gt_3000' },
            { label: 'Preferisco non rispondere', value: 'no_answer' },
        ],
        answer: null,
    },

    {
        key: 'saving',
        title:
            'Quanto riesci solitamente a risparmiare ogni mese (in % del reddito netto)?',
        options: [
            { label: '0-5%', value: '0_5' },
            { label: '5-15%', value: '5_15' },
            { label: '15-30%', value: '15_30' },
            { label: '> 30%', value: 'gt_30' },
            { label: 'Non lo so con precisione', value: 'dk' },
        ],
        answer: null,
    },

    {
        key: 'risk',
        title:
            'Quanto ti senti a tuo agio con il rischio negli investimenti (fluttuazioni di valore)?',
        options: [
            {
                label: 'Voglio evitare qualsiasi perdita',
                value: 'avoid_loss',
            },
            {
                label: 'Accetto piccole fluttuazioni',
                value: 'small_risk',
            },
            {
                label: 'Accetto forti fluttuazioni per rendimenti più alti',
                value: 'high_risk',
            },
            {
                label: 'Non ne sono sicuro',
                value: 'not_sure',
            },
        ],
        answer: null,
    },
]
