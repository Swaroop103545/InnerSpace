import { JournalEntry } from '../types';

export interface PersonMentionOccurrence {
  entryId: string;
  entryTitle: string;
  entryDate: string;
  entryMood?: string;
  timestamp?: number;
  snippet: string;
  source: 'title' | 'body' | 'tag' | 'polaroid';
}

export interface ScratchedPerson {
  id: string; // normalized key (e.g. lowercase)
  name: string; // proper casing display name
  mentionsCount: number; // total times mentioned across all entries
  entriesCount: number; // number of unique entries
  occurrences: PersonMentionOccurrence[];
  suggestedRelation: 'Family' | 'Friend' | 'Partner' | 'Mentor' | 'Colleague' | 'Other';
  firstMentionDate?: string;
  lastMentionDate?: string;
  associatedMoods: string[];
  isCustom?: boolean;
}

// Kinship words and their implied relation
const KINSHIP_MAP: Record<string, 'Family' | 'Friend'> = {
  mom: 'Family',
  dad: 'Family',
  mother: 'Family',
  father: 'Family',
  mama: 'Family',
  papa: 'Family',
  grandma: 'Family',
  grandpa: 'Family',
  grandmother: 'Family',
  grandfather: 'Family',
  nana: 'Family',
  granny: 'Family',
  sister: 'Family',
  brother: 'Family',
  sis: 'Family',
  bro: 'Family',
  aunt: 'Family',
  uncle: 'Family',
  cousin: 'Family',
  niece: 'Family',
  nephew: 'Family',
  husband: 'Family',
  wife: 'Family',
  partner: 'Family',
  fiancé: 'Family',
  fiance: 'Family',
  fiancée: 'Family',
  fiancee: 'Family',
  son: 'Family',
  daughter: 'Family',
  grandson: 'Family',
  granddaughter: 'Family',
  stepdad: 'Family',
  stepmom: 'Family',
  bestie: 'Friend',
};

// Title prefixes
const PROFESSIONAL_PREFIXES = new Set([
  'dr', 'dr.', 'doctor', 'prof', 'prof.', 'professor', 'coach', 'pastor', 'nurse'
]);

// Stopwords: common English words, dates, or journal prompts that are NOT people names
const STOPWORDS = new Set([
  // Days of week
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  // Months
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
  // Time & date words
  'today', 'tonight', 'tomorrow', 'yesterday', 'morning', 'afternoon', 'evening',
  'night', 'midnight', 'noon', 'day', 'days', 'week', 'weeks', 'month', 'months',
  'year', 'years', 'hour', 'hours', 'minute', 'minutes', 'moment', 'moments',
  // Pronouns
  'i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  // Articles & Determiners
  'the', 'a', 'an', 'this', 'that', 'these', 'those', 'each', 'every', 'all',
  'both', 'few', 'some', 'any', 'most', 'several', 'either', 'neither',
  // Prepositions & Conjunctions
  'and', 'or', 'but', 'nor', 'so', 'yet', 'for', 'if', 'then', 'because', 'since',
  'though', 'although', 'while', 'whereas', 'unless', 'until', 'as',
  'in', 'on', 'at', 'to', 'from', 'with', 'by', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'under', 'over', 'between',
  'out', 'off', 'up', 'down',
  // Common verbs
  'is', 'am', 'are', 'was', 'were', 'be', 'being', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'doing',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'go', 'goes', 'went', 'gone', 'going',
  'come', 'came', 'coming',
  'get', 'got', 'getting',
  'make', 'made', 'making',
  'take', 'took', 'taken', 'taking',
  'see', 'saw', 'seen', 'seeing',
  'know', 'knew', 'known',
  'think', 'thought', 'thinking',
  'feel', 'felt', 'feeling',
  'tell', 'told', 'telling',
  'say', 'said', 'saying',
  'look', 'looked', 'looking',
  'want', 'wanted', 'wanting',
  'give', 'gave', 'given',
  'find', 'found',
  // Common adjectives & Adverbs
  'good', 'great', 'best', 'better', 'nice', 'bad', 'worst', 'worse',
  'new', 'old', 'first', 'last', 'next', 'early', 'late',
  'big', 'small', 'little', 'high', 'low', 'long', 'short',
  'happy', 'sad', 'calm', 'peaceful', 'excited', 'tired', 'grateful',
  'beautiful', 'lovely', 'wonderful', 'amazing', 'perfect', 'sweet',
  'just', 'very', 'really', 'quite', 'too', 'also', 'even', 'still',
  'always', 'never', 'sometimes', 'often', 'usually', 'rarely', 'seldom',
  'almost', 'already', 'again', 'now', 'soon', 'later', 'here', 'there',
  'well', 'oh', 'ah', 'yes', 'no', 'not', 'okay', 'ok',
  'finally', 'suddenly', 'meanwhile', 'actually', 'honestly', 'basically',
  // Journal specific
  'innerspace', 'journal', 'entry', 'daily', 'highlight', 'gratitude', 'challenge',
  'tomorrow', 'intention', 'polaroid', 'memory', 'reflection', 'note', 'page',
  'thoughts', 'personal', 'creative', 'travel', 'wellness', 'work', 'life',
  'coffee', 'tea', 'matcha', 'latte', 'cafe', 'bistro', 'restaurant', 'food',
  'breakfast', 'lunch', 'dinner', 'brunch', 'walk', 'run', 'hike', 'park',
  'book', 'reading', 'music', 'song', 'movie', 'photo', 'picture', 'home',
  'room', 'bed', 'desk', 'office', 'school', 'gym', 'beach', 'mountain',
  'spring', 'summer', 'autumn', 'fall', 'winter', 'sun', 'rain', 'snow',
  'wind', 'clouds', 'weather', 'sky', 'stars', 'moon',
  'god', 'lord', 'peace', 'joy', 'love', 'hope', 'faith', 'grace',
]);

