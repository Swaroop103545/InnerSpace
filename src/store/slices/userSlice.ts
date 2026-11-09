import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  isAuthenticated: boolean;
  name: string;
  email: string;
  subtitle: string;
  streakDays: number;
}

const initialState: UserState = {
  isAuthenticated: false,
  name: 'Emma',
  email: 'emma@innerspace.app',
  subtitle: 'Tell me about your day today',
  streakDays: 14,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{ email: string; password?: string; name?: string }>
    ) => {
      state.isAuthenticated = true;
      state.email = action.payload.email;
      if (action.payload.name) {
        state.name = action.payload.name;
      }
    },

    register: (
      state,
      action: PayloadAction<{ name: string; email: string; password?: string }>
    ) => {
      state.isAuthenticated = true;
      state.name = action.payload.name;
      state.email = action.payload.email;
    },

    logout: (state) => {
      state.isAuthenticated = false;
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

export const { login, register, logout, updateProfile } = userSlice.actions;

export const selectIsAuthenticated = (state: { user: UserState }) =>
  state.user.isAuthenticated;
export const selectUserName = (state: { user: UserState }) => state.user.name;
export const selectUserEmail = (state: { user: UserState }) => state.user.email;
export const selectUserSubtitle = (state: { user: UserState }) =>
  state.user.subtitle;
export const selectUserStreakDays = (state: { user: UserState }) =>
  state.user.streakDays;

export default userSlice.reducer;
