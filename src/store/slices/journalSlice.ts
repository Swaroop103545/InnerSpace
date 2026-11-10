import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { JournalEntry, JournalSection, DisplayedJournalSection } from '../../types';
import { INITIAL_SECTIONS } from '../initialData';
import { isDemoEntry } from '../../services/journalFirestoreService';

export interface JournalState {
  sections: JournalSection[];
  sortDescending: boolean;
  collapsedSections: Record<string, boolean>;
  searchQuery: string;
  selectedMoodFilter: string | null;
  selectedTagFilter: string | null;
  isLoadingEntries: boolean;
}

const initialState: JournalState = {
  sections: INITIAL_SECTIONS,
  sortDescending: true,
  collapsedSections: {},
  searchQuery: '',
  selectedMoodFilter: null,
  selectedTagFilter: null,
  isLoadingEntries: false,
};

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const MONTH_ABBRS: Record<string, { full: string; code: string }> = {
  JAN: { full: 'JANUARY', code: 'jan' },
  FEB: { full: 'FEBRUARY', code: 'feb' },
  MAR: { full: 'MARCH', code: 'mar' },
  APR: { full: 'APRIL', code: 'apr' },
  MAY: { full: 'MAY', code: 'may' },
  JUN: { full: 'JUNE', code: 'jun' },
  JUL: { full: 'JULY', code: 'jul' },
  AUG: { full: 'AUGUST', code: 'aug' },
  SEP: { full: 'SEPTEMBER', code: 'sep' },
  OCT: { full: 'OCTOBER', code: 'oct' },
  NOV: { full: 'NOVEMBER', code: 'nov' },
  DEC: { full: 'DECEMBER', code: 'dec' },
};

export function resolveSectionForEntry(entry: JournalEntry): {
  id: string;
  month: string;
  year: string;
} {
  const dateObj = entry.timestamp ? new Date(entry.timestamp) : new Date();
  let month = MONTH_NAMES[dateObj.getMonth()];
  let year = String(dateObj.getFullYear());
  let code = month.substring(0, 3).toLowerCase();

  // If entry.date contains month abbreviation (e.g. "FRIDAY, NOV 02")
  if (entry.date) {
    const uppercaseDate = entry.date.toUpperCase();
    for (const [abbr, info] of Object.entries(MONTH_ABBRS)) {
      if (uppercaseDate.includes(abbr)) {
        month = info.full;
        code = info.code;
        break;
      }
    }
  }

  const id = `${code}-${year}`;
  return { id, month, year };
}

export function groupEntriesIntoSections(entries: JournalEntry[]): JournalSection[] {
  const map: Map<string, { id: string; month: string; year: string; data: JournalEntry[] }> = new Map();

  for (const entry of entries) {
    const { id, month, year } = resolveSectionForEntry(entry);
    if (!map.has(id)) {
      map.set(id, { id, month, year, data: [] });
    }
    map.get(id)!.data.push(entry);
  }

  // Sort entries within each section by timestamp descending
  return Array.from(map.values()).map((section) => ({
    ...section,
    data: [...section.data].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
  }));
}

export const journalSlice = createSlice({
  name: 'journal',
  initialState,
  reducers: {
    setIsLoadingEntries: (state, action: PayloadAction<boolean>) => {
      state.isLoadingEntries = action.payload;
    },

    setEntries: (state, action: PayloadAction<JournalEntry[]>) => {
      const rawEntries = action.payload || [];
      const entries = rawEntries.filter((e) => !isDemoEntry(e));
      if (entries.length === 0) {
        state.sections = [];
      } else {
        state.sections = groupEntriesIntoSections(entries);
      }
      state.isLoadingEntries = false;
    },

    addEntry: (state, action: PayloadAction<JournalEntry>) => {
      const entry = action.payload;
      const { id: sectionId, month, year } = resolveSectionForEntry(entry);

      const existingSectionIndex = state.sections.findIndex((s) => s.id === sectionId);
      if (existingSectionIndex >= 0) {
        // Prevent duplicate IDs if re-inserted
        state.sections[existingSectionIndex].data = [
          entry,
          ...state.sections[existingSectionIndex].data.filter((e) => e.id !== entry.id),
        ];
      } else {
        const newSection: JournalSection = {
          id: sectionId,
          month,
          year,
          data: [entry],
        };
        state.sections.unshift(newSection);
      }
    },

    updateEntry: (state, action: PayloadAction<JournalEntry>) => {
      const updated = action.payload;
      for (const section of state.sections) {
        const index = section.data.findIndex((e) => e.id === updated.id);
        if (index >= 0) {
          section.data[index] = updated;
          return;
        }
      }
    },

    deleteEntry: (state, action: PayloadAction<{ id: string; sectionId?: string }>) => {
      const { id } = action.payload;
      for (let i = 0; i < state.sections.length; i++) {
        const section = state.sections[i];
        const entryIndex = section.data.findIndex((e) => e.id === id);
        if (entryIndex >= 0) {
          section.data.splice(entryIndex, 1);
          if (section.data.length === 0) {
            state.sections.splice(i, 1);
          }
          return;
        }
      }
    },

    toggleFavoriteEntry: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      for (const section of state.sections) {
        const entry = section.data.find((e) => e.id === id);
        if (entry) {
          entry.isFavorite = !entry.isFavorite;
          return;
        }
      }
    },

    toggleSortDescending: (state) => {
      state.sortDescending = !state.sortDescending;
    },

    setSortDescending: (state, action: PayloadAction<boolean>) => {
      state.sortDescending = action.payload;
    },

    toggleSectionCollapse: (state, action: PayloadAction<string>) => {
      const sectionId = action.payload;
      state.collapsedSections[sectionId] = !state.collapsedSections[sectionId];
    },

    setSectionCollapse: (
      state,
      action: PayloadAction<{ sectionId: string; collapsed: boolean }>
    ) => {
      state.collapsedSections[action.payload.sectionId] = action.payload.collapsed;
    },

    expandAllSections: (state) => {
      state.collapsedSections = {};
    },

    collapseAllSections: (state) => {
      const collapsed: Record<string, boolean> = {};
      for (const section of state.sections) {
        collapsed[section.id] = true;
      }
      state.collapsedSections = collapsed;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setSelectedMoodFilter: (state, action: PayloadAction<string | null>) => {
      state.selectedMoodFilter = action.payload;
    },

    setSelectedTagFilter: (state, action: PayloadAction<string | null>) => {
      state.selectedTagFilter = action.payload;
    },

    clearFilters: (state) => {
      state.searchQuery = '';
      state.selectedMoodFilter = null;
      state.selectedTagFilter = null;
    },

    resetToInitialData: (state) => {
      state.sections = INITIAL_SECTIONS;
      state.collapsedSections = {};
      state.searchQuery = '';
      state.selectedMoodFilter = null;
      state.selectedTagFilter = null;
      state.isLoadingEntries = false;
    },
  },
});

