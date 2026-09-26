import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface FormattedMessageTextProps {
  content: string;
  isUser?: boolean;
}

export const FormattedMessageText: React.FC<FormattedMessageTextProps> = ({
  content,
  isUser = false,
}) => {
  const { colors } = useTheme();

  if (isUser) {
    return (
      <Text style={[styles.userText, { color: colors.chatUserText }]}>
        {content}
      </Text>
    );
  }

  // Parse inline markdown: **bold**, `code`, *italic*
  const renderInlineMarkdown = (rawText: string, baseStyle: object) => {
    // Regex matches: **bold**, `code`, *italic*
    const tokens = rawText.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

    return tokens.map((token, index) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        const innerText = token.slice(2, -2);
        return (
          <Text
            key={index}
            style={[
              baseStyle,
              styles.boldText,
              { color: colors.text, fontWeight: '800' },
            ]}
          >
            {innerText}
          </Text>
        );
      }

      if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
        const innerCode = token.slice(1, -1);
        return (
          <Text
            key={index}
            style={[
              baseStyle,
              styles.inlineCode,
              {
                backgroundColor: colors.surfaceSubtle,
                color: colors.primary,
                borderColor: colors.border,
              },
            ]}
          >
            {` ${innerCode} `}
          </Text>
        );
      }

      if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
        const innerItalic = token.slice(1, -1);
        return (
          <Text key={index} style={[baseStyle, styles.italicText]}>
            {innerItalic}
          </Text>
        );
      }

      return (
        <Text key={index} style={baseStyle}>
          {token}
        </Text>
      );
    });
  };

  // Split into lines for structured layout
  const rawLines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let codeBlockBuffer: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Code block toggles ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        blocks.push(
          <View
            key={`code-${i}`}
            style={[
              styles.codeBlock,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.codeText,
                { color: '#0369A1' },
              ]}
            >
              {codeBlockBuffer.join('\n')}
            </Text>
          </View>
        );
        codeBlockBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    // Empty lines act as spacing
    if (!trimmed) {
      blocks.push(<View key={`empty-${i}`} style={styles.paragraphSpacer} />);
      continue;
    }

    // Callout / Key Insight Box: starts with 💡 or >
    if (trimmed.startsWith('💡') || trimmed.startsWith('>')) {
      const insightText = trimmed.replace(/^(💡|>)\s*/, '');
      blocks.push(
        <View
          key={`insight-${i}`}
          style={[
            styles.insightBox,
            {
              backgroundColor: '#FFFBEB',
              borderColor: '#F59E0B',
            },
          ]}
        >
          <View style={styles.insightIconRow}>
            <Text style={styles.insightIcon}>💡</Text>
            <Text style={[styles.insightTitle, { color: '#D97706' }]}>
              Key Insight
            </Text>
          </View>
          <Text style={[styles.insightBodyText, { color: colors.text }]}>
            {renderInlineMarkdown(
              insightText.replace(/^\*\*Key Insight:?\*\*\s*/i, ''),
              { color: colors.text, fontSize: 13, lineHeight: 20 }
            )}
          </Text>
        </View>
      );
      continue;
    }

    // Header Lines: #, ##, or emoji + **Title** (e.g. 🌱 **Understanding ...**)
    const isHeading =
      trimmed.startsWith('#') ||
      /^([\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji})\s+\*\*.*\*\*$/u.test(trimmed);

    if (isHeading) {
      const headingClean = trimmed
        .replace(/^#+\s*/, '')
        .replace(/^\*\*|\*\*$/g, '');
      blocks.push(
        <View key={`heading-${i}`} style={styles.headingWrapper}>
          <Text style={[styles.headingText, { color: colors.text }]}>
            {renderInlineMarkdown(headingClean, {
              color: colors.text,
              fontSize: 16,
              fontWeight: '800',
              lineHeight: 22,
            })}
          </Text>
        </View>
      );
      continue;
    }

    // Numbered List: e.g. "1. **Input:** You gather only what you need."
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberMatch) {
      const num = numberMatch[1];
      const itemBody = numberMatch[2];
      blocks.push(
        <View key={`num-${i}`} style={styles.listItemRow}>
          <View
            style={[
              styles.numberBadge,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary + '35',
              },
            ]}
          >
            <Text style={[styles.numberBadgeText, { color: colors.primary }]}>
              {num}
            </Text>
          </View>
          <Text style={[styles.listItemText, { color: colors.chatBotText }]}>
            {renderInlineMarkdown(itemBody, {
              color: colors.chatBotText,
              fontSize: 14,
              lineHeight: 20,
            })}
          </Text>
        </View>
      );
      continue;
    }

    // Bullet List: e.g. "- Item" or "* Item"
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)/);
    if (bulletMatch) {
      const itemBody = bulletMatch[1];
      blocks.push(
        <View key={`bullet-${i}`} style={styles.listItemRow}>
          <View
            style={[
              styles.bulletDot,
              { backgroundColor: colors.primary },
            ]}
          />
          <Text style={[styles.listItemText, { color: colors.chatBotText }]}>
            {renderInlineMarkdown(itemBody, {
              color: colors.chatBotText,
              fontSize: 14,
              lineHeight: 20,
            })}
          </Text>
        </View>
      );
      continue;
    }

    // Regular Paragraph
    blocks.push(
      <Text key={`p-${i}`} style={[styles.paragraphText, { color: colors.chatBotText }]}>
        {renderInlineMarkdown(trimmed, {
          color: colors.chatBotText,
          fontSize: 14,
          lineHeight: 21,
        })}
      </Text>
    );
  }

  return <View style={styles.container}>{blocks}</View>;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  paragraphText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 6,
  },
  paragraphSpacer: {
    height: 6,
  },
  boldText: {
    fontWeight: '800',
  },
  italicText: {
    fontStyle: 'italic',
  },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  headingWrapper: {
    marginVertical: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.15)',
  },
  headingText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 2,
  },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
    borderWidth: 1,
  },
  numberBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 7,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  insightBox: {
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  insightIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  insightIcon: {
    fontSize: 14,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightBodyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  codeBlock: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 6,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});
