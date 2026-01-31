import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { LocationProvider } from "./contexts/LocationContext";
import { AdminProvider } from "./contexts/AdminContext";
import ConditionalHeader from "./components/ConditionalHeader";
import SiteClosedModal from "./components/SiteClosedModal";
import CartModal from "./components/CartModal";
import WhatsAppButton from "./components/WhatsAppButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Quisine - Fresh Food Delivery | Order Online",
  description: "Order delicious, fresh food delivered to your doorstep. Browse our menu of healthy meals, traditional favorites, and daily specials. Fast delivery, great taste!",
  keywords: [
    "food delivery",
    "online food order",
    "restaurant delivery",
    "fresh meals",
    "healthy food delivery",
    "The Quisine",
    "food ordering app",
    "meal delivery service",
    "quick meal delivery"
  ],
  authors: [{ name: "The Quisine" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  openGraph: {
    title: "The Quisine - Fresh Food Delivery",
    description: "Order delicious, fresh food delivered to your doorstep",
    type: "website",
    url: "https://www.thequisine.in",
    siteName: "The Quisine",
    images: [
      {
        url: "https://www.thequisine.in/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Quisine Food Delivery"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "The Quisine - Fresh Food Delivery",
    description: "Order delicious, fresh food delivered to your doorstep",
    images: ["https://www.thequisine.in/og-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en">
      <head>
        {/* Facebook Domain Verification */}
        <meta name="facebook-domain-verification" content="qlycesjfobz3di2hu7z12fm3aqkkuu" />
        
        {/* Preconnect to API for faster product loading */}
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_BASE_URL || 'https://the-quisine-app-backend.vercel.app'} />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_BASE_URL || 'https://the-quisine-app-backend.vercel.app'} />
        
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '727895786553220');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img height="1" width="1" style={{display: 'none'}}
            src="https://www.facebook.com/tr?id=727895786553220&ev=PageView&noscript=1"
          />
        </noscript>
        {/* End Meta Pixel Code */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
        <AuthProvider>
          <AdminProvider>
            <CartProvider>
              <LocationProvider>
                <ConditionalHeader />
                <SiteClosedModal />
                <CartModal />
                <WhatsAppButton />
                {children}
              </LocationProvider>
            </CartProvider>
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
