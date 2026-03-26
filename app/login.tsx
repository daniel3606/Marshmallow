import MarshmallowCharacter from "@/components/MarshmallowCharacter";
import { MARSHMALLOW_COLORS } from "@/constants/marshmallow";
import Theme from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useMarshmallow } from "@/contexts/MarshmallowContext";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Step = "welcome" | "setup";
type MarshmallowColorHex = (typeof MARSHMALLOW_COLORS)[number]["hex"];

const isWeb = Platform.OS === "web";
const AuthInput = isWeb ? TextInput : BottomSheetTextInput;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { session, signIn, signUp, signOut } = useAuth();
  const { setupMarshmallow } = useMarshmallow();

  const authSheetRef = useRef<BottomSheetModal>(null);
  const [webAuthOpen, setWebAuthOpen] = useState(false);
  /** Avoids redirecting to tabs while session updates before marshmallow setup step. */
  const authSubmittingRef = useRef(false);

  const [step, setStep] = useState<Step>("welcome");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<MarshmallowColorHex>(
    MARSHMALLOW_COLORS[0].hex
  );

  const snapPoints = useMemo(() => ["78%"], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  useEffect(() => {
    if (step === "setup") {
      authSubmittingRef.current = false;
    }
  }, [step]);

  useEffect(() => {
    if (
      session &&
      step === "welcome" &&
      !authSubmittingRef.current &&
      !webAuthOpen
    ) {
      router.replace("/");
    }
  }, [session, step, webAuthOpen]);

  const resetAuthFields = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAuthError(null);
  };

  const openAuthSheet = (mode: "login" | "signup") => {
    setAuthMode(mode);
    resetAuthFields();
    if (isWeb) {
      setWebAuthOpen(true);
    } else {
      authSheetRef.current?.present();
    }
  };

  const closeAuthSheet = () => {
    if (isWeb) {
      setWebAuthOpen(false);
    } else {
      authSheetRef.current?.dismiss();
    }
    resetAuthFields();
  };

  const handleAuthDismiss = () => {
    resetAuthFields();
  };

  const handleAuthSubmit = async () => {
    setAuthError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setAuthError("Please enter email and password.");
      return;
    }
    if (authMode === "signup") {
      if (password !== confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        return;
      }
    }

    setAuthLoading(true);
    authSubmittingRef.current = true;
    try {
      if (authMode === "login") {
        const { error } = await signIn(trimmedEmail, password);
        if (error) {
          authSubmittingRef.current = false;
          setAuthError(error.message);
          return;
        }
        closeAuthSheet();
        setStep("setup");
      } else {
        const { error, needsEmailConfirmation } = await signUp(
          trimmedEmail,
          password
        );
        if (error) {
          authSubmittingRef.current = false;
          setAuthError(error.message);
          return;
        }
        if (needsEmailConfirmation) {
          authSubmittingRef.current = false;
          Alert.alert(
            "Confirm your email",
            "We sent a confirmation link. Open it, then return here and log in.",
            [
              {
                text: "OK",
                onPress: () => {
                  resetAuthFields();
                  setAuthMode("login");
                  closeAuthSheet();
                },
              },
            ]
          );
          return;
        }
        closeAuthSheet();
        setStep("setup");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleComplete = () => {
    setupMarshmallow(name.trim(), selectedColor);
    router.replace("/promo");
  };

  const handleBackFromSetup = async () => {
    await signOut();
    resetAuthFields();
    setName("");
    setSelectedColor(MARSHMALLOW_COLORS[0].hex);
    setStep("welcome");
  };

  const authTitle =
    authMode === "login" ? "Log in" : "Create account";
  const authCta = authMode === "login" ? "Log in" : "Sign up";

  const authFormInner = (
    <>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{authTitle}</Text>
        <Text style={styles.sheetSubtitle}>
          {authMode === "login"
            ? "Welcome back — sign in to continue."
            : "Create an account to save your marshmallow."}
        </Text>
      </View>

      <AuthInput
        style={[styles.sheetInput, styles.textInputLeft]}
        placeholder="Email"
        placeholderTextColor={Theme.colors.gray}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <AuthInput
        style={[styles.sheetInput, styles.textInputLeft]}
        placeholder="Password"
        placeholderTextColor={Theme.colors.gray}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={authMode === "login" ? "password" : "password-new"}
        textContentType={
          authMode === "login" ? "password" : "newPassword"
        }
      />
      {authMode === "signup" && (
        <AuthInput
          style={[styles.sheetInput, styles.textInputLeft]}
          placeholder="Confirm password"
          placeholderTextColor={Theme.colors.gray}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
        />
      )}

      {authError ? (
        <Text style={styles.errorText}>{authError}</Text>
      ) : null}

      <View style={styles.sheetActions}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.buttonPrimary,
            authLoading && styles.buttonDisabled,
            pressed && styles.pressed,
          ]}
          onPress={handleAuthSubmit}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color={Theme.colors.white} />
          ) : (
            <Text style={styles.buttonPrimaryText}>{authCta}</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.buttonGhost,
            pressed && styles.pressed,
          ]}
          onPress={closeAuthSheet}
        >
          <Text style={styles.buttonGhostText}>Cancel</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        {step === "welcome" && (
          <View style={styles.stepContainer}>
            <Text style={styles.welcomeTitle}>
              Welcome to{"\n"}Marshmallow
            </Text>

            <View style={styles.hero}>
              <View style={styles.bigEyes}>
                <View style={styles.bigEye}>
                  <View style={styles.bigEyeHighlight} />
                </View>
                <View style={styles.bigEye}>
                  <View style={styles.bigEyeHighlight} />
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonPrimary,
                  pressed && styles.pressed,
                ]}
                onPress={() => openAuthSheet("login")}
              >
                <Text style={styles.buttonPrimaryText}>Log In</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonSignUp,
                  pressed && styles.pressed,
                ]}
                onPress={() => openAuthSheet("signup")}
              >
                <Text style={styles.buttonSignUpText}>Sign Up</Text>
              </Pressable>
            </View>
          </View>
        )}

        {!isWeb && (
          <BottomSheetModal
            ref={authSheetRef}
            snapPoints={snapPoints}
            enablePanDownToClose
            enableDynamicSizing={false}
            onDismiss={handleAuthDismiss}
            backdropComponent={renderBackdrop}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={styles.handleIndicator}
            bottomInset={insets.bottom}
          >
            <BottomSheetScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.sheetScrollContent,
                { paddingBottom: Math.max(insets.bottom, 16) + 8 },
              ]}
            >
              {authFormInner}
            </BottomSheetScrollView>
          </BottomSheetModal>
        )}

        {isWeb && (
          <Modal
            visible={webAuthOpen}
            animationType="slide"
            transparent
            onRequestClose={closeAuthSheet}
          >
            <View style={styles.webModalRoot}>
              <Pressable
                style={styles.webBackdrop}
                onPress={closeAuthSheet}
              />
              <View
                style={[
                  styles.webSheet,
                  { paddingBottom: Math.max(insets.bottom, 16) },
                ]}
              >
                <View style={styles.webHandle} />
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.webSheetScroll}
                >
                  {authFormInner}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {step === "setup" && (
          <View style={styles.stepContainer}>
            <ScrollView
              style={styles.setupScroll}
              contentContainerStyle={styles.setupScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.stepTitle}>Create your marshmallow</Text>

              <View style={styles.preview}>
                <MarshmallowCharacter
                  color={selectedColor}
                  name={name.trim()}
                  sizeCm={1}
                />
              </View>

              <TextInput
                style={styles.textInput}
                placeholder="Name your marshmallow"
                placeholderTextColor={Theme.colors.gray}
                value={name}
                onChangeText={setName}
                autoFocus
                maxLength={20}
                returnKeyType="done"
              />

              <View style={styles.colorGrid}>
                {MARSHMALLOW_COLORS.map((c) => (
                  <Pressable
                    key={c.hex}
                    onPress={() => setSelectedColor(c.hex)}
                    style={styles.colorOption}
                  >
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c.hex },
                        selectedColor === c.hex && styles.colorSelected,
                      ]}
                    >
                      {selectedColor === c.hex && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.colorLabel}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonPrimary,
                  !name.trim() && styles.buttonDisabled,
                  pressed && styles.pressed,
                ]}
                onPress={handleComplete}
                disabled={!name.trim()}
              >
                <Text style={styles.buttonPrimaryText}>{"Let's go!"}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonGhost,
                  pressed && styles.pressed,
                ]}
                onPress={handleBackFromSetup}
              >
                <Text style={styles.buttonGhostText}>Back</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 32,
  },
  stepContainer: {
    flex: 1,
  },
  setupScroll: {
    flex: 1,
  },
  setupScrollContent: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: "center",
  },
  sheetBackground: {
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  handleIndicator: {
    width: 40,
    backgroundColor: Theme.colors.gray,
    opacity: 0.35,
  },
  sheetScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sheetHeader: {
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 26,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    textAlign: "center",
  },
  sheetSubtitle: {
    fontSize: 15,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    textAlign: "center",
    marginTop: 8,
  },
  sheetInput: {
    width: "100%",
    marginBottom: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: Theme.colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    fontSize: 17,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  sheetActions: {
    marginTop: 8,
    gap: 10,
    width: "100%",
  },
  webModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  webBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  webSheet: {
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  webHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.gray,
    opacity: 0.35,
    marginBottom: 12,
  },
  webSheetScroll: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeTitle: {
    fontSize: 42,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    textAlign: "center",
    marginTop: 20,
  },
  bigEyes: {
    flexDirection: "row",
    gap: 122,
    alignItems: "center",
    justifyContent: "center",
  },
  bigEye: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  bigEyeHighlight: {
    position: "absolute",
    top: 12,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    textAlign: "center",
  },
  textInput: {
    width: "100%",
    marginBottom: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    fontSize: 18,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
    textAlign: "center",
  },
  textInputLeft: {
    textAlign: "left",
  },
  errorText: {
    width: "100%",
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: "#C62828",
    textAlign: "center",
    marginBottom: 8,
  },
  preview: {
    marginTop: 28,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 8,
  },
  colorOption: {
    alignItems: "center",
    width: 68,
  },
  colorSwatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: Theme.colors.secondary,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.secondary,
  },
  colorLabel: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.gray,
  },
  actions: {
    paddingBottom: 60,
    gap: 10,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: Theme.colors.secondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.8,
  },
  buttonPrimaryText: {
    color: Theme.colors.white,
    fontFamily: Theme.fonts.semibold,
    fontSize: 18,
  },
  buttonSignUp: {
    backgroundColor: "#FFF6ED",
    borderWidth: 2,
    borderColor: "#999",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSignUpText: {
    color: "#999",
    fontFamily: Theme.fonts.semibold,
    fontSize: 18,
  },
  buttonGhostText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.medium,
    fontSize: 16,
  },
});
