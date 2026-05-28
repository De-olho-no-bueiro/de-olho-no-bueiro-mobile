type RouterLike = {
  back: () => void;
  replace: (href: any) => void;
  canGoBack?: () => boolean;
};

export function navigateBackOrFallback(
  router: RouterLike,
  fallback: any = '/(tabs)',
) {
  if (typeof router.canGoBack === 'function' && router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}
