import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '@/theme/tokens';
import { STATUS_LIST } from '@/constants/statuses';
import { useSearch } from '@/hooks';
import type { NodeType, SearchResult } from '@/types';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchResultCard } from '@/components/search/SearchResultCard';

export default function SearchScreen() {
  const [nodeTypeFilter, setNodeTypeFilter] = useState<NodeType | undefined>(
    undefined
  );
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const {
    query,
    setQuery,
    clearQuery,
    refresh,
    results,
    loading,
    error,
  } = useSearch(250, {
    nodeType: nodeTypeFilter,
    status: statusFilter,
  });

  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const hasSearchCriteriaRef = useRef<boolean>(false);
  const activeStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    hasSearchCriteriaRef.current =
      query.trim().length > 0 || Boolean(statusFilter);
    activeStatusRef.current = statusFilter;
  }, [query, statusFilter]);

  // Refresh results when returning to Search & gently focus input when idle
  useFocusEffect(
    useCallback(() => {
      if (hasSearchCriteriaRef.current) {
        refresh();
      }
      if (!activeStatusRef.current) {
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 120);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [refresh])
  );

  const handleClearAll = useCallback(() => {
    clearQuery();
    setNodeTypeFilter(undefined);
    setStatusFilter(undefined);
  }, [clearQuery]);

  const handleSelectAll = () => {
    setNodeTypeFilter(undefined);
    setStatusFilter(undefined);
  };

  const handleToggleType = (type: NodeType) => {
    if (nodeTypeFilter === type && !statusFilter) {
      setNodeTypeFilter(undefined);
    } else {
      setNodeTypeFilter(type);
      setStatusFilter(undefined);
    }
  };

  const handleToggleStatus = (statusVal: string) => {
    if (statusFilter === statusVal) {
      setStatusFilter(undefined);
    } else {
      setStatusFilter(statusVal);
      setNodeTypeFilter(undefined);
    }
  };

  const handleSelectResult = useCallback((item: SearchResult) => {
    if (item.nodeType === 'entry') {
      router.push(`/node/${item.id}` as any);
    } else {
      router.navigate({
        pathname: '/(tabs)',
        params: { nodeId: item.id },
      } as any);
    }
  }, []);

  const hasQuery = query.trim().length > 0;
  const hasStatus = Boolean(statusFilter);
  const isSearchActive = hasQuery || hasStatus;
  const isAllActive = !nodeTypeFilter && !statusFilter;

  return (
    <ScreenContainer avoidKeyboard>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        {isSearchActive && !loading ? (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{results.length} found</Text>
          </View>
        ) : null}
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarWrap}>
        <View
          style={[
            styles.searchBar,
            isFocused && styles.searchBarFocused,
          ]}>
          <Ionicons
            name="search-outline"
            size={18}
            color={isFocused ? Colors.tier.core : Colors.text.muted}
          />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search titles, tags, notes, or details..."
            placeholderTextColor={Colors.text.muted}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {loading ? (
            <ActivityIndicator size="small" color={Colors.tier.core} />
          ) : null}
          {query.length > 0 ? (
            <Pressable
              hitSlop={8}
              onPress={clearQuery}
              accessibilityLabel="Clear search input"
              accessibilityRole="button">
              <Ionicons
                name="close-circle"
                size={18}
                color={Colors.text.muted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Horizontal Filter Pills */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.filtersContent}>
          <Pressable
            style={[styles.pill, isAllActive && styles.pillActive]}
            onPress={handleSelectAll}>
            <Text
              style={[
                styles.pillText,
                isAllActive && styles.pillTextActive,
              ]}>
              All
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.pill,
              nodeTypeFilter === 'entry' && !statusFilter && styles.pillActive,
            ]}
            onPress={() => handleToggleType('entry')}>
            <Ionicons
              name="document-text-outline"
              size={13}
              color={
                nodeTypeFilter === 'entry' && !statusFilter
                  ? Colors.tier.core
                  : Colors.text.secondary
              }
            />
            <Text
              style={[
                styles.pillText,
                nodeTypeFilter === 'entry' &&
                  !statusFilter &&
                  styles.pillTextActive,
              ]}>
              Entries
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.pill,
              nodeTypeFilter === 'folder' && !statusFilter && styles.pillActive,
            ]}
            onPress={() => handleToggleType('folder')}>
            <Ionicons
              name="folder-outline"
              size={13}
              color={
                nodeTypeFilter === 'folder' && !statusFilter
                  ? Colors.tier.core
                  : Colors.text.secondary
              }
            />
            <Text
              style={[
                styles.pillText,
                nodeTypeFilter === 'folder' &&
                  !statusFilter &&
                  styles.pillTextActive,
              ]}>
              Folders
            </Text>
          </Pressable>

          {STATUS_LIST.map((preset) => {
            const val = String(preset.value);
            const active = statusFilter === val;
            return (
              <Pressable
                key={val}
                style={[
                  styles.pill,
                  active && {
                    borderColor: preset.color,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  },
                ]}
                onPress={() => handleToggleStatus(val)}>
                <Ionicons
                  name={preset.icon as keyof typeof Ionicons.glyphMap}
                  size={13}
                  color={active ? preset.color : Colors.text.secondary}
                />
                <Text
                  style={[
                    styles.pillText,
                    active && { color: preset.color, fontWeight: FontWeight.bold },
                  ]}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Dark Inline Error Banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={Colors.semantic.danger}
          />
          <Text style={styles.errorBannerText} numberOfLines={2}>
            {error.message}
          </Text>
        </View>
      ) : null}

      {/* Search Results List */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          results.length === 0 ? styles.emptyContainer : styles.listContent
        }
        renderItem={({ item }) => (
          <SearchResultCard result={item} onPress={handleSelectResult} />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={Colors.tier.core} />
            </View>
          ) : !isSearchActive ? (
            <EmptyState
              icon="search-outline"
              title="Search your Second Brain"
              subtitle={
                nodeTypeFilter
                  ? `Type a keyword to filter ${
                      nodeTypeFilter === 'folder' ? 'folders' : 'entries'
                    }.`
                  : 'Find any watched anime, food note, tag, or folder path in seconds.'
              }
            />
          ) : (
            <EmptyState
              icon="planet-outline"
              title="No matches found"
              subtitle="Try a different keyword or clear active filters."
              actionLabel="Clear Search"
              onAction={handleClearAll}
            />
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm + 4,
    paddingBottom: Spacing.xs + 2,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  countPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  countText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  searchBarWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 46,
  },
  searchBarFocused: {
    borderColor: Colors.border.active,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: FontSize.md,
    paddingVertical: Spacing.sm,
  },
  filtersContainer: {
    flexGrow: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.subtle,
    paddingBottom: Spacing.sm + 2,
  },
  filtersContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs + 2,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  pillActive: {
    borderColor: Colors.border.active,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
  },
  pillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
  pillTextActive: {
    color: Colors.tier.core,
    fontWeight: FontWeight.bold,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.semantic.danger,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  errorBannerText: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.semantic.danger,
  },
  loadingWrap: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.xxl,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
});
