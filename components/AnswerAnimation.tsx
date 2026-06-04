import { COLORS } from '@/constants/color';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Octicons from '@expo/vector-icons/Octicons';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type AnimationPhase = 'idle' | 'fetching' | 'reasoning' | 'generating' | 'complete';

interface AnswerAnimationProps {
  phase: AnimationPhase;
  hideSpinner?: boolean;
}

const STEPS = [
  {
    key: 'fetching' as AnimationPhase,
    title: 'Ricerca informazioni',
    subtitle: 'Recupero le fonti rilevanti',
    icon: 'search-sharp',
    iconComponent: Ionicons,
  },
  {
    key: 'reasoning' as AnimationPhase,
    title: 'Analisi e ragionamento',
    subtitle: 'Comprendo il contesto',
    icon: 'brain',
    iconComponent: MaterialCommunityIcons,
  },
  {
    key: 'generating' as AnimationPhase,
    title: 'Generazione risposta',
    subtitle: 'Stesura della risposta in corso...',
    icon: 'text',
    iconComponent: Ionicons,
  },
];

const ESTIMATED_TIME = '1.2s';

export function AnswerAnimation({ phase, hideSpinner = false }: AnswerAnimationProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const [pulseValue] = useState(new Animated.Value(0));
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    if (phase !== 'idle') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseValue.setValue(0);
    }
  }, [phase, pulseValue]);

  useEffect(() => {
    let dotAnim: Animated.CompositeAnimation | null = null;
    if (phase !== 'idle') {
      dotAnim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(dot1, { toValue: 1, duration: 420, useNativeDriver: true }),
            Animated.timing(dot1, { toValue: 0, duration: 420, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(160),
            Animated.timing(dot2, { toValue: 1, duration: 420, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0, duration: 420, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(320),
            Animated.timing(dot3, { toValue: 1, duration: 420, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0, duration: 420, useNativeDriver: true }),
          ]),
        ]),
      );
      dotAnim.start();
    } else {
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }

    return () => {
      if (dotAnim) dotAnim.stop();
    };
  }, [phase, dot1, dot2, dot3]);

  const pulseScale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  if (phase === 'idle') {
    return <></>;
  }

  const activeIndex = STEPS.findIndex(step => step.key === phase);
  const isComplete = phase === 'complete';
  const title = isComplete ? 'Risposta generata' : 'Sto lavorando...';
  const subtitle = isComplete ? 'Risposta pronta' : 'Ricerco, analizzo e genero la risposta';

  return (
    <View style={[styles.container, collapsed && styles.containerCollapsed]}>
      <View style={[styles.card, collapsed && styles.cardCollapsed]}>
        <View style={[styles.headerRow, collapsed && styles.headerRowCollapsed]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrapper}>
              <Octicons name="sparkles-fill" size={24} color={COLORS.primaryLightOpacityDarker} />
            </View>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.collapseButton}
            activeOpacity={0.8}
            onPress={() => setCollapsed(prev => !prev)}
          >
            <Entypo name={collapsed ? 'chevron-down' : 'chevron-up'} size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {!collapsed && (
          <>
            <View style={styles.card}>
              <View style={styles.stepsWrapper}>
                {STEPS.map((step, index) => {
                  const isActive = !isComplete && index === activeIndex;
                  const iconBackground = isActive ? '#EEF2FF' : '#F8FAFC';
                  const subtitleText = step.key === 'fetching' && isComplete ? '3 fonti trovate' : step.subtitle;
                  const IconComponent = step.iconComponent;

                  return (
                    <View key={step.key} style={styles.stepRow}>
                      <View style={styles.stepIconColumn}>
                        <Animated.View
                          style={[
                            styles.stepIconWrapper,
                            { backgroundColor: iconBackground, transform: isActive ? [{ scale: pulseScale }] : [{ scale: 1 }] },
                          ]}
                        >
                          <IconComponent name={step.icon as any} size={24} color="#000000" />
                        </Animated.View>
                        {index < STEPS.length - 1 ? <View style={[styles.stepConnector, { backgroundColor: '#E2E8F0' }]} /> : null}
                      </View>
                      <View style={styles.stepTextWrapper}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepSubtitle}>{subtitleText}</Text>
                      </View>
                      <View style={styles.stepStatusWrapper}>
                        {isComplete || index < activeIndex ? (
                          <FontAwesome5 name="check" size={24} color="#09ffd294" />
                        ) : isActive && !hideSpinner ? (
                          <View style={styles.spinnerDots}>
                            <Animated.View
                              style={[
                                styles.spinnerDot,
                                styles.spinnerDotActive,
                                {
                                  transform: [{ translateY: dot1.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
                                  opacity: dot1.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                                },
                              ]}
                            />
                            <Animated.View
                              style={[
                                styles.spinnerDot,
                                styles.spinnerDotActive,
                                {
                                  transform: [{ translateY: dot2.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
                                  opacity: dot2.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                                },
                              ]}
                            />
                            <Animated.View
                              style={[
                                styles.spinnerDot,
                                styles.spinnerDotActive,
                                {
                                  transform: [{ translateY: dot3.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
                                  opacity: dot3.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                                },
                              ]}
                            />
                          </View>
                        ) : (
                          <View style={styles.statusPlaceholder} />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
    marginTop: '5%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: '-2%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '2%',
  },
  headerTextWrapper: {
    flex: 0.8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: '6%',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  collapseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapseIcon: {
    fontSize: 18,
    color: '#000000',
  },
  stepsWrapper: {
    marginTop: '2%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  stepIconColumn: {
    alignItems: 'center',
    marginRight: 14,
  },
  stepIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCompletedIcon: {
    fontSize: 18,
    fontWeight: '800',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    marginTop: 8,
    borderRadius: 1,
  },
  stepTextWrapper: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  stepStatusWrapper: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#15803D',
    fontSize: 16,
    fontWeight: '800',
  },
  activeDot: {
    fontSize: 16,
    color: '#4338CA',
  },
  statusPlaceholder: {
    width: 18,
    height: 18,
  },
  spinnerDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  spinnerDotActive: {
    backgroundColor: '#4338CA',
  },
  spinnerDotInactive: {
    backgroundColor: '#CBD5E1',
  },
  containerCollapsed: {
    marginBottom: 6,
    marginTop: '4%',
  },
  cardCollapsed: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  headerRowCollapsed: {
    marginBottom:'3%',
    marginTop: 0,
  },
});

