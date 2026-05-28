import React, { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ListRenderItemInfo,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthArtwork } from '@/features/auth/components/AuthArtwork';
import { AuthBackdrop } from '@/features/auth/components/AuthBackdrop';
import { AuthPrimaryButton } from '@/features/auth/components/AuthPrimaryButton';
import { onboardingSlides, type OnboardingSlide } from '@/features/auth/constants/onboarding-slides';

function OnboardingCard({
  item,
  index,
  activeIndex,
  total,
  onNext,
  onLogin,
  screenWidth,
}: {
  item: OnboardingSlide;
  index: number;
  activeIndex: number;
  total: number;
  onNext: () => void;
  onLogin: () => void;
  screenWidth: number;
}) {
  const isLast = index === total - 1;

  return (
    <View style={{ width: screenWidth }} className="flex-1 px-4 pb-6 pt-3">
      <View className="mx-auto h-full w-full max-w-[430px] rounded-[40px] border border-white/70 bg-white/80 p-2">
        <View
          className="flex-1 rounded-[32px] bg-white px-4 pb-5 pt-4"
          style={{
            shadowColor: '#173B83',
            shadowOpacity: 0.14,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 18 },
            elevation: 6,
          }}
        >
          <View className="mb-2" />

          {item.artworkVariant === 'community' ? (
            <View className="items-center justify-center py-8">
              <View 
                className="items-center justify-center rounded-full border-8 border-blue-50/60 bg-white"
                style={{
                  width: 170,
                  height: 170,
                  shadowColor: '#173B83',
                  shadowOpacity: 0.12,
                  shadowRadius: 28,
                  shadowOffset: { width: 0, height: 12 },
                  elevation: 8,
                }}
              >
                <Image
                  source={require('../../../../assets/images/Novo-logo-bueiro.png')}
                  resizeMode="cover"
                  style={{ width: '100%', height: '100%', borderRadius: 999 }}
                />
              </View>
              <Text className="mt-6 text-[22px] font-black tracking-widest text-slate-700 uppercase">
                De Olho no Bueiro
              </Text>
              <View className="mt-4 h-1.5 w-12 rounded-full bg-blue-500" />
            </View>
          ) : (
            <AuthArtwork
              badge={item.artworkBadge}
              title={item.artworkTitle}
              description={item.artworkDescription}
              variant={item.artworkVariant}
              size="compact"
              imageSource={item.artworkSource}
            />
          )}

          <View className="mt-6">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-blue-600">
              {item.eyebrow}
            </Text>
            <Text className="mt-2 text-[31px] font-bold leading-[35px] tracking-tight text-slate-950">
              {item.title}
            </Text>
            <Text className="mt-3 text-sm leading-6 text-slate-500">{item.description}</Text>
          </View>

          <View className="mt-auto pt-6">
            <View className="mb-5 flex-row items-center justify-center">
              {onboardingSlides.map((slide, slideIndex) => (
                <View
                  key={slide.id}
                  className={`mx-1 rounded-full ${
                    slideIndex === activeIndex ? 'h-2.5 w-8 bg-blue-600' : 'h-2.5 w-2.5 bg-blue-200'
                  }`}
                />
              ))}
            </View>

            <AuthPrimaryButton
              label={item.ctaLabel}
              icon="arrow-right"
              onPress={onNext}
            />

            {isLast && (
              <Pressable
                onPress={onLogin}
                className="mt-4 flex-row items-center justify-center rounded-full border-2 border-blue-100 bg-white py-3"
                style={({ pressed }) => ({ opacity: pressed ? 0.84 : 1 })}
              >
                <Text className="text-[15px] font-bold text-blue-600">Já tenho uma conta</Text>
              </Pressable>
            )}
          </View>

          <View className="mt-2 items-center">
            <View className="h-1.5 w-16 rounded-full bg-slate-900/10" />
          </View>
        </View>
      </View>
    </View>
  );
}

export function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const { slide } = useLocalSearchParams<{ slide?: string }>();
  const initialIndex = slide && !isNaN(Number(slide)) ? parseInt(slide, 10) : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex);
  };

  const handleNext = (index: number) => {
    if (index === onboardingSlides.length - 1) {
      router.push('/register' as any);
      return;
    }

    const nextIndex = index + 1;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setActiveIndex(nextIndex);
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<OnboardingSlide>) => (
    <OnboardingCard
      item={item}
      index={index}
      activeIndex={activeIndex}
      total={onboardingSlides.length}
      onNext={() => handleNext(index)}
      onLogin={() => router.push('/login' as any)}
      screenWidth={width}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#dbe9ff' }}>
      <StatusBar style="dark" />

      <View className="flex-1 bg-[#dbe9ff]">
        <AuthBackdrop />

        <FlatList
          ref={flatListRef}
          data={onboardingSlides}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      </View>
    </SafeAreaView>
  );
}
