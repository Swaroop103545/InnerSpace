import { ImageSourcePropType } from 'react-native';

export interface PolaroidData {
  image: ImageSourcePropType;
  caption: string;
  tapeColor: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  titleEmoji?: string;
  body: string;
  backgroundColor: string;
  textColors: {
    date: string;
    title: string;
    body: string;
  };
  polaroid?: PolaroidData;
  mood?: string;
  weather?: string;
  tags?: string[];
  alignment?: 'left' | 'center' | 'right';
  fontFamily?: string;
}

export interface JournalSection {
  id: string;
  month: string;
  year: string;
  data: JournalEntry[];
}

export interface DisplayedJournalSection extends JournalSection {
  totalCount: number;
  isExpanded: boolean;
}


