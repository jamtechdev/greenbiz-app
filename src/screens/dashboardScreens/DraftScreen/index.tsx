// src/screens/.../DraftScreen.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Modal from 'react-native-modal';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
  Platform,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { apiService } from '../../../api/axiosConfig'; // <- adjust if needed
import { scaleHeight } from '../../../utils/resposive';

// Alerts (same UX as MyListings)
import { useCustomAlert } from '../../../hook/useCustomAlert';
import CustomAlert from '../../../components/CustomAlert';

const { width } = Dimensions.get('window');

// Colors
const COLORS = {
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  secondary: '#10b981',
  accent: '#8b5cf6',
  background: '#f8fafc',
  cardBackground: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#e2e8f0',
  light: '#f1f5f9',
};

// Fonts
const FONTS = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  light: 'Poppins-Light',
};

const TABS = ['market', 'auction'];

/* ---------- Helpers ---------- */
const isDraft = (item) => String(item?.status || '').toLowerCase() === 'draft';

const isAuctionItem = (item) => {
  if (Array.isArray(item?.type)) {
    return item.type.map(x => String(x).toLowerCase()).includes('auction');
  }
  const t = String(item?.type || '').toLowerCase();
  return t === 'auction' || t.includes('auction');
};

const splitMarketAuction = (items = []) => {
  const drafts = items.filter(isDraft);
  const auctionList = drafts.filter(isAuctionItem);
  const marketList  = drafts.filter((x) => !isAuctionItem(x));
  return { marketList, auctionList };
};

