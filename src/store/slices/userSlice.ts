import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  name: string;
  subtitle: string;
  streakDays: number;
}

const initialState: UserState = {
  name: 'Emma',
  subtitle: 'Tell me about your day today',
  streakDays: 14,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateProfile: (
      state,
      action: PayloadAction<{ name?: string; subtitle?: string; streakDays?: number }>
    ) => {
      if (action.payload.name !== undefined) {
        state.name = action.payload.name;
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

export const { updateProfile } = userSlice.actions;

export const selectUserName = (state: { user: UserState }) => state.user.name;
export const selectUserSubtitle = (state: { user: UserState }) => state.user.subtitle;
export const selectUserStreakDays = (state: { user: UserState }) => state.user.streakDays;

export default userSlice.reducer;

