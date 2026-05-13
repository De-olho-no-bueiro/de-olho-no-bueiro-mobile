import React from 'react';
import { Image, type DimensionValue, type ImageSourcePropType, Text, View } from 'react-native';

export type AuthArtworkVariant =
  | 'report'
  | 'analytics'
  | 'shield'
  | 'community'
  | 'secure'
  | 'identity';

type AuthArtworkProps = {
  badge: string;
  title: string;
  description: string;
  variant: AuthArtworkVariant;
  size?: 'large' | 'compact';
  imageSource?: ImageSourcePropType;
};

function FloatingSparkle({ className }: { className: string }) {
  return (
    <View className={`absolute h-3 w-3 rotate-45 rounded-[4px] bg-white/90 ${className}`} />
  );
}

function FallbackScene({ variant, size }: { variant: AuthArtworkVariant; size: 'large' | 'compact' }) {
  const shellStyle = { height: size === 'large' ? 208 : 144 };
  const logoStyle = { height: size === 'large' ? 40 : 32, width: size === 'large' ? 40 : 32 };

  if (variant === 'analytics') {
    return (
      <View className="relative w-full items-center justify-center" style={shellStyle}>
        <FloatingSparkle className="left-8 top-3" />
        <FloatingSparkle className="right-10 top-10 h-2.5 w-2.5" />
        <View className="absolute left-7 top-10 h-16 w-16 rounded-full border-[8px] border-slate-300 bg-slate-200/70" />
        <View className="absolute right-12 top-14 h-20 w-14 rotate-12 rounded-[18px] bg-[#7aa9ff]" />
        <View className="absolute bottom-12 h-24 w-40 rounded-[28px] bg-[#4a7cff]" />
        <View className="absolute bottom-8 left-8 h-24 w-16 rounded-[22px] bg-[#8dc7ff]" />
        <View className="absolute bottom-16 right-10 rounded-[20px] border border-white/80 bg-white/90 px-4 py-3">
          <View className="mb-2 h-1.5 w-16 rounded-full bg-blue-200" />
          <View className="flex-row items-end gap-1">
            <View className="h-4 w-4 rounded-full bg-blue-500" />
            <View className="h-8 w-8 rounded-full bg-blue-400" />
            <View className="h-6 w-6 rounded-full bg-blue-300" />
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'shield') {
    return (
      <View className="relative w-full items-center justify-center" style={shellStyle}>
        <FloatingSparkle className="left-10 top-4" />
        <FloatingSparkle className="right-10 top-4" />
        <View className="absolute left-8 top-16 h-14 w-14 rounded-[18px] bg-[#4a7cff]" />
        <View className="absolute right-8 top-14 h-12 w-12 rounded-[16px] bg-[#79a9ff]" />
        <View className="absolute bottom-10 h-28 w-44 rounded-[32px] bg-[#5b8cff]" />
        <View className="absolute bottom-16 h-24 w-24 items-center justify-center rounded-[28px] bg-white/95">
          <View className="h-12 w-12 rounded-[18px] bg-[#2f63f3]" />
          <View className="absolute h-6 w-6 rounded-b-[10px] rounded-t-[6px] border-[3px] border-amber-500 bg-amber-300" />
        </View>
        <View className="absolute bottom-7 left-10 h-16 w-16 rounded-[22px] border-4 border-[#bcd2ff] bg-transparent" />
        <View className="absolute bottom-7 right-10 h-16 w-16 rounded-[22px] border-4 border-[#bcd2ff] bg-transparent" />
      </View>
    );
  }

  if (variant === 'community') {
    return (
      <View className="relative w-full items-center justify-center" style={shellStyle}>
        <View className="h-28 w-28 items-center justify-center rounded-full bg-white shadow-md border-[4px] border-blue-50 overflow-hidden">
          <Image
            source={require('../../../../assets/images/Novo-logo-bueiro.png')}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </View>
    );
  }

  if (variant === 'identity') {
    return (
      <View className="relative w-full items-center justify-center" style={shellStyle}>
        <FloatingSparkle className="left-8 top-6" />
        <View className="absolute left-10 top-16 h-14 w-14 rounded-[18px] bg-[#8dc7ff]" />
        <View className="absolute right-10 top-12 h-10 w-10 rounded-[14px] bg-[#4a7cff]" />
        <View className="absolute bottom-12 h-24 w-40 rounded-[30px] bg-[#5b8cff]" />
        <View className="absolute bottom-20 h-16 w-28 rounded-[22px] bg-white/95" />
        <View className="absolute flex-row items-center" style={{ bottom: 72 }}>
          <Image
            source={require('../../../../assets/images/Novo-logo-bueiro.png')}
            resizeMode="contain"
            style={logoStyle}
          />
        </View>
        <View className="absolute bottom-20 right-9 h-12 w-12 rounded-full border-[5px] border-amber-100 bg-amber-400" />
      </View>
    );
  }

  if (variant === 'secure') {
    return (
      <View className="relative w-full items-center justify-center" style={shellStyle}>
        <FloatingSparkle className="left-9 top-4" />
        <View className="absolute bottom-10 h-24 w-36 rounded-[28px] bg-[#4a7cff]" />
        <View className="absolute bottom-20 h-20 w-24 rounded-[24px] bg-[#2f63f3]" />
        <View className="absolute bottom-24 left-10 h-16 w-16 rounded-[22px] border-4 border-[#bcd2ff] bg-transparent" />
        <View className="absolute bottom-20 right-8 h-20 w-16 rotate-12 rounded-[20px] bg-amber-300" />
        <View className="absolute bottom-24 h-10 w-10 rounded-full border-[5px] border-amber-100 bg-amber-400" />
      </View>
    );
  }

  return (
    <View className="relative w-full items-center justify-center" style={shellStyle}>
      <FloatingSparkle className="left-8 top-5" />
      <FloatingSparkle className="right-8 top-8" />
      <View className="absolute left-7 top-14 h-16 w-16 rounded-[22px] bg-[#8dc7ff]" />
      <View className="absolute right-9 top-12 h-14 w-14 rounded-[18px] bg-[#4a7cff]" />
      <View className="absolute bottom-10 h-24 w-40 rounded-[28px] bg-[#4a7cff]" />
      <View className="absolute bottom-20 h-20 w-28 rounded-[26px] bg-[#2f63f3]" />
      <View className="absolute bottom-20 right-8 h-16 w-12 rotate-12 rounded-[18px] bg-amber-300" />
      <View className="absolute bottom-28 h-11 w-11 rounded-full border-[5px] border-amber-100 bg-amber-400" />
      <Image
        source={require('../../../../assets/images/Novo-logo-bueiro.png')}
        resizeMode="contain"
        className="absolute"
        style={[logoStyle, { bottom: 84 }]}
      />
    </View>
  );
}

export function AuthArtwork({
  badge,
  title,
  description,
  variant,
  size = 'large',
  imageSource,
}: AuthArtworkProps) {
  const isLarge = size === 'large';
  const rowPositions: DimensionValue[] = ['16%', '32%', '48%', '64%', '80%'];
  const columnPositions: DimensionValue[] = ['16%', '34%', '52%', '70%', '88%'];

  return (
    <View
      className="overflow-hidden rounded-[30px] border border-blue-100 bg-white"
      style={{ height: isLarge ? 352 : 228 }}
    >
      <View className="absolute inset-0 bg-[#f7fbff]" />

      {rowPositions.map((top, index) => (
        <View
          key={`row-${index}`}
          className="absolute left-0 right-0 h-px bg-blue-100/70"
          style={{ top }}
        />
      ))}

      {columnPositions.map((left, index) => (
        <View
          key={`col-${index}`}
          className="absolute bottom-0 top-0 w-px bg-blue-100/70"
          style={{ left }}
        />
      ))}

      <View className="absolute left-4 top-4 rounded-full border border-blue-100 bg-white/95 px-3 py-2">
        <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-blue-600">
          {badge}
        </Text>
      </View>

      <View
        className="absolute inset-x-0 items-center justify-center"
        style={isLarge ? { top: 40, bottom: 96 } : { top: 32, bottom: 80 }}
      >
        {imageSource ? (
          <Image
            source={imageSource}
            resizeMode="contain"
            style={{ height: isLarge ? 208 : 128, width: isLarge ? 208 : 128 }}
          />
        ) : (
          <FallbackScene variant={variant} size={size} />
        )}
      </View>

      <View className="absolute inset-x-4 bottom-4 rounded-[24px] border border-blue-100 bg-white/95 px-4 py-3">
        <Text className="text-sm font-bold tracking-tight text-slate-950">{title}</Text>
        <Text className="mt-1 text-xs leading-5 text-slate-500">{description}</Text>
      </View>
    </View>
  );
}
