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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';
import { JournalEntry, PolaroidData } from '../types';

export interface NewEntryScreenProps {
  onClose?: () => void;
  onSave?: (entry: JournalEntry) => void;
  initialDate?: Date;
  fontsLoaded?: boolean;
}

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
    textColors: { date: '#781552', title: '#222222', body: '#333333' },
    previewColor: '#FAFAFA',
  },
  {
    id: 'matcha-pink',
    name: 'Matcha Rose',
    backgroundColor: '#FADADD', // Soft Pastel Pink
    textColors: { date: '#781552', title: '#470938', body: '#73175A' },
    previewColor: '#FADADD',
  },
  {
    id: 'pumpkin-orange',
    name: 'Autumn Spice',
    backgroundColor: '#FDE3D9', // Soft Pastel Peach/Orange
    textColors: { date: '#722108', title: '#3B0E01', body: '#6F230A' },
    previewColor: '#FDE3D9',
  },
  {
    id: 'forest-green',
    name: 'Quiet Moss',
    backgroundColor: '#E2F0D9', // Soft Pastel Sage Green
    textColors: { date: '#0E5B2C', title: '#073519', body: '#0A4C25' },
    previewColor: '#E2F0D9',
  },
  {
    id: 'golden-hour',
    name: 'Golden Light',
    backgroundColor: '#FEF3D6', // Soft Pastel Cream/Yellow
    textColors: { date: '#7A4705', title: '#3D1F00', body: '#6E3C04' },
    previewColor: '#FEF3D6',
  },
  {
    id: 'lavender',
    name: 'Lavender Dusk',
    backgroundColor: '#EAE4F2', // Soft Pastel Lavender
    textColors: { date: '#431780', title: '#260B4C', body: '#41157E' },
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
];

