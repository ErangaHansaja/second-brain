import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, FontWeight, Radius, Spacing } from '@/theme/tokens';
import type { NodeStatus, ParsedNode, SearchResult } from '@/types';

// Components
import { TextInputField } from '@/components/common/TextInputField';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { TierBadge } from '@/components/explorer/TierBadge';
import { Breadcrumb } from '@/components/explorer/Breadcrumb';
import { NodeCard } from '@/components/explorer/NodeCard';
import { MoveNodeModal, type MoveTargetFolder } from '@/components/explorer/MoveNodeModal';
import { StatusChip } from '@/components/detail/StatusChip';
import { RatingStars } from '@/components/detail/RatingStars';
import { TagsRow } from '@/components/detail/TagsRow';
import { MetadataEditor } from '@/components/detail/MetadataEditor';
import { SearchResultCard } from '@/components/search/SearchResultCard';

export default function ComponentGalleryScreen() {
  // Common states
  const [inputText, setInputText] = useState('Obsidian Design Engine');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [destructiveDialog, setDestructiveDialog] = useState(false);

  // Detail interactive states
  const [currentStatus, setCurrentStatus] = useState<NodeStatus>('in_progress');
  const [currentRating, setCurrentRating] = useState<number | null>(9);
  const [currentTags, setCurrentTags] = useState<string[]>(['sci-fi', 'space', 'nolan', 'physics']);
  const [currentMeta, setCurrentMeta] = useState<Record<string, unknown>>({
    director: 'Christopher Nolan',
    releaseYear: 2014,
    runtime: '169 min',
  });

  // Modal states
  const [moveModalVisible, setMoveModalVisible] = useState(false);

  // Sample nodes
  const sampleFolder: ParsedNode = {
    id: 'sample-folder-1',
    parentId: 'root',
    title: 'Media & Entertainment',
    nodeType: 'folder',
    depth: 1,
    icon: 'film-outline',
    color: '#818CF8',
    status: null,
    rating: null,
    tags: ['collection', 'media'],
    metadata: {},
    notes: null,
    description: 'Films, books, series and interactive media curation.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleEntry: ParsedNode = {
    id: 'sample-entry-1',
    parentId: 'sample-folder-1',
    title: 'Interstellar (2014)',
    nodeType: 'entry',
    depth: 2,
    icon: 'rocket-outline',
    color: '#38BDF8',
    status: 'completed',
    rating: 10,
    tags: ['sci-fi', 'space'],
    metadata: { director: 'Christopher Nolan' },
    notes: 'Exemplary sci-fi masterwork.',
    description: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleSearchResult: SearchResult = {
    ...sampleEntry,
    breadcrumb: [
      { id: 'root', title: 'Me', depth: 0 },
      { id: 'sample-folder-1', title: 'Media & Entertainment', depth: 1 },
      { id: 'movies', title: 'Sci-Fi Films', depth: 2 },
    ],
  };

  const sampleTargetFolders: MoveTargetFolder[] = [
    { id: 'root', title: 'Me', depth: 0, pathLabel: 'Root (Core)' },
    { id: 'sample-folder-1', title: 'Media & Entertainment', depth: 1, pathLabel: 'Me / Media & Entertainment' },
    { id: 'projects', title: 'Active Projects', depth: 1, pathLabel: 'Me / Active Projects' },
    { id: 'archive', title: 'Cold Archive', depth: 2, pathLabel: 'Me / Active Projects / Cold Archive' },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UI Component Gallery</Text>
        <Text style={styles.headerSubtitle}>
          Visual QA showcase of Step 6 atomic components & design tokens.
        </Text>
      </View>

      {/* 1. Cosmic Tier Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Cosmic Tier Badges (Depths 0–4)</Text>
        <View style={styles.rowWrap}>
          <TierBadge depth={0} />
          <TierBadge depth={1} />
          <TierBadge depth={2} />
          <TierBadge depth={3} />
          <TierBadge depth={4} />
        </View>
      </View>

      {/* 2. Breadcrumbs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Breadcrumb Navigation</Text>
        <Breadcrumb
          ancestors={[
            { id: 'root', title: 'Me', depth: 0 },
            { id: 'media', title: 'Media', depth: 1 },
            { id: 'cinema', title: 'Cinema', depth: 2 },
          ]}
          current="Interstellar"
          onPress={(id) => Alert.alert('Navigate', `Breadcrumb pressed: ${id}`)}
        />
      </View>

      {/* 3. Node Cards (List & Grid) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Node Cards (List View)</Text>
        <NodeCard
          node={sampleFolder}
          descendantCount={14}
          onPress={(n) => Alert.alert('Folder Pressed', n.title)}
        />
        <NodeCard
          node={sampleEntry}
          onPress={(n) => Alert.alert('Entry Pressed', n.title)}
        />

        <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
          Node Cards (Grid View)
        </Text>
        <View style={styles.gridRow}>
          <NodeCard
            node={sampleFolder}
            descendantCount={14}
            viewMode="grid"
            onPress={(n) => Alert.alert('Folder Pressed', n.title)}
          />
          <NodeCard
            node={sampleEntry}
            viewMode="grid"
            onPress={(n) => Alert.alert('Entry Pressed', n.title)}
          />
        </View>
      </View>

      {/* 4. Entry Detail Atoms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Entry Detail Atoms</Text>

        <Text style={styles.subHeading}>Status Chip (Tap to Change)</Text>
        <StatusChip
          status={currentStatus}
          editable
          onChange={setCurrentStatus}
        />

        <Text style={styles.subHeading}>Rating Stars (Tap 1–10 to rate)</Text>
        <RatingStars
          rating={currentRating}
          onRate={setCurrentRating}
        />

        <Text style={styles.subHeading}>Tags Row (Editable #tags)</Text>
        <TagsRow
          tags={currentTags}
          editable
          onTagsChange={setCurrentTags}
        />

        <Text style={styles.subHeading}>Metadata Key-Value Editor</Text>
        <MetadataEditor
          metadata={currentMeta}
          editable
          onChange={setCurrentMeta}
        />
      </View>

      {/* 5. Search Result Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Search Result Card</Text>
        <SearchResultCard
          result={sampleSearchResult}
          onPress={(res) => Alert.alert('Search Result', res.title)}
        />
      </View>

      {/* 6. Common UI Primitives */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Common Input & Dialogs</Text>
        <TextInputField
          label="Title Field"
          value={inputText}
          onChangeText={setInputText}
          placeholder="Enter item title..."
        />

        <TextInputField
          label="Field with Error"
          value=""
          onChangeText={() => {}}
          placeholder="Required input..."
          error="This field cannot be left blank"
          style={{ marginTop: Spacing.sm }}
        />

        <View style={styles.buttonRow}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              setDestructiveDialog(false);
              setDialogVisible(true);
            }}>
            <Text style={styles.actionBtnText}>Test Confirm Dialog</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.dangerActionBtn]}
            onPress={() => {
              setDestructiveDialog(true);
              setDialogVisible(true);
            }}>
            <Text style={[styles.actionBtnText, styles.dangerBtnText]}>
              Test Delete Dialog
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => setMoveModalVisible(true)}>
            <Text style={styles.actionBtnText}>Test Move Modal</Text>
          </Pressable>
        </View>
      </View>

      {/* 7. Empty State */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Empty State Display</Text>
        <EmptyState
          icon="planet-outline"
          title="No Items Discovered"
          subtitle="Begin populating this domain by creating your first folder or entry."
          actionLabel="Create Item"
          onAction={() => Alert.alert('Empty State Action', 'Action button pressed')}
        />
      </View>

      {/* Dialogs */}
      <ConfirmDialog
        visible={dialogVisible}
        title={destructiveDialog ? 'Delete Node' : 'Confirm Action'}
        message={
          destructiveDialog
            ? 'Are you sure you want to permanently delete this item and all its nested children? This cannot be undone.'
            : 'Proceed with this structural update?'
        }
        confirmLabel={destructiveDialog ? 'Delete' : 'Proceed'}
        destructive={destructiveDialog}
        onConfirm={() => {
          setDialogVisible(false);
          Alert.alert('Confirmed', 'Action was confirmed.');
        }}
        onCancel={() => setDialogVisible(false)}
      />

      <MoveNodeModal
        visible={moveModalVisible}
        nodeTitle="Interstellar (2014)"
        folders={sampleTargetFolders}
        currentParentId="sample-folder-1"
        onSelect={(targetId) => {
          setMoveModalVisible(false);
          Alert.alert('Target Selected', `Moved to folder ID: ${targetId}`);
        }}
        onCancel={() => setMoveModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg.void,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.subtle,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  section: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.tier.core,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subHeading: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.elevated,
  },
  actionBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  dangerActionBtn: {
    borderColor: 'rgba(244, 63, 94, 0.4)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  dangerBtnText: {
    color: Colors.semantic.danger,
  },
});
