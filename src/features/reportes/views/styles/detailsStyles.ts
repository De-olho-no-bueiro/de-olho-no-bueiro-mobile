import { StyleSheet } from 'react-native';

export const detailsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centeredState: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    textAlign: 'center',
    fontSize: 18,
  },
  emptyStateBackButton: {
    marginTop: 24,
  },
  floatingBackButton: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  postCard: {
    marginHorizontal: 12,
    marginBottom: 20,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
  },
  headerSection: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  authorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  authorAvatarImage: {
    width: '100%',
    height: '100%',
  },
  authorInitial: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  authorName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 11,
    marginHorizontal: 6,
  },
  metaLocation: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
  },
  mediaContainer: {
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  mediaScroll: {
    width: '100%',
    height: '100%',
  },
  mediaImage: {
    width: '100%',
    flex: 1,
  },
  mediaPlaceholder: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCounter: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mediaCounterIcon: {
    marginRight: 6,
  },
  mediaCounterText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  bodySection: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  statusRow: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '700',
    marginBottom: 16,
  },
  descriptionFallback: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
    marginBottom: 18,
  },
  locationIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginBottom: 18,
  },
  commentsHeader: {
    marginBottom: 14,
  },
  commentsTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  commentsList: {
    gap: 14,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  commentAvatarInitial: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  commentContent: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  commentHeaderMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentMenuButton: {
    marginLeft: 8,
    padding: 2,
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyCommentsIcon: {
    marginBottom: 10,
  },
  emptyCommentsText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  commentInputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  commentComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
  },
  commentSubmitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0A7EA4',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  commentEditBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  commentEditText: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentEditCancel: {
    fontSize: 13,
    fontWeight: '700',
  },
});
