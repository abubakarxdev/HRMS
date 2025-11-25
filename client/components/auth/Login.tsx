import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import loginBg from '../../assets/login-bg.avif';

const LogoIcon = () => (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        <path d="M19.34 10.34C20.37 11.2 21 12.53 21 14v2h2v-2c0-2.21-1.26-4.14-3.11-5.14l-1.55 1.48zM4.66 10.34l-1.55-1.48C1.26 9.86 0 11.79 0 14v2h2v-2c0-1.47.63-2.8 1.66-3.66z"/>
    </svg>
);

const Login: React.FC = () => {
    const { login } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            // On success, the app state will change and redirect automatically.
        } catch (err: any) {
            setError(err.message || 'Invalid email or password.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900">
                <img 
                    src={loginBg} 
                    alt="Office" 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-16 text-white">
                    <div className="mb-6">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl inline-block mb-4 border border-white/20">
                            <LogoIcon />
                        </div>
                        <h1 className="text-5xl font-bold mb-4 tracking-tight">HRIS Pro</h1>
                        <p className="text-xl text-slate-200 font-light max-w-md leading-relaxed">
                            Empowering your workforce with seamless management and real-time insights.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 bg-slate-50">
                <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
                        <p className="mt-2 text-slate-500">Please enter your details to sign in.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <FormField 
                            id="email"
                            label="Email address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <FormField 
                            id="password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center animate-pulse">
                                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <Button 
                                type="submit" 
                                className="w-full py-3 text-lg shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300" 
                                isLoading={loading}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </div>
                    </form>
                    
                    <div className="text-center mt-6">
                        <p className="text-xs text-slate-400">
                            &copy; {new Date().getFullYear()} HRIS Pro. Secure Login.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
