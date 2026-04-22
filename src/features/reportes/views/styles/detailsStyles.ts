import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const detailsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  safeArea: {
    flex: 1,
  },

  topSpacer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },

  mainContent: {
    flex: 1,
  },

  mediaContainer: {
    width: '100%',
    height: 380,
    backgroundColor: '#000',
  },
  mediaScroll: {
    width: '100%',
    height: '100%',
  },
  mediaImage: {
    width: width,
    height: 380,
  },
  mediaPlaceholder: {
    width: width,
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  content: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A7EA4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaDot: {
    fontSize: 10,
    color: '#64748B',
    marginHorizontal: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#64748B',
  },

  titleSection: {
    marginBottom: 16,
  },
  typeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeIcon: {
    marginRight: 6,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A7EA4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 30,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
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
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    marginBottom: 20,
  },

  locationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  locationIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },

  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  commentsList: {
    paddingBottom: 100,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  commentTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },

  emptyComments: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },

  commentInputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
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

  darkContainer: {
    backgroundColor: '#000',
  },
  darkContent: {
    backgroundColor: '#000',
  },
  darkCard: {
    backgroundColor: '#1C1C1E',
  },
  darkText: {
    color: '#F5F5F7',
  },
  darkMuted: {
    color: '#8E8E93',
  },
  darkBorder: {
    borderColor: '#38383A',
  },
  darkInputWrapper: {
    backgroundColor: '#1C1C1E',
    borderTopColor: '#38383A',
  },
  darkInput: {
    backgroundColor: '#2C2C2E',
    color: '#F5F5F7',
  },
  darkCommentContent: {
    backgroundColor: '#1C1C1E',
  },
});
