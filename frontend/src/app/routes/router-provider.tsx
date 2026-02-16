// src/app/router-provider.tsx
import { RouterProvider } from "react-router-dom"
import { router } from "./../routes"

export function AppRouterProvider() {
  return <RouterProvider router={router} />
}
