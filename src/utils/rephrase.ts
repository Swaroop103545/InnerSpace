export type RephraseTone = 'reflective' | 'poetic' | 'concise' | 'uplifting';

export interface ToneOption {
  id: RephraseTone;
  name: string;
  emoji: string;
  description: string;
}

export const REPHRASE_TONES: ToneOption[] = [
  {
    id: 'reflective',
    name: 'Reflective',
    emoji: '🌿',
    description: 'Calm, thoughtful, and introspective journal voice',
  },
  {
    id: 'poetic',
    name: 'Poetic',
    emoji: '✨',
    description: 'Lyrical, vivid, and evocative sensory imagery',
  },
  {
    id: 'concise',
    name: 'Polished',
    emoji: '🎯',
    description: 'Clean, articulate, and well-structured thoughts',
  },
  {
    id: 'uplifting',
    name: 'Uplifting',
    emoji: '☀️',
    description: 'Warm, grateful, and positive perspective',
  },
];

// Common contractions & internet slang normalizer
const SLANG_MAP: Record<string, string> = {
  im: "I'm",
  dont: "don't",
  cant: "can't",
  wont: "won't",
  didnt: "didn't",
  isnt: "isn't",
  arent: "aren't",
  wasnt: "wasn't",
  werent: "weren't",
  couldnt: "couldn't",
  shouldnt: "shouldn't",
  wouldnt: "wouldn't",
  havent: "haven't",
  hasnt: "hasn't",
  gonna: 'going to',
  wanna: 'want to',
  gotta: 'need to',
  kinda: 'somewhat',
  sorta: 'rather',
  cuz: 'because',
  bc: 'because',
  bcz: 'because',
  idk: "I don't know",
  tbh: 'to be honest',
  ngl: 'truthfully',
  rn: 'right now',
  btw: 'by the way',
  pls: 'please',
  thx: 'thanks',
  u: 'you',
  ur: 'your',
  r: 'are',
};

// Quick expansions for ultra-short single thoughts or status words
const SHORT_INPUT_EXPANSIONS: Record<string, Record<RephraseTone, string[]>> = {
  tired: {
    reflective: [
      'Feeling an honest exhaustion at the end of the day, giving myself full permission to rest and recharge.',
      'My body is asking for quiet stillness tonight, and I am choosing to listen and slow down.',
    ],
    poetic: [
      'Heavy eyelids and the quiet dusk—yielding gently to the soft embrace of night.',
      'The hours grew long, carrying a soft fatigue like shadows stretching across the floor.',
    ],
    concise: [
      'Feeling drained from today’s demands; prioritizing restorative rest tonight.',
      'Energy is low; taking the evening to recharge and recover focus.',
    ],
    uplifting: [
      'Weary in body but thankful for all that today brought; looking forward to waking up recharged tomorrow!',
      'Gave my all to the day, and now embracing peaceful rest with a grateful heart.',
    ],
  },
  stressed: {
    reflective: [
      'Navigating a heavy wave of pressure today, taking a deep breath to remind myself that it is okay to pause.',
      'Sitting with feelings of tension, learning to let go of what I cannot control one breath at a time.',
    ],
    poetic: [
      'Caught within a swirling current of restless thoughts, waiting for the inner storm to soften.',
      'Tension whispered through the hours, yet within the quiet, a gentle stillness waits to be found.',
    ],
    concise: [
      'Managing elevated stress and workload; taking deliberate steps to regain calm and perspective.',
      'Feeling the weight of current responsibilities; focusing on one task at a time.',
    ],
    uplifting: [
      'Though things feel overwhelming right now, I know this season will pass and I am stronger than this stress.',
      'Taking a deep breath and choosing peace over panic—everything will work out in time.',
    ],
  },
  happy: {
    reflective: [
      'Today brought a genuine sense of warmth and contentment that lingered long after the day ended.',
      'Noticing a pleasant lightness in my spirit today, deeply savoring these moments of peace.',
    ],
    poetic: [
      'Golden light bathed the hours today, leaving a quiet, enduring warmth in my heart.',
      'A gentle joy danced through the day like sunlight rippling across calm water.',
    ],
    concise: [
      'Today was productive, uplifting, and genuinely enjoyable.',
      'In great spirits today after several positive and fulfilling moments.',
    ],
    uplifting: [
      'My heart is overflowing with gratitude today—celebrating all the bright moments that came my way!',
      'So much to smile about today! Feeling blessed, energized, and deeply thankful.',
    ],
  },
  bored: {
    reflective: [
      'Finding myself in an unscheduled stillness today, learning to appreciate the absence of constant rush.',
      'A quiet day with little happening on the surface, offering space to reflect and listen inward.',
    ],
    poetic: [
      'Time drifted slowly like autumn leaves on still water, unhurried and quiet.',
      'An empty afternoon unfurled, echoing with the soft stillness of nothing to do.',
    ],
    concise: [
      'A quiet, low-activity day; taking advantage of the downtime to reset.',
      'Nothing pressing on the agenda today; enjoying the mental break.',
    ],
    uplifting: [
      'Grateful for an unhurried, calm day with zero pressure—a wonderful chance to rest and dream!',
      'A quiet day is a blank canvas, full of potential for whatever comes next.',
    ],
  },
};

