import React from 'react';
import { type DimensionValue, View } from 'react-native';

const verticalGridPositions: DimensionValue[] = ['10%', '24%', '38%', '52%', '66%', '80%', '94%'];
const horizontalGridPositions: DimensionValue[] = ['8%', '22%', '36%', '50%', '64%', '78%', '92%'];

export function AuthBackdrop() {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden bg-[#dbe9ff]">
      {verticalGridPositions.map((left) => (
        <View
          key={`v-${left}`}
          className="absolute bottom-0 top-0 w-px bg-white/55"
          style={{ left }}
        />
      ))}

      {horizontalGridPositions.map((top) => (
        <View
          key={`h-${top}`}
          className="absolute left-0 right-0 h-px bg-white/55"
          style={{ top }}
        />
      ))}

      <View className="absolute -left-24 top-2 h-56 w-56 rounded-full bg-[#bfd5ff]/80" />
      <View className="absolute -right-16 top-24 h-48 w-48 rounded-full bg-[#cde1ff]/90" />
      <View className="absolute bottom-10 left-8 h-28 w-28 rounded-full bg-white/45" />
      <View className="absolute bottom-20 right-6 h-24 w-24 rounded-full bg-[#b7d1ff]/70" />
    </View>
  );
}