export default function DraftScreen({ navigation }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('market');

  // 3-dot menu + actions
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // State per tab (with requireLogin)
  const [market, setMarket] = useState({
    data: [],
    loading: true,
    refreshing: false,
    error: '',
    requireLogin: false,
  });
  const [auction, setAuction] = useState({
    data: [],
    loading: true,
    refreshing: false,
    error: '',
    requireLogin: false,
  });

  // Alerts (same UX as MyListings)
  const { alertConfig, showConfirm, showError, showSuccess, hideAlert } = useCustomAlert();

  // Tab indicator animation
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabWidth = (width - 32) / 2;

  // Language for date formatting
  const currentLanguage = useSelector(state => state.language?.current || 'en');

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return '—';
      const lang = String(currentLanguage || '').toLowerCase();
      const locale = lang === 'zh-hant' ? 'zh-Hant' : 'en-US';
      return d.toLocaleDateString(locale, { year: 'numeric', month: 'numeric', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  const getStatusColor = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'published':
      case 'publish':
        return { bg: '#10b98120', text: '#10b981' };
      case 'pending':
        return { bg: '#f59e0b20', text: '#f59e0b' };
      case 'draft':
      default:
        return { bg: '#6b728020', text: '#6b7280' };
    }
  };

  /* ---------- Fetcher with 401 → Login required ---------- */
  const fetchFor = useCallback(async (kind, { refreshing = false } = {}) => {
    const setState = kind === 'market' ? setMarket : setAuction;

    setState(prev => ({
      ...prev,
      loading: refreshing ? prev.loading : true,
      refreshing,
      error: '',
      requireLogin: false,
    }));

    try {
      let data = [];
      const res = await apiService.getAllListing();
      const all = res?.data?.data ?? res?.data ?? [];
      const { marketList, auctionList } = splitMarketAuction(all);
      data = kind === 'market' ? marketList : auctionList;

      if (!Array.isArray(data)) data = [];
      setState({ data, loading: false, refreshing: false, error: '', requireLogin: false });
    } catch (err) {
      const status = err?.response?.status;
      const msg = String(err?.response?.data?.message || '').toLowerCase();
      const requireLogin =
        status === 401 ||
        msg.includes('authorization header') ||
        msg.includes('unauthorized') ||
        msg.includes('invalid token');

      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        requireLogin,
        error: requireLogin
          ? t('loginRequired', { defaultValue: 'Login required' })
          : (err?.response?.data?.message ||
             t('loadingError', { defaultValue: 'Unable to load items. Please try again.' })),
      }));
    }
  }, [t]);

  // Initial loads
  useEffect(() => {
    fetchFor('market');
    fetchFor('auction');
  }, [fetchFor]);

  // Animate indicator on tab change
  useEffect(() => {
    const index = activeTab === 'market' ? 0 : 1;
    Animated.spring(indicatorX, {
      toValue: index * tabWidth,
      useNativeDriver: true,
      bounciness: 10,
      speed: 12,
    }).start();
  }, [activeTab, tabWidth, indicatorX]);

  // Current tab state
  const currentState = activeTab === 'market' ? market : auction;

  const onRefresh = () => fetchFor(activeTab, { refreshing: true });

  /* ---------- Actions (same as MyListings) ---------- */
  const currentListing = currentState.data.find(i => i?.ID === activeMenuId);

  const handleViewDetails = (listing) => {
    setActiveMenuId(null);
    navigation.navigate('ProductDetailsById', { productId: listing?.ID });
  };

  const handleEditListing = (listing) => {
    setActiveMenuId(null);
    navigation.navigate('editProductscreen', {
      listingId: listing?.ID,
      listing,
    });
  };

  const handlePublishListing = (listing) => {
    setActiveMenuId(null);
    showConfirm({
      title: t('submitForReview'),
      message: `${t('submitForReview')} "${listing?.title}" ${t('sendToAdmin')}`,
      confirmText: t('submitForReview'),
      onConfirm: async () => {
        try {
          setPublishing(true);
          const response = await apiService.updateListingStatus(listing?.ID, 'pending');
          if (response?.data?.success) {
            showSuccess({
              title: t('submitForReview'),
              message: t('sendToAdmin'),
              onPress: () => fetchFor(activeTab),
            });
            fetchFor(activeTab);
          } else {
            throw new Error(response?.data?.message || 'Publish failed');
          }
        } catch (error) {
          showError({
            title: t('submissionFailed', { defaultValue: 'Submission Failed' }),
            message:
              error?.response?.data?.message ||
              t('tryAgain', { defaultValue: 'Please try again.' }),
          });
        } finally {
          setPublishing(false);
        }
      },
    });
  };

  const handleDeleteListing = (listing) => {
    setActiveMenuId(null);
    showConfirm({
      title: t('deleteListing'),
      message: `${t('deleteListing')} "${listing?.title}"? ${t('permanentlyRemove')}`,
      confirmText: t('deleteListing'),
      destructive: true,
      onConfirm: async () => {
        try {
          setDeleting(true);
          const response = await apiService.deleteListing(listing?.ID);
          if (response?.data?.success) {
            showSuccess({
              title: t('deleteListing'),
              message: t('permanentlyRemove'),
              onPress: () => fetchFor(activeTab),
            });
            fetchFor(activeTab);
          } else {
            throw new Error(response?.data?.message || 'Delete failed');
          }
        } catch (error) {
          showError({
            title: t('deleteFailed', { defaultValue: 'Delete Failed' }),
            message:
              error?.response?.data?.message ||
              t('tryAgain', { defaultValue: 'Please try again.' }),
          });
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  /* ---------- Renderers ---------- */
  const renderItem = ({ item }) => {
    const status = getStatusColor(item?.status);
    const productType = Array.isArray(item?.type) ? item.type?.[0] : item?.type;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.95}
        onPress={() => navigation.navigate('ProductDetailsById', { productId: item?.ID })}
      >
        <View style={styles.cardRow}>
          <View style={styles.imageWrap}>
            <Image
              source={{
                uri:
                  item?.thumbnail ||
                  item?.featured_image ||
                  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
              }}
              style={styles.image}
              resizeMode="contain"
            />
            <View style={styles.overlayRow}>
              <View style={styles.overlayBadge}>
                <Icon name="eye" size={12} color="#fff" />
                <Text style={styles.overlayText}>0</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.title} numberOfLines={2}>
                {item?.title || 'Untitled Listing'}
              </Text>

              {/* 3-dot menu button */}
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => setActiveMenuId(item?.ID)}
                activeOpacity={0.7}
              >
                <Icon name="more-vertical" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* status + type */}
            <View style={styles.badgeRow}>
              {!!item?.status && (
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                  <View style={[styles.dot, { backgroundColor: status.text }]} />
                  <Text style={[styles.badgeText, { color: status.text }]}>
                    {item.status}
                  </Text>
                </View>
              )}
              {!!productType && (
                <View style={[styles.badge, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={[styles.badgeText, { color: '#0277bd' }]}>{productType}</Text>
                </View>
              )}
            </View>

            <View style={styles.metaRow}>
              <Icon name="calendar" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaText}>
                {t('listedOn', {
                  defaultValue: 'Listed on {{date}}',
                  date: formatDate(item?.created_at),
                })}
              </Text>
            </View>

            <View style={styles.tagRow}>
              {item?.price ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {(item?.currency || 'USD')} {item?.price}
                  </Text>
                </View>
              ) : (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {t('priceOnRequest', { defaultValue: 'Price on request' })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <SafeAreaView style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={20} color="#0d9488" />
        </TouchableOpacity>

        <Text style={styles.screenTitle}>
          {t('productDetail.productType.marketplace')}
        </Text>

        {/* Spacer so the title stays centered */}
        <View style={styles.backButtonPlaceholder} />
      </View>

      <View style={styles.tabsWrap}>
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tabBtn}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab === 'market'
                    ?  t('productDetail.productType.market', { defaultValue: 'Market' })
                    : t('productDetail.productType.auction', { defaultValue: 'Auction' })}
                </Text>
              </TouchableOpacity>
            );   
          })}
          <Animated.View
            style={[styles.indicator, { width: tabWidth, transform: [{ translateX: indicatorX }] }]}
          />
        </View>
      </View>
    </SafeAreaView>
  );

  const EmptyState = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>
        {t('nothingToShow', { defaultValue: 'No data found' })}
      </Text>
    </View>
  );

  /* ---------- UI ---------- */
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#c0faf5" />

      {/* Header + Tabs */}
      <ListHeader />

      {/* Content */}
      {currentState.loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {t('loading', { defaultValue: 'Loading...' })}
          </Text>
        </View>
      ) : currentState.error ? (
        <View style={styles.errorWrap}>
          <Icon name="alert-triangle" size={20} color={COLORS.error} />
          <Text style={styles.errorText}>{currentState.error}</Text>

          {currentState.requireLogin ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 12 }]}
              onPress={() => navigation.navigate('Login')}
            >
              <Icon name="log-in" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>
                {t('login.signIn', { defaultValue: 'Login' })}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 12 }]}
              onPress={onRefresh}
            >
              <Icon name="refresh-cw" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>
                {t('tryAgain', { defaultValue: 'Try Again' })}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : currentState.data.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={currentState.data}
          keyExtractor={(item, idx) => item?.ID?.toString?.() ?? `row-${idx}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={currentState.refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
              progressBackgroundColor="#c0faf5"
            />
          }
        />
      )}

      {/* 3-dot Action Menu (same as MyListings) */}
      <Modal
        isVisible={activeMenuId !== null}
        onBackdropPress={() => setActiveMenuId(null)}
        backdropOpacity={0.3}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modalStyle}
      >
        <View style={styles.popoverMenu}>
          <View style={styles.menuHandle} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => currentListing && handleViewDetails(currentListing)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Icon name="eye" size={18} color="#3b82f6" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>{t('viewDetails')}</Text>
              <Text style={styles.menuSubtext}>{t('seeFullInfo')}</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => currentListing && handleEditListing(currentListing)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#fef3c7' }]}>
              <Icon name="edit" size={18} color="#f59e0b" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>{t('editListing')}</Text>
              <Text style={styles.menuSubtext}>{t('modifyDetails')}</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#94a3b8" />
          </TouchableOpacity>

          {/* Submit for review only for drafts */}
          {currentListing && String(currentListing?.status).toLowerCase() === 'draft' && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handlePublishListing(currentListing)}
              activeOpacity={0.7}
              disabled={publishing}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#dcfce7' }]}>
                {publishing ? (
                  <ActivityIndicator size={18} color="#16a34a" />
                ) : (
                  <Icon name="send" size={18} color="#16a34a" />
                )}
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuText, { color: '#16a34a' }]}>
                  {publishing ? t('submitting') : t('submitForReview')}
                </Text>
                <Text style={styles.menuSubtext}>{t('sendToAdmin')}</Text>
              </View>
              <Icon name="chevron-right" size={16} color="#16a34a" />
            </TouchableOpacity>
          )}

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={[styles.menuItem, styles.dangerMenuItem]}
            onPress={() => currentListing && handleDeleteListing(currentListing)}
            activeOpacity={0.7}
            disabled={deleting}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#fee2e2' }]}>
              {deleting ? (
                <ActivityIndicator size={18} color="#dc2626" />
              ) : (
                <Icon name="trash-2" size={18} color="#dc2626" />
              )}
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: '#dc2626' }]}>
                {deleting ? t('deleting') : t('deleteListing')}
              </Text>
              <Text style={styles.menuSubtext}>{t('permanentlyRemove')}</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Custom Alert (confirm/success/error) */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        showCancel={alertConfig.showCancel}
        cancelText={alertConfig.cancelText}
        vibrate={alertConfig.vibrate}
        onDismiss={hideAlert}
      />
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* Header + Tabs */
  header: {
    backgroundColor: '#c0faf5',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: '#e0f4f3',
    marginTop: scaleHeight(20),
    marginBottom: scaleHeight(20),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  backButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#0d9488',
    letterSpacing: -0.3,
  },
  tabsWrap: {
    backgroundColor: 'transparent',
  },
  tabsRow: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e0f4f3',
  },
  tabBtn: {
    width: (width - 32) / 2,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.semiBold,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  indicator: {
    position: 'absolute',
    height: 3,
    backgroundColor: COLORS.primary,
    bottom: 0,
    left: 0,
  },

  /* Loader / Error / Empty */
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
  },
  errorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },

  /* List + Cards */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardRow: {
    flexDirection: 'row',
    padding: 14,
  },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: 90,
    height: 90,
    backgroundColor: COLORS.light,
  },
  overlayRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
  },
  overlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  overlayText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },

  cardBody: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
    marginRight: 8,
  },

  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
  },

  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: COLORS.light,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontFamily: FONTS.semiBold,
  },

  // 3-dot menu button
  menuBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },

  // Modal styles (same palette as MyListings)
  modalStyle: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  popoverMenu: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
  },
  menuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: { flex: 1 },
  menuText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  menuSubtext: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: FONTS.medium,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  dangerMenuItem: {
    backgroundColor: '#fef2f2',
  },
});