// Rich vocabulary synonyms by tone
const VERB_SYNONYMS: Record<RephraseTone, [RegExp, string[]][]> = {
  reflective: [
    [/\b(went to the gym|going to the gym|hit the gym|worked out)\b/gi, ['dedicated time to physical movement', 'focused on intentional exercise', 'channeled energy into training my body']],
    [/\b(watched netflix|watching netflix|watched tv|watching tv|watched a movie)\b/gi, ['unwound by watching stories unfold on screen', 'allowed my mind to decompress with some screen time']],
    [/\b(did homework|doing homework|finished homework)\b/gi, ['immersed myself in study and focused assignments', 'brought my academic work to completion']],
    [/\b(ate food|ate dinner|eating dinner|had dinner|had lunch|ate lunch)\b/gi, ['sat down to a nourishing meal', 'enjoyed a wholesome meal to recharge', 'nourished my body with dinner']],
    [/\b(had coffee|drinking coffee|made coffee|got coffee)\b/gi, ['savored a warm, grounding cup of coffee', 'paused for a mindful moment over freshly brewed coffee']],
    [/\b(went for a walk|walked around|taking a walk)\b/gi, ['stepped outside for an unhurried, grounding walk', 'wandered mindfully to clear mental clutter']],
    [/\b(hung out with|chatted with|talked to|talked with)\b/gi, ['shared meaningful moments of connection with', 'spent quality, heartfelt time with']],
    [/\b(woke up early|woke up)\b/gi, ['awakened with the quiet dawn', 'greeted the early hours with quiet intention']],
    [/\b(felt sad|feeling down|feeling sad)\b/gi, ['sat with a tender heaviness in my chest', 'acknowledged a quiet sadness without judging it']],
    [/\b(felt angry|got mad|annoyed)\b/gi, ['felt frustration surge, observing it before reacting', 'wrestled with a wave of irritation, seeking balance']],
    [/\b(coded|coding|working on code|wrote code)\b/gi, ['immersed myself in creative problem-solving and code', 'spent dedicated hours crafting logic and solving puzzles']],
    [/\b(want to build muscle|build muscle)\b/gi, ['cultivating physical strength and resilience', 'building bodily strength with patient discipline']],
    [/\b(stay healthy|be healthy)\b/gi, ['nurturing long-term vitality and wellness', 'prioritizing my health with care and intention']],
  ],
  poetic: [
    [/\b(went to the gym|going to the gym|hit the gym|worked out)\b/gi, ['tested the limits of sinew and breath', 'channeled fiery energy into movement beneath the bright lights']],
    [/\b(watched netflix|watching netflix|watched tv|watching tv|watched a movie)\b/gi, ['let twilight melt away in front of moving pictures and narratives', 'drifted through cinematic worlds in the quiet evening']],
    [/\b(did homework|doing homework|finished homework)\b/gi, ['poured thoughts onto paper and keys into the late hours', 'conquered pages of studies before the night grew cold']],
    [/\b(ate food|ate dinner|eating dinner|had dinner|had lunch|ate lunch)\b/gi, ['partook of a warm, comforting feast', 'gathered around warm flavors and quiet nourishment']],
    [/\b(had coffee|drinking coffee|made coffee|got coffee)\b/gi, ['sipped steam and dark roast as morning silence filled the air', 'held the comforting warmth of fresh brew in cold hands']],
    [/\b(went for a walk|walked around|taking a walk)\b/gi, ['wandered beneath the open canopy of the sky', 'let my footsteps trace quiet paths under whispering trees']],
    [/\b(hung out with|chatted with|talked to|talked with)\b/gi, ['wove threads of laughter and shared memory with', 'shared warmth and unhurried words with']],
    [/\b(woke up early|woke up)\b/gi, ['stepped into the world while pastel dawn still kissed the horizon', 'awoke to the softest blue hues of the morning']],
    [/\b(felt sad|feeling down|feeling sad)\b/gi, ['felt shadows stretch long across the corridors of the heart', 'carried an ache like autumn rain against window glass']],
    [/\b(felt angry|got mad|annoyed)\b/gi, ['felt a sudden spark ignite within the chest', 'storm clouds gathered quickly in the mind']],
    [/\b(coded|coding|working on code|wrote code)\b/gi, ['wove lines of digital architecture into being', 'sculpted thoughts into glowing lines of syntax']],
    [/\b(want to build muscle|build muscle)\b/gi, ['forging strength into muscle and bone', 'tempering body and endurance']],
    [/\b(stay healthy|be healthy)\b/gi, ['tending to the sacred vessel of body and spirit', 'nurturing the fire of vitality within']],
  ],
  concise: [
    [/\b(went to the gym|going to the gym|hit the gym|worked out)\b/gi, ['went to the gym for a training session', 'completed a structured workout']],
    [/\b(watched netflix|watching netflix|watched tv|watching tv|watched a movie)\b/gi, ['unwound with some television', 'spent downtime watching Netflix']],
    [/\b(did homework|doing homework|finished homework)\b/gi, ['completed my required assignments', 'finished academic tasks']],
    [/\b(ate food|ate dinner|eating dinner|had dinner|had lunch|ate lunch)\b/gi, ['had a balanced meal', 'ate dinner and recharged']],
    [/\b(had coffee|drinking coffee|made coffee|got coffee)\b/gi, ['enjoyed a cup of coffee', 'took a quick coffee break']],
    [/\b(went for a walk|walked around|taking a walk)\b/gi, ['took a walk outdoors', 'went for an evening walk to clear my head']],
    [/\b(hung out with|chatted with|talked to|talked with)\b/gi, ['spent time catching up with', 'met with']],
    [/\b(woke up early|woke up)\b/gi, ['woke up early and got moving', 'started the morning early']],
    [/\b(felt sad|feeling down|feeling sad)\b/gi, ['felt low in mood today', 'experienced feelings of sadness']],
    [/\b(felt angry|got mad|annoyed)\b/gi, ['felt frustrated with the situation', 'encountered frustrating obstacles']],
    [/\b(coded|coding|working on code|wrote code)\b/gi, ['focused on software development', 'worked on coding tasks and logic']],
    [/\b(want to build muscle|build muscle)\b/gi, ['working on muscular strength', 'building physical strength']],
    [/\b(stay healthy|be healthy)\b/gi, ['maintaining physical health', 'protecting overall wellness']],
  ],
  uplifting: [
    [/\b(went to the gym|going to the gym|hit the gym|worked out)\b/gi, ['invested positive energy at the gym', 'energized body and soul through a great workout']],
    [/\b(watched netflix|watching netflix|watched tv|watching tv|watched a movie)\b/gi, ['treated myself to cozy relaxation with Netflix', 'enjoyed some comforting, well-earned downtime']],
    [/\b(did homework|doing homework|finished homework)\b/gi, ['proudly tackled my study goals', 'powered through my assignments with determination']],
    [/\b(ate food|ate dinner|eating dinner|had dinner|had lunch|ate lunch)\b/gi, ['blessed with a delicious, satisfying meal', 'savored every bite of a wonderful dinner']],
    [/\b(had coffee|drinking coffee|made coffee|got coffee)\b/gi, ['delighted in a warm, uplifting cup of coffee', 'started with the comforting aroma of fresh coffee']],
    [/\b(went for a walk|walked around|taking a walk)\b/gi, ['embraced the fresh air with an invigorating walk', 'enjoyed a wonderful, refreshing stroll outdoors']],
    [/\b(hung out with|chatted with|talked to|talked with)\b/gi, ['cherished joyful moments connecting with', 'shared heartwarming conversations with']],
    [/\b(woke up early|woke up)\b/gi, ['greeted the day with gratitude and optimism', 'woke up eager to welcome the blessings of a new day']],
    [/\b(felt sad|feeling down|feeling sad)\b/gi, ['honoring my tender feelings while trusting in brighter days ahead', 'gentle with myself through low moments, knowing hope remains']],
    [/\b(felt angry|got mad|annoyed)\b/gi, ['taking a deep breath and choosing grace over frustration', 'releasing irritation and choosing peace']],
    [/\b(coded|coding|working on code|wrote code)\b/gi, ['brought exciting digital ideas to life through code', 'enjoyed the spark of creating and coding']],
    [/\b(want to build muscle|build muscle)\b/gi, ['celebrating the strength my body can build', 'loving the journey of growing stronger and fitter']],
    [/\b(stay healthy|be healthy)\b/gi, ['cherishing my health and vibrant well-being', 'investing in radiant health and long-lasting vitality']],
  ],
};

