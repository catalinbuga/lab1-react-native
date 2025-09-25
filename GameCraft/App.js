import React from 'react';
import GameScreen from './src/screens/GameScreen';
import CraftLoader from './src/components/loading/CraftLoader';

export default function App() {
  return (
    <CraftLoader>
      <GameScreen />
    </CraftLoader>
  );
}
