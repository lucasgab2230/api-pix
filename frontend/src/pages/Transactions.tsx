import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Clock, XCircle, CheckCircle, Filter, Download } from 'lucide-react';
import { pixApi, Transaction } from '../lib/api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { formatCurrency } from '../lib/validators';

type FilterType = 'all' | 'completed' | 'pending' | 'failed' | 'cancelled';

export function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await pixApi.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-warning-600 dark:text-warning-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-danger-600 dark:text-danger-400" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusClass = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100';
      case 'pending':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-100';
      case 'failed':
        return 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-100';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Histórico de Transações
          </h1>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
              Voltar
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Filtrar:
              </span>
              <div className="flex gap-2">
                {(['all', 'completed', 'pending', 'failed', 'cancelled'] as FilterType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      filter === type
                        ? 'bg-primary-600 text-white dark:bg-primary-500'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type === 'all' && 'Todas'}
                    {type === 'completed' && 'Concluídas'}
                    {type === 'pending' && 'Pendentes'}
                    {type === 'failed' && 'Falharam'}
                    {type === 'cancelled' && 'Canceladas'}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="secondary" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </Card>

        {sortedTransactions.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <Clock className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Nenhuma transação encontrada
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {filter === 'all'
                  ? 'Você ainda não realizou nenhuma transação'
                  : `Nenhuma transação com status "${getStatusText(filter)}"`
                }
              </p>
              <Button
                className="mt-4"
                variant="primary"
                onClick={() => navigate('/send-pix')}
              >
                Fazer Primeiro PIX
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedTransactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate(`/transactions/${transaction.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                      transaction.senderKey === transaction.receiverKey
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'bg-primary-100 dark:bg-primary-900'
                    }`}>
                      {getStatusIcon(transaction.status)}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {transaction.description || 'Transação PIX'}
                        </h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(transaction.status)}`}>
                          {getStatusText(transaction.status)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium text-gray-900 dark:text-gray-100">De:</span> {transaction.senderName}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Para:</span> {transaction.receiverName}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Chave:</span> {transaction.receiverKey}
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString('pt-BR', {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      transaction.senderKey === transaction.receiverKey
                        ? 'text-gray-400'
                        : 'text-primary-600 dark:text-primary-400'
                    }`}>
                      {transaction.senderKey === transaction.receiverKey ? '-' : ''}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
