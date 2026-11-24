import {
  ensureRootNode,
  getNode,
  createNode,
  updateNode,
  deleteNode,
  getAncestors,
  getDescendantCount,
  moveNode,
  searchNodes,
  exportDatabase,
} from './repository';

export interface TestResult {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface SelfTestOutput {
  passed: boolean;
  results: TestResult[];
}

/**
 * Runs 8 isolated on-device checks inside a temporary test folder (__selftest_root__)
 * and cleans up the test tree in a finally block to leave the database spotless.
 */
export async function runRepositorySelfTest(): Promise<SelfTestOutput> {
  const results: TestResult[] = [];
  let testRootId: string | null = null;

  try {
    // 1. Root Node Bootstrap
    const root = await ensureRootNode();
    if (root.depth === 0 && root.title === 'Me' && root.nodeType === 'folder') {
      results.push({ name: '1. Root Node Bootstrap', passed: true });
    } else {
      results.push({
        name: '1. Root Node Bootstrap',
        passed: false,
        detail: `Expected depth 0 Me folder, got depth ${root.depth} ${root.title}`,
      });
    }

    // Create an isolated test harness root folder under "Me"
    const testRoot = await createNode({
      parentId: root.id,
      title: '__selftest_root__',
      nodeType: 'folder',
    });
    testRootId = testRoot.id;

    // 2. Hierarchy Depth Computation (Folder -> Subfolder -> Entry)
    const subfolder = await createNode({
      parentId: testRoot.id,
      title: 'Subfolder A',
      nodeType: 'folder',
    });
    const entry = await createNode({
      parentId: subfolder.id,
      title: 'Quantum Teleportation Note',
      nodeType: 'entry',
    });
    await updateNode(entry.id, { tags: ['physics', 'quantum'] });

    if (testRoot.depth === 1 && subfolder.depth === 2 && entry.depth === 3) {
      results.push({
        name: '2. Hierarchy Depth Computation',
        passed: true,
        detail: `Depths: ${testRoot.depth} -> ${subfolder.depth} -> ${entry.depth}`,
      });
    } else {
      results.push({
        name: '2. Hierarchy Depth Computation',
        passed: false,
        detail: `Expected 1, 2, 3 but got ${testRoot.depth}, ${subfolder.depth}, ${entry.depth}`,
      });
    }

    // 3. Recursive Ancestor Chain
    const ancestors = await getAncestors(entry.id);
    const isAncestorsCorrect =
      ancestors.length === 3 &&
      ancestors[0]?.title === 'Me' &&
      ancestors[1]?.title === '__selftest_root__' &&
      ancestors[2]?.title === 'Subfolder A';

    results.push({
      name: '3. Recursive Ancestor Chain',
      passed: isAncestorsCorrect,
      detail: ancestors.map(a => a.title).join(' > '),
    });

    // 4. Recursive Descendant Count
    const count = await getDescendantCount(testRoot.id);
    results.push({
      name: '4. Recursive Descendant Count',
      passed: count === 2,
      detail: `Subtree count: ${count} (expected 2)`,
    });

    // 5. Safe Move & Depth Cascade
    const siblingFolder = await createNode({
      parentId: testRoot.id,
      title: 'Subfolder B',
      nodeType: 'folder',
    });

    let circularBlocked = false;
    try {
      await moveNode(testRoot.id, subfolder.id);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Circular move')) {
        circularBlocked = true;
      }
    }

    const movedSubfolder = await moveNode(subfolder.id, siblingFolder.id);
    const refreshedEntry = await getNode(entry.id);

    const moveSucceeded =
      circularBlocked &&
      movedSubfolder.parentId === siblingFolder.id &&
      movedSubfolder.depth === 3 &&
      refreshedEntry?.depth === 4;

    results.push({
      name: '5. Safe Move & Depth Cascade',
      passed: moveSucceeded,
      detail: `Circular blocked: ${circularBlocked}, New depths: ${movedSubfolder.depth}, ${refreshedEntry?.depth}`,
    });

    // 6. Global Search with Breadcrumbs
    const searchResults = await searchNodes('Quantum Teleportation');
    const found = searchResults.find(r => r.id === entry.id);
    const searchPassed =
      found !== undefined &&
      found.breadcrumb.length > 0 &&
      found.breadcrumb[0]?.title === 'Me';

    results.push({
      name: '6. Global Search with Breadcrumbs',
      passed: searchPassed,
      detail: found ? `Found with ${found.breadcrumb.length} breadcrumbs` : 'Not found',
    });

    // 7. Root Protection & Cascade Delete
    let rootDeleteBlocked = false;
    try {
      await deleteNode(root.id);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Cannot delete root node')) {
        rootDeleteBlocked = true;
      }
    }

    await deleteNode(testRoot.id);
    testRootId = null;

    const deletedSubfolder = await getNode(subfolder.id);
    const deletedEntry = await getNode(entry.id);
    const cascadePassed =
      rootDeleteBlocked && deletedSubfolder === null && deletedEntry === null;

    results.push({
      name: '7. Root Protection & Cascade Delete',
      passed: cascadePassed,
      detail: `Root protected: ${rootDeleteBlocked}, Children purged: ${deletedSubfolder === null && deletedEntry === null}`,
    });

    // 8. Database Export Schema
    const backup = await exportDatabase();
    const exportPassed =
      backup.version === 1 &&
      Array.isArray(backup.nodes) &&
      backup.nodes.some(n => n.depth === 0);

    results.push({
      name: '8. Database Export Schema',
      passed: exportPassed,
      detail: `Version: ${backup.version}, Total nodes: ${backup.nodes.length}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'Self-Test Execution',
      passed: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    if (testRootId) {
      try {
        await deleteNode(testRootId);
      } catch {
        // ignore cleanup error
      }
    }
  }

  const allPassed = results.length === 8 && results.every(r => r.passed);
  return {
    passed: allPassed,
    results,
  };
}
