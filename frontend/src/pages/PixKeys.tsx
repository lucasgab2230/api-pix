import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, Trash2, Eye, EyeOff } from 'lucide-react';
import { pixApi, PixKey } from '../lib/api';
import { validatePixKey, validateBankAccount, validateAgency, maskCPF, maskPhone, generateUUID } from '../lib/validators';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { formatCurrency } from '../lib/validators';

type PixKeyType = 'cpf' | 'email' | 'phone' | 'random';

export function PixKeys() {
  const navigate = useNavigate();
  const [pixKeys, setPixKeys] = useState<PixKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'cpf' as PixKeyType,
    key: '',
    name: '',
    bank: '',
    account: '',
    agency: '',
    initialBalance: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPixKeys();
  }, []);

  const loadPixKeys = async () => {
    try {
      const data = await pixApi.getPixKeys();
      setPixKeys(data);
    } catch (error) {
      console.error('Error loading PIX keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.bank.trim()) {
      newErrors.bank = 'Banco é obrigatório';
    }

    const accountValid = validateBankAccount(formData.account);
    if (!accountValid.valid) {
      newErrors.account = accountValid.error || 'Conta inválida';
    }

    const agencyValid = validateAgency(formData.agency);
    if (!agencyValid.valid) {
      newErrors.agency = agencyValid.error || 'Agência inválida';
    }

    const keyValid = validatePixKey(formData.type, formData.key);
    if (!keyValid.valid) {
      newErrors.key = keyValid.error || 'Chave PIX inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await pixApi.createPixKey(formData);
      setShowForm(false);
      setFormData({
        type: 'cpf',
        key: '',
        name: '',
        bank: '',
        account: '',
        agency: '',
        initialBalance: 0,
      });
      setErrors({});
      loadPixKeys();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Erro ao criar chave PIX' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKey = async (key: string) => {
    if (!confirm('Tem certeza que deseja desativar esta chave PIX?')) return;

    try {
      await pixApi.deletePixKey(key);
      loadPixKeys();
    } catch (error) {
      console.error('Error deleting PIX key:', error);
      alert('Erro ao desativar chave PIX');
    }
  };

  const handleKeyTypeChange = (type: PixKeyType) => {
    setFormData({ ...formData, type });
    setErrors({ ...errors, key: '' });
  };

  const handleKeyChange = (value: string) => {
    let masked = value;
    if (formData.type === 'cpf') {
      masked = maskCPF(value);
    } else if (formData.type === 'phone') {
      masked = maskPhone(value);
    } else if (formData.type === 'random') {
      masked = value;
    }
    setFormData({ ...formData, key: masked });
    setErrors({ ...errors, key: '' });
  };

  const generateRandomKey = () => {
    setFormData({ ...formData, key: generateUUID() });
    setErrors({ ...errors, key: '' });
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
            Minhas Chaves PIX
          </h1>
          <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
            Voltar
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {!showForm && (
          <div className="mb-6 flex justify-end">
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Chave PIX
            </Button>
          </div>
        )}

        {showForm && (
          <Card className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Tipo de Chave
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(['cpf', 'email', 'phone', 'random'] as PixKeyType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleKeyTypeChange(type)}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                        formData.type === type
                          ? 'border-primary-500 bg-primary-50 text-primary-900 dark:bg-primary-900/20 dark:text-primary-100'
                          : 'border-gray-300 bg-white text-gray-900 hover:border-primary-500 hover:bg-primary-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-primary-500 dark:hover:bg-primary-900/20'
                      }`}
                    >
                      {type === 'cpf' && 'CPF'}
                      {type === 'email' && 'E-mail'}
                      {type === 'phone' && 'Telefone'}
                      {type === 'random' && 'Aleatória'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={formData.type === 'cpf' ? 'CPF' : formData.type === 'email' ? 'E-mail' : formData.type === 'phone' ? 'Telefone (+55)' : 'Chave UUID'}
                  type="text"
                  placeholder={formData.type === 'cpf' ? '000.000.000-00' : formData.type === 'email' ? 'seu@email.com' : formData.type === 'phone' ? '+55 (11) 99999-9999' : 'UUID v4'}
                  value={formData.key}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  required
                  helperText={
                    formData.type === 'random' && (
                      <button
                        type="button"
                        onClick={generateRandomKey}
                        className="mt-2 text-sm text-primary-600 hover:underline dark:text-primary-500"
                      >
                        Gerar chave aleatória
                      </button>
                    )
                  }
                  error={errors.key}
                />

                <Input
                  label="Nome do Titular"
                  type="text"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  error={errors.name}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Banco"
                  type="text"
                  placeholder="Ex: Nubank, Banco do Brasil"
                  value={formData.bank}
                  onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  required
                  error={errors.bank}
                />

                <Input
                  label="Agência"
                  type="text"
                  placeholder="0001"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  required
                  error={errors.agency}
                />
              </div>

              <Input
                label="Conta"
                type="text"
                placeholder="12345-6"
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                required
                error={errors.account}
              />

              <Input
                label="Saldo Inicial (Opcional)"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={formData.initialBalance || ''}
                onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
                helperText="Saldo inicial para testar transações"
              />

              {errors.submit && (
                <div className="rounded-lg bg-danger-50 p-4 text-sm text-danger-900 dark:bg-danger-900/20 dark:text-danger-100">
                  {errors.submit}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  fullWidth
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Criar Chave PIX
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pixKeys.map((pixKey) => (
            <Card key={pixKey.id} className="relative">
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      pixKey.active
                        ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100'
                        : 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-100'
                    }`}
                  >
                    {pixKey.active ? 'Ativa' : 'Inativa'}
                  </span>
                  <button
                    onClick={() => handleDeleteKey(pixKey.key)}
                    className="text-gray-400 hover:text-danger-600 dark:hover:text-danger-400"
                    disabled={!pixKey.active}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {pixKey.name}
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Tipo
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {pixKey.type === 'cpf' && 'CPF'}
                    {pixKey.type === 'email' && 'E-mail'}
                    {pixKey.type === 'phone' && 'Telefone'}
                    {pixKey.type === 'random' && 'Aleatória'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Chave
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {pixKey.key}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Banco
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {pixKey.bank}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Conta
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {pixKey.account}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Saldo Atual
                  </span>
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(pixKey.balance)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/pix-keys/${pixKey.id}`)}
                >
                  Ver Detalhes
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/send-pix?key=${pixKey.key}`)}
                  disabled={!pixKey.active}
                >
                  Enviar PIX
                </Button>
              </div>
            </Card>
          ))}

          {pixKeys.length === 0 && !showForm && (
            <div className="col-span-full py-12 text-center">
              <CreditCard className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Nenhuma chave PIX cadastrada
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Adicione sua primeira chave PIX para começar a usar o sistema
              </p>
              <Button
                className="mt-4"
                variant="primary"
                onClick={() => setShowForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Chave PIX
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
