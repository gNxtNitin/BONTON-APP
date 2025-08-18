# Status Bar Testing Guide for Bonton App

## 🚨 IMPORTANT: Status Bar Color Not Changing

If the status bar color is still not changing to `#4cf4dc`, follow these steps:

## 🔧 **Step 1: Clean and Rebuild (CRITICAL)**

### For Android:
```bash
# Clean the project
cd android
./gradlew clean

# Remove build folders
rm -rf android/app/build
rm -rf android/build

# Go back to root
cd ..

# Clear Metro cache
npx react-native start --reset-cache

# In another terminal, rebuild
npx react-native run-android
```

### For iOS:
```bash
# Clean iOS build
cd ios
rm -rf build
rm -rf Pods
pod install
cd ..

# Rebuild
npx react-native run-ios
```

## 🔍 **Step 2: Verify Configuration Files**

### Android Theme Files:
1. **`android/app/src/main/res/values/styles.xml`**:
   ```xml
   <item name="android:statusBarColor">@color/status_bar_color</item>
   <item name="android:windowLightStatusBar">false</item>
   <item name="android:windowDrawsSystemBarBackgrounds">true</item>
   ```

2. **`android/app/src/main/res/values/colors.xml`**:
   ```xml
   <color name="status_bar_color">#4cf4dc</color>
   ```

3. **`android/app/src/main/res/values-night/styles.xml`**:
   ```xml
   <item name="android:statusBarColor">@color/status_bar_color</item>
   ```

### MainActivity.kt:
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  
  // Set status bar color explicitly
  window.statusBarColor = Color.parseColor("#4cf4dc")
  window.decorView.systemUiVisibility = window.decorView.systemUiVisibility and 
      android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
}
```

## 🧪 **Step 3: Test on Different Devices**

### Test Devices:
- **Physical Android Device** (preferred)
- **Android Emulator** (API 30+)
- **Physical iOS Device**
- **iOS Simulator**

### Test Scenarios:
1. **App Launch**: Status bar should be `#4cf4dc` immediately
2. **Navigation**: Color should persist across all screens
3. **Theme Switch**: Color should remain `#4cf4dc` in both light/dark modes
4. **App Background/Foreground**: Color should persist

## 🐛 **Step 4: Debug Status Bar**

### Add Console Logs:
```javascript
// In App.js useEffect
console.log('App.js: Setting status bar color to #4cf4dc');
console.log('Platform:', Platform.OS);
console.log('StatusBar API available:', !!StatusBar);

// Check if StatusBar methods exist
console.log('setBackgroundColor available:', !!StatusBar.setBackgroundColor);
console.log('setBarStyle available:', !!StatusBar.setBarStyle);
```

### Check Android Logs:
```bash
# View Android logs
adb logcat | grep -i "status\|statusbar\|bonton"
```

## 🔄 **Step 5: Alternative Approaches**

### Approach 1: Force Status Bar in MainActivity
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  
  // Multiple attempts to set status bar
  window.statusBarColor = Color.parseColor("#4cf4dc")
  
  // Post to ensure it's applied after layout
  window.decorView.post {
    window.statusBarColor = Color.parseColor("#4cf4dc")
  }
}
```

### Approach 2: Use AppCompat Theme
```xml
<style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <item name="android:statusBarColor">@color/status_bar_color</item>
    <item name="android:windowLightStatusBar">false</item>
    <item name="colorPrimaryDark">@color/status_bar_color</item>
</style>
```

### Approach 3: React Native StatusBar with Delays
```javascript
useEffect(() => {
  const setStatusBarWithDelay = () => {
    StatusBar.setBackgroundColor('#4cf4dc', true);
    StatusBar.setBarStyle('light-content', true);
  };
  
  setStatusBarWithDelay();
  
  // Multiple attempts
  const timer1 = setTimeout(setStatusBarWithDelay, 100);
  const timer2 = setTimeout(setStatusBarWithDelay, 500);
  const timer3 = setTimeout(setStatusBarWithDelay, 1000);
  
  return () => {
    clearTimeout(timer1);
    clearTimeout(timer2);
    clearTimeout(timer3);
  };
}, []);
```

## 📱 **Step 6: Device-Specific Issues**

### Android API Level Issues:
- **API 21-22**: May not support `android:statusBarColor`
- **API 23+**: Full support for status bar customization
- **API 30+**: May require additional flags

### Samsung/OnePlus Devices:
- Some devices have custom UI overlays
- May require device-specific settings
- Check device accessibility settings

### iOS Version Issues:
- **iOS 13+**: Full support for status bar customization
- **iOS 12 and below**: Limited customization options

## 🎯 **Expected Result**

After successful implementation:
- ✅ Status bar background: `#4cf4dc` (light teal/cyan)
- ✅ Status bar text/icons: White (`light-content`)
- ✅ Color consistent across all screens
- ✅ Color persists in both light/dark themes
- ✅ Color maintained during navigation

## 🆘 **If Still Not Working**

1. **Check React Native Version**: Ensure you're using RN 0.60+
2. **Verify Permissions**: Check if any permissions are blocking status bar changes
3. **Device Manufacturer**: Some devices have custom UI restrictions
4. **System Theme**: Ensure system theme isn't overriding app theme
5. **Clean Install**: Uninstall app completely and reinstall

## 📞 **Support**

If the issue persists after following all steps:
1. Check the console logs for errors
2. Verify all configuration files are correct
3. Test on multiple devices/emulators
4. Consider device-specific workarounds
