import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheck, FiUsers, FiLayers, FiShield, FiTarget, FiImage, FiFile, FiCpu, FiGitBranch, FiMessageSquare, FiCalendar, FiGrid, FiCode } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-background">
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
                <span className="block text-primary mb-2">Transform</span>
                <span className="block text-secondary-foreground mb-2">Your Design</span>
                <span className="block text-secondary-foreground">Feedback Workflow</span>
              </h1>
            </motion.div>
            <motion.p
              className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto px-4"
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
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg text-base sm:text-lg font-semibold transition-colors flex items-center justify-center hover:bg-accent"
              >
                Get Started Free
                <FiArrowRight className="inline ml-2" />
              </Link>
              <Link
                to="/signin"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-secondary text-secondary-foreground rounded-lg text-base sm:text-lg font-semibold transition-colors flex items-center justify-center hover:bg-muted"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <FiArrowRight className="w-6 h-6 text-primary rotate-90" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-secondary-foreground mb-4">Powerful Features</h2>
            <p className="text-muted-foreground">Everything you need for efficient design collaboration</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-muted rounded-xl border border-border hover:border-primary transition-colors"
              >
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-foreground mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* File Support Section */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-secondary-foreground mb-4">Supported File Types</h2>
            <p className="text-muted-foreground">Work with all your design assets in one place</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {fileTypes.map((type, index) => (
              <motion.div
                key={type.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`p-4 sm:p-6 bg-foreground rounded-xl border border-border hover:border-primary transition-colors text-center ${type.comingSoon ? 'opacity-70' : ''}`}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-muted rounded-xl flex items-center justify-center text-primary mb-4">
                  {type.icon}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-secondary-foreground">{type.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">{type.description}</p>
                {type.comingSoon && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    Coming Soon
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-primary-foreground mb-6 sm:mb-8">
            Ready to Transform Your Design Process?
          </h2>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-foreground text-secondary-foreground rounded-lg text-base sm:text-lg font-semibold hover:bg-muted transition-colors"
          >
            Get Started Free
            <FiArrowRight className="inline ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    title: 'AI-Powered Feedback',
    description: 'Get intelligent suggestions and automated design analysis with our advanced AI assistant.',
    icon: <FiCpu className="w-6 h-6" />,
  },
  {
    title: 'Real-time Collaboration',
    description: 'Work together seamlessly with your team in real-time with live cursors and instant updates.',
    icon: <FiUsers className="w-6 h-6" />,
  },
  {
    title: 'Version Control',
    description: 'Track all design iterations and feedback with powerful version history and branching.',
    icon: <FiGitBranch className="w-6 h-6" />,
  },
  {
    title: 'Smart Comments',
    description: 'Leave contextual feedback directly on designs with our intuitive commenting system.',
    icon: <FiMessageSquare className="w-6 h-6" />,
  },
  {
    title: 'Kanban Board',
    description: 'Organize tasks and track progress with customizable Kanban boards.',
    icon: <FiGrid className="w-6 h-6" />,
  },
  {
    title: 'Calendar View',
    description: 'Schedule and manage deadlines with integrated calendar functionality.',
    icon: <FiCalendar className="w-6 h-6" />,
  },
  {
    title: 'Asset Management',
    description: 'Organize and manage all your design files and assets in a centralized workspace.',
    icon: <FiLayers className="w-6 h-6" />,
  },
  {
    title: 'Enterprise Security',
    description: 'Keep your designs secure with enterprise-grade security and access controls.',
    icon: <FiShield className="w-6 h-6" />,
  },
];

const fileTypes = [
  {
    name: "PNG Files",
    description: "High-quality raster images",
    icon: <FiImage className="w-6 h-6 sm:w-8 sm:h-8" />
  },
  {
    name: "JPEG Files",
    description: "Compressed image format",
    icon: <FiImage className="w-6 h-6 sm:w-8 sm:h-8" />
  },
  {
    name: "SVG Files",
    description: "Vector graphics",
    icon: <FiImage className="w-6 h-6 sm:w-8 sm:h-8" />
  },
  {
    name: "PDF Files",
    description: "Coming Soon - Advanced document support",
    icon: <FiFile className="w-6 h-6 sm:w-8 sm:h-8" />,
    comingSoon: true
  },
  {
    name: "PSD Files",
    description: "Coming Soon - Photoshop integration",
    icon: <FiLayers className="w-6 h-6 sm:w-8 sm:h-8" />,
    comingSoon: true
  },
  {
    name: "AI Files",
    description: "Coming Soon - Illustrator support",
    icon: <FiLayers className="w-6 h-6 sm:w-8 sm:h-8" />,
    comingSoon: true
  },
  {
    name: "Custom Code",
    description: "Support for various code files",
    icon: <FiCode className="w-6 h-6 sm:w-8 sm:h-8" />
  }
];

export default HomePage;