// General single-word synonym upgrades
const WORD_UPGRADES: Record<RephraseTone, [RegExp, string][]> = {
  reflective: [
    [/\b(good|great|nice|awesome)\b/gi, 'meaningful'],
    [/\b(bad|terrible|awful)\b/gi, 'challenging'],
    [/\b(hard|difficult)\b/gi, 'demanding'],
    [/\b(lot of|lots of|many)\b/gi, 'an abundance of'],
    [/\b(stuff|things)\b/gi, 'elements'],
    [/\b(stressed|overwhelmed)\b/gi, 'carrying heavy tension'],
    [/\b(tired|exhausted)\b/gi, 'weary in spirit'],
    [/\b(confused|lost)\b/gi, 'in an unresolved space'],
    [/\b(scared|afraid)\b/gi, 'vulnerable'],
  ],
  poetic: [
    [/\b(good|great|nice|awesome)\b/gi, 'luminous'],
    [/\b(bad|terrible|awful)\b/gi, 'shadowed'],
    [/\b(hard|difficult)\b/gi, 'steep and rugged'],
    [/\b(lot of|lots of|many)\b/gi, 'a constellation of'],
    [/\b(stuff|things)\b/gi, 'fragments of life'],
    [/\b(stressed|overwhelmed)\b/gi, 'weathering a tempest'],
    [/\b(tired|exhausted)\b/gi, 'softened by exhaustion'],
    [/\b(confused|lost)\b/gi, 'wandering through misty paths'],
    [/\b(scared|afraid)\b/gi, 'trembling before the unknown'],
  ],
  concise: [
    [/\b(good|great|nice|awesome)\b/gi, 'positive'],
    [/\b(bad|terrible|awful)\b/gi, 'adverse'],
    [/\b(hard|difficult)\b/gi, 'complex'],
    [/\b(lot of|lots of|many)\b/gi, 'multiple'],
    [/\b(stuff|things)\b/gi, 'tasks'],
    [/\b(stressed|overwhelmed)\b/gi, 'under pressure'],
    [/\b(tired|exhausted)\b/gi, 'fatigued'],
    [/\b(confused|lost)\b/gi, 'uncertain'],
    [/\b(scared|afraid)\b/gi, 'concerned'],
  ],
  uplifting: [
    [/\b(good|great|nice|awesome)\b/gi, 'wonderful'],
    [/\b(bad|terrible|awful)\b/gi, 'a learning opportunity'],
    [/\b(hard|difficult)\b/gi, 'character-building'],
    [/\b(lot of|lots of|many)\b/gi, 'so many exciting'],
    [/\b(stuff|things)\b/gi, 'possibilities'],
    [/\b(stressed|overwhelmed)\b/gi, 'ready to rise above the pressure'],
    [/\b(tired|exhausted)\b/gi, 'grateful for all the effort spent'],
    [/\b(confused|lost)\b/gi, 'on the verge of discovery'],
    [/\b(scared|afraid)\b/gi, 'bravely facing the challenge'],
  ],
};

