import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  uid: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  name: string;
  email: string;
  subtitle: string;
  streakDays: number;
  photoURL?: string | null;
}

const initialState: UserState = {
  uid: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  name: '',
  email: '',
  subtitle: 'Tell me about your day today',
  streakDays: 0,
  photoURL: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setAuthInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },

    login: (
      state,
      action: PayloadAction<{
        uid?: string;
        email: string;
        password?: string;
        name?: string;
        photoURL?: string | null;
      }>
    ) => {
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.isLoading = false;
      state.email = action.payload.email;
      if (action.payload.uid) {
        state.uid = action.payload.uid;
      }
      if (action.payload.name) {
        state.name = action.payload.name;
      }
      if (action.payload.photoURL !== undefined) {
        state.photoURL = action.payload.photoURL;
      }
    },

    register: (
      state,
      action: PayloadAction<{
        uid?: string;
        name: string;
        email: string;
        password?: string;
      }>
    ) => {
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.isLoading = false;
      state.name = action.payload.name;
      state.email = action.payload.email;
      if (action.payload.uid) {
        state.uid = action.payload.uid;
      }
    },

    setFullUserProfile: (
      state,
      action: PayloadAction<{
        uid: string;
        name: string;
        email: string;
        subtitle?: string;
        streakDays?: number;
        photoURL?: string | null;
      }>
    ) => {
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.isLoading = false;
      state.uid = action.payload.uid;
      state.name = action.payload.name;
      state.email = action.payload.email;
      if (action.payload.subtitle !== undefined) {
        state.subtitle = action.payload.subtitle;
      }
      if (action.payload.streakDays !== undefined) {
        state.streakDays = action.payload.streakDays;
      }
      if (action.payload.photoURL !== undefined) {
        state.photoURL = action.payload.photoURL;
      }
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.isLoading = false;
      state.uid = null;
    },

    updateProfile: (
      state,
      action: PayloadAction<{
        name?: string;
        email?: string;
        subtitle?: string;
        streakDays?: number;
      }>
    ) => {
      if (action.payload.name !== undefined) {
        state.name = action.payload.name;
      }
      if (action.payload.email !== undefined) {
        state.email = action.payload.email;
      }
      if (action.payload.subtitle !== undefined) {
        state.subtitle = action.payload.subtitle;
      }
      if (action.payload.streakDays !== undefined) {
        state.streakDays = action.payload.streakDays;
      }
    },
  },
});

export const {
  setAuthLoading,
  setAuthInitialized,
  login,
  register,
  setFullUserProfile,
  logout,
  updateProfile,
} = userSlice.actions;

export const selectUserId = (state: { user: UserState }) => state.user.uid;
export const selectIsAuthenticated = (state: { user: UserState }) =>
  state.user.isAuthenticated;
export const selectAuthIsInitialized = (state: { user: UserState }) =>
  state.user.isInitialized;
export const selectAuthIsLoading = (state: { user: UserState }) =>
  state.user.isLoading;
export const selectUserName = (state: { user: UserState }) => state.user.name;
export const selectUserEmail = (state: { user: UserState }) => state.user.email;
export const selectUserSubtitle = (state: { user: UserState }) =>
  state.user.subtitle;
export const selectUserStreakDays = (state: { user: UserState }) =>
  state.user.streakDays;

export default userSlice.reducer;
