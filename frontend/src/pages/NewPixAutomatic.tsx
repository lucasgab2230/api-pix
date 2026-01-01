import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

type FrequencyType = 'daily' | 'weekly' | 'monthly';

export function NewPixAutomatic() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    receiverKey: '',
    amount: '',
    frequency: 'monthly' as FrequencyType,
    dayOfWeek: 1,
    dayOfMonth: 1,
    startDate: new Date().toISOString().split('T')[0],
  });

  const frequencyOptions = [
    { value: 'daily', label: 'Diário' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
  ] as const;

  const dayOfWeekOptions = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const configs = JSON.parse(localStorage.getItem('pix_automatic_configs') || '[]');
    const newConfig = {
      ...formData,
      amount: parseFloat(formData.amount),
      status: 'active' as const,
      totalTransactions: 0,
      totalSent: 0,
    };

    configs.push(newConfig);
    localStorage.setItem('pix_automatic_configs', JSON.stringify(configs));

    navigate('/pix-automatic');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Novo Agendamento PIX Automático
              </h1>
            </div>
          </div>
          <Link
            to="/pix-automatic"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:border-gray-500 dark:hover:bg-gray-800"
          >
            Voltar
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-gray-100">
            Configurar Pagamento Recorrente
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Nome do Agendamento
              </label>
              <input
                type="text"
                placeholder="Ex: Aluguel, Netflix, Internet..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Um nome para identificar este agendamento
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Chave PIX do Destinatário
              </label>
              <input
                type="text"
                placeholder="CPF, E-mail, Telefone ou UUID"
                value={formData.receiverKey}
                onChange={(e) => setFormData({ ...formData, receiverKey: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  placeholder="0,00"
                  step="0.01"
                  min="0.01"
                  max={15000}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  Limite máximo: R$ 15.000,00
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Frequência
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as FrequencyType })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                  required
                >
                  {frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.frequency === 'weekly' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Dia da Semana
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                  required
                >
                  {dayOfWeekOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.frequency === 'monthly' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Dia do Mês
                </label>
                <select
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                  required
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Dia {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Data de Início
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Informações Importantes
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>O pagamento será processado automaticamente na data configurada</li>
                    <li>O saldo da chave PIX deve ser suficiente na data do pagamento</li>
                    <li>Você pode pausar ou cancelar o agendamento a qualquer momento</li>
                    <li>Conforme BACEN Resolução 429/2023</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                <ArrowRight className="mr-2 inline h-4 w-4" />
                Criar Agendamento
              </button>
              <Link
                to="/pix-automatic"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 text-center transition-all hover:border-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:border-gray-500 dark:hover:bg-gray-800"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
