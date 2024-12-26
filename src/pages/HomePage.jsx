import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheck, FiUsers, FiLayers, FiShield, FiTarget, FiImage, FiFile, FiCpu, FiGitBranch, FiMessageSquare, FiCode } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    const features = [
        {
            title: 'AI-Powered Feedback',
            description: 'Get intelligent suggestions and automated design analysis with our advanced AI assistant that learns from your team\'s preferences.',
            icon: <FiCpu className="w-6 h-6" />,
        },
        {
            title: 'Real-time Collaboration',
            description: 'Work together seamlessly with your team in real-time with live cursors, instant updates, and synchronized viewing.',
            icon: <FiUsers className="w-6 h-6" />,
        },
        {
            title: 'Version Control',
            description: 'Track all design iterations with powerful version history, branching, and merge capabilities for complete design evolution.',
            icon: <FiGitBranch className="w-6 h-6" />,
        },
        {
            title: 'Smart Comments',
            description: 'Leave contextual feedback with AI-enhanced annotations, voice notes, and automatic tagging system.',
            icon: <FiMessageSquare className="w-6 h-6" />,
        },
        {
            title: 'Asset Management',
            description: 'Organize designs with smart folders, tags, and AI-powered search across your entire design library.',
            icon: <FiLayers className="w-6 h-6" />,
        },
        {
            title: 'Enterprise Security',
            description: 'Bank-grade encryption, SSO integration, and granular access controls for enterprise-level security.',
            icon: <FiShield className="w-6 h-6" />,
        },
        {
            title: 'Design System Integration',
            description: 'Seamlessly integrate with your existing design system and maintain consistency across projects.',
            icon: <FiCode className="w-6 h-6" />,
        },
        {
            title: 'Analytics Dashboard',
            description: 'Track feedback metrics, team performance, and project progress with detailed analytics.',
            icon: <FiTarget className="w-6 h-6" />,
        }
    ];

    const pricingPlans = [
        {
            name: 'Free',
            price: '$0',
            features: [
                'Up to 3 projects',
                'Basic collaboration',
                'File support up to 50MB',
                'Community support'
            ]
        },
        {
            name: 'Pro',
            price: '$15',
            features: [
                'Unlimited projects',
                'Advanced collaboration',
                'File support up to 250MB',
                'Priority support',
                'Version history',
                'Custom workflows'
            ]
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            features: [
                'Everything in Pro',
                'SSO Integration',
                'Advanced security',
                'Custom contracts',
                'Dedicated support',
                'Custom training'
            ]
        }
    ];

    const integrations = [
        {
            name: 'Figma',
            description: 'Direct integration with Figma files'
        },
        {
            name: 'Adobe Creative Cloud',
            description: 'Seamless workflow with Adobe apps'
        },
        {
            name: 'Sketch',
            description: 'Native support for Sketch files'
        },
        {
            name: 'Slack',
            description: 'Real-time notifications and updates'
        }
    ];

    const fileTypes = [
        {
            name: "PNG Files",
            description: "High-quality raster images",
            icon: <FiImage className="w-8 h-8 text-[#2DD4BF]" />
        },
        {
            name: "JPEG Files",
            description: "Compressed image format",
            icon: <FiImage className="w-8 h-8 text-[#2DD4BF]" />
        },
        {
            name: "PDF Files",
            description: "Document layouts",
            icon: <FiFile className="w-8 h-8 text-[#2DD4BF]" />
        },
        {
            name: "PSD Files",
            description: "Photoshop documents",
            icon: <FiLayers className="w-8 h-8 text-[#2DD4BF]" />
        },
        {
            name: "AI Files",
            description: "Illustrator artwork",
            icon: <FiLayers className="w-8 h-8 text-[#2DD4BF]" />
        },
        {
            name: "SVG Files",
            description: "Vector graphics",
            icon: <FiImage className="w-8 h-8 text-[#2DD4BF]" />
        }
    ];

    const faqs = [
        {
            question: "How does FeedbackFlow work?",
            answer: "FeedbackFlow provides a collaborative platform where teams can upload designs, leave contextual feedback, track versions, and manage design iterations. With real-time collaboration features and AI-powered insights, it streamlines the entire design feedback process from initial concepts to final approval."
        },
        {
            question: "Can I use FeedbackFlow with my existing tools?",
            answer: "Yes! FeedbackFlow integrates seamlessly with popular design tools like Figma, Adobe Creative Cloud, and Sketch. We support various file formats including PNG, JPEG, PDF, PSD, AI, and SVG files. Our platform also integrates with project management tools and communication platforms like Slack for a smooth workflow."
        },
        {
            question: "Is my data secure with FeedbackFlow?",
            answer: "Absolutely. We implement enterprise-grade security measures, including bank-level encryption, SSO integration, secure file transfer, and role-based access controls. All data is stored in secure, redundant cloud infrastructure with regular backups and 99.9% uptime guarantee."
        },
        {
            question: "What makes FeedbackFlow different?",
            answer: "FeedbackFlow combines real-time collaboration, AI-powered insights, and intuitive design tools in one platform. Our unique approach includes features like voice annotations, AI-assisted feedback, automated design analysis, and comprehensive version control, making the design review process more efficient and enjoyable."
        },
        {
            question: "How does the AI feedback assistant work?",
            answer: "Our AI assistant analyzes designs based on design principles, brand guidelines, and your team's historical feedback patterns. It can suggest improvements, identify inconsistencies, and even predict potential usability issues. The AI learns from your team's preferences over time, making its suggestions increasingly relevant."
        },
        {
            question: "What kind of support do you offer?",
            answer: "We offer tiered support based on your plan. Free users get community support and documentation access. Pro users receive priority email support with 24-hour response time. Enterprise customers get dedicated support managers, custom training sessions, and immediate assistance for critical issues."
        }
    ];

    return (
        <div className="min-h-screen bg-[#080C14]">
            {/* Hero Section */}
            <section className="relative min-h-[100vh] flex flex-col justify-center items-center">
                <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div
                            className="mb-6 sm:mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                                <span className="block text-[#2DD4BF] mb-2">Transform</span>
                                <span className="block text-white mb-2">Your Design</span>
                                <span className="block text-white">Feedback Workflow</span>
                            </h1>
                        </motion.div>
                        <motion.p
                            className="text-base sm:text-lg md:text-xl text-[#94A3B8] mb-8 sm:mb-12 max-w-3xl mx-auto px-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            Streamline your design feedback process with our powerful collaboration platform.
                            Real-time comments, version control, and intuitive canvas tools all in one place.
                        </motion.p>
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 justify-center px-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <Link
                                to="/signup"
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#2DD4BF] text-[#080C14] rounded-lg text-base sm:text-lg font-semibold transition-colors flex items-center justify-center hover:bg-[#2DD4BF]/90"
                            >
                                Get Started Free
                                <FiArrowRight className="inline ml-2" />
                            </Link>
                            <Link
                                to="/signin"
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#1B2B44] text-white rounded-lg text-base sm:text-lg font-semibold transition-colors flex items-center justify-center hover:bg-[#1B2B44]/90"
                            >
                                Sign In
                            </Link>
                        </motion.div>
                    </div>
                </div>

                {/* Background Elements */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                    <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-[#2DD4BF]/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
                    <div className="absolute top-1/3 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-[#2DD4BF]/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000" />
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <FiArrowRight className="w-6 h-6 text-[#2DD4BF] rotate-90" />
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="py-16 sm:py-20 bg-[#0A1628]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Powerful Features</h2>
                        <p className="text-[#94A3B8]">Everything you need for efficient design collaboration</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="p-6 bg-[#080C14] rounded-xl border border-[#1B2B44] hover:border-[#2DD4BF] transition-colors"
                            >
                                <div className="w-12 h-12 bg-[#2DD4BF] rounded-lg flex items-center justify-center text-[#080C14] mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                <p className="text-sm sm:text-base text-[#94A3B8]">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* File Support Section */}
            <section className="py-16 sm:py-20 bg-[#080C14]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Supported File Types</h2>
                        <p className="text-[#94A3B8]">Work with all your design assets in one place</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-8">
                        {fileTypes.map((type, index) => (
                            <motion.div
                                key={type.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="p-6 bg-[#0A1628] rounded-xl border border-[#1B2B44] hover:border-[#2DD4BF] transition-colors text-center"
                            >
                                <div className="w-16 h-16 mx-auto bg-[#0A1628] rounded-xl flex items-center justify-center mb-4">
                                    {type.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{type.name}</h3>
                                <p className="text-sm text-[#94A3B8]">{type.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Add Pricing Section before FAQ */}
            <section className="py-16 sm:py-20 bg-[#080C14]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Simple Pricing</h2>
                        <p className="text-[#94A3B8]">Choose the plan that's right for your team</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {pricingPlans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="p-6 bg-[#0A1628] rounded-xl border border-[#1B2B44] hover:border-[#2DD4BF] transition-colors"
                            >
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-3xl font-bold text-[#2DD4BF] mb-6">{plan.price}</p>
                                <ul className="space-y-3">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center text-[#94A3B8]">
                                            <FiCheck className="w-5 h-5 text-[#2DD4BF] mr-2" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to="/signup"
                                    className="mt-6 w-full inline-block px-6 py-3 bg-[#2DD4BF] text-[#080C14] rounded-lg text-center font-semibold hover:bg-[#2DD4BF]/90 transition-colors"
                                >
                                    Get Started
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Add Integrations Section before Pricing */}
            <section className="py-16 sm:py-20 bg-[#0A1628]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Seamless Integrations</h2>
                        <p className="text-[#94A3B8]">Works with your favorite design tools</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {integrations.map((integration, index) => (
                            <motion.div
                                key={integration.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="p-6 bg-[#080C14] rounded-xl border border-[#1B2B44] hover:border-[#2DD4BF] transition-colors text-center"
                            >
                                <h3 className="text-lg font-semibold text-white mb-2">{integration.name}</h3>
                                <p className="text-sm text-[#94A3B8]">{integration.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 sm:py-20 bg-[#0A1628]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
                        <p className="text-[#94A3B8]">Everything you need to know about FeedbackFlow</p>
                    </div>
                    <div className="max-w-3xl mx-auto">
                        <div className="space-y-8">
                            {faqs.map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="bg-[#080C14] rounded-xl p-6 border border-[#1B2B44] hover:border-[#2DD4BF] transition-colors"
                                >
                                    <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
                                    <p className="text-[#94A3B8]">{faq.answer}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 sm:py-20 bg-gradient-to-r from-[#2DD4BF] to-[#2DD4BF]/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl sm:text-4xl font-bold text-[#080C14] mb-6 sm:mb-8">
                        Ready to Transform Your Design Process?
                    </h2>
                    <Link
                        to="/signup"
                        className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#080C14] text-white rounded-lg text-base sm:text-lg font-semibold hover:bg-[#0A1628] transition-colors"
                    >
                        Get Started Free
                        <FiArrowRight className="inline ml-2" />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default HomePage; 