import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Theme from "@/constants/theme";

interface MarshmallowCharacterProps {
  color: string;
  name: string;
  sizeCm: number;
  isBlocking?: boolean;
}

export default function MarshmallowCharacter({
  color,
  name,
  sizeCm,
  isBlocking,
}: MarshmallowCharacterProps) {
  const scale = 0.8 + Math.min(sizeCm / 60, 0.4);

  return (
    <View style={styles.container}>
      <View style={[styles.wrapper, { transform: [{ scale }] }]}>
        {/* Ground shadow */}
        <View style={styles.groundShadow} />

        {/* Body */}
        <View style={[styles.body, { backgroundColor: color }]}>
          {/* Shine highlight */}
          <View style={styles.shine} />

          <View style={styles.face}>
            <View style={styles.faceShift}>
              <View style={styles.eyes}>
                <View style={styles.eye}>
                  <View style={styles.eyeHighlight} />
                </View>
                <View style={styles.eye}>
                  <View style={styles.eyeHighlight} />
                </View>
              </View>

              {isBlocking ? (
                <View style={styles.mouthDeterminedLines}>
                  <View style={styles.mouthLineStraight} />
                </View>
              ) : (
                <View style={styles.mouthSmileLine} />
              )}
            </View>
          </View>

          {/* Shield badge when blocking */}
          {isBlocking && (
            <View style={styles.shieldBadge}>
              <Text style={styles.shieldEmoji}>🛡️</Text>
            </View>
          )}
        </View>
      </View>

      {/* Name */}
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  groundShadow: {
    position: "absolute",
    bottom: -8,
    width: 161,
    height: 38,
    borderRadius: 265,
    marginLeft: 30,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  body: {
    width: 200,
    height: 222,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  shine: {
    position: "absolute",
    top: 14,
    left: 28,
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
    transform: [{ rotate: "-20deg" }],
  },
  face: {
    alignItems: "center",
    marginTop: 8,
  },
  faceShift: {
    alignItems: "center",
    marginRight: 28,
    marginTop: 30,
  },
  eyes: {
    flexDirection: "row",
    gap: 54,
    marginBottom: 12,
  },
  eye: {
    width: 26,
    height: 26,
    borderRadius: 100,
    backgroundColor: "#2C2C2E",
  },
  eyeHighlight: {
    position: "absolute",
    top: 5,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 3.5,
    backgroundColor: "#FFFFFF",
  },
  cheeks: {
    flexDirection: "row",
    gap: 50,
    marginBottom: 6,
  },
  cheek: {
    width: 20,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,130,130,0.3)",
  },
  /** Single curved stroke: only the bottom border is drawn */
  mouthSmileLine: {
    width: 40,
    height: 12,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 2.5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderColor: "#2C2C2E",
    backgroundColor: "transparent",
  },
  mouthDeterminedLines: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  mouthLineStraight: {
    width: 26,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#2C2C2E",
  },
  shieldBadge: {
    position: "absolute",
    top: -6,
    right: -6,
  },
  shieldEmoji: {
    fontSize: 24,
  },
  name: {
    marginTop: 14,
    fontSize: 20,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
});
