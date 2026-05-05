#!/usr/bin/env node

/**
 * Sequential Thinking Thought Formatter
 *
 * Formats thoughts for display with visual indicators for type (regular/revision/branch).
 * Provides consistent, readable output for thought sequences.
 *
 * Usage:
 *   node format-thought.js --thought "Analysis" --number 1 --total 5
 *   node format-thought.js --thought "Revision" --number 2 --total 5 --revision 1
 *   node format-thought.js --thought "Branch A" --number 3 --total 5 --branch 2 --branchId "a"
 */

class ThoughtFormatter {
  static format(thoughtData) {
    const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId } = thoughtData;

    let prefix = '';
    let context = '';
    let emoji = '';

    if (isRevision && revisesThought) {
      emoji = '🔄';
      prefix = 'REVISION';
      context = ` (revising thought ${revisesThought})`;
    } else if (branchFromThought) {
      emoji = '🌿';
      prefix = 'BRANCH';
      context = branchId ? ` (from thought ${branchFromThought}, ID: ${branchId})` : ` (from thought ${branchFromThought})`;
    } else {
      emoji = '💭';
      prefix = 'Thought';
      context = '';
    }

    const header = `${emoji} ${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
    const maxLength = Math.max(header.length, thought.length);
    const border = '─'.repeat(maxLength + 4);

    // Wrap long thoughts
    const wrappedThought = this.wrapText(thought, maxLength);
    const thoughtLines = wrappedThought.map(line => `│ ${line.padEnd(maxLength + 2)} │`).join('\n');

    return `
┌${border}┐
│ ${header.padEnd(maxLength + 2)} │
├${border}┤
${thoughtLines}
└${border}┘`;
  }

  static wrapText(text, maxWidth) {
    if (text.length <= maxWidth) {
      return [text];
    }

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxWidth) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  static formatSimple(thoughtData) {
    const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId } = thoughtData;

    let marker = '';
    if (isRevision && revisesThought) {
      marker = ` [REVISION of Thought ${revisesThought}]`;
    } else if (branchFromThought) {
      marker = branchId ? ` [BRANCH ${branchId.toUpperCase()} from Thought ${branchFromThought}]` : ` [BRANCH from Thought ${branchFromThought}]`;
    }

    return `Thought ${thoughtNumber}/${totalThoughts}${marker}: ${thought}`;
  }

  static formatMarkdown(thoughtData) {
    const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId } = thoughtData;

    let marker = '';
    if (isRevision && revisesThought) {
      marker = ` **[REVISION of Thought ${revisesThought}]**`;
    } else if (branchFromThought) {
      marker = branchId ? ` **[BRANCH ${branchId.toUpperCase()} from Thought ${branchFromThought}]**` : ` **[BRANCH from Thought ${branchFromThought}]**`;
    }

    return `**Thought ${thoughtNumber}/${totalThoughts}**${marker}\n\n${thought}\n`;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  const parseArgs = (args) => {
    const parsed = {};
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const value = args[i + 1];

        if (value && !value.startsWith('--')) {
          // Parse boolean
          if (value === 'true') parsed[key] = true;
          else if (value === 'false') parsed[key] = false;
          // Parse number
          else if (!isNaN(value)) parsed[key] = parseFloat(value);
          // String
          else parsed[key] = value;
          i++;
        }
      }
    }
    return parsed;
  };

  const input = parseArgs(args);

  const thoughtData = {
    thought: input.thought || 'No thought provided',
    thoughtNumber: input.number || 1,
    totalThoughts: input.total || 1,
    isRevision: input.revision !== undefined,
    revisesThought: input.revision,
    branchFromThought: input.branch,
    branchId: input.branchId
  };

  const format = input.format || 'box';

  let output;
  switch (format) {
    case 'simple':
      output = ThoughtFormatter.formatSimple(thoughtData);
      break;
    case 'markdown':
      output = ThoughtFormatter.formatMarkdown(thoughtData);
      break;
    case 'box':
    default:
      output = ThoughtFormatter.format(thoughtData);
  }

  console.log(output);
}

module.exports = { ThoughtFormatter };
