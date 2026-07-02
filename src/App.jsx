import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import DatasetOverview from "./pages/DatasetOverview"
import Visualizations from "./pages/Visualizations"
import Chatbot from "./pages/Chatbot"
import MLPrediction from "./pages/MLPrediction"
import AutoML from "./pages/AutoML"
import ExportReport from "./pages/ExportReport"

// If user is logged in → show the page they want
// If user is NOT logged in → send them to login
function ProtectedRoute({ user, children }) {
  if (user === null) return null        // still checking auth — show nothing
  if (user === false) return <Navigate to="/" />  // not logged in → go to login
  return children                       // logged in → show the page
}

export default function App() {
  // user = null means we don't know yet
  // user = false means not logged in
  // user = object means logged in
  const [user, setUser] = useState(null)

  useEffect(() => {
    // onAuthStateChanged listens for login/logout events
    // fires immediately on app load to check existing session
    // returns unsubscribe function — we call it on cleanup
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)   // logged in
      } else {
        setUser(false)          // not logged in
      }
    })

    return () => unsubscribe() // cleanup when App unmounts
  }, []) // empty [] = run this effect only once on mount

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route — login page */}
        <Route path="/" element={<Login user={user} />} />

        {/* Protected routes — only accessible when logged in */}
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}><Dashboard user={user} /></ProtectedRoute>
        } />
        <Route path="/overview/:datasetId" element={
          <ProtectedRoute user={user}><DatasetOverview user={user} /></ProtectedRoute>
        } />
        <Route path="/visualizations/:datasetId" element={
          <ProtectedRoute user={user}><Visualizations user={user} /></ProtectedRoute>
        } />
        <Route path="/chatbot/:datasetId" element={
          <ProtectedRoute user={user}><Chatbot user={user} /></ProtectedRoute>
        } />
        <Route path="/ml/:datasetId" element={
          <ProtectedRoute user={user}><MLPrediction user={user} /></ProtectedRoute>
        } />
        <Route path="/automl/:datasetId" element={
          <ProtectedRoute user={user}><AutoML user={user} /></ProtectedRoute>
        } />
        <Route path="/report/:datasetId" element={
          <ProtectedRoute user={user}><ExportReport user={user} /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}