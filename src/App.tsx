import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import CryptoFaucet from './components/CryptoFaucet'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <CryptoFaucet/>
    </>
  )
}

export default App
