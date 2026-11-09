
import React, { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';

import { JournalEntry, PolaroidData } from '../types';
import { useAppDispatch } from '../store/hooks';
import { addEntry, updateEntry } from '../store/slices/journalSlice';
import { closeNewEntryModal } from '../store/slices/uiSlice';
import {
  rephraseText,
  REPHRASE_TONES,
  RephraseTone,
} from '../utils/rephrase';

export interface NewEntryScreenProps {
  onClose?: () => void;
  onSave?: (entry: JournalEntry) => void;
  entryToEdit?: JournalEntry | null;
  initialDate?: Date;
  fontsLoaded?: boolean;
}

type JournalMode = 'plain' | 'daily';
type PickerType =
  | 'mood'
  | 'weather'
  | 'tags'
  | 'font'
  | 'theme'
  | 'polaroid'
  | 'rephraseTone'
  | null;

const DAILY_MARKER = '[[DAILY_JOURNAL]]';

const DAILY_FIELDS = [
  {
    key: 'highlight',
    title: 'Today’s highlight',
    subtitle: 'What made today memorable?',
    placeholder: 'Write about a moment worth remembering...',
    icon: 'sunny-outline' as const,
  },
  {
    key: 'gratitude',
    title: 'Grateful for',
    subtitle: 'What are you thankful for today?',
    placeholder: 'Something, someone, or even a small moment...',
    icon: 'heart-outline' as const,
  },
  {
    key: 'challenge',
    title: 'Today’s challenge',
    subtitle: 'What was difficult, and what did you learn?',
    placeholder: 'Be honest. This is your private space...',
    icon: 'flag-outline' as const,
  },
  {
    key: 'tomorrow',
    title: 'Tomorrow’s intention',
    subtitle: 'What would you like to focus on?',
    placeholder: 'One thing you want to make time for...',
    icon: 'arrow-forward-circle-outline' as const,
  },
] as const;

type DailyFieldKey = (typeof DAILY_FIELDS)[number]['key'];

const AVAILABLE_MOODS = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'peaceful', label: 'Calm', emoji: '😌' },
  { id: 'excited', label: 'Excited', emoji: '🥳' },
  { id: 'inspired', label: 'Inspired', emoji: '✨' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'productive', label: 'Productive', emoji: '⚡' },
  { id: 'reflective', label: 'Reflective', emoji: '💭' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'melancholy', label: 'Melancholy', emoji: '🌧️' },
];

const AVAILABLE_WEATHER = [
  { id: 'sunny', label: 'Sunny', emoji: '☀️' },
  { id: 'partly-cloudy', label: 'Partly Cloudy', emoji: '⛅' },
  { id: 'cloudy', label: 'Overcast', emoji: '☁️' },
  { id: 'rainy', label: 'Rainy', emoji: '🌧️' },
  { id: 'stormy', label: 'Thunderstorm', emoji: '⛈️' },
  { id: 'snowy', label: 'Snowy', emoji: '❄️' },
  { id: 'windy', label: 'Windy', emoji: '💨' },
];

const PRESET_TAGS = [
  'Personal',
  'Daily',
  'Gratitude',
  'Thoughts',
  'Memory',
  'Creative',
  'Travel',
  'Wellness',
  'Work',
];

const COLOR_THEMES = [
  {
    id: 'clean-white',
    name: 'Clean Slate',
    backgroundColor: '#FAFAFA',
    textColors: {
      date: '#781552',
      title: '#222222',
      body: '#333333',
    },
    previewColor: '#FAFAFA',
  },
  {
    id: 'matcha-pink',
    name: 'Matcha Rose',
    backgroundColor: '#FADADD',
    textColors: {
      date: '#781552',
      title: '#470938',
      body: '#73175A',
    },
    previewColor: '#FADADD',
  },
  {
    id: 'pumpkin-orange',
    name: 'Autumn Spice',
    backgroundColor: '#FDE3D9',
    textColors: {
      date: '#722108',
      title: '#3B0E01',
      body: '#6F230A',
    },
    previewColor: '#FDE3D9',
  },
  {
    id: 'forest-green',
    name: 'Quiet Moss',
    backgroundColor: '#E2F0D9',
    textColors: {
      date: '#0E5B2C',
      title: '#073519',
      body: '#0A4C25',
    },
    previewColor: '#E2F0D9',
  },
  {
    id: 'golden-hour',
    name: 'Golden Light',
    backgroundColor: '#FEF3D6',
    textColors: {
      date: '#7A4705',
      title: '#3D1F00',
      body: '#6E3C04',
    },
    previewColor: '#FEF3D6',
  },
  {
    id: 'lavender',
    name: 'Lavender Dusk',
    backgroundColor: '#EAE4F2',
    textColors: {
      date: '#431780',
      title: '#260B4C',
      body: '#41157E',
    },
    previewColor: '#EAE4F2',
  },
];

const SAMPLE_POLAROIDS = [
  {
    id: 'matcha',
    image: require('../../assets/matcha-cafe.jpg'),
    caption: 'Matcha Afternoon 🍵',
    tapeColor: 'rgba(182, 140, 244, 0.72)',
  },
  {
    id: 'clara',
    image: require('../../assets/clara-pumpkin.jpg'),
    caption: 'Autumn Memories 🎃',
    tapeColor: 'rgba(255, 185, 45, 0.8)',
  },
  {
    id: 'patch',
    image: require('../../assets/pumpkin-patch-2.jpg'),
    caption: 'Golden Glow ✨',
    tapeColor: 'rgba(180, 240, 230, 0.85)',
  },
] as PolaroidData[];

const DAILY_LABELS: Record<DailyFieldKey, string> = {
  highlight: 'TODAY’S HIGHLIGHT',
  gratitude: 'GRATEFUL FOR',
  challenge: 'TODAY’S CHALLENGE',
  tomorrow: 'TOMORROW’S INTENTION',
};

