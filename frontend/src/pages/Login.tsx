import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';

export function Login() {
  const navigate = useNavigate();
  const { signIn, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            PIX BaaS
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Banking as a Service em conformidade com BACEN
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              error={error}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="•••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Link
              to="/forgot-password"
              className="block text-right text-sm text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400"
            >
              Esqueceu sua senha?
            </Link>

            <Button type="submit" variant="primary" fullWidth loading={loading}>
              Entrar
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Não tem uma conta?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400"
          >
            Criar conta
          </Link>
        </p>

        <div className="rounded-lg bg-blue-50 p-4 text-xs text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
          <p className="font-semibold">
            <Mail className="mr-1 inline h-3 w-3" />
            Sistema em conformidade com BACEN
          </p>
          <p className="mt-1">
            Limites diários: R$ 50.000,00 | Limite por transação: R$ 15.000,00
          </p>
          <p className="mt-1">
            Transações processadas via SPI - Sistema de Pagamentos Instantâneos
          </p>
        </div>
      </div>
    </div>
  );
}