// Sentence framing wrappers if no specific dictionary matches, or to enhance tone
const TONE_FRAMINGS: Record<RephraseTone, ((sentence: string, idx: number) => string)[]> = {
  reflective: [
    (s) => `Taking time to reflect: ${s.charAt(0).toLowerCase() + s.slice(1)}`,
    (s) => `Looking inward today, ${s.charAt(0).toLowerCase() + s.slice(1)}`,
    (s) => `In this quiet moment of contemplation: ${s}`,
    (s) => `${s} — observing this experience with calm presence and mindful perspective.`,
  ],
  poetic: [
    (s) => `As the hours gently unfolded, ${s.charAt(0).toLowerCase() + s.slice(1)}`,
    (s) => `Beneath the quiet expanse of the sky, ${s.charAt(0).toLowerCase() + s.slice(1)}`,
    (s) => `Like light filtering through autumn leaves, ${s.charAt(0).toLowerCase() + s.slice(1)}`,
    (s) => `${s} — a fleeting whisper woven into the tapestry of the day.`,
  ],
  concise: [
    (s) => `${s}`,
    (s) => `Day in review: ${s}`,
    (s) => `Key takeaway: ${s.charAt(0).toLowerCase() + s.slice(1)}`,
    (s) => `${s} — maintaining clarity and focus.`,
  ],
  uplifting: [
    (s) => `Grateful for today: ${s.charAt(0).toLowerCase() + s.slice(1)}`,
    (s) => `With an open and optimistic heart, ${s.charAt(0).toLowerCase() + s.slice(1)}`,
    (s) => `Embracing every step of the journey: ${s}`,
    (s) => `${s} — choosing joy, gratitude, and confidence for what lies ahead!`,
  ],
};

