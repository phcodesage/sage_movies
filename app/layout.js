import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sage Movies - Free Movies, TV Shows & Anime Streaming',
  description: 'Watch free movies, TV shows and anime online. Stream trending movies, 123movies alternatives, movies for kids and popular TV series without registration.',
  keywords: 'free movies, 123movies, trending movies, movies for kids, anime streaming, TV shows online, watch movies free, streaming site',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="https://ui-avatars.com/api/?name=SM&background=e50914&color=fff&rounded=true&size=32" type="image/png"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className={`${inter.className} bg-netflix-black text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
