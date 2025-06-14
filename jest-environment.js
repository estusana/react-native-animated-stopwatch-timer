/**
 * Custom Jest environment to fix React Native performance property conflict
 */

const { TestEnvironment } = require('jest-environment-node');

class ReactNativeTestEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);

    // Fix the performance property issue before React Native setup runs
    this.fixPerformanceProperty();
  }

  fixPerformanceProperty() {
    // Remove the existing performance property if it's read-only
    if (typeof this.global.performance !== 'undefined') {
      try {
        // Try to delete the existing property
        delete this.global.performance;
      } catch (error) {
        // If deletion fails, ignore
      }
    }

    // Create a configurable performance object
    this.global.performance = {
      now: () => Date.now(),
    };

    // Ensure it's configurable for React Native to override
    Object.defineProperty(this.global, 'performance', {
      value: this.global.performance,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = ReactNativeTestEnvironment;
