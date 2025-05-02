import React from 'react';
import { Stack } from 'expo-router';

export default function PlannerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="meal-plan" />
      <Stack.Screen name="create" />
      <Stack.Screen 
        name="add-meal" 
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="[id]" 
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}