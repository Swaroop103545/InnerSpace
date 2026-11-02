import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TabType } from '../../components/BottomNavBar';
import { JournalEntry } from '../../types';

export interface UIState {
  activeTab: TabType;
  isNewEntryOpen: boolean;
  editingEntry: JournalEntry | null;
  selectedEntryDetail: JournalEntry | null;
  isSearchBarVisible: boolean;
}

const initialState: UIState = {
  activeTab: 'home',
  isNewEntryOpen: false,
  editingEntry: null,
  selectedEntryDetail: null,
  isSearchBarVisible: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<TabType>) => {
      state.activeTab = action.payload;
    },

    openNewEntryModal: (state) => {
      state.editingEntry = null;
      state.isNewEntryOpen = true;
    },

    openEditEntryModal: (state, action: PayloadAction<JournalEntry>) => {
      state.editingEntry = action.payload;
      state.isNewEntryOpen = true;
    },

    closeNewEntryModal: (state) => {
      state.isNewEntryOpen = false;
      state.editingEntry = null;
    },

    setSelectedEntryDetail: (state, action: PayloadAction<JournalEntry | null>) => {
      state.selectedEntryDetail = action.payload;
    },

    toggleSearchBar: (state) => {
      state.isSearchBarVisible = !state.isSearchBarVisible;
    },

    setSearchBarVisible: (state, action: PayloadAction<boolean>) => {
      state.isSearchBarVisible = action.payload;
    },
  },
});

export const {
  setActiveTab,
  openNewEntryModal,
  openEditEntryModal,
  closeNewEntryModal,
  setSelectedEntryDetail,
  toggleSearchBar,
  setSearchBarVisible,
} = uiSlice.actions;

export const selectActiveTab = (state: { ui: UIState }) => state.ui.activeTab;
export const selectIsNewEntryOpen = (state: { ui: UIState }) => state.ui.isNewEntryOpen;
export const selectEditingEntry = (state: { ui: UIState }) => state.ui.editingEntry;
export const selectSelectedEntryDetail = (state: { ui: UIState }) => state.ui.selectedEntryDetail;
export const selectIsSearchBarVisible = (state: { ui: UIState }) => state.ui.isSearchBarVisible;

export default uiSlice.reducer;

