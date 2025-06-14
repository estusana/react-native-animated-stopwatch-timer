import React, {
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import Animated, {
  type EntryAnimationsValues,
  type ExitAnimationsValues,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import useTimer from './useTimer';

const DEFAULT_ANIMATION_DELAY = 0;
const DEFAULT_ANIMATION_DISTANCE = 80;
const DEFAULT_ANIMATION_DURATION = 200;

// Animation presets for better performance and user experience
const ANIMATION_PRESETS = {
  smooth: {
    damping: 20,
    stiffness: 200,
    mass: 0.8,
  },
  bouncy: {
    damping: 8,
    stiffness: 100,
    mass: 1,
  },
  quick: {
    damping: 15,
    stiffness: 300,
    mass: 0.6,
  },
} as const;

export interface StopwatchTimerProps {
  /**
   * Starts the animation on load
   */
  autostart?: boolean;
  /**
   * Show hour digit if needed
   */
  needHour?: boolean;
  /**
   * The enter/exit animation duration in milliseconds of a digit.
   */
  animationDuration?: number;
  /**
   * The enter/exit animation delay in milliseconds of a digit.
   */
  animationDelay?: number;
  /**
   * The enter/exit animation distance in dp of a digit.
   */
  animationDistance?: number;
  /**
   * Animation preset for enhanced user experience
   */
  animationPreset?: 'smooth' | 'bouncy' | 'quick' | 'custom';
  /**
   * Enable spring-based animations for more natural feel
   */
  useSpringAnimation?: boolean;
  /**
   * Performance optimization mode
   */
  performanceMode?: 'balanced' | 'performance' | 'quality';
  /**
   * The style of the component View container.
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Extra style applied only to each digit, excluding separators.
   */
  digitStyle?: StyleProp<TextStyle>;
  /**
   * Whether the component should work as a stopwatch or as a timer.
   */
  mode?: 'stopwatch' | 'timer';
  /**
   * Initial time in milliseconds
   */
  initialTimeInMs?: number;
  /**
   * The number of zeros for the minutes.
   */
  leadingZeros?: 1 | 2;
  /**
   * Whether the new digit should enter from the top or the bottom.
   */
  enterAnimationType?: 'slide-in-up' | 'slide-in-down';
  /**
   * Callback executed when the timer reaches 0 (only when working in timer mode and initialTimeInMs is provided).
   */
  onFinish?: () => void;
  /**
   * Extra style applied only to separators. In this case, the colon (:) and the comma (,)
   */
  separatorStyle?: StyleProp<TextStyle>;
  /**
   * The style applied to each individual character of the stopwatch/timer.
   */
  textCharStyle?: StyleProp<TextStyle>;
  /**
   * If 0, the component will only display seconds and minutes.
   * If 1, the component will display seconds, minutes and hundredth of ms.
   */
  trailingZeros?: 0 | 1 | 2;
  /**
   * Decimal separator for formatting time. Defaults to a comma (','), but any string can be used for custom formats.
   */
  decimalSeparator?: string;
  /**
   * The interval in milliseconds at which the stopwatch/timer should update. Defaults to 16ms.
   */
  intervalMs?: number;
}

export interface StopwatchTimerMethods {
  /**
   * Starts the stopwatch/timer or resumes it if paused. Has no effect if the stopwatch/timer is already running.
   */
  play: () => void;
  /**
   * Pauses the stopwatch/timer and returns the current elapsed time in milliseconds.
   */
  pause: () => number;
  /**
   * Resets the stopwatch/timer.
   */
  reset: () => void;
  /**
   * Returns the current elapsed time in milliseconds.
   */
  getSnapshot: () => number;
}

const Stopwatch = forwardRef<StopwatchTimerMethods, StopwatchTimerProps>(
  function Stopwatch(
    {
      animationDelay = DEFAULT_ANIMATION_DELAY,
      animationDistance = DEFAULT_ANIMATION_DISTANCE,
      animationDuration = DEFAULT_ANIMATION_DURATION,
      animationPreset = 'smooth',
      useSpringAnimation = false,
      performanceMode = 'balanced',
      containerStyle,
      enterAnimationType = 'slide-in-up',
      mode = 'stopwatch',
      digitStyle,
      initialTimeInMs,
      leadingZeros = 1,
      onFinish,
      separatorStyle,
      textCharStyle,
      trailingZeros = 1,
      decimalSeparator = ',',
      intervalMs = 16,
      needHour = false,
      autostart = false,
    }: StopwatchTimerProps,
    ref: ForwardedRef<StopwatchTimerMethods>
  ) {
    const {
      tensOfMs,
      lastDigit,
      tens,
      minutes,
      play,
      reset,
      pause,
      getSnapshot,
      hours,
    } = useTimer({
      initialTimeInMs,
      onFinish,
      mode,
      intervalMs,
      needHour,
    });

    // Memoized imperative handle to prevent unnecessary re-creations
    useImperativeHandle(
      ref,
      () => ({
        play,
        pause,
        reset,
        getSnapshot,
      }),
      [play, pause, reset, getSnapshot]
    );

    // Consolidated SharedValue for better memory efficiency
    const digitMountStates = useSharedValue({
      seconds: false,
      tensOfSeconds: false,
      minutes: false,
      hours: false,
    });

    // Memoized animation configuration based on performance mode
    const animationConfig = useMemo(() => {
      const validPresets = ['smooth', 'bouncy', 'quick'] as const;
      const selectedPreset = validPresets.includes(animationPreset as any)
        ? (animationPreset as keyof typeof ANIMATION_PRESETS)
        : 'smooth';
      const preset = ANIMATION_PRESETS[selectedPreset];

      const baseConfig = {
        duration:
          performanceMode === 'performance'
            ? animationDuration * 0.7
            : animationDuration,
        delay:
          performanceMode === 'performance'
            ? animationDelay * 0.5
            : animationDelay,
        distance: animationDistance,
      };

      // Return properly typed configuration based on animation type
      return useSpringAnimation
        ? { ...baseConfig, ...preset, useSpringAnimation: true as const }
        : { ...baseConfig, useSpringAnimation: false as const };
    }, [
      animationPreset,
      useSpringAnimation,
      performanceMode,
      animationDuration,
      animationDelay,
      animationDistance,
    ]);

    // Optimized animation creation function with consolidated state
    const createEntering = useCallback(
      (digitType: 'seconds' | 'tensOfSeconds' | 'minutes' | 'hours') =>
        (values: EntryAnimationsValues) => {
          'worklet';
          if (!digitMountStates.value[digitType]) {
            // Skip entering animation on first render
            digitMountStates.value = {
              ...digitMountStates.value,
              [digitType]: true,
            };
            return { initialValues: {}, animations: {} };
          }

          const enterDirection = enterAnimationType === 'slide-in-up' ? -1 : 1;
          const initialValues = {
            originY:
              values.targetOriginY + animationConfig.distance * enterDirection,
          };

          const animations =
            useSpringAnimation && 'damping' in animationConfig
              ? {
                  originY: withDelay(
                    animationConfig.delay,
                    withSpring(values.targetOriginY, {
                      damping: animationConfig.damping,
                      stiffness: animationConfig.stiffness,
                      mass: animationConfig.mass,
                    })
                  ),
                }
              : {
                  originY: withDelay(
                    animationConfig.delay,
                    withTiming(values.targetOriginY, {
                      duration: animationConfig.duration,
                    })
                  ),
                };

          return { initialValues, animations };
        },
      [
        digitMountStates,
        enterAnimationType,
        animationConfig,
        useSpringAnimation,
      ]
    );

    // Optimized exiting animation function
    const exiting = useCallback(
      (values: ExitAnimationsValues) => {
        'worklet';
        const exitDirection = enterAnimationType === 'slide-in-up' ? 1 : -1;
        const initialValues = {
          originY: values.currentOriginY,
        };

        const animations =
          useSpringAnimation && 'damping' in animationConfig
            ? {
                originY: withDelay(
                  animationConfig.delay,
                  withSpring(
                    values.currentOriginY +
                      animationConfig.distance * exitDirection,
                    {
                      damping: animationConfig.damping,
                      stiffness: animationConfig.stiffness,
                      mass: animationConfig.mass,
                    }
                  )
                ),
              }
            : {
                originY: withDelay(
                  animationConfig.delay,
                  withTiming(
                    values.currentOriginY +
                      animationConfig.distance * exitDirection,
                    {
                      duration: animationConfig.duration,
                    }
                  )
                ),
              };

        return { initialValues, animations };
      },
      [enterAnimationType, animationConfig, useSpringAnimation]
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { width, ...textCharStyleWithoutWidth } = StyleSheet.flatten(
      textCharStyle || {}
    );

    useEffect(() => {
      if (autostart) play();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <View style={[styles.container, containerStyle]}>
        {leadingZeros === 2 && (
          <Text
            style={[
              styles.defaultCharStyle,
              textCharStyleWithoutWidth,
              digitStyle,
            ]}
          >
            0
          </Text>
        )}
        {needHour ? (
          <>
            <Animated.Text
              key={`${hours}-hours`}
              style={[
                styles.defaultCharStyle,
                textCharStyleWithoutWidth,
                digitStyle,
              ]}
              entering={createEntering('hours')}
              exiting={exiting}
            >
              {hours}
            </Animated.Text>
            <Text
              style={[
                styles.defaultCharStyle,
                textCharStyleWithoutWidth,
                separatorStyle,
              ]}
            >
              :
            </Text>
          </>
        ) : (
          <></>
        )}
        <Animated.Text
          key={`${minutes}-minutes`}
          style={[
            styles.defaultCharStyle,
            textCharStyleWithoutWidth,
            digitStyle,
          ]}
          entering={createEntering('minutes')}
          exiting={exiting}
        >
          {needHour && minutes < 10 ? '0' : ''}
          {minutes}
        </Animated.Text>
        <Text
          style={[
            styles.defaultCharStyle,
            textCharStyleWithoutWidth,
            separatorStyle,
          ]}
        >
          :
        </Text>
        <Animated.Text
          key={`${tens}-tens`}
          style={[
            styles.defaultCharStyle,
            textCharStyleWithoutWidth,
            digitStyle,
          ]}
          entering={createEntering('tensOfSeconds')}
          exiting={exiting}
        >
          {tens}
        </Animated.Text>
        <Animated.Text
          key={`${lastDigit}-count`}
          style={[
            styles.defaultCharStyle,
            textCharStyleWithoutWidth,
            digitStyle,
          ]}
          entering={createEntering('seconds')}
          exiting={exiting}
        >
          {lastDigit}
        </Animated.Text>
        {trailingZeros > 0 && (
          <>
            <Text
              style={[
                styles.defaultCharStyle,
                textCharStyleWithoutWidth,
                separatorStyle,
              ]}
            >
              {decimalSeparator}
            </Text>
            <Text
              style={[
                styles.defaultCharStyle,
                textCharStyleWithoutWidth,
                digitStyle,
              ]}
            >
              {tensOfMs >= 10 ? String(tensOfMs).charAt(0) : 0}
            </Text>
            {trailingZeros === 2 && (
              <Text
                style={[
                  styles.defaultCharStyle,
                  textCharStyleWithoutWidth,
                  digitStyle,
                ]}
              >
                {tensOfMs >= 10
                  ? String(tensOfMs).charAt(1)
                  : String(tensOfMs).charAt(0)}
              </Text>
            )}
          </>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  defaultCharStyle: {
    textAlign: 'center',
  },
});

const StopwatchTimer = React.memo(Stopwatch);

export default StopwatchTimer;