// Curated library of hundreds of common given names across various cultures
const POPULAR_NAMES = new Set([
  // Female names
  'emma', 'olivia', 'ava', 'isabella', 'sophia', 'charlotte', 'mia', 'amelia',
  'harper', 'evelyn', 'abigail', 'emily', 'elizabeth', 'mila', 'ella', 'avery',
  'sofia', 'camila', 'aria', 'scarlett', 'victoria', 'madison', 'luna', 'grace',
  'chloe', 'penelope', 'layla', 'riley', 'zoey', 'nora', 'lily', 'eleanor',
  'hannah', 'lillian', 'addison', 'aubrey', 'ellie', 'stella', 'natalie', 'zoe',
  'leah', 'hazel', 'violet', 'aurora', 'savannah', 'audrey', 'brooklyn', 'bella',
  'claire', 'skylar', 'isla', 'genesis', 'elena', 'naomi', 'caroline',
  'maya', 'anna', 'serenity', 'alyssa', 'sarah', 'allison', 'gabriella', 'alice',
  'sadie', 'hailey', 'eva', 'emilia', 'autumn', 'quinn', 'nevaeh', 'piper',
  'ruby', 'seraphina', 'ivy', 'willow', 'clara', 'lydia', 'rose', 'fiona',
  'julia', 'rachel', 'jessica', 'ashley', 'amanda', 'brittany', 'megan', 'lauren',
  'amber', 'danielle', 'melissa', 'rebecca', 'laura', 'stephanie', 'nicole',
  'heather', 'mary', 'patricia', 'jennifer', 'linda', 'barbara', 'susan',
  'margaret', 'dorothy', 'lisa', 'nancy', 'karen', 'betty', 'helen', 'sandra',
  'donna', 'carol', 'ruth', 'sharon', 'michelle', 'kimberly', 'deborah',
  'priya', 'ananya', 'diya', 'aadhya', 'sanvi', 'sara', 'pari', 'anika', 'navya',
  'pooja', 'riya', 'sneha', 'tanvi', 'neha', 'kavya', 'shreya', 'isha', 'simran',
  'fatima', 'aisha', 'mariam', 'zainab', 'yasmin', 'noor', 'leila', 'amira',
  'mei', 'lin', 'yan', 'ting', 'xin', 'hui', 'sakura', 'yui', 'aoi', 'hina', 'rin',
  'valentina', 'lucia', 'maria', 'catalina', 'ximena', 'mariana',

  // Male names
  'liam', 'noah', 'oliver', 'william', 'elijah', 'james', 'benjamin', 'lucas',
  'henry', 'alexander', 'mason', 'michael', 'ethan', 'daniel', 'jacob', 'logan',
  'jackson', 'levi', 'sebastian', 'mateo', 'jack', 'owen', 'theodore', 'aiden',
  'samuel', 'joseph', 'john', 'david', 'wyatt', 'matthew', 'luke', 'asher',
  'carter', 'julian', 'grayson', 'leo', 'jayden', 'gabriel', 'isaac', 'lincoln',
  'anthony', 'hudson', 'dylan', 'ezra', 'thomas', 'charles', 'christopher', 'jaxon',
  'maverick', 'josiah', 'isaiah', 'andrew', 'elias', 'joshua', 'nathan', 'caleb',
  'ryan', 'adrian', 'miles', 'eli', 'nolan', 'christian', 'aaron', 'cameron',
  'ezekiel', 'colton', 'luca', 'landon', 'hunter', 'jonathan', 'santiago', 'axel',
  'easton', 'cooper', 'jeremiah', 'angel', 'roman', 'connor', 'jameson', 'robert',
  'greyson', 'jordan', 'ian', 'carson', 'jaxson', 'leonardo', 'nicholas', 'dominic',
  'austin', 'adam', 'xavier', 'jose', 'jace', 'everett', 'declan', 'evan', 'kayden',
  'parker', 'wesley', 'kai', 'brayden', 'bryson', 'weston', 'jason', 'micah',
  'silas', 'rowan', 'waylon', 'arthur', 'damian', 'vincent', 'cole', 'diego',
  'harrison', 'george', 'ivan', 'tyler', 'kaiden', 'ashton', 'alan', 'calvin',
  'luis', 'blake', 'brody', 'jesse', 'alex', 'sam', 'chris', 'max', 'ben', 'dan',
  'tom', 'tim', 'jake', 'mike', 'dave', 'matt', 'nick', 'tony', 'paul', 'mark',
  'aarav', 'vivaan', 'aditya', 'vihaan', 'arjun', 'sai', 'reyansh', 'ayaan',
  'krishna', 'ishan', 'shaurya', 'rahul', 'rohan', 'amit', 'vikram', 'dev', 'kabir',
  'omar', 'ali', 'ahmed', 'hassan', 'hussein', 'tariq', 'bilal', 'kareem', 'zayd',
  'carlos', 'juan', 'alejandro', 'miguel', 'javier', 'fernando',
  'chen', 'wei', 'hao', 'jun', 'ming', 'ren', 'haruto', 'hinata', 'yuto', 'sota',
]);

