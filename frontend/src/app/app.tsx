import { createPortal } from "react-dom"
import { Toaster } from "sonner"
import { AppRouterProvider } from "./providers/router-provider"
import { AuthProvider } from "./providers/auth-provider"
import { QueryProvider } from "./providers/query-provider"
import { ThemeProvider } from "./providers/theme-provider"

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppRouterProvider />
          {typeof document !== "undefined" &&
            createPortal(
              <Toaster richColors position="top-right" />,
              document.body
            )}
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
