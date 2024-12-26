import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOMetadata = ({
    title = 'FeedbackFlow - Free Design Feedback & Team Collaboration Platform',
    description = 'Free design feedback tool with real-time collaboration. Get AI-powered insights, smart comments, and version control. Perfect for designers, developers, and creative teams. Start collaborating today!',
    path = '',
    type = 'website'
}) => {
    const baseUrl = 'https://feedbackflow.app';
    const url = `${baseUrl}${path}`;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "FeedbackFlow",
        "applicationCategory": "DesignTool, CollaborationApplication, FeedbackManagement",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Free forever plan with unlimited core features"
        },
        "description": description,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "150",
            "reviewCount": "85"
        },
        "featureList": [
            "Free AI-Powered Design Feedback",
            "Real-time Team Collaboration",
            "Unlimited Version Control",
            "Smart Comments & Annotations",
            "Design Asset Management",
            "Enterprise-grade Security",
            "Design System Integration",
            "Team Analytics Dashboard"
        ],
        "applicationSubCategory": "Design Collaboration Software",
        "releaseNotes": "Regular updates with new features",
        "screenshot": `${baseUrl}/screenshots/dashboard.png`,
        "softwareVersion": "2.0",
        "author": {
            "@type": "Organization",
            "name": "FeedbackFlow",
            "url": baseUrl
        }
    };

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{title}</title>
            <meta name="title" content={title} />
            <meta name="description" content={description} />
            <meta name="keywords" content="free design feedback, design collaboration tool, free feedback platform, team collaboration software, AI design feedback, version control for designers, design management tool, real-time collaboration, design review tool, free design tool, creative team collaboration, design feedback system, design critique platform" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={`${baseUrl}/social-preview.png`} />
            <meta property="og:site_name" content="FeedbackFlow - Free Design Collaboration" />
            <meta property="og:locale" content="en_US" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={`${baseUrl}/social-preview.png`} />
            <meta property="twitter:creator" content="@feedbackflow" />
            <meta property="twitter:site" content="@feedbackflow" />

            {/* Additional Meta Tags */}
            <meta name="application-name" content="FeedbackFlow" />
            <meta name="apple-mobile-web-app-title" content="FeedbackFlow" />
            <meta name="theme-color" content="#2DD4BF" />
            <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
            <meta name="googlebot" content="index, follow" />
            <meta name="google" content="notranslate" />
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="msapplication-TileColor" content="#2DD4BF" />
            <meta name="msapplication-config" content="/browserconfig.xml" />

            {/* Language and Region */}
            <meta property="og:locale:alternate" content="en_GB" />
            <link rel="alternate" href={url} hreflang="x-default" />
            <link rel="alternate" href={url} hreflang="en" />

            {/* Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>

            {/* Canonical URL */}
            <link rel="canonical" href={url} />

            {/* PWA Tags */}
            <meta name="apple-mobile-web-app-title" content="FeedbackFlow" />
            <link rel="apple-touch-startup-image" href="/splash.png" />
        </Helmet>
    );
};

export default SEOMetadata; 