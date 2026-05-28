import type { Metadata } from 'next'
import './globals.css'
import '@/styles/fonts.css'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { ActiveUserProvider } from '@/contexts/active_user_context';
import Header from '@/components/Header/Header';
import BottomNav from '@/components/Navbar/BottomNav';

export const metadata: Metadata = {
    title: 'باشگاه فولاد مبارکه سپاهان',
    description: 'باشگاه فولاد مبارکه سپاهان',
    icons: {
        icon: '/logo.png',
        shortcut: '/logo.png',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ActiveUserProvider>
            <html lang="fa" dir="rtl" suppressHydrationWarning>
                <head>
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                        try {
                            const saved = localStorage.getItem('theme-mode');
                            if (saved === 'dark') {
                                document.documentElement.classList.add('dark');
                                }
                                } catch(e) {}
                                `,
                        }}
                    />
                </head>
                <body className="app-page font-vazirmatn" suppressHydrationWarning>
                    <div className="app-shell">
                        <div className="app-container">
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                overflow: 'auto'
                            }}>
                                <Header />
                                <main style={{ flex: 1, overflow: 'auto',}}>
                                    {children}
                                </main>
                                <BottomNav />
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        </ActiveUserProvider>
    )
}