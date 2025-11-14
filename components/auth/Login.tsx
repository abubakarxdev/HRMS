import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import Input from '../ui/Input';
import Button from '../ui/Button';

const LogoIcon = () => (
    <svg className="h-10 w-10 text-primary-600 mx-auto" viewBox="0 0 24 24" fill="currentColor">
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
        const success = await login(email, password);
        if (!success) {
            setError('Invalid email or password.');
            setLoading(false);
        }
        // On success, the app state will change and redirect automatically.
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 space-y-6">
                <div className="text-center">
                    <LogoIcon />
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                        Sign in to HRIS Pro
                    </h2>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <Input 
                        id="email"
                        label="Email address"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input 
                        id="password"
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </div>
                </form>
                <div className="text-center text-sm text-slate-500 p-4 bg-slate-50 rounded-md border border-slate-200">
                    <p className="font-semibold mb-2">Demo Credentials:</p>
                    <ul className="text-left space-y-1">
                        <li><strong>HR:</strong> hr@example.com / password</li>
                        <li><strong>Manager:</strong> manager@example.com / password</li>
                        <li><strong>Employee:</strong> employee@example.com / password</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Login;
