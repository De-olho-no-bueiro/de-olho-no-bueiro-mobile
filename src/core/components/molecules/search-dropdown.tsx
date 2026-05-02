import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/core/components/atoms/themed-text';
import { IconSymbol } from '@/core/components/atoms/icon-symbol';

type SearchDropdownProps<T> = {
  items: T[];
  visible: boolean;
  emptyText?: string;
  getKey: (item: T, index: number) => string;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
  backgroundColor: string;
  borderColor: string;
};

export function SearchDropdown<T>({
  items,
  visible,
  emptyText = 'Nenhum resultado encontrado',
  getKey,
  getLabel,
  onSelect,
  backgroundColor,
  borderColor,
}: SearchDropdownProps<T>) {
  if (!visible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      {items.length === 0 ? (
        <ThemedText style={styles.emptyText}>{emptyText}</ThemedText>
      ) : (
        items.map((item, index) => (
          <TouchableOpacity
            key={getKey(item, index)}
            style={[
              styles.item,
              index < items.length - 1 && { borderBottomColor: borderColor, borderBottomWidth: 1 },
            ]}
            onPress={() => onSelect(item)}
          >
            <View style={styles.itemContent}>
              <IconSymbol name="mappin.and.ellipse" size={18} color="#64748B" />
              <ThemedText numberOfLines={1} style={styles.itemText}>
                {getLabel(item)}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56, // Adjusted to be closer to search bar
    left: 0,
    right: 0,
    borderRadius: 16,
    marginTop: 4,
    maxHeight: 250,
    zIndex: 20,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemText: {
    fontSize: 15,
    flex: 1,
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});
