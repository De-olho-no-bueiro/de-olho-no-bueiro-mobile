import { type ImageSourcePropType } from 'react-native';

import { type AuthArtworkVariant } from '@/features/auth/components/AuthArtwork';

export type OnboardingSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  artworkBadge: string;
  artworkTitle: string;
  artworkDescription: string;
  artworkVariant: AuthArtworkVariant;
  artworkSource?: ImageSourcePropType;
  ctaLabel: string;
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'report-fast',
    eyebrow: 'De Olho no Bueiro',
    title: 'A tecnologia a favor da prevenção urbana',
    description:
      'Uma nova forma de mapear, reportar e resolver problemas de infraestrutura antes que eles causem transtornos.',
    artworkBadge: 'Mapeamento Interativo',
    artworkTitle: 'Visão completa da cidade',
    artworkDescription: '',
    artworkVariant: 'report',
    artworkSource: require('../../../../assets/images/3D-Pin-Map.png'),
    ctaLabel: 'Avançar',
  },
  {
    id: 'join-community',
    eyebrow: 'Vamos começar',
    title: 'Participe da rede que ajuda a prevenir transtornos',
    description:
      'Crie sua conta para colaborar, ou faça login para continuar ajudando sua comunidade.',
    artworkBadge: 'Comunidade ativa',
    artworkTitle: 'Junte-se a nós',
    artworkDescription: '',
    artworkVariant: 'community',
    ctaLabel: 'Criar conta',
  },
];
