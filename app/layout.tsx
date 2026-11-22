import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import "./globals.css";

const headingFont = DM_Sans({
    variable: "--font-heading",
    subsets: ["latin"],
    weight: "400",
});

const bodyFont = DM_Sans({
    variable: "--font-body",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Fork My Boston",
    description: "Discover and share Boston itineraries.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${headingFont.variable} ${bodyFont.variable}`}>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}