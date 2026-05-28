import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

type AuthPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Feather>['name'];
};

export function AuthPrimaryButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  icon,
}: AuthPrimaryButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`h-14 w-full flex-row items-center justify-center rounded-full ${
        isDisabled ? 'bg-blue-300' : 'bg-blue-600'
      }`}
      style={({ pressed }) => ({
        opacity: pressed && !isDisabled ? 0.92 : 1,
        shadowColor: '#2563EB',
        shadowOpacity: isDisabled ? 0 : 0.24,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 12 },
        elevation: isDisabled ? 0 : 6,
      })}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Text className="text-base font-bold tracking-tight text-white">{label}</Text>
          {icon ? <Feather name={icon} size={18} color="#FFFFFF" style={{ marginLeft: 8 }} /> : null}
        </>
      )}
    </Pressable>
  );
}