const parseDailyContent = (body: string) => {
  const result: Record<DailyFieldKey, string> = {
    highlight: '',
    gratitude: '',
    challenge: '',
    tomorrow: '',
  };

  if (!body.startsWith(DAILY_MARKER)) {
    return null;
  }

  const lines = body.split('\n');
  let currentKey: DailyFieldKey | null = null;

  lines.slice(1).forEach((line) => {
    const matchedKey = (
      Object.keys(DAILY_LABELS) as DailyFieldKey[]
    ).find((key) => line.trim() === DAILY_LABELS[key]);

    if (matchedKey) {
      currentKey = matchedKey;
      return;
    }

    if (currentKey) {
      result[currentKey] +=
        (result[currentKey] ? '\n' : '') + line;
    }
  });

  return result;
};

export const NewEntryScreen: React.FC<NewEntryScreenProps> = ({
  onClose,
  onSave,
  entryToEdit,
  initialDate,
  fontsLoaded: passedFontsLoaded,
}) => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const [internalFontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Caveat_600SemiBold,
  });

  const fontsLoaded = passedFontsLoaded ?? internalFontsLoaded;
  const isEditing = Boolean(entryToEdit);

  const initialEntryDate = useMemo(() => {
    if (entryToEdit?.timestamp) {
      return new Date(entryToEdit.timestamp);
    }
    return initialDate || new Date();
  }, [entryToEdit, initialDate]);

  const [entryDate] = useState<Date>(initialEntryDate);

  const initialContent = useMemo(() => {
    if (!entryToEdit) return '';

    if (entryToEdit.title && entryToEdit.body) {
      if (entryToEdit.body.startsWith(entryToEdit.title)) {
        return entryToEdit.body;
      }

      return `${entryToEdit.title}\n${entryToEdit.body}`;
    }

    return entryToEdit.body || entryToEdit.title || '';
  }, [entryToEdit]);

  const existingDailyFields = useMemo(() => {
    if (!entryToEdit?.body) return null;
    return parseDailyContent(entryToEdit.body);
  }, [entryToEdit]);

  const [journalMode, setJournalMode] = useState<JournalMode>(
    existingDailyFields ? 'daily' : 'plain'
  );

  const [content, setContent] = useState<string>(
    existingDailyFields ? '' : initialContent
  );

  const [dailyFields, setDailyFields] = useState<
    Record<DailyFieldKey, string>
  >(
    existingDailyFields || {
      highlight: '',
      gratitude: '',
      challenge: '',
      tomorrow: '',
    }
  );

  const [selectedMood, setSelectedMood] = useState<string | null>(
    entryToEdit?.mood || null
  );

  const [selectedWeather, setSelectedWeather] = useState<string | null>(
    entryToEdit?.weather || null
  );

  const [selectedTags, setSelectedTags] = useState<string[]>(
    entryToEdit?.tags || []
  );

  const initialTheme = useMemo(() => {
    if (!entryToEdit) return COLOR_THEMES[0];

    return (
      COLOR_THEMES.find(
        (theme) =>
          theme.backgroundColor.toLowerCase() ===
          entryToEdit.backgroundColor.toLowerCase()
      ) || COLOR_THEMES[0]
    );
  }, [entryToEdit]);

  const [activeTheme, setActiveTheme] = useState(initialTheme);

  const [textAlignment, setTextAlignment] = useState<
    'left' | 'center' | 'right'
  >(entryToEdit?.alignment || 'left');

  const [selectedFont, setSelectedFont] = useState<
    'system' | 'serif' | 'handwriting'
  >((entryToEdit?.fontFamily as any) || 'system');

  const [fontSizeLevel, setFontSizeLevel] = useState<
    'regular' | 'large' | 'title'
  >('regular');

  const [selectedPolaroid, setSelectedPolaroid] =
    useState<PolaroidData | null>(entryToEdit?.polaroid || null);

  const [isRecordingMemo, setIsRecordingMemo] = useState(false);
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [selectedTone, setSelectedTone] =
    useState<RephraseTone>('reflective');

  const [variantCounter, setVariantCounter] = useState(0);
  const [undoHistory, setUndoHistory] = useState<string[]>([]);
  const [showRephraseBanner, setShowRephraseBanner] = useState(false);

  const [activePicker, setActivePicker] = useState<PickerType>(null);

  const inputRef = useRef<any>(null);

  const dayNumber = entryDate.getDate();

  const dayOfWeek = entryDate.toLocaleDateString('en-US', {
    weekday: 'long',
  });

  const yearMonth = `${entryDate.getFullYear()}.${String(
    entryDate.getMonth() + 1
  ).padStart(2, '0')}`;

  const dailyCombinedContent = useMemo(() => {
    return Object.values(dailyFields).join('\n');
  }, [dailyFields]);

  const charCount =
    journalMode === 'plain'
      ? content.length
      : dailyCombinedContent.length;

  const hasContent =
    journalMode === 'plain'
      ? content.trim().length > 0
      : Object.values(dailyFields).some((value) => value.trim().length > 0);

  const activeFontFamily = useMemo(() => {
    if (!fontsLoaded) return undefined;

    if (selectedFont === 'serif') {
      return 'PlayfairDisplay_700Bold';
    }

    if (selectedFont === 'handwriting') {
      return 'Caveat_600SemiBold';
    }

    return undefined;
  }, [fontsLoaded, selectedFont]);

  const activeFontSize = useMemo(() => {
    if (fontSizeLevel === 'large') return 20;
    if (fontSizeLevel === 'title') return 24;
    return 17;
  }, [fontSizeLevel]);

  const activeLineHeight = activeFontSize * 1.55;

  const updateDailyField = (
    key: DailyFieldKey,
    value: string
  ) => {
    setDailyFields((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const getSaveContent = () => {
    if (journalMode === 'plain') {
      return content.trim();
    }

    const sections = DAILY_FIELDS.map((field) => {
      const value = dailyFields[field.key].trim();

      if (!value) return '';

      return `${DAILY_LABELS[field.key]}\n${value}`;
    }).filter(Boolean);

    return sections.length
      ? `${DAILY_MARKER}\n${sections.join('\n\n')}`
      : '';
  };

  const getDisplayTitle = (savedContent: string) => {
    if (journalMode === 'daily') {
      return 'Daily Reflection';
    }

    const firstLine = savedContent
      .split('\n')
      .find((line) => line.trim().length > 0);

    return firstLine || 'Today’s Reflection';
  };

  const handleClose = () => {
    const hasUnsaved = isEditing
      ? (
          journalMode === 'plain'
            ? content !== initialContent || Boolean(existingDailyFields)
            : !existingDailyFields ||
              JSON.stringify(dailyFields) !==
                JSON.stringify(existingDailyFields)
        )
      : hasContent;

    if (hasUnsaved) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved thoughts. Do you want to discard them?',
        [
          {
            text: 'Keep Writing',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              dispatch(closeNewEntryModal());
              onClose?.();
            },
          },
        ]
      );
      return;
    }

    dispatch(closeNewEntryModal());
    onClose?.();
  };

  const handleRephrase = async (
    toneToUse: RephraseTone = selectedTone
  ) => {
    const source =
      journalMode === 'plain'
        ? content
        : dailyCombinedContent;

    if (!source.trim()) {
      Alert.alert(
        'Nothing to Rephrase',
        'Please write something before using Rephrase.'
      );
      return;
    }

    try {
      setIsRephrasing(true);
      setUndoHistory((previous) => [...previous, source]);

      const nextVariant = variantCounter + 1;
      setVariantCounter(nextVariant);

      const rephrased = await rephraseText(
        source,
        toneToUse,
        nextVariant
      );

      if (journalMode === 'plain') {
        setContent(rephrased);
      } else {
        setDailyFields((previous) => ({
          ...previous,
          highlight: rephrased,
          gratitude: '',
          challenge: '',
          tomorrow: '',
        }));
      }

      setShowRephraseBanner(true);
    } catch {
      Alert.alert(
        'Rephrase Failed',
        'Could not rephrase the text at this moment.'
      );
    } finally {
      setIsRephrasing(false);
    }
  };

  const handleUndoRephrase = () => {
    if (!undoHistory.length) return;

    const previous =
      undoHistory[undoHistory.length - 1];

    setUndoHistory((history) => history.slice(0, -1));

    if (journalMode === 'plain') {
      setContent(previous);
    } else {
      setDailyFields({
        highlight: previous,
        gratitude: '',
        challenge: '',
        tomorrow: '',
      });
    }

    if (undoHistory.length <= 1) {
      setShowRephraseBanner(false);
    }
  };

  const handleSave = () => {
    const savedContent = getSaveContent();

    if (!savedContent && !selectedPolaroid) {
      Alert.alert(
        'Empty Entry',
        'Please write something before saving.'
      );
      return;
    }

    let firstLine = getDisplayTitle(savedContent);
    let restLines = savedContent;

    if (journalMode === 'plain') {
      const lines = savedContent
        .split('\n')
        .filter((line) => line.trim().length > 0);

      firstLine = lines[0] || 'Today’s Reflection';

      restLines =
        lines.length > 1
          ? lines.slice(1).join('\n')
          : savedContent || 'A quiet moment.';
    }

    const fullDateStr = entryDate
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: '2-digit',
      })
      .toUpperCase();

    const moodObj = AVAILABLE_MOODS.find(
      (mood) => mood.id === selectedMood
    );

    const titleEmoji =
      moodObj?.emoji || entryToEdit?.titleEmoji || undefined;

    const targetId =
      entryToEdit?.id || `entry-${Date.now()}`;

    const targetTimestamp =
      entryToEdit?.timestamp || entryDate.getTime();

    const resultEntry: JournalEntry = {
      id: targetId,
      date: entryToEdit?.date || fullDateStr,
      timestamp: targetTimestamp,
      title:
        firstLine.length > 35
          ? `${firstLine.substring(0, 32)}...`
          : firstLine,
      titleEmoji,
      body: restLines,
      backgroundColor:
        activeTheme.backgroundColor === '#FFFFFF'
          ? '#FAF7FB'
          : activeTheme.backgroundColor,
      textColors: activeTheme.textColors,
      polaroid: selectedPolaroid || undefined,
      mood: selectedMood || undefined,
      weather: selectedWeather || undefined,
      tags:
        selectedTags.length > 0
          ? selectedTags
          : undefined,
      alignment: textAlignment,
      fontFamily: selectedFont,
      isFavorite: entryToEdit?.isFavorite,
    };

    if (onSave) {
      onSave(resultEntry);
    } else {
      if (isEditing) {
        dispatch(updateEntry(resultEntry));
      } else {
        dispatch(addEntry(resultEntry));
      }

      dispatch(closeNewEntryModal());
      onClose?.();
    }
  };

  const handleInsertTimestamp = () => {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const time = `${hours}:${minutes}`;

    if (journalMode === 'plain') {
      setContent((previous) =>
        previous ? `${previous}\n${time} ` : `${time} `
      );
    } else {
      setDailyFields((previous) => ({
        ...previous,
        highlight: previous.highlight
          ? `${previous.highlight}\n${time} `
          : `${time} `,
      }));
    }
  };

  const cycleAlignment = () => {
    setTextAlignment((previous) => {
      if (previous === 'left') return 'center';
      if (previous === 'center') return 'right';
      return 'left';
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((previous) =>
      previous.includes(tag)
        ? previous.filter((item) => item !== tag)
        : [...previous, tag]
    );
  };

  const switchMode = (mode: JournalMode) => {
    if (mode === journalMode) return;

    setJournalMode(mode);
    setShowRephraseBanner(false);
  };

  const renderDailyField = (
    field: (typeof DAILY_FIELDS)[number],
    index: number
  ) => (
    <View key={field.key} style={styles.dailyFieldCard}>
      <View style={styles.dailyFieldHeader}>
        <View style={styles.dailyFieldIcon}>
          <Ionicons
            name={field.icon}
            size={19}
            color="#547365"
          />
        </View>

        <View style={styles.dailyFieldHeading}>
          <Text style={styles.dailyFieldTitle}>
            {field.title}
          </Text>
          <Text style={styles.dailyFieldSubtitle}>
            {field.subtitle}
          </Text>
        </View>

        <Text style={styles.dailyFieldNumber}>
          0{index + 1}
        </Text>
      </View>

      <TextInput
        style={[
          styles.dailyFieldInput,
          {
            fontFamily: activeFontFamily,
            fontSize: activeFontSize,
            lineHeight: activeLineHeight,
            textAlign: textAlignment,
          },
        ]}
        placeholder={field.placeholder}
        placeholderTextColor="#A4AAA6"
        multiline
        scrollEnabled={false}
        textAlignVertical="top"
        value={dailyFields[field.key]}
        onChangeText={(value) =>
          updateDailyField(field.key, value)
        }
        selectionColor="#4B9879"
      />
    </View>
  );

  const renderMetadata = () => (
    <View style={styles.metadataCard}>
      <Text style={styles.sectionEyebrow}>
        ENTRY DETAILS
      </Text>

      <TouchableOpacity
        style={styles.metaRow}
        activeOpacity={0.7}
        onPress={() => setActivePicker('mood')}
      >
        <View style={styles.metaIcon}>
          <MaterialCommunityIcons
            name="emoticon-happy-outline"
            size={20}
            color="#68736D"
          />
        </View>

        <Text style={styles.metaLabel}>
          Mood
        </Text>

        <Text style={styles.metaValue}>
          {selectedMood
            ? `${
                AVAILABLE_MOODS.find(
                  (mood) => mood.id === selectedMood
                )?.emoji
              } ${
                AVAILABLE_MOODS.find(
                  (mood) => mood.id === selectedMood
                )?.label
              }`
            : 'Add mood'}
        </Text>

        <Feather
          name="chevron-right"
          size={17}
          color="#A1AAA5"
        />
      </TouchableOpacity>

      <View style={styles.metaDivider} />

      <TouchableOpacity
        style={styles.metaRow}
        activeOpacity={0.7}
        onPress={() => setActivePicker('weather')}
      >
        <View style={styles.metaIcon}>
          <MaterialCommunityIcons
            name="weather-partly-cloudy"
            size={20}
            color="#68736D"
          />
        </View>

        <Text style={styles.metaLabel}>
          Weather
        </Text>

        <Text style={styles.metaValue}>
          {selectedWeather
            ? `${
                AVAILABLE_WEATHER.find(
                  (weather) => weather.id === selectedWeather
                )?.emoji
              } ${
                AVAILABLE_WEATHER.find(
                  (weather) => weather.id === selectedWeather
                )?.label
              }`
            : 'Add weather'}
        </Text>

        <Feather
          name="chevron-right"
          size={17}
          color="#A1AAA5"
        />
      </TouchableOpacity>

      <View style={styles.metaDivider} />

      <TouchableOpacity
        style={styles.metaRow}
        activeOpacity={0.7}
        onPress={() => setActivePicker('tags')}
      >
        <View style={styles.metaIcon}>
          <MaterialCommunityIcons
            name="bookmark-outline"
            size={20}
            color="#68736D"
          />
        </View>

        <Text style={styles.metaLabel}>
          Tags
        </Text>

        <Text
          style={styles.metaValue}
          numberOfLines={1}
        >
          {selectedTags.length
            ? selectedTags.map((tag) => `#${tag}`).join(' ')
            : 'Add tags'}
        </Text>

        <Feather
          name="chevron-right"
          size={17}
          color="#A1AAA5"
        />
      </TouchableOpacity>

      <View style={styles.metaDivider} />

      <View style={styles.metaRow}>
        <View style={styles.metaIcon}>
          <MaterialCommunityIcons
            name="text-box-outline"
            size={20}
            color="#68736D"
          />
        </View>

        <Text style={styles.metaLabel}>
          Characters
        </Text>

        <Text style={styles.metaValue}>
          {charCount}
        </Text>
      </View>
    </View>
  );

  const renderPickerContent = () => {
    switch (activePicker) {
      case 'mood':
        return (
          <View>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>
                How are you feeling?
              </Text>

              {selectedMood ? (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMood(null);
                    setActivePicker(null);
                  }}
                >
                  <Text style={styles.sheetClearText}>
                    Clear
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.chipGrid}>
              {AVAILABLE_MOODS.map((item) => {
                const selected = selectedMood === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.choiceChip,
                      selected && styles.choiceChipSelected,
                    ]}
                    onPress={() => {
                      setSelectedMood(
                        selected ? null : item.id
                      );
                      setActivePicker(null);
                    }}
                  >
                    <Text style={styles.choiceEmoji}>
                      {item.emoji}
                    </Text>
                    <Text
                      style={[
                        styles.choiceText,
                        selected && styles.choiceTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 'weather':
        return (
          <View>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>
                Today's Weather
              </Text>

              {selectedWeather ? (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedWeather(null);
                    setActivePicker(null);
                  }}
                >
                  <Text style={styles.sheetClearText}>
                    Clear
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.chipGrid}>
              {AVAILABLE_WEATHER.map((item) => {
                const selected =
                  selectedWeather === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.choiceChip,
                      selected && styles.choiceChipSelected,
                    ]}
                    onPress={() => {
                      setSelectedWeather(
                        selected ? null : item.id
                      );
                      setActivePicker(null);
                    }}
                  >
                    <Text style={styles.choiceEmoji}>
                      {item.emoji}
                    </Text>
                    <Text
                      style={[
                        styles.choiceText,
                        selected && styles.choiceTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 'tags':
        return (
          <View>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>
                Select Tags
              </Text>

              {selectedTags.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSelectedTags([])}
                >
                  <Text style={styles.sheetClearText}>
                    Clear All
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.chipGrid}>
              {PRESET_TAGS.map((tag) => {
                const selected = selectedTags.includes(tag);

                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.choiceChip,
                      selected && styles.choiceChipSelected,
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        selected && styles.choiceTextSelected,
                      ]}
                    >
                      #{tag}
                    </Text>

                    {selected ? (
                      <Feather
                        name="check"
                        size={13}
                        color="#347B5C"
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.sheetDoneButton}
              onPress={() => setActivePicker(null)}
            >
              <Text style={styles.sheetDoneText}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'font':
        return (
          <View>
            <Text style={styles.sheetTitle}>
              Typography
            </Text>

            <Text style={styles.sheetSubheading}>
              Font style
            </Text>

            <View style={styles.fontOptionsRow}>
              {(
                [
                  {
                    id: 'system',
                    title: 'Modern Sans',
                    subtitle: 'Minimal',
                  },
                  {
                    id: 'serif',
                    title: 'Playfair',
                    subtitle: 'Editorial',
                  },
                  {
                    id: 'handwriting',
                    title: 'Caveat',
                    subtitle: 'Handwritten',
                  },
                ] as const
              ).map((font) => (
                <TouchableOpacity
                  key={font.id}
                  onPress={() => setSelectedFont(font.id)}
                  style={[
                    styles.fontOption,
                    selectedFont === font.id &&
                      styles.fontOptionSelected,
                  ]}
                >
                  <Text style={styles.fontOptionTitle}>
                    {font.title}
                  </Text>
                  <Text style={styles.fontOptionSubtitle}>
                    {font.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sheetSubheading}>
              Text size
            </Text>

            <View style={styles.fontSizeRow}>
              {(
                ['regular', 'large', 'title'] as const
              ).map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setFontSizeLevel(level)}
                  style={[
                    styles.sizeButton,
                    fontSizeLevel === level &&
                      styles.sizeButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.sizeButtonText,
                      fontSizeLevel === level &&
                        styles.sizeButtonTextSelected,
                    ]}
                  >
                    {level === 'regular'
                      ? 'Standard'
                      : level === 'large'
                        ? 'Large'
                        : 'Headline'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.sheetDoneButton}
              onPress={() => setActivePicker(null)}
            >
              <Text style={styles.sheetDoneText}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'theme':
        return (
          <View>
            <Text style={styles.sheetTitle}>
              Card theme
            </Text>

            <Text style={styles.sheetDescription}>
              Choose a background for your journal entry.
            </Text>

            <View style={styles.themeGrid}>
              {COLOR_THEMES.map((theme) => {
                const selected =
                  activeTheme.id === theme.id;

                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={styles.themeOption}
                    onPress={() => {
                      setActiveTheme(theme);
                      setActivePicker(null);
                    }}
                  >
                    <View
                      style={[
                        styles.themeSwatch,
                        {
                          backgroundColor:
                            theme.previewColor,
                        },
                        selected && styles.themeSwatchSelected,
                      ]}
                    >
                      {selected ? (
                        <Feather
                          name="check"
                          size={18}
                          color="#333"
                        />
                      ) : null}
                    </View>

                    <Text style={styles.themeName}>
                      {theme.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 'polaroid':
        return (
          <View>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>
                Attach Photo Polaroid
              </Text>

              {selectedPolaroid ? (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedPolaroid(null);
                    setActivePicker(null);
                  }}
                >
                  <Text style={styles.sheetClearText}>
                    Remove
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {SAMPLE_POLAROIDS.map((photo) => {
              const selected =
                selectedPolaroid?.caption === photo.caption;

              return (
                <TouchableOpacity
                  key={photo.id}
                  style={[
                    styles.polaroidOption,
                    selected && styles.polaroidOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedPolaroid(
                      selected ? null : photo
                    );
                    setActivePicker(null);
                  }}
                >
                  <View style={styles.polaroidOptionIcon}>
                    <MaterialCommunityIcons
                      name="image-outline"
                      size={21}
                      color="#547365"
                    />
                  </View>

                  <View style={styles.polaroidOptionText}>
                    <Text style={styles.polaroidOptionTitle}>
                      {photo.caption}
                    </Text>
                    <Text style={styles.polaroidOptionSubtitle}>
                      {selected ? 'Attached' : 'Tap to attach'}
                    </Text>
                  </View>

                  <Feather
                    name={selected ? 'check-circle' : 'plus-circle'}
                    size={19}
                    color={selected ? '#347B5C' : '#9CA59F'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'rephraseTone':
        return (
          <View>
            <Text style={styles.sheetTitle}>
              Rephrase style
            </Text>

            <Text style={styles.sheetDescription}>
              Choose the tone that best expresses your thoughts.
            </Text>

            {REPHRASE_TONES.map((tone) => {
              const selected = selectedTone === tone.id;

              return (
                <TouchableOpacity
                  key={tone.id}
                  style={[
                    styles.toneOption,
                    selected && styles.toneOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedTone(tone.id);
                    setActivePicker(null);
                    handleRephrase(tone.id);
                  }}
                >
                  <Text style={styles.toneEmoji}>
                    {tone.emoji}
                  </Text>

                  <View style={styles.toneTextColumn}>
                    <Text style={styles.toneTitle}>
                      {tone.name}
                    </Text>
                    <Text style={styles.toneDescription}>
                      {tone.description}
                    </Text>
                  </View>

                  {selected ? (
                    <Feather
                      name="check"
                      size={18}
                      color="#347B5C"
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 14),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{
            top: 12,
            bottom: 12,
            left: 12,
            right: 12,
          }}
        >
          <Feather
            name="x"
            size={23}
            color="#26332D"
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit entry' : 'New entry'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Your personal space
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.rephraseButton}
            onPress={() => handleRephrase()}
            disabled={isRephrasing}
          >
            {isRephrasing ? (
              <ActivityIndicator
                size="small"
                color="#347B5C"
              />
            ) : (
              <MaterialCommunityIcons
                name="auto-fix"
                size={16}
                color="#347B5C"
              />
            )}
            <Text style={styles.rephraseButtonText}>
              AI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* DATE */}
          <View style={styles.dateSection}>
            <View>
              <Text style={styles.dateDayNumber}>
                {dayNumber}
              </Text>
            </View>

            <View style={styles.dateDetails}>
              <Text style={styles.dateWeekday}>
                {dayOfWeek}
              </Text>
              <Text style={styles.dateMonth}>
                {yearMonth}
              </Text>
            </View>

            <View style={styles.dateRight}>
              <View style={styles.dateDot} />
              <Text style={styles.dateLabel}>
                JOURNAL ENTRY
              </Text>
            </View>
          </View>

          {/* JOURNAL MODE SWITCH */}
          <View style={styles.modeContainer}>
            <View style={styles.modeHeading}>
              <Text style={styles.modeHeadingTitle}>
                Writing format
              </Text>
              <Text style={styles.modeHeadingSubtitle}>
                Choose how you want to reflect today.
              </Text>
            </View>

            <View style={styles.modeSwitch}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.modeOption,
                  journalMode === 'plain' &&
                    styles.modeOptionActive,
                ]}
                onPress={() => switchMode('plain')}
              >
                <Feather
                  name="edit-3"
                  size={16}
                  color={
                    journalMode === 'plain'
                      ? '#FFFFFF'
                      : '#66736C'
                  }
                />
                <Text
                  style={[
                    styles.modeOptionText,
                    journalMode === 'plain' &&
                      styles.modeOptionTextActive,
                  ]}
                >
                  Plain Journal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.modeOption,
                  journalMode === 'daily' &&
                    styles.modeOptionActive,
                ]}
                onPress={() => switchMode('daily')}
              >
                <Feather
                  name="calendar"
                  size={16}
                  color={
                    journalMode === 'daily'
                      ? '#FFFFFF'
                      : '#66736C'
                  }
                />
                <Text
                  style={[
                    styles.modeOptionText,
                    journalMode === 'daily' &&
                      styles.modeOptionTextActive,
                  ]}
                >
                  Daily Journal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* REPHRASE FEEDBACK */}
          {showRephraseBanner ? (
            <View style={styles.rephraseBanner}>
              <View style={styles.rephraseBannerInfo}>
                <MaterialCommunityIcons
                  name="creation"
                  size={17}
                  color="#347B5C"
                />
                <Text style={styles.rephraseBannerText}>
                  Rephrased ·{' '}
                  {REPHRASE_TONES.find(
                    (tone) => tone.id === selectedTone
                  )?.name}
                </Text>
              </View>

              <View style={styles.rephraseActions}>
                <TouchableOpacity
                  onPress={() =>
                    setActivePicker('rephraseTone')
                  }
                >
                  <Text style={styles.rephraseActionText}>
                    Tone
                  </Text>
                </TouchableOpacity>

                {undoHistory.length > 0 ? (
                  <TouchableOpacity
                    onPress={handleUndoRephrase}
                    style={styles.undoButton}
                  >
                    <MaterialCommunityIcons
                      name="undo"
                      size={14}
                      color="#52645A"
                    />
                    <Text style={styles.undoText}>
                      Undo
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={() =>
                    setShowRephraseBanner(false)
                  }
                >
                  <Feather
                    name="x"
                    size={15}
                    color="#79847D"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* ATTACHMENT STATUS */}
          {isRecordingMemo ? (
            <View style={styles.attachmentBanner}>
              <MaterialCommunityIcons
                name="microphone"
                size={18}
                color="#B76C40"
              />
              <Text style={styles.attachmentText}>
                Voice note attached (0:24)
              </Text>
              <TouchableOpacity
                onPress={() => setIsRecordingMemo(false)}
              >
                <Feather
                  name="x"
                  size={16}
                  color="#777"
                />
              </TouchableOpacity>
            </View>
          ) : null}

          {selectedPolaroid ? (
            <View style={styles.attachmentBanner}>
              <MaterialCommunityIcons
                name="image-outline"
                size={18}
                color="#347B5C"
              />
              <Text style={styles.attachmentText}>
                {selectedPolaroid.caption}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedPolaroid(null)}
              >
                <Feather
                  name="x"
                  size={16}
                  color="#777"
                />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* PLAIN JOURNAL */}
          {journalMode === 'plain' ? (
            <View style={styles.plainWritingSection}>
              <View style={styles.writingHeading}>
                <Text style={styles.writingEyebrow}>
                  YOUR THOUGHTS
                </Text>
                <Text style={styles.writingHint}>
                  Take your time. There is no right way to write.
                </Text>
              </View>

              <TextInput
                ref={inputRef}
                style={[
                  styles.plainTextInput,
                  {
                    fontFamily: activeFontFamily,
                    fontSize: activeFontSize,
                    lineHeight: activeLineHeight,
                    textAlign: textAlignment,
                  },
                ]}
                placeholder="Start writing your thoughts here..."
                placeholderTextColor="#A5ACA7"
                multiline
                scrollEnabled={false}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
                selectionColor="#4B9879"
                autoFocus
              />
            </View>
          ) : (
            /* DAILY JOURNAL */
            <View style={styles.dailySection}>
              <View style={styles.dailyIntro}>
                <View style={styles.dailyIntroIcon}>
                  <MaterialCommunityIcons
                    name="notebook-outline"
                    size={22}
                    color="#547365"
                  />
                </View>

                <View style={styles.dailyIntroText}>
                  <Text style={styles.dailyIntroTitle}>
                    A little reflection
                  </Text>
                  <Text style={styles.dailyIntroSubtitle}>
                    Four small prompts to help you understand your day.
                  </Text>
                </View>
              </View>

              {DAILY_FIELDS.map(renderDailyField)}
            </View>
          )}

          {/* METADATA */}
          {renderMetadata()}

          {/* EXTRA ATTACHMENTS */}
          <View style={styles.extraSection}>
            <Text style={styles.sectionEyebrow}>
              PERSONALIZE YOUR ENTRY
            </Text>

            <View style={styles.extraToolsGrid}>
              <TouchableOpacity
                style={styles.extraTool}
                onPress={() => setActivePicker('font')}
              >
                <View style={styles.extraToolIcon}>
                  <Feather
                    name="type"
                    size={19}
                    color="#547365"
                  />
                </View>
                <Text style={styles.extraToolTitle}>
                  Typography
                </Text>
                <Text style={styles.extraToolSubtitle}>
                  {selectedFont}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.extraTool}
                onPress={() => setActivePicker('theme')}
              >
                <View style={styles.extraToolIcon}>
                  <MaterialCommunityIcons
                    name="palette-outline"
                    size={20}
                    color="#547365"
                  />
                </View>
                <Text style={styles.extraToolTitle}>
                  Theme
                </Text>
                <Text style={styles.extraToolSubtitle}>
                  {activeTheme.name}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.extraTool}
                onPress={cycleAlignment}
              >
                <View style={styles.extraToolIcon}>
                  <MaterialCommunityIcons
                    name={
                      textAlignment === 'center'
                        ? 'format-align-center'
                        : textAlignment === 'right'
                          ? 'format-align-right'
                          : 'format-align-left'
                    }
                    size={20}
                    color="#547365"
                  />
                </View>
                <Text style={styles.extraToolTitle}>
                  Alignment
                </Text>
                <Text style={styles.extraToolSubtitle}>
                  {textAlignment}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.extraTool}
                onPress={() => setActivePicker('polaroid')}
              >
                <View style={styles.extraToolIcon}>
                  <MaterialCommunityIcons
                    name="image-outline"
                    size={20}
                    color="#547365"
                  />
                </View>
                <Text style={styles.extraToolTitle}>
                  Photo
                </Text>
                <Text style={styles.extraToolSubtitle}>
                  {selectedPolaroid ? 'Attached' : 'Add photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.extraTool}
                onPress={() =>
                  setIsRecordingMemo((previous) => !previous)
                }
              >
                <View style={styles.extraToolIcon}>
                  <MaterialCommunityIcons
                    name={
                      isRecordingMemo
                        ? 'microphone'
                        : 'microphone-outline'
                    }
                    size={20}
                    color={
                      isRecordingMemo ? '#B76C40' : '#547365'
                    }
                  />
                </View>
                <Text style={styles.extraToolTitle}>
                  Voice note
                </Text>
                <Text style={styles.extraToolSubtitle}>
                  {isRecordingMemo ? 'Attached' : 'Add note'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.extraTool}
                onPress={handleInsertTimestamp}
              >
                <View style={styles.extraToolIcon}>
                  <Feather
                    name="clock"
                    size={19}
                    color="#547365"
                  />
                </View>
                <Text style={styles.extraToolTitle}>
                  Timestamp
                </Text>
                <Text style={styles.extraToolSubtitle}>
                  Insert time
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomNote}>
            <Feather
              name="lock"
              size={13}
              color="#9BA59E"
            />
            <Text style={styles.bottomNoteText}>
              A private space for your thoughts.
            </Text>
          </View>
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View style={styles.bottomBarInfo}>
            <Text style={styles.bottomBarLabel}>
              {journalMode === 'daily'
                ? 'DAILY JOURNAL'
                : 'PLAIN JOURNAL'}
            </Text>
            <Text style={styles.bottomBarCount}>
              {charCount} characters
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bottomSaveButton}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.bottomSaveText}>
              {isEditing ? 'Update entry' : 'Save entry'}
            </Text>
            <Feather
              name="arrow-right"
              size={17}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* PICKER MODAL */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setActivePicker(null)}
          />

          <View
            style={[
              styles.modalSheet,
              {
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            <View style={styles.sheetHandle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderPickerContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },

  header: {
    minHeight: 74,
    paddingHorizontal: 19,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  closeButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#F3F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    fontSize: 16,
    color: '#26332D',
    fontWeight: '700',
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#929C95',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  rephraseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#EFF6F1',
  },

  rephraseButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#347B5C',
  },

  saveButton: {
    backgroundColor: '#347B5C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 23,
    paddingBottom: 35,
  },

  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  dateDayNumber: {
    fontSize: 47,
    fontWeight: '700',
    color: '#26332D',
    letterSpacing: -2,
    lineHeight: 54,
  },

  dateDetails: {
    marginLeft: 12,
  },

  dateWeekday: {
    fontSize: 14,
    fontWeight: '700',
    color: '#35433B',
  },

  dateMonth: {
    fontSize: 12,
    color: '#8B968E',
    marginTop: 3,
  },

  dateRight: {
    marginLeft: 'auto',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  dateDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#5B9B79',
  },

  dateLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#87938B',
    letterSpacing: 1,
  },

  modeContainer: {
    marginBottom: 23,
  },

  modeHeading: {
    marginBottom: 12,
  },

  modeHeadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3932',
  },

  modeHeadingSubtitle: {
    fontSize: 12,
    color: '#8B958E',
    marginTop: 4,
  },

  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#EDF1ED',
    padding: 4,
    borderRadius: 13,
    gap: 4,
  },

  modeOption: {
    flex: 1,
    minHeight: 43,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  modeOptionActive: {
    backgroundColor: '#347B5C',
  },

  modeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#68736C',
  },

  modeOptionTextActive: {
    color: '#FFFFFF',
  },

  rephraseBanner: {
    backgroundColor: '#EEF6F0',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rephraseBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },

  rephraseBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#347B5C',
  },

  rephraseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  rephraseActionText: {
    color: '#347B5C',
    fontSize: 12,
    fontWeight: '700',
  },

  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  undoText: {
    color: '#52645A',
    fontSize: 11,
    fontWeight: '600',
  },

  attachmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE8',
    borderRadius: 10,
    padding: 11,
    marginBottom: 12,
  },

  attachmentText: {
    flex: 1,
    color: '#52645A',
    fontSize: 12,
    fontWeight: '600',
  },

  plainWritingSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EEE9',
    borderRadius: 17,
    padding: 18,
    marginBottom: 22,
    minHeight: 300,
  },

  writingHeading: {
    marginBottom: 17,
  },

  writingEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71927E',
    letterSpacing: 1.3,
  },

  writingHint: {
    fontSize: 11,
    color: '#A0AAA3',
    marginTop: 5,
  },

  plainTextInput: {
    color: '#28362E',
    minHeight: 235,
    padding: 0,
    textAlignVertical: 'top',
  },

  dailySection: {
    marginBottom: 22,
  },

  dailyIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 11,
  },

  dailyIntroIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#EAF2EC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dailyIntroText: {
    flex: 1,
  },

  dailyIntroTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3932',
  },

  dailyIntroSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: '#929D95',
    marginTop: 3,
  },

  dailyFieldCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE8',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
  },

  dailyFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  dailyFieldIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#EFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dailyFieldHeading: {
    flex: 1,
    marginLeft: 10,
  },

  dailyFieldTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#354239',
  },

  dailyFieldSubtitle: {
    fontSize: 10,
    color: '#939D96',
    marginTop: 3,
  },

  dailyFieldNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BBC5BD',
  },

  dailyFieldInput: {
    minHeight: 85,
    padding: 0,
    color: '#344239',
    textAlignVertical: 'top',
  },

  metadataCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE8',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
    marginBottom: 24,
  },

  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#829087',
    letterSpacing: 1.2,
    marginBottom: 11,
  },

  metaRow: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  metaIcon: {
    width: 29,
    alignItems: 'center',
  },

  metaLabel: {
    flex: 1,
    fontSize: 12,
    color: '#56635A',
    fontWeight: '600',
  },

  metaValue: {
    maxWidth: '45%',
    fontSize: 11,
    color: '#8A968E',
    fontWeight: '500',
    textAlign: 'right',
  },

  metaDivider: {
    height: 1,
    backgroundColor: '#F0F2F0',
  },

  extraSection: {
    marginBottom: 24,
  },

  extraToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  extraTool: {
    width: '31%',
    flexGrow: 1,
    minHeight: 106,
    padding: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE8',
    borderRadius: 13,
  },

  extraToolIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 9,
  },

  extraToolTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#435148',
  },

  extraToolSubtitle: {
    fontSize: 10,
    color: '#9AA49D',
    marginTop: 4,
  },

  bottomNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 5,
    marginBottom: 8,
  },

  bottomNoteText: {
    fontSize: 10,
    color: '#9BA59E',
  },

  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9EEE9',
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bottomBarInfo: {
    flex: 1,
  },

  bottomBarLabel: {
    fontSize: 9,
    color: '#7F8E83',
    fontWeight: '800',
    letterSpacing: 1,
  },

  bottomBarCount: {
    fontSize: 11,
    color: '#A0AAA3',
    marginTop: 4,
  },

  bottomSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#347B5C',
    paddingHorizontal: 19,
    paddingVertical: 13,
    borderRadius: 11,
  },

  bottomSaveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 30, 24, 0.4)',
  },

  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 21,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '75%',
  },

  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#DDE3DE',
    alignSelf: 'center',
    marginBottom: 20,
  },

  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3932',
    marginBottom: 7,
  },

  sheetDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#929D95',
    marginBottom: 17,
  },

  sheetClearText: {
    fontSize: 12,
    color: '#B56C53',
    fontWeight: '700',
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 15,
  },

  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: '#F3F5F3',
    borderRadius: 10,
  },

  choiceChipSelected: {
    backgroundColor: '#EAF4ED',
    borderWidth: 1,
    borderColor: '#8DB59A',
  },

  choiceEmoji: {
    fontSize: 16,
  },

  choiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#56635A',
  },

  choiceTextSelected: {
    color: '#347B5C',
  },

  sheetSubheading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#87938B',
    letterSpacing: 1,
    marginTop: 17,
    marginBottom: 10,
  },

  fontOptionsRow: {
    flexDirection: 'row',
    gap: 9,
  },

  fontOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
    backgroundColor: '#F4F6F4',
    borderRadius: 12,
  },

  fontOptionSelected: {
    backgroundColor: '#EAF4ED',
    borderWidth: 1,
    borderColor: '#8DB59A',
  },

  fontOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3C4A41',
  },

  fontOptionSubtitle: {
    fontSize: 9,
    color: '#929D95',
    marginTop: 4,
  },

  fontSizeRow: {
    flexDirection: 'row',
    gap: 8,
  },

  sizeButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#F3F5F3',
    borderRadius: 10,
  },

  sizeButtonSelected: {
    backgroundColor: '#EAF4ED',
    borderWidth: 1,
    borderColor: '#8DB59A',
  },

  sizeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#68736C',
  },

  sizeButtonTextSelected: {
    color: '#347B5C',
  },

  sheetDoneButton: {
    marginTop: 20,
    backgroundColor: '#347B5C',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 11,
  },

  sheetDoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 10,
    marginBottom: 15,
  },

  themeOption: {
    width: '28%',
    alignItems: 'center',
    gap: 7,
  },

  themeSwatch: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E1E5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  themeSwatchSelected: {
    borderWidth: 2,
    borderColor: '#347B5C',
  },

  themeName: {
    fontSize: 10,
    color: '#69766E',
    fontWeight: '600',
    textAlign: 'center',
  },

  polaroidOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EDE8',
    marginBottom: 9,
    gap: 11,
  },

  polaroidOptionSelected: {
    backgroundColor: '#EFF6F0',
    borderColor: '#91B69B',
  },

  polaroidOptionIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    backgroundColor: '#EFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  polaroidOptionText: {
    flex: 1,
  },

  polaroidOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3C4A41',
  },

  polaroidOptionSubtitle: {
    fontSize: 10,
    color: '#929D95',
    marginTop: 4,
  },

  toneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9EDE9',
    marginBottom: 9,
  },

  toneOptionSelected: {
    backgroundColor: '#EFF6F0',
    borderColor: '#91B69B',
  },

  toneEmoji: {
    fontSize: 22,
  },

  toneTextColumn: {
    flex: 1,
  },

  toneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3C4A41',
  },

  toneDescription: {
    fontSize: 10,
    color: '#929D95',
    marginTop: 3,
  },
});
