import React, { useEffect, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export type Source = {
  id: string;
  text: string;
  metadata?: {
    source_title?: string;
    source_url?: string;
    answer?: string;
  };
};

interface SourcesDisplayProps {
  sources: Source[];
  visible: boolean;
  onOpenUrl?: (url: string) => void;
}

function truncateText(text: string, maxChars: number = 100): string {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '...';
}

function normalizeTitleFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$|^\//g, '');
    if (!path) return undefined;
    const lastSegment = path.split('/').pop()?.replace(/\.[a-z0-9]+$/i, '');
    if (!lastSegment) return undefined;
    return lastSegment
      .replace(/[-_]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  } catch {
    return undefined;
  }
}

function getDisplaySourceTitle(item: Source): string | undefined {
  const sourceTitle = item.metadata?.source_title?.trim();
  if (!sourceTitle) return undefined;
  if (sourceTitle.includes(' - ')) return sourceTitle;
  const url = item.metadata?.source_url;
  const suffix = url ? normalizeTitleFromUrl(url) : undefined;
  return suffix ? `${sourceTitle} - ${suffix}` : sourceTitle;
}

export function SourcesDisplay({
  sources,
  visible,
  onOpenUrl,
}: SourcesDisplayProps): React.JSX.Element | null {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  if (!visible || sources.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="always"
      >
        {sources.map((item, index) => (
          <View key={`${item.id}-${index}`} style={styles.sourceItem}>
            <View style={styles.sourceContent}>
              <Text style={styles.sourceId}>{item.id}</Text>

              <Text style={styles.sourceAnswer} numberOfLines={2}>
                {item.metadata?.answer || item.text}
              </Text>

              {getDisplaySourceTitle(item) && (
                <Text style={styles.sourceMetadata}>
                  {getDisplaySourceTitle(item)}
                </Text>
              )}

              {item.metadata?.source_url && (
                <TouchableOpacity onPress={() => onOpenUrl?.(item.metadata?.source_url || '')}>
                  <Text style={styles.sourceUrl}>
                    {item.metadata.source_url}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 14,
    padding: 6,
  },

  listContent: {
    paddingBottom: 30,
  },

  sourceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  sourceContent: {
    flex: 1,
  },

  sourceId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5d98e1',
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  sourceAnswer: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 6,
  },

  sourceMetadata: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },

  sourceUrl: {
    fontSize: 12,
    color: '#0EA5E9',
  },
});