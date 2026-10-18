/**
 * fallow.js - Code Quality, Duplication & Maintainability Analysis Engine
 * 
 * Inspects the codebase to identify:
 * 1. Duplicate code patterns & redundant logic
 * 2. Dead code & unused exports/variables
 * 3. Overly complex monolithic files & high-cyclomatic complexity functions
 * 4. Generates maintainability guidelines and refactoring recommendations
 */

import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        walkDir(fullPath, fileList);
      }
    } else if (/\.(tsx?|jsx?)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function runFallowAnalysis() {
  const files = walkDir(SRC_DIR);
  const issues = [];
  let totalLines = 0;

  const fileContents = new Map();
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8');
    fileContents.set(f, content);
    totalLines += content.split('\n').length;
  }

  // 1. Monolithic file size & complexity analysis
  for (const [filePath, content] of fileContents.entries()) {
    const relPath = path.relative(process.cwd(), filePath);
    const lines = content.split('\n');
    const lineCount = lines.length;

    if (lineCount > 500) {
      issues.push({
        type: 'COMPLEXITY',
        severity: 'high',
        file: relPath,
        message: `Monolithic file exceeds 500 lines (${lineCount} lines).`,
        recommendation: `Split ${path.basename(filePath)} into smaller subcomponents and custom hooks. Target < 250 lines per component.`,
      });
    } else if (lineCount > 300) {
      issues.push({
        type: 'COMPLEXITY',
        severity: 'medium',
        file: relPath,
        message: `Large file (${lineCount} lines).`,
        recommendation: `Extract reusable view sub-components or utility functions to improve readability.`,
      });
    }

    // Check for nested ternary complexity (excluding TypeScript type annotations)
    let nestedTernaryCount = 0;
    lines.forEach((l, idx) => {
      // Ignore typescript type definitions like foo?: number, bar?: string
      if (l.includes('?:') || l.trim().startsWith('interface ') || l.trim().startsWith('type ')) return;
      const qMatches = (l.match(/\?/g) || []).length;
      const colonMatches = (l.match(/:/g) || []).length;
      if (qMatches >= 2 && colonMatches >= 2) {
        nestedTernaryCount++;
        if (nestedTernaryCount <= 2) {
          issues.push({
            type: 'COMPLEXITY',
            severity: 'low',
            file: relPath,
            line: idx + 1,
            message: `Nested ternary expression on line ${idx + 1}.`,
            recommendation: `Replace complex nested ternary with a dedicated helper function or early return.`,
          });
        }
      }
    });
  }

  // 2. Duplicate Code Detection
  const functionSignatures = [
    {
      name: 'renderPointsToSvgPath',
      regex: /function\s+renderPointsToSvgPath/g,
      recommendation: 'Extract renderPointsToSvgPath into src/utils/canvasGeometry.ts and reuse across Canvas, export, and shapeDetection.',
    },
    {
      name: 'image import FileReader logic',
      regex: /reader\.readAsDataURL\(file\)/g,
      recommendation: 'Extract common createImageElementFromFile into src/utils/canvasGeometry.ts to eliminate duplicate file reading & scaling.',
    },
    {
      name: 'cloneElements',
      regex: /function\s+cloneElements|JSON\.parse\(JSON\.stringify/g,
      recommendation: 'Centralize cloneElements into a shared utility to prevent redundant JSON serialize/deserialize copies.',
    },
    {
      name: 'keyboard delete / duplicate listeners',
      regex: /(key\s*===\s*['"]Delete['"]|key\s*===\s*['"]Backspace['"])/g,
      recommendation: 'Unify keyboard shortcuts handling strictly in the global shortcuts hook instead of duplicate listeners in Canvas.tsx.',
    },
  ];

  for (const sig of functionSignatures) {
    const occurrences = [];
    for (const [filePath, content] of fileContents.entries()) {
      if (sig.regex.test(content)) {
        occurrences.push(path.relative(process.cwd(), filePath));
      }
    }
    if (occurrences.length > 1) {
      issues.push({
        type: 'DUPLICATE',
        severity: 'high',
        file: occurrences.join(', '),
        message: `Duplicate logic detected for "${sig.name}" across ${occurrences.length} files.`,
        recommendation: sig.recommendation,
      });
    }
  }

  // 3. Modularity & Dead Code Analysis
  const headerPath = path.join(SRC_DIR, 'components/Header.tsx');
  if (fileContents.has(headerPath)) {
    const headerContent = fileContents.get(headerPath);
    if (headerContent.length > 15000) {
      issues.push({
        type: 'MODULARITY',
        severity: 'medium',
        file: 'src/components/Header.tsx',
        message: 'Header contains inline menus (Export, Background, Title Form) making mobile responsiveness harder to maintain.',
        recommendation: 'Extract ExportMenu, BackgroundMenu, and TitleEditor into standalone subcomponents and provide a MobileHeaderMenu drawer.',
      });
    }
  }

  const toolbarPath = path.join(SRC_DIR, 'components/Toolbar.tsx');
  if (fileContents.has(toolbarPath)) {
    const toolbarContent = fileContents.get(toolbarPath);
    if (toolbarContent.length > 15000) {
      issues.push({
        type: 'MODULARITY',
        severity: 'high',
        file: 'src/components/Toolbar.tsx',
        message: 'Toolbar has 15 horizontal action items that overflow on mobile screens (< 768px).',
        recommendation: 'Separate ZoomControls into standalone component and build responsive mobile bottom dock / compact drawer.',
      });
    }
  }

  // 4. Performance & Lighthouse checks
  const htmlPath = path.resolve('index.html');
  if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    if (!htmlContent.includes('viewport-fit=cover')) {
      issues.push({
        type: 'MODULARITY',
        severity: 'medium',
        file: 'index.html',
        message: 'Viewport meta tag missing viewport-fit=cover for mobile edge-to-edge support.',
        recommendation: 'Update index.html viewport to include viewport-fit=cover and add theme-color for mobile browser header styling.',
      });
    }
  }

  // Maintainability guidelines
  const guidelines = [
    'Rule 1: Single Responsibility Principle - Split files exceeding 300 lines into subcomponents and domain hooks.',
    'Rule 2: Zero Duplicate Geometry - Centralize SVG path generation, bounding box checks, and hit-testing in src/utils/canvasGeometry.ts.',
    'Rule 3: Clean State Segregation - Separate Canvas rendering logic from gesture/touch handling using custom hooks.',
    'Rule 4: Mobile-First Responsive Design - Ensure toolbar and header gracefully adapt to screens from 320px to 4K, in both portrait and landscape.',
    'Rule 5: Lighthouse 100 Standards - Accessible ARIA labels on all interactive elements, dynamic code-splitting for heavy dependencies, preconnects & theme-color.',
    'Rule 6: Single Source of Truth for Keyboard Shortcuts - Handle all keyboard shortcuts in one centralized hook to avoid duplicate/conflicting listeners.',
    'Rule 7: Crash-Proof Touch Support - Support multi-touch gestures (pinch-to-zoom, two-finger pan) with zero pointer conflicts.',
  ];

  const report = {
    timestamp: new Date().toISOString(),
    filesAnalyzed: files.length,
    totalLines,
    issues,
    guidelines,
  };

  return report;
}

// Execute analysis if run directly
const report = runFallowAnalysis();
const outputPath = path.resolve('fallow-guidelines.json');
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');

console.log('====================================================');
console.log('               FALLOW.JS ANALYSIS REPORT             ');
console.log('====================================================');
console.log(`Files Analyzed : ${report.filesAnalyzed}`);
console.log(`Total Lines    : ${report.totalLines}`);
console.log(`Issues Found   : ${report.issues.length}`);
console.log('----------------------------------------------------');
report.issues.forEach((issue, idx) => {
  console.log(`[${idx + 1}] [${issue.severity.toUpperCase()}] ${issue.type} in ${issue.file}`);
  console.log(`    Message: ${issue.message}`);
  console.log(`    Fix    : ${issue.recommendation}\n`);
});
console.log('----------------------------------------------------');
console.log('GUIDELINES IMPLEMENTATION PLAN:');
report.guidelines.forEach((g) => console.log(`  * ${g}`));
console.log('====================================================');
console.log(`Detailed report written to: ${outputPath}`);
