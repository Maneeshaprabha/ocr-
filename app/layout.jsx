
import "./globals.css";
import { LanguageProvider } from "@/app/provider/LanguageProvider";
import { ThemeProvider } from "@/app/provider/ThemeProvider";
import { AuthProvider } from "./components/context/AuthProvider";

export const metadata = {
  title: "OCR Processor",
  description: "OCR App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full m-0 p-0">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}