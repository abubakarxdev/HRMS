import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import loginBg from '../../assets/login-bg.avif';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import FormField from '../ui/FormField';

const LogoIcon = () => (
    <svg className="h-10 w-10 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        <path d="M19.34 10.34C20.37 11.2 21 12.53 21 14v2h2v-2c0-2.21-1.26-4.14-3.11-5.14l-1.55 1.48zM4.66 10.34l-1.55-1.48C1.26 9.86 0 11.79 0 14v2h2v-2c0-1.47.63-2.8 1.66-3.66z"/>
    </svg>
);

const Login: React.FC = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login({ email, password });
            toast.success('Welcome back! Login successful.');
        } catch (err: any) {
            const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Invalid email or password.';
            toast.error(message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50 overflow-hidden">
            {/* Left Side - Image & Branding */}
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden"
            >
                <div className="absolute inset-0 bg-indigo-900/20 z-10 mix-blend-overlay"></div>
                <motion.img 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
                    src={loginBg} 
                    alt="Office" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-20 flex flex-col justify-end p-16 text-white">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="mb-12"
                    >
                        <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl inline-block mb-6 border border-white/10 shadow-2xl">
                            <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                        </div>
                        <h1 className="text-6xl font-bold mb-6 tracking-tight leading-tight">
                            Elevate Your <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Workforce.</span>
                        </h1>
                        <p className="text-xl text-slate-300 font-light max-w-lg leading-relaxed">
                            Experience the next generation of HR management. Seamless, intuitive, and designed for growth.
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 relative">
                <div className="absolute top-0 right-0 p-8">
                     {/* Optional: Language selector or help link could go here */}
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-md space-y-10"
                >
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="bg-indigo-50 p-3 rounded-xl">
                                <LogoIcon />
                            </div>
                        </div>
                        <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                        <p className="mt-3 text-slate-500 text-lg">Please enter your details to sign in.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <FormField
                                id="email"
                                label="Email address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                                className="w-full"
                            />
                            <FormField
                                id="password"
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                                className="w-full"
                            />
                        </div>
                        
                        <Button 
                            type="submit" 
                            className="w-full py-4 text-lg font-semibold rounded-xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 bg-indigo-600 hover:bg-indigo-700" 
                            isLoading={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>
                    
                    <div className="text-center pt-4">
                        <p className="text-sm text-slate-400">
                            &copy; {new Date().getFullYear()} HRIS Pro. All rights reserved.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
