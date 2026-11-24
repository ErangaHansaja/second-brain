import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import { deleteNode, updateNode } from '@/db/repository';
import { useAncestors, useDescendantCount, useNode } from '@/hooks';
import type { NodeStatus, ParsedNode, UpdateNodePatch } from '@/types';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { TextInputField } from '@/components/common/TextInputField';
import { Breadcrumb } from '@/components/explorer/Breadcrumb';
import { TierBadge } from '@/components/explorer/TierBadge';
import { StatusChip } from '@/components/detail/StatusChip';
import { RatingStars } from '@/components/detail/RatingStars';
import { TagsRow } from '@/components/detail/TagsRow';
import { MetadataEditor } from '@/components/detail/MetadataEditor';

export interface NodeDetailScreenProps {
  nodeId: string;
  initialEdit?: boolean;
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NodeDetailScreen({
  nodeId,
  initialEdit = false,
}: NodeDetailScreenProps) {
  const { node, loading, error, refresh: refreshNode } = useNode(nodeId || null);
  const { ancestors } = useAncestors(nodeId || null);
  const { count: descendantCount } = useDescendantCount(
    node?.nodeType === 'folder' ? node.id : null
  );

  // Edit mode & draft states
  const [isEditing, setIsEditing] = useState<boolean>(Boolean(initialEdit));
  const [title, setTitle] = useState<string>('');
  const [status, setStatus] = useState<NodeStatus | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [notes, setNotes] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [titleError, setTitleError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Dialog states
  const [deleteDialogVisible, setDeleteDialogVisible] = useState<boolean>(false);
  const [discardAction, setDiscardAction] = useState<(() => void) | null>(null);

  const syncedNodeIdRef = useRef<string | null>(null);

  const syncDraftFromNode = useCallback((source: ParsedNode) => {
    setTitle(source.title);
    setStatus(source.status ?? null);
    setRating(source.rating ?? null);
    setTags(source.tags ?? []);
    setMetadata(source.metadata ?? {});
    setNotes(source.notes ?? '');
    setDescription(source.description ?? '');
    setTitleError(null);
  }, []);

  // Populate draft cleanly on initial load or when viewing in read mode without clobbering edits
  useEffect(() => {
    if (!node) return;
    if (syncedNodeIdRef.current !== node.id) {
      syncDraftFromNode(node);
      syncedNodeIdRef.current = node.id;
    } else if (!isEditing) {
      syncDraftFromNode(node);
    }
  }, [node, isEditing, syncDraftFromNode]);

  const hasUnsavedChanges = useMemo(() => {
    if (!node || !isEditing) return false;

    if (title.trim() !== node.title) return true;

    if (node.nodeType === 'entry') {
      const normalizedDraftNotes = notes.trim() === '' ? null : notes;
      const normalizedNodeNotes =
        !node.notes || node.notes.trim() === '' ? null : node.notes;

      if (normalizedDraftNotes !== normalizedNodeNotes) return true;
      if ((status ?? null) !== (node.status ?? null)) return true;
      if ((rating ?? null) !== (node.rating ?? null)) return true;
      if (JSON.stringify(tags) !== JSON.stringify(node.tags)) return true;
      if (JSON.stringify(metadata) !== JSON.stringify(node.metadata)) return true;
    } else {
      const normalizedDraftDesc = description.trim() || null;
      const normalizedNodeDesc = node.description?.trim() || null;
      if (normalizedDraftDesc !== normalizedNodeDesc) return true;
    }

    return false;
  }, [
    node,
    isEditing,
    title,
    status,
    rating,
    tags,
    metadata,
    notes,
    description,
  ]);

  const attemptNavigation = useCallback(
    (navigateFn: () => void) => {
      if (isEditing && hasUnsavedChanges) {
        setDiscardAction(() => navigateFn);
        return;
      }
      navigateFn();
    },
    [isEditing, hasUnsavedChanges]
  );

  const handleBack = useCallback(() => {
    attemptNavigation(() => router.back());
  }, [attemptNavigation]);

  // Scoped Android BackHandler while detail screen is focused
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (isEditing && hasUnsavedChanges) {
            setDiscardAction(() => () => router.back());
            return true;
          }
          return false;
        }
      );
      return () => subscription.remove();
    }, [isEditing, hasUnsavedChanges])
  );

  const handleCancelEdit = () => {
    if (node) {
      syncDraftFromNode(node);
    }
    setIsEditing(false);
    setErrorBanner(null);
  };

  const handleSave = async () => {
    if (!node || saving) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Title cannot be empty');
      return;
    }

    try {
      setSaving(true);
      setErrorBanner(null);
      setTitleError(null);

      const patch: UpdateNodePatch = {
        title: trimmedTitle,
      };

      if (node.nodeType === 'entry') {
        patch.status = status ?? null;
        patch.rating = rating ?? null;
        patch.tags = tags;
        patch.metadata = metadata;
        patch.notes = notes.trim() ? notes : null;
      } else {
        patch.description = description.trim() ? description.trim() : null;
      }

      const updated = await updateNode(node.id, patch);
      syncDraftFromNode(updated);
      setIsEditing(false);
      refreshNode();
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Failed to save changes'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!node || deleting) return;
    try {
      setDeleting(true);
      await deleteNode(node.id);
      setDeleteDialogVisible(false);
      router.back();
    } catch (err) {
      setDeleteDialogVisible(false);
      setErrorBanner(
        err instanceof Error ? err.message : 'Failed to delete item'
      );
    } finally {
      setDeleting(false);
    }
  };

  const isEntry = node?.nodeType === 'entry';

  const deleteMessage = node
    ? node.nodeType === 'folder' && descendantCount > 0
      ? `Delete "${node.title}" and its ${descendantCount} nested ${
          descendantCount === 1 ? 'item' : 'items'
        }? This action cannot be undone.`
      : `Delete "${node.title}"? This action cannot be undone.`
    : '';

  return (
    <ScreenContainer avoidKeyboard>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <Pressable
          hitSlop={12}
          onPress={handleBack}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.iconBtnPressed,
          ]}
          accessibilityLabel="Go back"
          accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </Pressable>

        {node ? (
          isEditing ? (
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerCancelBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleCancelEdit}
                disabled={saving}>
                <Text style={styles.headerCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.headerSaveBtn,
                  pressed && styles.btnPressed,
                  saving && styles.btnDisabled,
                ]}
                onPress={handleSave}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.bg.void} />
                ) : (
                  <Text style={styles.headerSaveText}>Save</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.editBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => {
                  setErrorBanner(null);
                  setIsEditing(true);
                }}>
                <Ionicons
                  name="pencil-outline"
                  size={15}
                  color={Colors.text.primary}
                />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>

              {node.depth > 0 ? (
                <Pressable
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    styles.deleteIconBtn,
                    pressed && styles.deleteIconBtnPressed,
                  ]}
                  onPress={() => setDeleteDialogVisible(true)}
                  accessibilityLabel="Delete item"
                  accessibilityRole="button">
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={Colors.semantic.danger}
                  />
                </Pressable>
              ) : null}
            </View>
          )
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Main Content */}
      {loading && !node ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.tier.core} />
        </View>
      ) : error && !node ? (
        <View style={styles.centered}>
          <EmptyState
            icon="alert-circle-outline"
            title="Could Not Load Item"
            subtitle={error.message}
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        </View>
      ) : !node ? (
        <View style={styles.centered}>
          <EmptyState
            icon="document-text-outline"
            title="Item Not Found"
            subtitle="This node may have been deleted or moved."
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        </View>
      ) : (
        <View style={styles.flexBody}>
          {/* Breadcrumb Trail */}
          {node.depth > 0 ? (
            <Breadcrumb
              ancestors={ancestors}
              current={node.title}
              onPress={(ancestorId) =>
                attemptNavigation(() =>
                  router.replace(`/?nodeId=${ancestorId}` as any)
                )
              }
            />
          ) : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Dark Inline Error Banner */}
            {errorBanner ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={Colors.semantic.danger}
                />
                <Text style={styles.errorBannerText}>{errorBanner}</Text>
                <Pressable hitSlop={8} onPress={() => setErrorBanner(null)}>
                  <Ionicons name="close" size={14} color={Colors.text.muted} />
                </Pressable>
              </View>
            ) : null}

            {/* Tier Badge & Title */}
            <View style={styles.titleSection}>
              <View style={styles.badgeRow}>
                <TierBadge depth={node.depth} />
                <Text style={styles.typeLabel}>{node.nodeType}</Text>
              </View>

              {isEditing ? (
                <TextInputField
                  label="Title"
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    if (titleError) setTitleError(null);
                  }}
                  placeholder="Item title..."
                  error={titleError}
                />
              ) : (
                <Text style={styles.titleText}>{node.title}</Text>
              )}
            </View>

            {/* Entry-Specific Inspector & Editor */}
            {isEntry ? (
              <View style={styles.sectionsContainer}>
                {/* Status */}
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>Status</Text>
                    {isEditing && status !== null ? (
                      <Pressable
                        hitSlop={8}
                        onPress={() => setStatus(null)}>
                        <Text style={styles.clearLink}>Clear</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  {isEditing ? (
                    <StatusChip
                      status={status}
                      editable
                      onChange={setStatus}
                    />
                  ) : node.status ? (
                    <StatusChip status={node.status} editable={false} />
                  ) : (
                    <Text style={styles.mutedText}>No status</Text>
                  )}
                </View>

                {/* Rating */}
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>Rating</Text>
                    {isEditing && rating !== null ? (
                      <Pressable
                        hitSlop={8}
                        onPress={() => setRating(null)}>
                        <Text style={styles.clearLink}>Clear</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <RatingStars
                    rating={isEditing ? rating : node.rating}
                    readonly={!isEditing}
                    onRate={setRating}
                  />
                </View>

                {/* Tags */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Tags</Text>
                  {isEditing ? (
                    <TagsRow
                      tags={tags}
                      editable
                      onTagsChange={setTags}
                    />
                  ) : node.tags.length > 0 ? (
                    <TagsRow tags={node.tags} editable={false} />
                  ) : (
                    <Text style={styles.mutedText}>No tags</Text>
                  )}
                </View>

                {/* Details (Metadata) */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Details</Text>
                  <MetadataEditor
                    metadata={isEditing ? metadata : node.metadata}
                    editable={isEditing}
                    onChange={setMetadata}
                  />
                </View>

                {/* Notes & Thoughts */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Notes & Thoughts</Text>
                  {isEditing ? (
                    <TextInputField
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Thoughts, reviews, or reminders (e.g. check for next season)..."
                      multiline
                      inputStyle={styles.notesInput}
                    />
                  ) : node.notes ? (
                    <Text style={styles.notesReadText}>{node.notes}</Text>
                  ) : (
                    <Text style={styles.mutedText}>
                      No notes yet. Tap Edit to add thoughts or reminders.
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              /* Folder-Specific Minimal Details */
              <View style={styles.sectionsContainer}>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Description</Text>
                  {isEditing ? (
                    <TextInputField
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Short description of this folder..."
                      multiline
                      inputStyle={styles.descriptionInput}
                    />
                  ) : node.description ? (
                    <Text style={styles.notesReadText}>{node.description}</Text>
                  ) : (
                    <Text style={styles.mutedText}>No description set.</Text>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Contained Items</Text>
                  <Text style={styles.monoStatText}>
                    {descendantCount}{' '}
                    {descendantCount === 1 ? 'nested item' : 'nested items'}
                  </Text>
                </View>
              </View>
            )}

            {/* Subtle Footer Timestamps */}
            <View style={styles.footerMeta}>
              <Text style={styles.footerDate}>
                Created {formatShortDate(node.createdAt)}
              </Text>
              <Text style={styles.footerDot}>·</Text>
              <Text style={styles.footerDate}>
                Updated {formatShortDate(node.updatedAt)}
              </Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Item"
        message={deleteMessage}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) setDeleteDialogVisible(false);
        }}
      />

      {/* Discard Unsaved Changes Confirmation */}
      <ConfirmDialog
        visible={Boolean(discardAction)}
        title="Discard Unsaved Changes?"
        message="You have unsaved edits. Leave without saving your changes?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        destructive
        onConfirm={() => {
          const action = discardAction;
          setDiscardAction(null);
          setIsEditing(false);
          action?.();
        }}
        onCancel={() => setDiscardAction(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.bg.void,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.subtle,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerSpacer: {
    width: 36,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 3,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  editBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  deleteIconBtn: {
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    backgroundColor: 'rgba(244, 63, 94, 0.06)',
  },
  deleteIconBtnPressed: {
    borderColor: Colors.semantic.danger,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
  },
  headerCancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  headerCancelText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
  headerSaveBtn: {
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.xs + 3,
    borderRadius: Radius.md,
    backgroundColor: Colors.tier.core,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSaveText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.bg.void,
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  flexBody: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: Colors.semantic.danger,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.semantic.danger,
  },
  titleSection: {
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeLabel: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  titleText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    lineHeight: 34,
  },
  sectionsContainer: {
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.subtle,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  clearLink: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  mutedText: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    lineHeight: 20,
  },
  notesReadText: {
    fontSize: FontSize.md,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  notesInput: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  descriptionInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  monoStatText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.subtle,
  },
  footerDate: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  footerDot: {
    color: Colors.text.muted,
    fontSize: FontSize.xs,
  },
});
