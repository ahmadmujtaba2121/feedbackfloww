import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiX, FiSettings } from 'react-icons/fi';
import ThemeSwitcher from '../ThemeSwitcher';

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { currentUser, signOut } = useAuth();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Pricing', path: '/pricing' },
    ];

    const linkStyles = {
        base: 'px-3 py-2 rounded-md text-sm font-medium transition-colors',
        active: 'bg-primary/20 text-primary',
        inactive: 'text-secondary-foreground hover:bg-muted'
    };

    return (
        <nav className="fixed w-full z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-primary">FeedbackFlow</h1>
                        </Link>
                        <div className="hidden md:block ml-10">
                            <div className="flex items-center space-x-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`${linkStyles.base} ${isActive(link.path) ? linkStyles.active : linkStyles.inactive}`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <ThemeSwitcher />
                        {currentUser ? (
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={signOut}
                                    className="px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-muted rounded-md transition-colors"
                                >
                                    Sign Out
                                </button>
                                <Link
                                    to="/settings"
                                    className="p-2 text-secondary-foreground hover:bg-muted rounded-md transition-colors"
                                >
                                    <FiSettings className="w-5 h-5" />
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-muted rounded-md transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-accent rounded-md transition-colors"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-secondary-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? (
                                <FiX className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <FiMenu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="px-4 pt-2 pb-3 space-y-2 bg-background border-b border-border">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`block ${linkStyles.base} ${isActive(link.path) ? linkStyles.active : linkStyles.inactive}`}
                            onClick={() => setIsOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="pt-4 pb-2">
                        <div className="flex items-center px-3">
                            <div className="flex-shrink-0">
                                <ThemeSwitcher />
                            </div>
                        </div>
                    </div>
                    {currentUser ? (
                        <div className="space-y-2">
                            <Link
                                to="/settings"
                                className="block px-3 py-2 rounded-md text-sm font-medium text-secondary-foreground hover:bg-muted transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Settings
                            </Link>
                            <button
                                onClick={() => {
                                    signOut();
                                    setIsOpen(false);
                                }}
                                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-secondary-foreground hover:bg-muted transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2 pt-2">
                            <Link
                                to="/login"
                                className="block px-3 py-2 rounded-md text-sm font-medium text-secondary-foreground hover:bg-muted transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/signup"
                                className="block px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-accent transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation; 