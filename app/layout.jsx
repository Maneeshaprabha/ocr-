
import "./globals.css";
import "./globals.css";
import { LanguageProvider } from "@/app/Provider/LanguageProvider";
import { ThemeProvider } from "@/app/Provider/ThemeProvider";
import { AuthProvider } from "@/app/components/context/AuthProvider";

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