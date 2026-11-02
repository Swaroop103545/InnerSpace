import React from 'react';
import { StyleSheet, Text, View, Image, ImageSourcePropType, Platform } from 'react-native';

interface PolaroidProps {
  image: ImageSourcePropType;
  caption: string;
  tapeColor?: string;
  fontsLoaded?: boolean;
}

export const Polaroid: React.FC<PolaroidProps> = ({
  image,
  caption,
  tapeColor = 'rgba(180, 140, 240, 0.72)',
  fontsLoaded = false,
}) => {
  return (
    <View style={styles.wrapper}>
      {/* Washi Tape Strip on Top Edge */}
      <View
        style={[
          styles.tape,
          {
            backgroundColor: tapeColor,
          },
        ]}
      />

      {/* Polaroid Frame */}
      <View style={styles.frame}>
        <Image source={image} style={styles.photo} resizeMode="cover" />
        <Text
          style={[
            styles.captionText,
            fontsLoaded ? { fontFamily: 'Caveat_600SemiBold' } : null,
          ]}
          numberOfLines={1}
        >
          {caption}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 8, // Space for the tape overhang
  },
  tape: {
    position: 'absolute',
    top: 0,
    width: 46,
    height: 15,
    borderRadius: 2,
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  frame: {
    backgroundColor: '#FFFFFF',
    padding: 5.5,
    paddingBottom: 7,
    borderRadius: 4,
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 6,
    alignItems: 'center',
    width: 108,
  },
  photo: {
    width: 97,
    height: 88,
    borderRadius: 2,
  },
  captionText: {
    marginTop: 5,
    fontSize: 15,
    color: '#24202C',
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Snell Roundhand', android: 'sans-serif-medium' }),
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
