import React, { useState } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

type AuthInputProps = TextInputProps & {
  icon: FeatherIconName;
  label: string;
  hint?: string;
};

export function AuthInput({ icon, label, hint, onFocus, onBlur, ...props }: AuthInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      <Text className="mb-2 ml-1 text-[11px] font-semibold uppercase tracking-[1.8px] text-slate-400">
        {label}
      </Text>

      <View
        className={`h-16 flex-row items-center rounded-[24px] border px-4 ${
          isFocused ? 'border-blue-500 bg-white' : 'border-slate-200 bg-[#f7fbff]'
        }`}
      >
        <View
          className={`mr-3 h-11 w-11 items-center justify-center rounded-[16px] ${
            isFocused ? 'bg-blue-600' : 'bg-blue-50'
          }`}
        >
          <Feather name={icon} size={18} color={isFocused ? '#FFFFFF' : '#2563EB'} />
        </View>

        <TextInput
          {...props}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          className="flex-1 text-[15px] font-medium text-slate-900"
          placeholderTextColor="#94A3B8"
        />
      </View>

      {hint ? <Text className="mt-2 ml-1 text-xs leading-5 text-slate-400">{hint}</Text> : null}
    </View>
  );
}