export const NewEntryScreen: React.FC<NewEntryScreenProps> = ({
  onClose,
  onSave,
  initialDate,
  fontsLoaded: passedFontsLoaded,
}) => {
  const insets = useSafeAreaInsets();
  const [internalFontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Caveat_600SemiBold,
  });
  const fontsLoaded = passedFontsLoaded ?? internalFontsLoaded;

  const [entryDate] = useState<Date>(initialDate || new Date());
  const [content, setContent] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTheme, setActiveTheme] = useState(COLOR_THEMES[0]);
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [selectedFont, setSelectedFont] = useState<'system' | 'serif' | 'handwriting'>('system');
  const [fontSizeLevel, setFontSizeLevel] = useState<'regular' | 'large' | 'title'>('regular');
  const [selectedPolaroid, setSelectedPolaroid] = useState<PolaroidData | null>(null);
  const [isRecordingMemo, setIsRecordingMemo] = useState(false);

  // Active sheet modals
  const [activePicker, setActivePicker] = useState<
    'mood' | 'weather' | 'tags' | 'font' | 'theme' | 'polaroid' | null
  >(null);

  const inputRef = useRef<any>(null);

  // Date formatting matching screenshot: Day number (e.g. "2"), Day of week ("Mon"), "2026.11"
  const dayNumber = entryDate.getDate();
  const dayOfWeek = entryDate.toLocaleDateString('en-US', { weekday: 'short' });
  const yearMonth = `${entryDate.getFullYear()}.${String(entryDate.getMonth() + 1).padStart(2, '0')}`;

  const charCount = content.length;

  const handleClose = () => {
    if (content.trim().length > 0) {
      Alert.alert(
        'Discard Entry?',
        'You have unsaved thoughts. Do you want to discard them?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => onClose?.() },
        ]
      );
    } else {
      onClose?.();
    }
  };

  const handleSave = () => {
    const trimmed = content.trim();
    if (!trimmed && !selectedPolaroid) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }

    // Determine title & body
    const lines = trimmed.split('\n').filter((line) => line.trim().length > 0);
    const firstLine = lines.length > 0 ? lines[0] : 'Today’s Reflection';
    const restLines = lines.length > 1 ? lines.slice(1).join('\n') : (trimmed || 'A quiet moment.');

    // Format full date for JournalCard (e.g. "MONDAY, NOV 02")
    const fullDateStr = entryDate
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: '2-digit',
      })
      .toUpperCase();

    // Pick emoji from mood or weather if available
    const moodObj = AVAILABLE_MOODS.find((m) => m.id === selectedMood);
    const titleEmoji = moodObj ? moodObj.emoji : undefined;

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      date: fullDateStr,
      title: firstLine.length > 35 ? `${firstLine.substring(0, 32)}...` : firstLine,
      titleEmoji,
      body: restLines,
      backgroundColor: activeTheme.backgroundColor === '#FFFFFF' ? '#FAF7FB' : activeTheme.backgroundColor,
      textColors: activeTheme.textColors,
      polaroid: selectedPolaroid || undefined,
      mood: selectedMood || undefined,
      weather: selectedWeather || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      alignment: textAlignment,
      fontFamily: selectedFont,
    };

    onSave?.(newEntry);
  };

  const handleInsertTimestamp = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes} `;
    setContent((prev) => (prev ? `${prev}\n${timeStr}` : timeStr));
  };

  const cycleAlignment = () => {
    if (textAlignment === 'left') setTextAlignment('center');
    else if (textAlignment === 'center') setTextAlignment('right');
    else setTextAlignment('left');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const activeFontFamily = useMemo(() => {
    if (!fontsLoaded) return undefined;
    if (selectedFont === 'serif') return 'PlayfairDisplay_700Bold';
    if (selectedFont === 'handwriting') return 'Caveat_600SemiBold';
    return undefined;
  }, [fontsLoaded, selectedFont]);

  const activeFontSize = useMemo(() => {
    if (fontSizeLevel === 'large') return 20;
    if (fontSizeLevel === 'title') return 24;
    return 17.5;
  }, [fontSizeLevel]);

  const activeLineHeight = useMemo(() => {
    return activeFontSize * 1.5;
  }, [activeFontSize]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Safe Area & Action Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.closeButton}
        >
          <Feather name="x" size={26} color="#222222" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date Indicator Row matching screenshot: Day number, Mon, 2026.11 */}
          <View style={styles.dateRow}>
            <Text style={styles.dayNumberText}>{dayNumber}</Text>
            <View style={styles.dateMetaColumn}>
              <Text style={styles.dayOfWeekText}>{dayOfWeek}</Text>
              <Text style={styles.yearMonthText}>{yearMonth}</Text>
            </View>
          </View>

          {/* Voice Memo Indicator (if toggled) */}
          {isRecordingMemo ? (
            <View style={styles.voiceMemoBanner}>
              <MaterialCommunityIcons name="microphone" size={18} color="#E56338" />
              <Text style={styles.voiceMemoText}>Voice note attached (0:24)</Text>
              <TouchableOpacity onPress={() => setIsRecordingMemo(false)}>
                <Feather name="x" size={16} color="#777" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Attached Polaroid Badge (if selected) */}
          {selectedPolaroid ? (
            <View style={styles.polaroidAttachmentBadge}>
              <MaterialCommunityIcons name="image-outline" size={18} color="#2AB565" />
              <Text style={styles.polaroidAttachmentText}>
                Photo: {selectedPolaroid.caption}
              </Text>
              <TouchableOpacity onPress={() => setSelectedPolaroid(null)}>
                <Feather name="x" size={16} color="#777" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Main Multiline Writing Input */}
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              {
                fontFamily: activeFontFamily,
                fontSize: activeFontSize,
                lineHeight: activeLineHeight,
                textAlign: textAlignment,
              },
            ]}
            placeholder="Write something..."
            placeholderTextColor="#B0B0B0"
            multiline
            scrollEnabled={false}
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
            selectionColor="#45C49A"
            autoFocus
          />

          {/* Metadata Rows: Mood, Weather, Tag, Character Count */}
          <View style={styles.metadataSection}>
            {/* Mood Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActivePicker('mood')}
              style={styles.metaRow}
            >
              <MaterialCommunityIcons
                name="emoticon-happy-outline"
                size={22}
                color={selectedMood ? '#45C49A' : '#6E7370'}
              />
              <Text
                style={[
                  styles.metaRowLabel,
                  selectedMood ? styles.metaRowLabelActive : null,
                ]}
              >
                {selectedMood
                  ? `Mood · ${
                      AVAILABLE_MOODS.find((m) => m.id === selectedMood)?.emoji
                    } ${
                      AVAILABLE_MOODS.find((m) => m.id === selectedMood)?.label
                    }`
                  : 'Mood'}
              </Text>
            </TouchableOpacity>

            {/* Weather Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActivePicker('weather')}
              style={styles.metaRow}
            >
              <MaterialCommunityIcons
                name="weather-sunny"
                size={22}
                color={selectedWeather ? '#F2A33A' : '#6E7370'}
              />
              <Text
                style={[
                  styles.metaRowLabel,
                  selectedWeather ? styles.metaRowLabelActive : null,
                ]}
              >
                {selectedWeather
                  ? `Weather · ${
                      AVAILABLE_WEATHER.find((w) => w.id === selectedWeather)?.emoji
                    } ${
                      AVAILABLE_WEATHER.find((w) => w.id === selectedWeather)?.label
                    }`
                  : 'Weather'}
              </Text>
            </TouchableOpacity>

            {/* Tag Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActivePicker('tags')}
              style={styles.metaRow}
            >
              <MaterialCommunityIcons
                name="bookmark-outline"
                size={22}
                color={selectedTags.length > 0 ? '#6E3DE6' : '#6E7370'}
              />
              <Text
                style={[
                  styles.metaRowLabel,
                  selectedTags.length > 0 ? styles.metaRowLabelActive : null,
                ]}
              >
                {selectedTags.length > 0
                  ? selectedTags.map((t) => `#${t}`).join(' ')
                  : 'Tag'}
              </Text>
            </TouchableOpacity>

            {/* Character Count Row */}
            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="alpha-w-box-outline"
                size={22}
                color="#6E7370"
              />
              <Text style={styles.metaRowLabel}>{charCount} chars</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Toolbar Toolstrip matching screenshot */}
        <View
          style={[
            styles.bottomToolbar,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          {/* 1. Typography / Font Tool */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActivePicker('font')}
            style={styles.toolItem}
          >
            <Text style={styles.fontToolText}>A</Text>
          </TouchableOpacity>

          {/* 2. Theme / Pattern Tool (Striped square) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActivePicker('theme')}
            style={styles.toolItem}
          >
            <MaterialCommunityIcons
              name="texture-box"
              size={24}
              color="#333333"
            />
          </TouchableOpacity>

          {/* 3. Alignment Tool */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={cycleAlignment}
            style={styles.toolItem}
          >
            <MaterialCommunityIcons
              name={
                textAlignment === 'center'
                  ? 'format-align-center'
                  : textAlignment === 'right'
                  ? 'format-align-right'
                  : 'format-align-left'
              }
              size={23}
              color="#333333"
            />
          </TouchableOpacity>

          {/* 4. Photo / Media Tool */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActivePicker('polaroid')}
            style={styles.toolItem}
          >
            <MaterialCommunityIcons
              name="image-outline"
              size={24}
              color={selectedPolaroid ? '#45C49A' : '#333333'}
            />
          </TouchableOpacity>

          {/* 5. Voice Memo Tool */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsRecordingMemo((prev) => !prev)}
            style={styles.toolItem}
          >
            <MaterialCommunityIcons
              name={isRecordingMemo ? 'microphone' : 'microphone-outline'}
              size={24}
              color={isRecordingMemo ? '#E56338' : '#333333'}
            />
          </TouchableOpacity>

          {/* 6. Clock / Timestamp Tool */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleInsertTimestamp}
            style={styles.toolItem}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={23}
              color="#333333"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Interactive Picker Modal Sheet */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActivePicker(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Mood Picker */}
            {activePicker === 'mood' ? (
              <View>
                <View style={styles.sheetHeaderRow}>
                  <Text style={styles.sheetTitle}>How are you feeling?</Text>
                  {selectedMood ? (
                    <TouchableOpacity onPress={() => setSelectedMood(null)}>
                      <Text style={styles.sheetClearText}>Clear</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.chipGrid}>
                  {AVAILABLE_MOODS.map((item) => {
                    const isSelected = selectedMood === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.75}
                        onPress={() => {
                          setSelectedMood(isSelected ? null : item.id);
                          setActivePicker(null);
                        }}
                        style={[
                          styles.moodChip,
                          isSelected ? styles.moodChipSelected : null,
                        ]}
                      >
                        <Text style={styles.moodEmoji}>{item.emoji}</Text>
                        <Text
                          style={[
                            styles.moodText,
                            isSelected ? styles.moodTextSelected : null,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Weather Picker */}
            {activePicker === 'weather' ? (
              <View>
                <View style={styles.sheetHeaderRow}>
                  <Text style={styles.sheetTitle}>Today's Weather</Text>
                  {selectedWeather ? (
                    <TouchableOpacity onPress={() => setSelectedWeather(null)}>
                      <Text style={styles.sheetClearText}>Clear</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.chipGrid}>
                  {AVAILABLE_WEATHER.map((item) => {
                    const isSelected = selectedWeather === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.75}
                        onPress={() => {
                          setSelectedWeather(isSelected ? null : item.id);
                          setActivePicker(null);
                        }}
                        style={[
                          styles.weatherChip,
                          isSelected ? styles.weatherChipSelected : null,
                        ]}
                      >
                        <Text style={styles.weatherEmoji}>{item.emoji}</Text>
                        <Text
                          style={[
                            styles.weatherText,
                            isSelected ? styles.weatherTextSelected : null,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Tag Picker */}
            {activePicker === 'tags' ? (
              <View>
                <View style={styles.sheetHeaderRow}>
                  <Text style={styles.sheetTitle}>Select Tags</Text>
                  {selectedTags.length > 0 ? (
                    <TouchableOpacity onPress={() => setSelectedTags([])}>
                      <Text style={styles.sheetClearText}>Clear All</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.tagWrap}>
                  {PRESET_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        activeOpacity={0.75}
                        onPress={() => toggleTag(tag)}
                        style={[
                          styles.tagChip,
                          isSelected ? styles.tagChipSelected : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            isSelected ? styles.tagTextSelected : null,
                          ]}
                        >
                          #{tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Typography / Font Picker */}
            {activePicker === 'font' ? (
              <View>
                <Text style={styles.sheetTitle}>Typography</Text>
                <Text style={styles.sheetSubheading}>Font Style</Text>
                <View style={styles.fontOptionsRow}>
                  <TouchableOpacity
                    onPress={() => setSelectedFont('system')}
                    style={[
                      styles.fontOptionCard,
                      selectedFont === 'system' ? styles.fontOptionCardSelected : null,
                    ]}
                  >
                    <Text style={styles.fontOptionSystemText}>Modern Sans</Text>
                    <Text style={styles.fontOptionSubtext}>Clean & Minimal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedFont('serif')}
                    style={[
                      styles.fontOptionCard,
                      selectedFont === 'serif' ? styles.fontOptionCardSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.fontOptionSerifText,
                        fontsLoaded ? { fontFamily: 'PlayfairDisplay_700Bold' } : null,
                      ]}
                    >
                      Playfair
                    </Text>
                    <Text style={styles.fontOptionSubtext}>Classic Editorial</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedFont('handwriting')}
                    style={[
                      styles.fontOptionCard,
                      selectedFont === 'handwriting' ? styles.fontOptionCardSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.fontOptionHandwritingText,
                        fontsLoaded ? { fontFamily: 'Caveat_600SemiBold' } : null,
                      ]}
                    >
                      Caveat
                    </Text>
                    <Text style={styles.fontOptionSubtext}>Handwritten</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sheetSubheading, { marginTop: 16 }]}>
                  Text Size
                </Text>
                <View style={styles.fontSizeRow}>
                  {(['regular', 'large', 'title'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setFontSizeLevel(level)}
                      style={[
                        styles.sizeButton,
                        fontSizeLevel === level ? styles.sizeButtonSelected : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sizeButtonText,
                          fontSizeLevel === level ? styles.sizeButtonTextSelected : null,
                        ]}
                      >
                        {level === 'regular'
                          ? 'Standard (18)'
                          : level === 'large'
                          ? 'Large (20)'
                          : 'Headline (24)'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Theme Picker */}
            {activePicker === 'theme' ? (
              <View>
                <Text style={styles.sheetTitle}>Card Theme & Color</Text>
                <View style={styles.themeRow}>
                  {COLOR_THEMES.map((theme) => {
                    const isSelected = activeTheme.id === theme.id;
                    return (
                      <TouchableOpacity
                        key={theme.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          setActiveTheme(theme);
                          setActivePicker(null);
                        }}
                        style={[
                          styles.themeCircleOuter,
                          isSelected ? styles.themeCircleOuterSelected : null,
                        ]}
                      >
                        <View
                          style={[
                            styles.themeCircleInner,
                            { backgroundColor: theme.previewColor },
                            theme.id === 'clean-white'
                              ? { borderWidth: 1, borderColor: '#D9D9D9' }
                              : null,
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Polaroid Photo Picker */}
            {activePicker === 'polaroid' ? (
              <View>
                <View style={styles.sheetHeaderRow}>
                  <Text style={styles.sheetTitle}>Attach Photo Polaroid</Text>
                  {selectedPolaroid ? (
                    <TouchableOpacity onPress={() => setSelectedPolaroid(null)}>
                      <Text style={styles.sheetClearText}>Remove</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.polaroidOptionsRow}>
                  {SAMPLE_POLAROIDS.map((p) => {
                    const isSelected =
                      selectedPolaroid?.caption === p.caption;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        activeOpacity={0.85}
                        onPress={() => {
                          setSelectedPolaroid(isSelected ? null : p);
                          setActivePicker(null);
                        }}
                        style={[
                          styles.polaroidOptionCard,
                          isSelected ? styles.polaroidOptionCardSelected : null,
                        ]}
                      >
                        <Text style={styles.polaroidOptionCaption}>
                          {p.caption}
                        </Text>
                        <Text style={styles.polaroidOptionSub}>
                          {isSelected ? '✓ Attached' : 'Tap to attach'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4ECB9A',
    paddingHorizontal: 22,
    paddingVertical: 8.5,
    borderRadius: 11,
    shadowColor: '#4ECB9A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dayNumberText: {
    fontSize: 46,
    fontWeight: '600',
    color: '#222222',
    letterSpacing: -1,
    marginRight: 10,
    includeFontPadding: false,
  },
  dateMetaColumn: {
    justifyContent: 'center',
  },
  dayOfWeekText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 16,
  },
  yearMonthText: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#7E8480',
    marginTop: 2,
  },
  voiceMemoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  voiceMemoText: {
    flex: 1,
    fontSize: 13,
    color: '#E56338',
    fontWeight: '500',
  },
  polaroidAttachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  polaroidAttachmentText: {
    flex: 1,
    fontSize: 13,
    color: '#2AB565',
    fontWeight: '500',
  },
  textInput: {
    color: '#222222',
    paddingTop: 0,
    paddingBottom: 24,
    minHeight: 220,
    flex: 1,
  },
  metadataSection: {
    paddingTop: 12,
    paddingBottom: 8,
    gap: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 2,
  },
  metaRowLabel: {
    fontSize: 14.5,
    color: '#6E7370',
    fontWeight: '400',
  },
  metaRowLabelActive: {
    color: '#222222',
    fontWeight: '500',
  },
  bottomToolbar: {
    backgroundColor: '#EDF5F0',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 14,
  },
  toolItem: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 42,
  },
  fontToolText: {
    fontSize: 21,
    fontWeight: '600',
    color: '#333333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '60%',
  },
  sheetHandle: {
    width: 38,
    height: 4.5,
    backgroundColor: '#DDD8E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },
  sheetClearText: {
    fontSize: 14,
    color: '#E56338',
    fontWeight: '600',
  },
  sheetSubheading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#777777',
    marginTop: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  moodChipSelected: {
    backgroundColor: '#E0F8EE',
    borderWidth: 1.5,
    borderColor: '#45C49A',
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodText: {
    fontSize: 14,
    color: '#444444',
    fontWeight: '500',
  },
  moodTextSelected: {
    color: '#157351',
    fontWeight: '700',
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  weatherChipSelected: {
    backgroundColor: '#FFF2DF',
    borderWidth: 1.5,
    borderColor: '#F2A33A',
  },
  weatherEmoji: {
    fontSize: 18,
  },
  weatherText: {
    fontSize: 14,
    color: '#444444',
    fontWeight: '500',
  },
  weatherTextSelected: {
    color: '#A15903',
    fontWeight: '700',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 4,
  },
  tagChip: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagChipSelected: {
    backgroundColor: '#ECE4FD',
    borderWidth: 1.5,
    borderColor: '#6E3DE6',
  },
  tagText: {
    fontSize: 13.5,
    color: '#555555',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#6E3DE6',
    fontWeight: '700',
  },
  fontOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fontOptionCard: {
    flex: 1,
    backgroundColor: '#F6F6F8',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  fontOptionCardSelected: {
    backgroundColor: '#EAE6FF',
    borderWidth: 1.5,
    borderColor: '#6E3DE6',
  },
  fontOptionSystemText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#222',
  },
  fontOptionSerifText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  fontOptionHandwritingText: {
    fontSize: 19,
    fontWeight: '600',
    color: '#222',
  },
  fontOptionSubtext: {
    fontSize: 10.5,
    color: '#777',
    marginTop: 3,
  },
  fontSizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    flex: 1,
    backgroundColor: '#F6F6F8',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  sizeButtonSelected: {
    backgroundColor: '#EAE6FF',
    borderWidth: 1.5,
    borderColor: '#6E3DE6',
  },
  sizeButtonText: {
    fontSize: 12.5,
    color: '#555',
    fontWeight: '600',
  },
  sizeButtonTextSelected: {
    color: '#6E3DE6',
    fontWeight: '700',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
  },
  themeCircleOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCircleOuterSelected: {
    borderColor: '#222222',
  },
  themeCircleInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  polaroidOptionsRow: {
    gap: 10,
    marginTop: 6,
  },
  polaroidOptionCard: {
    backgroundColor: '#F7F7FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  polaroidOptionCardSelected: {
    backgroundColor: '#EDFAF2',
    borderWidth: 1.5,
    borderColor: '#45C49A',
  },
  polaroidOptionCaption: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#222',
  },
  polaroidOptionSub: {
    fontSize: 12,
    color: '#777',
  },
});
