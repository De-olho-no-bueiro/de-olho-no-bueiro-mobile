import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const detailsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header / Carousel Images
  headerImageContainer: {
    height: 250,
    width: '100%',
    position: 'relative',
    backgroundColor: '#ccc',
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  carouselContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    backgroundColor: '#ccc',
  },
  carousel: {
    width: '100%',
    height: '100%',
  },
  carouselImageWrapper: {
    width,
    height: 300,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  imageHint: {
    position: 'absolute',
    bottom: 48, // Acima do card arredondado que sobe
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageHintText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  
  // Custom Waze Back Button (Pill)
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
  },
  backButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  backButtonText: {
    marginLeft: 6,
    fontWeight: '700',
    color: '#333',
    fontSize: 15,
  },

  // Main Content Wrapper
  contentWrapper: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    minHeight: 500,
    backgroundColor: '#FFFFFF',
  },

  // Cards
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAF0F6',
    shadowColor: '#0A7EA4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  // Title Row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A7EA4',
    flex: 1,
  },
  
  // Status Badge
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 14,
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
    color: '#334155',
  },

  // Divider
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
    backgroundColor: '#EAF0F6',
  },

  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A7EA4',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },

  // Comments List
  commentsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0A7EA4',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBubble: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EAF0F6',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  commentName: {
    fontWeight: '800',
    fontSize: 14,
    color: '#0F172A',
  },
  commentTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },

  // New Comment Input Fixed Bottom
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAF0F6',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EAF0F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    marginLeft: 12,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#CBD5E1',
  }
});
