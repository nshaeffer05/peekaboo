// Adopts the UIScene life cycle, which the iOS 27 SDK requires (the app traps
// at launch otherwise). Expo 57 ships ExpoAppSceneDelegate but its template
// does not wire it up, so this plugin does: a scene manifest in Info.plist, a
// SceneDelegate class, and an AppDelegate that lets the scene start React Native.
const { withInfoPlist, withAppDelegate } = require('expo/config-plugins');

const SCENE_CLASS = `
class SceneDelegate: ExpoAppSceneDelegate {}
`;

function withSceneLifecycle(config) {
  config = withInfoPlist(config, (c) => {
    c.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return c;
  });

  config = withAppDelegate(config, (c) => {
    let src = c.modResults.contents;
    if (c.modResults.language !== 'swift') {
      throw new Error('withSceneLifecycle expects a Swift AppDelegate');
    }
    if (!src.includes('ExpoAppSceneDelegate')) {
      // 1. Conform to the provider protocol the scene delegate reads.
      src = src.replace(
        /class AppDelegate: ExpoAppDelegate \{/,
        'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
      );
      // 2. The scene creates the window and starts React Native, so drop that here.
      src = src.replace(
        /#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/,
        ''
      );
      // 3. Scene delegate class in the same module.
      src += SCENE_CLASS;
    }
    c.modResults.contents = src;
    return c;
  });

  return config;
}

module.exports = withSceneLifecycle;
