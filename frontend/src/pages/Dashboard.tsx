import { useState, useEffect } from 'react';
import { LogOut, Wallet, ArrowUpRight, ArrowDownLeft, AlertTriangle, CheckCircle, Download, TrendingUp, Bell, Settings, Calendar } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import { pixApi, PixKey, Transaction } from '../lib/api';
import { formatCurrency, BACEN_LIMITS } from '../lib/validators';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { BalanceChart, TransactionVolumeChart, TransactionTypeDistribution } from '../components/Charts';
import { exportToPDF, exportToCSV, generateBalanceReport } from '../lib/export';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isConnected: realtimeConnected, events: realtimeEvents } = useRealtime();
  const [pixKeys, setPixKeys] = useState<PixKey[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (realtimeConnected) {
      realtimeEvents.forEach(event => {
        if (event.type === 'balance' || event.type === 'pix_key') {
          loadPixKeys();
        } else if (event.type === 'transaction') {
          loadTransactions();
        }
      });
    }
  }, [realtimeEvents]);

  const loadData = async () => {
    try {
      const [keysData, transactionsData] = await Promise.all([
        pixApi.getPixKeys(),
        pixApi.getTransactions(),
      ]);

      setPixKeys(keysData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPixKeys = async () => {
    try {
      const data = await pixApi.getPixKeys();
      setPixKeys(data);
    } catch (error) {
      console.error('Error loading PIX keys:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await pixApi.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return transactions.filter(t => new Date(t.createdAt) >= cutoff);
  };

  const getStats = () => {
    const filteredTransactions = getFilteredTransactions();
    const completedTransactions = filteredTransactions.filter(t => t.status === 'completed');
    
    const totalBalance = pixKeys.reduce((sum, key) => sum + key.balance, 0);
    const totalSent = completedTransactions
      .filter(t => t.senderName === user?.user_metadata?.full_name)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalReceived = completedTransactions
      .filter(t => t.receiverName === user?.user_metadata?.full_name)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalBalance,
      totalTransactions: completedTransactions.length,
      totalSent,
      totalReceived,
    };
  };

  const stats = getStats();

  const getBalanceChartData = () => {
    const filteredTransactions = getFilteredTransactions();
    const groupedByDate = new Map<string, { balance: number; sent: number; received: number }>();

    pixKeys.forEach(key => {
      const date = new Date().toISOString().split('T')[0];
      if (!groupedByDate.has(date)) {
        groupedByDate.set(date, { balance: key.balance, sent: 0, received: 0 });
      }
      const current = groupedByDate.get(date)!;
      current.balance += key.balance;
    });

    filteredTransactions.filter(t => t.status === 'completed').forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0];
      if (!groupedByDate.has(date)) {
        groupedByDate.set(date, { balance: 0, sent: 0, received: 0 });
      }
      const current = groupedByDate.get(date)!;
      if (t.senderName === user?.user_metadata?.full_name) {
        current.sent += t.amount;
      } else {
        current.received += t.amount;
      }
    });

    return Array.from(groupedByDate.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('pt-BR'),
        balance: data.balance,
        sent: data.sent,
        received: data.received,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getTransactionVolumeData = () => {
    const filteredTransactions = getFilteredTransactions();
    const completedTransactions = filteredTransactions.filter(t => t.status === 'completed');
    
    const groupedByMonth = new Map<string, { volume: number; transactions: number }>();

    completedTransactions.forEach(t => {
      const month = new Date(t.createdAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
      if (!groupedByMonth.has(month)) {
        groupedByMonth.set(month, { volume: 0, transactions: 0 });
      }
      const current = groupedByMonth.get(month)!;
      current.volume += t.amount;
      current.transactions += 1;
    });

    return Array.from(groupedByMonth.entries())
      .map(([period, data]) => ({
        period,
        volume: data.volume,
        transactions: data.transactions,
      }))
      .slice(-6);
  };

  const getTransactionTypeDistribution = () => {
    const filteredTransactions = getFilteredTransactions();
    const completedTransactions = filteredTransactions.filter(t => t.status === 'completed');

    const sentAmount = completedTransactions
      .filter(t => t.senderName === user?.user_metadata?.full_name)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const receivedAmount = completedTransactions
      .filter(t => t.receiverName === user?.user_metadata?.full_name)
      .reduce((sum, t) => sum + t.amount, 0);

    return [
      { name: 'Enviado', value: sentAmount, color: '#f59e0b' },
      { name: 'Recebido', value: receivedAmount, color: '#22c55e' },
    ];
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await generateBalanceReport(pixKeys, transactions);
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      exportToCSV(transactions);
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <Wallet className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                PIX BaaS
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Olá, {user?.user_metadata?.full_name || 'Usuário'}
                </p>
                {realtimeConnected && (
                  <div className="flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 dark:bg-success-900">
                    <Bell className="h-3 w-3 text-success-600 dark:text-success-400" />
                    <span className="text-xs font-medium text-success-800 dark:text-success-100">
                      Realtime
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/pix-automatic"
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:border-primary-500 dark:hover:bg-gray-900"
            >
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span>PIX Automático</span>
            </Link>
            <Link
              to="/bank-settings"
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:border-primary-500 dark:hover:bg-gray-900"
            >
              <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span>Bancos</span>
            </Link>
            <Link
              to="/transactions"
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:border-primary-500 dark:hover:bg-gray-900"
            >
              <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span>Histórico</span>
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-danger-500 hover:bg-danger-50 dark:border-gray-600 dark:text-gray-100 dark:hover:border-danger-500 dark:hover:bg-danger-900"
            >
              <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Período:
            </span>
            {(['7d', '30d', '90d'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-primary-600 text-white dark:bg-primary-500'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {period === '7d' && '7 dias'}
                {period === '30d' && '30 dias'}
                {period === '90d' && '90 dias'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-100 dark:hover:border-primary-500 dark:hover:bg-gray-900"
            >
              <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span>Relatório PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-100 dark:hover:border-primary-500 dark:hover:bg-gray-900"
            >
              <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span>Extrato CSV</span>
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Saldo Total
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(stats.totalBalance)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-primary-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-success-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Recebido
                </p>
                <p className="mt-2 text-3xl font-bold text-success-600 dark:text-success-400">
                  {formatCurrency(stats.totalReceived)}
                </p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-success-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-warning-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Enviado
                </p>
                <p className="mt-2 text-3xl font-bold text-warning-600 dark:text-warning-400">
                  {formatCurrency(stats.totalSent)}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-warning-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-primary-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Transações
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalTransactions}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary-500" />
            </div>
          </Card>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Histórico de Saldos" className="col-span-1 lg:col-span-2">
            <BalanceChart data={getBalanceChartData()} />
          </Card>

          <Card title="Volume de Transações" className="col-span-1 lg:col-span-1">
            <TransactionVolumeChart data={getTransactionVolumeData()} />
          </Card>

          <Card title="Distribuição por Tipo" className="col-span-1 lg:col-span-1">
            <TransactionTypeDistribution data={getTransactionTypeDistribution()} />
          </Card>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Minhas Chaves PIX">
            {pixKeys.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nenhuma chave PIX cadastrada
                </p>
                <Button
                  className="mt-4"
                  variant="primary"
                  onClick={() => navigate('/pix-keys')}
                >
                  Adicionar Chave PIX
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pixKeys.slice(0, 3).map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {key.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {key.type === 'cpf' && 'CPF'}
                        {key.type === 'email' && 'E-mail'}
                        {key.type === 'phone' && 'Telefone'}
                        {key.type === 'random' && 'Aleatória'}
                        : {key.key}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {key.bank} • {key.account}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {formatCurrency(key.balance)}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          key.active
                            ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100'
                            : 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-100'
                        }`}
                      >
                        {key.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>
                ))}
                {pixKeys.length > 3 && (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => navigate('/pix-keys')}
                  >
                    Ver Todas ({pixKeys.length})
                  </Button>
                )}
              </div>
            )}
          </Card>

          <Card title="Transações Recentes">
            {transactions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nenhuma transação realizada
                </p>
                <Button
                  className="mt-4"
                  variant="primary"
                  onClick={() => navigate('/send-pix')}
                >
                  Fazer PIX
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {getFilteredTransactions().slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          transaction.senderName === user?.user_metadata?.full_name
                            ? 'bg-warning-100 dark:bg-warning-900'
                            : 'bg-success-100 dark:bg-success-900'
                        }`}
                      >
                        {transaction.senderName === user?.user_metadata?.full_name ? (
                          <ArrowUpRight className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                        ) : (
                          <ArrowDownLeft className="h-5 w-5 text-success-600 dark:text-success-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {transaction.senderName === user?.user_metadata?.full_name
                            ? `Para: ${transaction.receiverName}`
                            : `De: ${transaction.senderName}`}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${
                          transaction.senderName === user?.user_metadata?.full_name
                            ? 'text-warning-600 dark:text-warning-400'
                            : 'text-success-600 dark:text-success-400'
                        }`}
                      >
                        {transaction.senderName === user?.user_metadata?.full_name ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          transaction.status === 'completed'
                            ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100'
                            : transaction.status === 'pending'
                            ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-100'
                            : transaction.status === 'failed'
                            ? 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {transaction.status === 'completed' && 'Concluída'}
                        {transaction.status === 'pending' && 'Pendente'}
                        {transaction.status === 'failed' && 'Falhou'}
                        {transaction.status === 'cancelled' && 'Cancelada'}
                      </span>
                    </div>
                  </div>
                ))}
                {transactions.length > 5 && (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => navigate('/transactions')}
                  >
                    Ver Todas
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Limites de Transação (BACEN)
                </p>
                <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                  Diário: {formatCurrency(BACEN_LIMITS.daily)}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Por operação: {formatCurrency(BACEN_LIMITS.single)}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Frequência: {BACEN_LIMITS.frequency} transações/dia
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-success-600 dark:text-success-400" />
              <div>
                <p className="font-medium text-success-900 dark:text-success-100">
                  Sistema Operacional
                </p>
                <p className="mt-1 text-sm text-success-800 dark:text-success-200">
                  SPI: Conectado
                </p>
                <p className="text-sm text-success-800 dark:text-success-200">
                  Realtime: {realtimeConnected ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-start gap-3">
              <Settings className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Configurações Rápidas
                </p>
                <div className="mt-2 space-y-2">
                  <Link
                    to="/pix-keys"
                    className="block text-sm text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400"
                  >
                    Gerenciar Chaves PIX →
                  </Link>
                  <Link
                    to="/pix-automatic"
                    className="block text-sm text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400"
                  >
                    Configurar PIX Automático →
                  </Link>
                  <Link
                    to="/bank-settings"
                    className="block text-sm text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400"
                  >
                    Configurar Bancos e Open Finance →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Conformidade BACEN - Resolução Conjunta nº 16/2025
              </p>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Sistema BaaS em conformidade com regulamentação brasileira. Integração segura com múltiplos bancos e Open Finance para compartilhamento de dados autorizado.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
