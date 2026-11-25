import { File, Paths } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { exportDatabase } from '@/db/repository';
import type { ExportedDatabase, Node } from '@/types';

export interface BackupExportResult {
  filename: string;
  nodeCount: number;
}

/**
 * Exports all database nodes to a formatted JSON file in the cache directory
 * and presents the native OS share sheet when available.
 */
export async function exportBackupToFile(): Promise<BackupExportResult> {
  const data = await exportDatabase();
  const dateTag = new Date().toISOString().slice(0, 10);
  const filename = `second-brain-backup-${dateTag}.json`;

  const file = new File(Paths.cache, filename);
  file.create({ intermediates: true, overwrite: true });
  await file.write(JSON.stringify(data, null, 2), { encoding: 'utf8' });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Second Brain Backup',
      UTI: 'public.json',
    });
  }

  return {
    filename,
    nodeCount: data.nodes.length,
  };
}

function isValidNodeRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeTransformUri(
  uri: string,
  transform: (u: string) => string
): string {
  try {
    return transform(uri);
  } catch {
    return uri;
  }
}

/**
 * Reads a backup URI into a UTF-8 string using a 3-stage fallback chain
 * to handle Android content:// URIs, cached files, and special characters like ().
 */
async function readBackupUriAsText(uri: string): Promise<string> {
  const errors: string[] = [];
  const uriCandidates = Array.from(
    new Set([
      uri,
      safeTransformUri(uri, encodeURI),
      safeTransformUri(uri, decodeURI),
    ])
  );

  // Attempt 1: Modern SDK 58 File.text()
  for (const candidate of uriCandidates) {
    try {
      const pickedFile = new File(candidate);
      return await pickedFile.text();
    } catch (err) {
      errors.push(
        `File.text(${candidate}): ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  // Attempt 2: Legacy expo-file-system readAsStringAsync
  for (const candidate of uriCandidates) {
    try {
      return await readAsStringAsync(candidate, { encoding: 'utf8' });
    } catch (err) {
      errors.push(
        `readAsStringAsync: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  // Attempt 3: Native fetch fallback
  try {
    const response = await fetch(uri);
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    errors.push(`fetch: ${detail}`);
    if (__DEV__) {
      console.warn('[Backup] Import failed:', errors.join(' | '));
    }
    throw new Error(`Could not read the selected backup file (${detail}).`);
  }
}

/**
 * Opens the system document picker to select a backup JSON file, reads it as UTF-8,
 * and strictly validates structure and hierarchy invariants before returning.
 * Returns null if the user cancelled selection.
 */
export async function pickAndParseBackupFile(): Promise<ExportedDatabase | null> {
  const pickerResult = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });

  if (
    pickerResult.canceled ||
    !pickerResult.assets ||
    pickerResult.assets.length === 0
  ) {
    return null;
  }

  const asset = pickerResult.assets[0];
  if (!asset?.uri) {
    return null;
  }

  let rawText: string;
  if (asset.file && typeof asset.file.text === 'function') {
    try {
      rawText = await asset.file.text();
    } catch (err) {
      if (__DEV__) {
        console.warn('[Backup] Import failed:', err);
      }
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(`Could not read the selected backup file (${detail}).`);
    }
  } else {
    rawText = await readBackupUriAsText(asset.uri);
  }

  const cleanText = rawText.replace(/^\uFEFF/, '');

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanText);
  } catch (err) {
    if (__DEV__) {
      console.warn('[Backup] Import failed:', err);
    }
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Selected file does not contain valid JSON (${detail}).`
    );
  }

  if (!isValidNodeRecord(parsed) || parsed.version !== 1) {
    throw new Error(
      'Unsupported backup format: expected Second Brain backup version 1.'
    );
  }

  if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
    throw new Error('Invalid backup: file contains no items to restore.');
  }

  const now = new Date().toISOString();
  const validatedNodes: Node[] = [];
  let rootCount = 0;

  for (let i = 0; i < parsed.nodes.length; i++) {
    const raw = parsed.nodes[i];
    if (!isValidNodeRecord(raw)) {
      throw new Error(`Invalid backup entry at position ${i + 1}.`);
    }

    if (typeof raw.id !== 'string' || !raw.id.trim()) {
      throw new Error(`Backup entry ${i + 1} is missing a valid string ID.`);
    }
    if (typeof raw.title !== 'string' || !raw.title.trim()) {
      throw new Error(`Backup entry "${raw.id}" is missing a valid title.`);
    }
    if (raw.nodeType !== 'folder' && raw.nodeType !== 'entry') {
      throw new Error(
        `Backup entry "${raw.title}" has invalid nodeType (expected "folder" or "entry").`
      );
    }
    if (
      typeof raw.depth !== 'number' ||
      !Number.isFinite(raw.depth) ||
      !Number.isInteger(raw.depth) ||
      raw.depth < 0
    ) {
      throw new Error(
        `Backup entry "${raw.title}" has an invalid numeric depth.`
      );
    }

    const parentId =
      raw.parentId === undefined || raw.parentId === null
        ? null
        : typeof raw.parentId === 'string'
        ? raw.parentId
        : null;

    if (raw.parentId !== undefined && raw.parentId !== null && typeof raw.parentId !== 'string') {
      throw new Error(
        `Backup entry "${raw.title}" has an invalid parentId.`
      );
    }

    const isRoot = parentId === null && raw.depth === 0;
    if (raw.depth === 0 && parentId !== null) {
      throw new Error(
        `Invalid backup: root entry "${raw.title}" (depth 0) cannot have a parentId.`
      );
    }
    if (raw.depth > 0 && parentId === null) {
      throw new Error(
        `Invalid backup: non-root entry "${raw.title}" (depth ${raw.depth}) is missing parentId.`
      );
    }
    if (isRoot) {
      if (raw.nodeType !== 'folder') {
        throw new Error('Invalid backup: root node must be a folder.');
      }
      rootCount += 1;
    }

    validatedNodes.push({
      id: raw.id,
      parentId,
      title: raw.title,
      nodeType: raw.nodeType,
      depth: raw.depth,
      icon: typeof raw.icon === 'string' ? raw.icon : null,
      color: typeof raw.color === 'string' ? raw.color : null,
      status: typeof raw.status === 'string' ? raw.status : null,
      rating: typeof raw.rating === 'number' ? raw.rating : null,
      tags: typeof raw.tags === 'string' ? raw.tags : '[]',
      metadata: typeof raw.metadata === 'string' ? raw.metadata : '{}',
      notes: typeof raw.notes === 'string' ? raw.notes : null,
      description: typeof raw.description === 'string' ? raw.description : null,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    });
  }

  if (rootCount !== 1) {
    throw new Error(
      `Invalid backup: expected exactly 1 root node (depth 0, parentId null), found ${rootCount}.`
    );
  }

  return {
    version: 1,
    exportedAt:
      typeof parsed.exportedAt === 'string' ? parsed.exportedAt : now,
    nodes: validatedNodes,
  };
}
