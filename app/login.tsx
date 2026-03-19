import Theme from "@/constants/theme";
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const login = () => {
  return (
    <View>
      <Text style={styles.title}>Welcome to Marshmallow</Text>
    </View>
  )
}

export default login

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.light.background
  },  
  title: {
    fontSize: 36,
    fontFamily: Theme.fonts.semibold,
  }
})