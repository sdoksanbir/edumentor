import { useState, useEffect } from "react"
import { storage } from "./utils"

const STORAGE_KEY = "sidebar:collapsed"

export function useSidebarController(isDesktop: boolean) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = storage.get(STORAGE_KEY)
    return saved === "true"
  })
  
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)

  useEffect(() => {
    storage.set(STORAGE_KEY, collapsed ? "true" : "false")
  }, [collapsed])

  const toggleCollapsed = () => {
    setCollapsed(prev => !prev)
  }

  // Reset hover when expanding sidebar
  useEffect(() => {
    if (!collapsed) {
      setHoveredGroupId(null)
    }
  }, [collapsed])

  return {
    collapsed: isDesktop ? collapsed : false,
    toggleCollapsed,
    hoveredGroupId,
    setHoveredGroupId,
  }
}
