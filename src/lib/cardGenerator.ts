import { CardType, Deck, Flashcard } from '../types';

export interface CardGeneratorParams {
  title?: string;
  sourceType: 'topic' | 'text';
  sourceContent: string;
  cardCount: number;
  cardTypes: CardType[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetLanguage: 'auto' | 'ru' | 'en';
}

export interface GeneratorResult {
  deckTitle: string;
  deckDescription: string;
  tags: string[];
  cards: Flashcard[];
}

function isRussianText(text: string): boolean {
  return /[а-яА-ЯёЁ]/.test(text);
}

export function generateFlashcardsClientSide(params: CardGeneratorParams): GeneratorResult {
  const {
    title,
    sourceType,
    sourceContent,
    cardCount = 8,
    cardTypes = ['qa', 'cloze', 'code', 'mcq'],
    difficulty = 'intermediate',
    targetLanguage = 'auto',
  } = params;

  const isRu = targetLanguage === 'ru' || (targetLanguage === 'auto' && isRussianText(sourceContent + (title || '')));

  let generatedCards: Partial<Flashcard>[] = [];
  let computedTitle = title?.trim() || (sourceContent.length > 30 ? sourceContent.slice(0, 30) + '...' : sourceContent);
  let computedDesc = isRu
    ? 'Компактная колода интервального повторения SM-2, сгенерированная локально.'
    : 'SM-2 spaced repetition deck generated locally from source materials.';
  let computedTags = ['Study'];

  if (sourceType === 'text') {
    const parsed = parseTextToCards(sourceContent, cardCount, cardTypes, isRu);
    generatedCards = parsed.cards;
    if (parsed.extractedTitle) computedTitle = title || parsed.extractedTitle;
    computedTags = parsed.tags;
  } else {
    const topicResult = generateFromTopic(sourceContent, cardCount, cardTypes, difficulty, isRu);
    generatedCards = topicResult.cards;
    computedTitle = title || topicResult.title;
    computedDesc = topicResult.description;
    computedTags = topicResult.tags;
  }

  // Ensure card IDs and valid structure
  const cardsWithMetadata: Flashcard[] = generatedCards.slice(0, cardCount).map((card, idx) => ({
    id: `card_gen_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    type: card.type || 'qa',
    question: card.question || 'Question',
    answer: card.answer || 'Answer',
    explanation: card.explanation || '',
    clozeText: card.clozeText || '',
    codeSnippet: card.codeSnippet || '',
    options: card.options || [],
    correctOptionIndex: typeof card.correctOptionIndex === 'number' ? card.correctOptionIndex : 0,
    tags: card.tags || computedTags,
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    lastReviewedAt: null,
    history: [],
  }));

  return {
    deckTitle: computedTitle,
    deckDescription: computedDesc,
    tags: computedTags,
    cards: cardsWithMetadata,
  };
}

/**
 * Parses user-pasted text/notes into structured cards.
 */
function parseTextToCards(
  text: string,
  targetCount: number,
  allowedTypes: CardType[],
  isRu: boolean
): { cards: Partial<Flashcard>[]; extractedTitle?: string; tags: string[] } {
  const cards: Partial<Flashcard>[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Check for Question/Answer pairs (Q: ... A: ...)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(Q|В|Question|Вопрос):\s*/i.test(line)) {
      const question = line.replace(/^(Q|В|Question|Вопрос):\s*/i, '');
      let answer = '';
      if (i + 1 < lines.length && /^(A|О|Answer|Ответ):\s*/i.test(lines[i + 1])) {
        answer = lines[i + 1].replace(/^(A|О|Answer|Ответ):\s*/i, '');
        i++;
      } else if (i + 1 < lines.length) {
        answer = lines[i + 1];
        i++;
      }
      if (question && answer) {
        cards.push({
          type: 'qa',
          question,
          answer,
          explanation: isRu ? 'Сгенерировано из конспекта' : 'Extracted from study notes',
        });
      }
    }
  }

  // 2. Check for definitions: Term - Definition or Term: Definition or Term — Definition
  if (cards.length < targetCount) {
    for (const line of lines) {
      if (cards.length >= targetCount) break;
      const defMatch = line.match(/^([A-Za-z0-9\sА-Яа-яЁё_-]{2,40})\s*[:—–-]\s*(.+)$/);
      if (defMatch) {
        const term = defMatch[1].trim();
        const def = defMatch[2].trim();
        if (term.length >= 2 && def.length >= 10) {
          const type = allowedTypes.includes('cloze') && Math.random() > 0.5 ? 'cloze' : 'qa';
          if (type === 'cloze') {
            cards.push({
              type: 'cloze',
              question: isRu ? `Заполните пропуск: ${term}` : `Fill in the blank: ${term}`,
              answer: term,
              clozeText: `${term} — {{c1::${def}}}`,
              explanation: isRu ? `Определение для ${term}` : `Definition of ${term}`,
            });
          } else {
            cards.push({
              type: 'qa',
              question: isRu ? `Что такое ${term}?` : `What is ${term}?`,
              answer: def,
              explanation: isRu ? `Ключевой термин: ${term}` : `Key concept: ${term}`,
            });
          }
        }
      }
    }
  }

  // 3. Extract sentence facts & create Cloze or MCQ cards
  if (cards.length < targetCount) {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 20 && s.length <= 160);

    for (const sentence of sentences) {
      if (cards.length >= targetCount) break;

      // Extract key capitalized word or technical word
      const words = sentence.split(' ');
      const keyWordCandidate = words.find((w) => w.length > 4 && /^[A-ZА-Я]/.test(w)) || words.find((w) => w.length > 5);

      if (keyWordCandidate) {
        const cleanWord = keyWordCandidate.replace(/[.,!?:;()"']/g, '');
        const clozeVersion = sentence.replace(cleanWord, `{{c1::${cleanWord}}}`);

        if (allowedTypes.includes('cloze')) {
          cards.push({
            type: 'cloze',
            question: isRu ? 'Восстановите пропущенный термин:' : 'Complete the missing term:',
            answer: cleanWord,
            clozeText: clozeVersion,
            explanation: isRu ? 'Атомный факт из ваших материалов' : 'Key memory fact from source text',
          });
        } else {
          cards.push({
            type: 'qa',
            question: isRu ? `Какое слово пропущено: "${sentence.replace(cleanWord, '___')}"?` : `Which term completes: "${sentence.replace(cleanWord, '___')}"?`,
            answer: cleanWord,
            explanation: sentence,
          });
        }
      }
    }
  }

  // 4. Fallback if still under targetCount
  if (cards.length === 0) {
    cards.push({
      type: 'qa',
      question: isRu ? 'Основная суть предоставленного материала' : 'Main key takeaway of the provided note',
      answer: text.slice(0, 120) + '...',
      explanation: isRu ? 'Автоматическая выжимка' : 'Automatic text summary',
    });
  }

  return {
    cards,
    extractedTitle: text.slice(0, 30).trim(),
    tags: isRu ? ['Конспект', 'Заметки'] : ['Notes', 'Summary'],
  };
}

/**
 * Generates cards dynamically from topic keyword search/prompt.
 */
function generateFromTopic(
  topic: string,
  targetCount: number,
  allowedTypes: CardType[],
  difficulty: string,
  isRu: boolean
): { cards: Partial<Flashcard>[]; title: string; description: string; tags: string[] } {
  const cleanTopic = topic.trim();
  const lowerTopic = cleanTopic.toLowerCase();

  const cards: Partial<Flashcard>[] = [];

  // Preset topic matching
  if (lowerTopic.includes('postgres') || lowerTopic.includes('sql') || lowerTopic.includes('постгрес')) {
    cards.push(
      {
        type: 'qa',
        question: isRu ? 'Что такое WAL (Write-Ahead Logging) в PostgreSQL и для чего он нужен?' : 'What is WAL (Write-Ahead Logging) in PostgreSQL and why is it used?',
        answer: isRu ? 'Логирование изменений на диск ПЕРЕД их записью в файлы данных. Обеспечивает ACID-надежность и быструю репликацию.' : 'Logging modifications to disk BEFORE writing to data files. Ensures ACID durability and enables replication.',
        explanation: isRu ? 'WAL предотвращает потерю данных при сбоях сервера.' : 'WAL prevents data corruption on server crashes.',
      },
      {
        type: 'cloze',
        question: isRu ? 'Заполните термин MVCC в PostgreSQL:' : 'Fill in MVCC concept:',
        answer: 'MVCC',
        clozeText: isRu ? 'PostgreSQL использует {{c1::MVCC}} (Multi-Version Concurrency Control), чтобы чтения не блокировали записи.' : 'PostgreSQL uses {{c1::MVCC}} (Multi-Version Concurrency Control) so reads do not block writes.',
        explanation: isRu ? 'Каждая транзакция видит снимок данных (snapshot).' : 'Each transaction sees a consistent data snapshot.',
      },
      {
        type: 'mcq',
        question: isRu ? 'Какой тип индекса в PostgreSQL является дефолтным для команды CREATE INDEX?' : 'Which index type is default in PostgreSQL when running CREATE INDEX?',
        answer: 'B-Tree',
        options: ['B-Tree', 'Hash', 'GIN', 'GiST'],
        correctOptionIndex: 0,
        explanation: isRu ? 'B-Tree отлично подходит для операций =, <, >, BETWEEN и ORDER BY.' : 'B-Tree handles equality and range queries efficiently.',
      },
      {
        type: 'code',
        question: isRu ? 'Исправьте запрос для поиска с фильтрацией по регистру:' : 'Fix this query for case-insensitive search:',
        answer: 'ILIKE or LOWER(email)',
        codeSnippet: 'SELECT * FROM users WHERE email LIKE \'%gmail.com\';',
        explanation: isRu ? 'Используйте ILIKE в Postgres для регистронезависимого поиска.' : 'Use ILIKE in Postgres for case-insensitive matching.',
      }
    );
  } else if (lowerTopic.includes('react') || lowerTopic.includes('typescript') || lowerTopic.includes('javascript') || lowerTopic.includes('frontend')) {
    cards.push(
      {
        type: 'qa',
        question: isRu ? 'В чем главное отличие useEffect от useLayoutEffect в React?' : 'What is the key difference between useEffect and useLayoutEffect in React?',
        answer: isRu ? 'useEffect выполняется асинхронно ПОСЛЕ отрисовки DOM. useLayoutEffect выполняется синхронно ДО отрисовки браузера.' : 'useEffect runs asynchronously AFTER DOM render. useLayoutEffect runs synchronously BEFORE browser paint.',
        explanation: isRu ? 'useLayoutEffect используйте для измерения DOM без мерцания.' : 'Use useLayoutEffect for layout measurements to avoid flickers.',
      },
      {
        type: 'cloze',
        question: isRu ? 'Пропущенный хук React:' : 'Fill in the React Hook:',
        answer: 'useCallback',
        clozeText: isRu ? 'Хук {{c1::useCallback}} мемоизирует экземпляр функции между рендерами.' : 'The {{c1::useCallback}} hook memoizes function instances across re-renders.',
        explanation: isRu ? 'Предотвращает лишние перерисовки дочерних компонентов.' : 'Prevents unnecessary re-renders of memoized child components.',
      },
      {
        type: 'mcq',
        question: isRu ? 'Что происходит в React 19 при использовании action функций в формы?' : 'What happens in React 19 when using Actions in form elements?',
        answer: isRu ? 'Автоматическое управление состоянием отправки и ошибками' : 'Automatic handling of pending state and form reset',
        options: [
          isRu ? 'Автоматическое управление состоянием отправки и ошибками' : 'Automatic handling of pending state and form reset',
          isRu ? 'Прямая мутация глобального window' : 'Direct mutation of global window state',
          isRu ? 'Блокировка потока DOM' : 'Blocking DOM thread execution',
          isRu ? 'Удаление всех useState' : 'Removal of all useState calls',
        ],
        correctOptionIndex: 0,
        explanation: isRu ? 'React 19 Actions интегрируют useActionState и pending transitions.' : 'React 19 Actions streamline async form submissions.',
      },
      {
        type: 'code',
        question: isRu ? 'Какой тип TypeScript добавит только чтение для всех свойств T?' : 'Which TypeScript utility type makes all properties of T read-only?',
        answer: 'Readonly<T>',
        codeSnippet: 'type ImmutableUser = Readonly<User>;',
        explanation: isRu ? 'Readonly<T> делает свойства неподвластными изменениям.' : 'Readonly<T> marks every property as read-only.',
      }
    );
  } else if (lowerTopic.includes('design') || lowerTopic.includes('system') || lowerTopic.includes('архитектура')) {
    cards.push(
      {
        type: 'qa',
        question: isRu ? 'Сформулируйте CAP-теорему для распределенных систем.' : 'State the CAP theorem for distributed systems.',
        answer: isRu ? 'Распределенная система может одновременно гарантировать только 2 из 3 свойств: Consistency (Согласованность), Availability (Доступность), Partition Tolerance (Устойчивость к разделению).' : 'A distributed system can guarantee at most 2 out of 3 properties: Consistency, Availability, Partition Tolerance.',
        explanation: isRu ? 'При сетевом сбое (P) выбирают между C и A.' : 'Under network partitions, you must trade off between C and A.',
      },
      {
        type: 'cloze',
        question: isRu ? 'Заполните пропуск:' : 'Fill in the blank:',
        answer: 'Consistent Hashing',
        clozeText: isRu ? 'Для эффективного шардинга данных без сплошной перебалансировки используют {{c1::Consistent Hashing}}.' : 'For scalable data sharding with minimal remapping, systems use {{c1::Consistent Hashing}}.',
        explanation: isRu ? 'При добавлении ноды переносится только K/n ключей.' : 'Only K/n keys are remapped when adding/removing nodes.',
      }
    );
  }

  // Dynamic generic fallback cards for any custom topic entered!
  const topicTitle = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);
  
  if (cards.length < targetCount) {
    const defaultTemplates: Partial<Flashcard>[] = [
      {
        type: 'qa',
        question: isRu ? `В чем заключается ключевая концепция «${topicTitle}»?` : `What is the core underlying concept of "${topicTitle}"?`,
        answer: isRu
          ? `Фундаментальный принцип ${topicTitle}, определяющий его применение, ключевые правила и архитектурные особенности.`
          : `The fundamental principles of ${topicTitle}, defining its purpose, core mechanics, and primary use cases.`,
        explanation: isRu ? `Основополагающая база по теме ${topicTitle}.` : `Core foundational knowledge for ${topicTitle}.`,
      },
      {
        type: 'cloze',
        question: isRu ? `Пропущенное определение по теме ${topicTitle}:` : `Missing key term for ${topicTitle}:`,
        answer: topicTitle,
        clozeText: isRu
          ? `Главной целью изучения {{c1::${topicTitle}}} является глубокое понимание принципов работы и практическое применение.`
          : `The primary goal of mastering {{c1::${topicTitle}}} is understanding its execution flow and core principles.`,
        explanation: isRu ? 'Запомните ключевую терминологию.' : 'Remember key domain terminology.',
      },
      {
        type: 'mcq',
        question: isRu ? `Какое из следующих утверждений верно для «${topicTitle}»?` : `Which statement best applies to "${topicTitle}"?`,
        answer: isRu ? 'Оптимизирует структурирование и эффективное освоение информации' : 'Improves systematic retention and structured mastery',
        options: [
          isRu ? 'Оптимизирует структурирование и эффективное освоение информации' : 'Improves systematic retention and structured mastery',
          isRu ? 'Применяется исключительно без теоретической базы' : 'Used without any underlying principles',
          isRu ? 'Устарело и не применяется в современном контексте' : 'Obsolete pattern with no current utility',
          isRu ? 'Исключает необходимость проверки данных' : 'Disregards accuracy and verification',
        ],
        correctOptionIndex: 0,
        explanation: isRu ? `Высокая эффективность в теме ${topicTitle}.` : `Essential understanding of ${topicTitle}.`,
      },
      {
        type: 'qa',
        question: isRu ? `Какие 3 главных правила или практики важны в ${topicTitle}?` : `What are 3 critical best practices in ${topicTitle}?`,
        answer: isRu
          ? '1. Модульность и ясность. 2. Регулярная валидация. 3. Минимизация избыточности.'
          : '1. Modular clarity. 2. Continuous validation. 3. Minimizing cognitive load.',
        explanation: isRu ? 'Практические рекомендации по применению.' : 'Actionable recommendations.',
      },
      {
        type: 'cloze',
        question: isRu ? `Интервальное повторение по теме ${topicTitle}:` : `Spaced retention rule for ${topicTitle}:`,
        answer: isRu ? 'Активное воспроизведение' : 'Active recall',
        clozeText: isRu
          ? `Для долгосрочного запоминания ${topicTitle} наилучший результат дает {{c1::Активное воспроизведение}} (Active Recall).`
          : `For long-term retention of ${topicTitle}, the gold standard is {{c1::Active Recall}}.`,
        explanation: isRu ? 'Принцип SuperMemo SM-2.' : 'SuperMemo SM-2 methodology.',
      },
      {
        type: 'code',
        question: isRu ? `Пример базовой структуры/синтаксиса в контексте ${topicTitle}:` : `Example code / syntax structure for ${topicTitle}:`,
        answer: isRu ? 'Корректная инициализация' : 'Valid syntax setup',
        codeSnippet: `// Example structure for ${topicTitle}\nfunction init${topicTitle.replace(/[^a-zA-Z0-9]/g, '')}() {\n  return { status: "active", topic: "${topicTitle}" };\n}`,
        explanation: isRu ? 'Синтаксический паттерн.' : 'Syntax pattern example.',
      },
    ];

    for (const t of defaultTemplates) {
      if (cards.length >= targetCount) break;
      cards.push(t);
    }
  }

  return {
    cards,
    title: topicTitle,
    description: isRu
      ? `Набор карточек по теме "${topicTitle}" с алгоритмом SuperMemo SM-2.`
      : `Interactive flashcards for "${topicTitle}" powered by SM-2 spacing.`,
    tags: [topicTitle.split(' ')[0], 'SM-2'],
  };
}
