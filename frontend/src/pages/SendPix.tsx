import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { pixApi, PixKey } from '../lib/api';
import { validatePixKey, validateAmount, formatCurrency, BACEN_LIMITS, checkAMLTransaction } from '../lib/validators';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';

export function SendPix() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pixKeys, setPixKeys] = useState<PixKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [searchingKey, setSearchingKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    senderKey: searchParams.get('key') || '',
    receiverKey: '',
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiverInfo, setReceiverInfo] = useState<PixKey | null>(null);
  const [amlWarnings, setAmlWarnings] = useState<string[]>([]);

  useEffect(() => {
    loadPixKeys();
  }, []);

  const loadPixKeys = async () => {
    try {
      const data = await pixApi.getPixKeys();
      setPixKeys(data);
      if (data.length === 1 && !formData.senderKey) {
        setFormData({ ...formData, senderKey: data[0].key });
      }
    } catch (error) {
      console.error('Error loading PIX keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKey = async () => {
    if (!formData.receiverKey) {
      setErrors({ ...errors, receiverKey: 'Informe a chave PIX do destinatário' });
      return;
    }

    setSearchingKey(true);
    setErrors({ ...errors, receiverKey: '' });
    setReceiverInfo(null);

    try {
      const data = await pixApi.getPixKey(formData.receiverKey);
      setReceiverInfo(data);
      setStep(2);
    } catch (error: any) {
      setErrors({ ...errors, receiverKey: error.message || 'Chave PIX não encontrada' });
    } finally {
      setSearchingKey(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value);
    setFormData({ ...formData, amount: value });
    setErrors({ ...errors, amount: '' });

    if (!isNaN(amount)) {
      const amlCheck = checkAMLTransaction(amount, 0, 0);
      setAmlWarnings(amlCheck.warnings);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.senderKey) {
      newErrors.senderKey = 'Selecione sua chave PIX';
    }

    if (!formData.receiverKey) {
      newErrors.receiverKey = 'Informe a chave PIX do destinatário';
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      newErrors.amount = 'Valor inválido';
    } else {
      const amountValid = validateAmount(amount);
      if (!amountValid.valid) {
        newErrors.amount = amountValid.error || 'Valor inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (formData.senderKey === formData.receiverKey) {
      setErrors({ ...errors, receiverKey: 'Não é possível enviar para a mesma chave' });
      return;
    }

    setSubmitting(true);
    try {
      const transaction = await pixApi.createTransaction({
        senderKey: formData.senderKey,
        receiverKey: formData.receiverKey,
        amount: parseFloat(formData.amount),
        description: formData.description,
      });
      navigate(`/transactions/${transaction.id}`, { replace: true });
    } catch (error: any) {
      setErrors({ ...errors, submit: error.message || 'Erro ao criar transação' });
    } finally {
      setSubmitting(false);
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
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Enviar PIX
          </h1>
          <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
            Cancelar
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card className="mb-8">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
              Sua Chave PIX
            </label>
            <select
              value={formData.senderKey}
              onChange={(e) => setFormData({ ...formData, senderKey: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500"
              required
            >
              <option value="">Selecione uma chave...</option>
              {pixKeys.map((key) => (
                <option key={key.id} value={key.key} disabled={!key.active}>
                  {key.name} ({key.type}: {key.key}) - Saldo: {formatCurrency(key.balance)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
              Chave PIX do Destinatário
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                value={formData.receiverKey}
                onChange={(e) => {
                  setFormData({ ...formData, receiverKey: e.target.value });
                  setReceiverInfo(null);
                  setErrors({ ...errors, receiverKey: '' });
                }}
                required
                error={errors.receiverKey}
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={handleSearchKey}
                loading={searchingKey}
                disabled={!formData.receiverKey}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {receiverInfo && (
            <div className="mb-6 rounded-lg bg-success-50 p-4 dark:bg-success-900/20">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-success-600 dark:text-success-400" />
                <div>
                  <p className="font-medium text-success-900 dark:text-success-100">
                    Destinatário Encontrado
                  </p>
                  <p className="text-sm text-success-800 dark:text-success-200">
                    {receiverInfo.name} • {receiverInfo.bank} • {receiverInfo.account}
                  </p>
                  <p className="text-xs text-success-700 dark:text-success-300">
                    Chave: {receiverInfo.key}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Input
            label="Valor (R$)"
            type="number"
            placeholder="0,00"
            step="0.01"
            min="0.01"
            max={BACEN_LIMITS.single}
            value={formData.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            required
            error={errors.amount}
            helperText={`Limite por transação: ${formatCurrency(BACEN_LIMITS.single)}`}
          />

          {amlWarnings.length > 0 && (
            <div className="mb-6 rounded-lg bg-warning-50 p-4 dark:bg-warning-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning-600 dark:text-warning-400" />
                <div>
                  <p className="font-medium text-warning-900 dark:text-warning-100">
                    Alertas de Compliance
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-warning-800 dark:text-warning-200">
                    {amlWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Pagamento de aluguel, Divida, etc."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500"
              rows={3}
              maxLength={140}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              {formData.description.length}/140 caracteres
            </p>
          </div>

          {errors.submit && (
            <div className="mb-6 rounded-lg bg-danger-50 p-4 text-sm text-danger-900 dark:bg-danger-900/20 dark:text-danger-100">
              {errors.submit}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={submitting}
            onClick={handleSubmit}
            disabled={!receiverInfo}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Confirmar Envio
          </Button>
        </Card>

        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Informações Importantes
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>Verifique cuidadosamente a chave PIX do destinatário</li>
                <li>Transações são processadas instantaneamente via SPI</li>
                <li>Após a confirmação, a transação não pode ser estornada automaticamente</li>
                <li>Limite diário: {formatCurrency(BACEN_LIMITS.daily)} | Limite por operação: {formatCurrency(BACEN_LIMITS.single)}</li>
                <li>Transações são monitoradas para prevenir fraudes (AML)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