export const {
  setIsLoadingEntries,
  setEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  toggleFavoriteEntry,
  toggleSortDescending,
  setSortDescending,
  toggleSectionCollapse,
  setSectionCollapse,
  expandAllSections,
  collapseAllSections,
  setSearchQuery,
  setSelectedMoodFilter,
  setSelectedTagFilter,
  clearFilters,
  resetToInitialData,
} = journalSlice.actions;

// Base selectors
export const selectJournalState = (state: { journal: JournalState }) => state.journal;
export const selectJournalSections = (state: { journal: JournalState }) => state.journal.sections;
export const selectSortDescending = (state: { journal: JournalState }) => state.journal.sortDescending;
export const selectCollapsedSections = (state: { journal: JournalState }) => state.journal.collapsedSections;
export const selectSearchQuery = (state: { journal: JournalState }) => state.journal.searchQuery;
export const selectMoodFilter = (state: { journal: JournalState }) => state.journal.selectedMoodFilter;
export const selectTagFilter = (state: { journal: JournalState }) => state.journal.selectedTagFilter;
export const selectIsLoadingEntries = (state: { journal: JournalState }) => state.journal.isLoadingEntries;

// Derived memoized selector: displayed sections with filtering & sorting applied
export const selectDisplayedSections = createSelector(
  [
    selectJournalSections,
    selectSortDescending,
    selectCollapsedSections,
    selectSearchQuery,
    selectMoodFilter,
    selectTagFilter,
  ],
  (
    sections,
    sortDescending,
    collapsedSections,
    searchQuery,
    moodFilter,
    tagFilter
  ): DisplayedJournalSection[] => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    const hasSearch = trimmedQuery.length > 0;
    const hasMood = Boolean(moodFilter);
    const hasTag = Boolean(tagFilter);

    // Apply filtering per section
    const filteredSections: JournalSection[] = [];

    for (const section of sections) {
      const matchingEntries = section.data.filter((entry) => {
        if (hasSearch) {
          const matchTitle = entry.title?.toLowerCase().includes(trimmedQuery);
          const matchBody = entry.body?.toLowerCase().includes(trimmedQuery);
          const matchTags = entry.tags?.some((t) => t.toLowerCase().includes(trimmedQuery));
          if (!matchTitle && !matchBody && !matchTags) {
            return false;
          }
        }

        if (hasMood && entry.mood !== moodFilter) {
          return false;
        }

        if (hasTag && !entry.tags?.includes(tagFilter!)) {
          return false;
        }

        return true;
      });

      // Include section if entries match (or if no filter is active, all sections)
      if (matchingEntries.length > 0 || (!hasSearch && !hasMood && !hasTag)) {
        filteredSections.push({
          ...section,
          data: matchingEntries,
        });
      }
    }

    // Apply sort order
    const orderedSections = sortDescending
      ? filteredSections
      : [...filteredSections].reverse().map((section) => ({
          ...section,
          data: [...section.data].reverse(),
        }));

    // Map to DisplayedJournalSection with totalCount and isExpanded
    return orderedSections.map((section) => {
      const isExpanded = !collapsedSections[section.id];
      return {
        ...section,
        totalCount: section.data.length,
        isExpanded,
        data: isExpanded ? section.data : [],
      };
    });
  }
);

// Derived memoized selector: overall journal statistics
export const selectJournalStats = createSelector(
  [selectJournalSections],
  (sections) => {
    let totalEntries = 0;
    let totalPolaroids = 0;
    let totalCharacters = 0;
    const moodCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    for (const section of sections) {
      for (const entry of section.data) {
        totalEntries += 1;
        if (entry.polaroid) {
          totalPolaroids += 1;
        }
        totalCharacters += (entry.body?.length || 0) + (entry.title?.length || 0);

        if (entry.mood) {
          moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        }

        if (entry.tags) {
          for (const tag of entry.tags) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        }
      }
    }

    return {
      totalEntries,
      totalPolaroids,
      totalCharacters,
      totalSections: sections.length,
      moodCounts,
      tagCounts,
    };
  }
);

export default journalSlice.reducer;