/**
 * Attempts to rephrase using Google Gemini API if an API key is available.
 */
async function rephraseWithGemini(
  text: string,
  tone: RephraseTone,
  apiKey: string
): Promise<string | null> {
  try {
    const prompt = `You are a supportive, articulate personal journaling editor. 
Rephrase the following journal entry to adopt a ${tone} tone (${REPHRASE_TONES.find((t) => t.id === tone)?.description}).
Guidelines:
- Keep the author's original personal meaning, events, people, and core emotions intact.
- Enhance vocabulary, rhythm, and emotional resonance.
- Preserve general paragraph breaks.
- Do NOT add disclaimers, conversational replies, markdown code blocks, or quotation marks around the output.
- Output ONLY the rephrased entry text.

Original entry:
${text}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText && typeof candidateText === 'string') {
      return candidateText.trim();
    }
  } catch (error) {
    console.warn('Gemini API call failed, falling back to local transformer:', error);
  }
  return null;
}

/**
 * Offline smart NLP journal rephraser.
 * Guarantees that ANY text is transformed and rewritten into the selected tone!
 */
export function rephraseOffline(
  text: string,
  tone: RephraseTone = 'reflective',
  variantIndex: number = 0
): string {
  const trimmedInput = text.trim();
  if (!trimmedInput) return text;

  // Check ultra-short single keywords (e.g., "tired", "stressed", "happy", "bored")
  const lowerSingle = trimmedInput.toLowerCase().replace(/[^a-z]/g, '');
  if (SHORT_INPUT_EXPANSIONS[lowerSingle]) {
    const pool = SHORT_INPUT_EXPANSIONS[lowerSingle][tone];
    if (pool && pool.length > 0) {
      return pool[variantIndex % pool.length];
    }
  }

  // Split into paragraphs to preserve layout
  const paragraphs = text.split('\n');

  const rephrasedParagraphs = paragraphs.map((paragraph, pIdx) => {
    let clean = paragraph.trim();
    if (!clean) return '';

    const originalForCompare = clean;

    // 1. Expand informal contractions and internet slang
    Object.entries(SLANG_MAP).forEach(([slang, formal]) => {
      const regex = new RegExp(`\\b${slang}\\b`, 'gi');
      clean = clean.replace(regex, formal);
    });

    // 2. Fix standalone lowercase "i" to "I"
    clean = clean.replace(/\bi\b/g, 'I');
    clean = clean.replace(/\bi'm\b/g, "I'm");
    clean = clean.replace(/\bi've\b/g, "I've");
    clean = clean.replace(/\bi'll\b/g, "I'll");
    clean = clean.replace(/\bi'd\b/g, "I'd");

    // 3. Apply tone-specific action and verb synonyms
    const verbList = VERB_SYNONYMS[tone] || [];
    verbList.forEach(([regex, options]) => {
      clean = clean.replace(regex, () => {
        return options[(variantIndex + pIdx) % options.length];
      });
    });

    // 4. Apply single-word upgrades
    const wordList = WORD_UPGRADES[tone] || [];
    wordList.forEach(([regex, replacement]) => {
      clean = clean.replace(regex, replacement);
    });

    // 5. Split paragraph into sentences
    const sentenceEndRegex = /([.?!]+["']?\s+)/g;
    const rawTokens = clean.split(sentenceEndRegex);
    const sentences: string[] = [];

    for (let i = 0; i < rawTokens.length; i += 2) {
      const sent = rawTokens[i];
      const delim = rawTokens[i + 1] || '';
      if (sent.trim()) {
        sentences.push((sent + delim).trim());
      }
    }

    if (sentences.length === 0) {
      sentences.push(clean);
    }

    // Transform each sentence
    const formattedSentences = sentences.map((s, sIdx) => {
      let trimmed = s.trim();
      if (!trimmed) return '';

      // Ensure first character is capitalized
      trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

      // Ensure proper end punctuation if missing
      if (!/[.!?]$/.test(trimmed)) {
        trimmed += '.';
      }

      return trimmed;
    });

    let resultParagraph = formattedSentences.join(' ');

    // 6. GUARANTEE TRANSFORMATION:
    // If the text barely changed, or for any sentence in first paragraph, apply tone framing!
    const framings = TONE_FRAMINGS[tone];
    const hasMajorChange = clean.toLowerCase() !== originalForCompare.toLowerCase();

    if (!hasMajorChange || (pIdx === 0 && variantIndex % 2 === 1)) {
      if (framings && framings.length > 0) {
        const frameFn = framings[(variantIndex + pIdx) % framings.length];
        resultParagraph = frameFn(resultParagraph, pIdx);
      }
    } else if (pIdx === 0 && !resultParagraph.startsWith('Looking') && !resultParagraph.startsWith('Reflecting') && !resultParagraph.startsWith('Grateful') && !resultParagraph.startsWith('Beneath')) {
      // Apply a subtle tone opener if first paragraph
      const frameFn = framings[(variantIndex) % framings.length];
      resultParagraph = frameFn(resultParagraph, pIdx);
    }

    return resultParagraph;
  });

  const finalResult = rephrasedParagraphs.join('\n');

  // Ultimate fallback check: under no circumstance should the output be identical to input
  if (finalResult.trim() === trimmedInput) {
    if (tone === 'reflective') {
      return `Taking a quiet moment to reflect: ${trimmedInput.charAt(0).toLowerCase() + trimmedInput.slice(1)}`;
    } else if (tone === 'poetic') {
      return `Beneath the gentle light of the day, ${trimmedInput.charAt(0).toLowerCase() + trimmedInput.slice(1)}`;
    } else if (tone === 'uplifting') {
      return `Finding gratitude in this moment: ${trimmedInput.charAt(0).toLowerCase() + trimmedInput.slice(1)}`;
    } else {
      return `Notes for today: ${trimmedInput}`;
    }
  }

  return finalResult;
}

/**
 * Main rephrase entry point.
 * Checks for Gemini API key; if unavailable or upon failure,
 * seamlessly uses the offline NLP engine.
 */
export async function rephraseText(
  text: string,
  tone: RephraseTone = 'reflective',
  variantIndex: number = 0
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (apiKey) {
    const aiResult = await rephraseWithGemini(text, tone, apiKey);
    if (aiResult) return aiResult;
  }

  // Slight synthetic delay (250-350ms) for natural UI responsiveness feel
  await new Promise((resolve) => setTimeout(resolve, 280));
  return rephraseOffline(text, tone, variantIndex);
}
