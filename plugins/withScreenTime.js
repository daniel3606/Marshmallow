const {
  withEntitlementsPlist,
  withPodfileProperties,
  withXcodeProject,
} = require("expo/config-plugins");

/**
 * Expo config plugin that:
 * 1. Adds the com.apple.developer.family-controls entitlement
 * 2. Bumps the iOS deployment target to 16.0 if it's lower
 *    (required by FamilyControls / ManagedSettings)
 */
const withScreenTime = (config) => {
  // --- Entitlements ---
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults["com.apple.developer.family-controls"] = true;
    return mod;
  });

  // --- CocoaPods deployment target ---
  // The iOS Podfile uses `podfile_properties['ios.deploymentTarget'] || '15.1'`.
  // Without this, CocoaPods may reject ScreenTimeModule due to iOS 16+ APIs.
  config = withPodfileProperties(config, (mod) => {
    mod.modResults["ios.deploymentTarget"] = "16.0";
    return mod;
  });

  // --- Deployment target ---
  config = withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const configs = project.pbxXCBuildConfigurationSection();

    for (const key in configs) {
      const buildSettings = configs[key].buildSettings;
      if (
        buildSettings &&
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET &&
        parseFloat(buildSettings.IPHONEOS_DEPLOYMENT_TARGET) < 16.0
      ) {
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.0";
      }
    }

    return mod;
  });

  return config;
};

module.exports = withScreenTime;