const PRECEDING_TRIGGERS = [
  'with', 'and', 'met', 'meet', 'meeting', 'visited', 'visiting', 'visit',
  'called', 'calling', 'call', 'talked to', 'talking to', 'talk to',
  'spoke with', 'speaking with', 'spoke to', 'speaking to',
  'saw', 'seeing', 'see', 'hung out with', 'hanging out with', 'hang out with',
  'spent time with', 'spending time with', 'spend time with',
  'dinner with', 'lunch with', 'brunch with', 'breakfast with', 'coffee with', 'drinks with',
  'walked with', 'walking with', 'walk with', 'helped', 'helping', 'help',
  'told', 'telling', 'tell', 'texted', 'texting', 'text',
  'messaged', 'messaging', 'chatted with', 'chatting with',
  'hugged', 'hugging', 'miss', 'missing', 'missed',
  'invited', 'inviting', 'invite', 'thanked', 'thanking', 'thank',
  'thanks to', 'for', 'from', 'to', 'by', 'about', 'congratulated',
];

export function formatPersonName(raw: string): string {
  const cleaned = raw.trim().replace(/^[@#]/, '').replace(/[.,!?;:'"()[\]{}]/g, '');
  return cleaned
    .split(/\s+/)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower.startsWith('dr')) return 'Dr.';
      if (lower.startsWith('mr.')) return 'Mr.';
      if (lower.startsWith('mrs.')) return 'Mrs.';
      if (lower.startsWith('ms.')) return 'Ms.';
      if (part.length === 0) return '';
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .filter(Boolean)
    .join(' ');
}

function createSnippet(text: string, targetName: string): string {
  if (!text) return '';
  const lowerText = text.toLowerCase();
  const lowerTarget = targetName.toLowerCase();
  const idx = lowerText.indexOf(lowerTarget);
  if (idx === -1) {
    return text.slice(0, 90).trim() + (text.length > 90 ? '...' : '');
  }

  const start = Math.max(0, idx - 35);
  const end = Math.min(text.length, idx + targetName.length + 45);
  let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

function inferRelationship(
  name: string,
  contextText = ''
): 'Family' | 'Friend' | 'Partner' | 'Mentor' | 'Colleague' | 'Other' {
  const lower = name.toLowerCase();
  if (KINSHIP_MAP[lower]) {
    return KINSHIP_MAP[lower];
  }
  if (lower.startsWith('dr.') || lower.startsWith('dr ') || lower.startsWith('prof')) {
    return 'Mentor';
  }

  const lowerContext = contextText.toLowerCase();
  if (
    lowerContext.includes('work') ||
    lowerContext.includes('office') ||
    lowerContext.includes('colleague') ||
    lowerContext.includes('meeting') ||
    lowerContext.includes('presentation') ||
    lowerContext.includes('project')
  ) {
    return 'Colleague';
  }

  if (
    lowerContext.includes('love') ||
    lowerContext.includes('date') ||
    lowerContext.includes('partner') ||
    lowerContext.includes('boyfriend') ||
    lowerContext.includes('girlfriend')
  ) {
    return 'Partner';
  }

  if (
    lowerContext.includes('mentor') ||
    lowerContext.includes('teacher') ||
    lowerContext.includes('coach') ||
    lowerContext.includes('doctor') ||
    lowerContext.includes('advisor')
  ) {
    return 'Mentor';
  }

  return 'Friend';
}

function cleanDailyJournalText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\[\[DAILY_JOURNAL\]\]/g, '')
    .replace(/Today’s highlight|Today's highlight/gi, '')
    .replace(/Grateful for/gi, '')
    .replace(/Today’s challenge|Today's challenge/gi, '')
    .replace(/Tomorrow’s intention|Tomorrow's intention/gi, '');
}

interface SpanMatch {
  name: string;
  start: number;
  end: number;
  source: 'title' | 'body' | 'tag' | 'polaroid';
  textContext: string;
}

/**
 * Scratches and extracts all people names and their exact mention counts from journal entries
 */
export function scratchPeopleFromEntries(
  entries: JournalEntry[],
  ignoredNames: string[] = []
): ScratchedPerson[] {
  const ignoredSet = new Set(ignoredNames.map((n) => n.trim().toLowerCase()));
  const peopleMap: Map<string, ScratchedPerson> = new Map();

  // Helper to record a detected mention
  const recordMention = (
    rawName: string,
    entry: JournalEntry,
    source: 'title' | 'body' | 'tag' | 'polaroid',
    contextText: string
  ) => {
    const formatted = formatPersonName(rawName);
    const key = formatted.toLowerCase();

    if (!key || key.length < 2) return;
    if (STOPWORDS.has(key)) return;
    if (ignoredSet.has(key)) return;
    if (!/^[a-zA-Z]/.test(formatted)) return;

    const existing = peopleMap.get(key);
    const snippet = createSnippet(contextText, formatted);

    const occurrence: PersonMentionOccurrence = {
      entryId: entry.id,
      entryTitle: entry.title || 'Untitled Entry',
      entryDate: entry.date,
      entryMood: entry.mood,
      timestamp: entry.timestamp,
      snippet,
      source,
    };

    if (existing) {
      existing.mentionsCount += 1;
      existing.occurrences.push(occurrence);
      if (entry.mood && !existing.associatedMoods.includes(entry.mood)) {
        existing.associatedMoods.push(entry.mood);
      }
      if (entry.date) {
        existing.lastMentionDate = entry.date;
      }
    } else {
      const suggestedRelation = inferRelationship(formatted, contextText);
      peopleMap.set(key, {
        id: key,
        name: formatted,
        mentionsCount: 1,
        entriesCount: 1,
        occurrences: [occurrence],
        suggestedRelation,
        firstMentionDate: entry.date,
        lastMentionDate: entry.date,
        associatedMoods: entry.mood ? [entry.mood] : [],
      });
    }
  };

  for (const entry of entries) {
    const titleText = entry.title || '';
    const bodyText = cleanDailyJournalText(entry.body || '');
    const polaroidCaption = entry.polaroid?.caption || '';

    // Process each text source with non-overlapping spans
    const processTextSpans = (text: string, source: 'title' | 'body' | 'polaroid') => {
      if (!text.trim()) return;

      const detectedSpans: SpanMatch[] = [];

      // Check if a span overlaps an already matched span
      const isOverlapping = (start: number, end: number) => {
        return detectedSpans.some(
          (s) => Math.max(s.start, start) < Math.min(s.end, end)
        );
      };

      // 1. Explicit @mentions (e.g. "@Sarah", "@Alex Smith")
      const atMentionPattern = /@([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|[a-zA-Z]+)/g;
      let atMatch: RegExpExecArray | null;
      while ((atMatch = atMentionPattern.exec(text)) !== null) {
        const captured = atMatch[1];
        const start = atMatch.index;
        const end = start + atMatch[0].length;
        if (captured && !STOPWORDS.has(captured.toLowerCase())) {
          detectedSpans.push({ name: captured, start, end, source, textContext: text });
        }
      }

      // 2. Title Prefixes (e.g. "Dr. Miller", "Uncle Dave", "Aunt May")
      const prefixPattern = /\b(Dr\.|Doctor|Prof\.|Professor|Coach|Uncle|Aunt|Pastor)\s+([A-Z][a-z]+)/gi;
      let prefixMatch: RegExpExecArray | null;
      while ((prefixMatch = prefixPattern.exec(text)) !== null) {
        const start = prefixMatch.index;
        const end = start + prefixMatch[0].length;
        if (!isOverlapping(start, end)) {
          const fullTitleName = `${prefixMatch[1]} ${prefixMatch[2]}`;
          detectedSpans.push({ name: fullTitleName, start, end, source, textContext: text });
        }
      }

      // 3. Kinship standalone words ("Mom", "Dad", "Grandma", "Grandpa")
      const kinshipPattern = /\b(Mom|Dad|Mother|Father|Grandma|Grandpa|Grandmother|Grandfather|Nana|Papa|Sister|Brother|Bestie)\b/gi;
      let kinshipMatch: RegExpExecArray | null;
      while ((kinshipMatch = kinshipPattern.exec(text)) !== null) {
        const start = kinshipMatch.index;
        const end = start + kinshipMatch[0].length;
        if (!isOverlapping(start, end)) {
          detectedSpans.push({ name: kinshipMatch[1], start, end, source, textContext: text });
        }
      }

      // 4. Preposition / Verb triggers ("with Sarah", "talked to Lucas", "and Maya")
      const triggerPattern = new RegExp(
        `\\b(?:${PRECEDING_TRIGGERS.join('|')})\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)`,
        'gi'
      );
      let triggerMatch: RegExpExecArray | null;
      while ((triggerMatch = triggerPattern.exec(text)) !== null) {
        const rawCaptured = triggerMatch[1];
        if (rawCaptured) {
          const fullMatchStr = triggerMatch[0];
          const nameOffset = fullMatchStr.lastIndexOf(rawCaptured);
          const start = triggerMatch.index + nameOffset;
          const end = start + rawCaptured.length;

          if (!isOverlapping(start, end)) {
            const parts = rawCaptured.split(/\s+/);
            for (const part of parts) {
              const lower = part.toLowerCase();
              if (!STOPWORDS.has(lower) && part.length > 1) {
                detectedSpans.push({ name: part, start, end, source, textContext: text });
              }
            }
          }
        }
      }

      // 5. Popular Names Dictionary Check
      const wordPattern = /\b[A-Z][a-z]+\b/g;
      let wordMatch: RegExpExecArray | null;
      while ((wordMatch = wordPattern.exec(text)) !== null) {
        const start = wordMatch.index;
        const end = start + wordMatch[0].length;
        if (!isOverlapping(start, end)) {
          const lower = wordMatch[0].toLowerCase();
          if (POPULAR_NAMES.has(lower) && !STOPWORDS.has(lower)) {
            detectedSpans.push({ name: wordMatch[0], start, end, source, textContext: text });
          }
        }
      }

      // Record each unique span mention
      for (const span of detectedSpans) {
        recordMention(span.name, entry, span.source, span.textContext);
      }
    };

    // Process Title, Body, and Polaroid Caption
    processTextSpans(titleText, 'title');
    processTextSpans(bodyText, 'body');
    processTextSpans(polaroidCaption, 'polaroid');

    // 6. Process Tags
    if (Array.isArray(entry.tags)) {
      for (const tag of entry.tags) {
        const cleanTag = tag.replace(/^[@#]/, '').trim();
        const lower = cleanTag.toLowerCase();
        if (
          (POPULAR_NAMES.has(lower) || KINSHIP_MAP[lower]) &&
          !STOPWORDS.has(lower)
        ) {
          recordMention(cleanTag, entry, 'tag', `Tag: #${cleanTag}`);
        }
      }
    }
  }

  // Calculate unique entries count
  const results: ScratchedPerson[] = Array.from(peopleMap.values()).map((person) => {
    const uniqueEntryIds = new Set(person.occurrences.map((o) => o.entryId));
    return {
      ...person,
      entriesCount: uniqueEntryIds.size,
    };
  });

  // Sort descending by mentions count, then alphabetical
  results.sort((a, b) => {
    if (b.mentionsCount !== a.mentionsCount) {
      return b.mentionsCount - a.mentionsCount;
    }
    return a.name.localeCompare(b.name);
  });

  return results;
}
