import { useState } from 'react';
import { Building2, Check, Globe, Lock, RefreshCw, ArrowRight, Trash2, AlertTriangle } from 'lucide-react';
import {
  AVAILABLE_BANKS,
  getBankConfig,
  saveBankConfig,
  getBankById,
  requestOpenFinanceConsent,
  revokeOpenFinanceConsent,
  getOpenFinanceConsent,
  OPEN_FINANCE_SCOPES,
  syncOpenFinanceData,
  type OpenFinanceConsent,
} from '../lib/banks';

interface BankSettingsProps {
  onBack?: () => void;
}

export function BankSettings({ onBack }: BankSettingsProps) {
  const [config, setConfig] = useState(getBankConfig());
  const [selectedBanks, setSelectedBanks] = useState<string[]>(config.allowedBanks);
  const [openFinanceEnabled, setOpenFinanceEnabled] = useState(config.enableOpenFinance);
  const [openFinanceConsent, setOpenFinanceConsent] = useState<OpenFinanceConsent | null>(getOpenFinanceConsent());
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleToggleBank = (bankId: string) => {
    const newSelectedBanks = selectedBanks.includes(bankId)
      ? selectedBanks.filter(id => id !== bankId)
      : [...selectedBanks, bankId];
    
    setSelectedBanks(newSelectedBanks);
    saveBankConfig({ allowedBanks: newSelectedBanks });
  };

  const handleSetDefaultBank = (bankId: string) => {
    saveBankConfig({ defaultBank: bankId });
    setConfig({ ...config, defaultBank: bankId });
  };

  const handleToggleOpenFinance = () => {
    if (!openFinanceEnabled) {
      const scopes = [OPEN_FINANCE_SCOPES.ACCOUNTS, OPEN_FINANCE_SCOPES.TRANSACTIONS, OPEN_FINANCE_SCOPES.PIX_KEYS];
      requestOpenFinanceConsent(scopes).then(consent => {
        setOpenFinanceConsent(consent);
        saveBankConfig({ enableOpenFinance: true });
        setOpenFinanceEnabled(true);
      });
    } else {
      revokeOpenFinanceConsent();
      setOpenFinanceConsent(null);
      saveBankConfig({ enableOpenFinance: false });
      setOpenFinanceEnabled(false);
    }
  };

  const handleSyncOpenFinance = async () => {
    setSyncing(true);
    setSyncMessage('');

    const result = await syncOpenFinanceData();
    setSyncMessage(result.message);
    setSyncing(false);
    
    setTimeout(() => setSyncMessage(''), 5000);
  };

  const handleRevokeConsent = () => {
    if (confirm('Tem certeza que deseja revogar o consentimento Open Finance? Isso interromperá o compartilhamento de dados.')) {
      revokeOpenFinanceConsent();
      setOpenFinanceConsent(null);
      saveBankConfig({ enableOpenFinance: false });
      setOpenFinanceEnabled(false);
    }
  };

  const activeBanks = AVAILABLE_BANKS.filter(bank => selectedBanks.includes(bank.id));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Configurações de Bancos
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Gerencie suas contas bancárias
              </p>
            </div>
          </div>
          {onBack && (
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition-all hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Voltar
          </button>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            Bancos Disponíveis
          </h2>
          
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Banco Padrão: {getBankById(config.defaultBank)?.name || 'Não definido'}
            </p>
            <select
              value={config.defaultBank}
              onChange={(e) => handleSetDefaultBank(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500"
            >
              {activeBanks.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_BANKS.filter(bank => bank.active).map(bank => (
              <div
                key={bank.id}
                className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  selectedBanks.includes(bank.id)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
                onClick={() => handleToggleBank(bank.id)}
              >
                {selectedBanks.includes(bank.id) && (
                  <div className="absolute right-4 top-4">
                    <Check className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                )}

                <div className="mb-3">
                  <div
                    className="mb-2 inline-block rounded-lg px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: bank.color }}
                  >
                    {bank.code}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {bank.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    ISPB: {bank.ispb}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Lock className="h-4 w-4 text-success-600 dark:text-success-400" />
                    <span className="text-gray-900 dark:text-gray-100">
                      Integração Segura
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success-600 dark:text-success-400" />
                    <span className="text-gray-900 dark:text-gray-100">
                      PIX Ativo
                    </span>
                  </div>
                  {selectedBanks.includes(bank.id) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success-600 dark:text-success-400" />
                      <span className="text-gray-900 dark:text-gray-100">
                        Conta Conectada
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              <strong>Bancos selecionados:</strong> {activeBanks.length} de {AVAILABLE_BANKS.length} disponíveis
            </p>
            <p>Clique em um banco para conectar ou desconectar sua conta</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Globe className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            Open Finance Brasil
          </h2>

          <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Integração com Open Finance
                </p>
                <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                  O Open Finance permite compartilhar seus dados bancários de forma segura com terceiros autorizados, em conformidade com as diretrizes do BACEN.
                </p>
              </div>
            </div>
          </div>

          {openFinanceConsent ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-success-50 p-4 dark:bg-success-900/20">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-success-600 dark:text-success-400" />
                  <div>
                    <p className="font-medium text-success-900 dark:text-success-100">
                      Consentimento Ativo
                    </p>
                    <p className="mt-1 text-sm text-success-800 dark:text-success-200">
                      Data de consentimento: {openFinanceConsent.dataSharing.consentDate ? new Date(openFinanceConsent.dataSharing.consentDate).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                    <p className="mt-1 text-sm text-success-800 dark:text-success-200">
                      Escopos autorizados:
                    </p>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-success-800 dark:text-success-200">
                      {openFinanceConsent.dataSharing.scopes.map((scope, index) => (
                        <li key={index}>{scope}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  onClick={handleSyncOpenFinance}
                  disabled={syncing}
                  className="rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  {syncing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sincronizando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Sincronizar Dados
                    </span>
                  )}
                </button>

                <button
                  onClick={handleRevokeConsent}
                  className="rounded-lg bg-danger-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-danger-700 dark:bg-danger-500 dark:hover:bg-danger-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Revogar Consentimento
                </button>
              </div>

              {syncMessage && (
                <div className={`rounded-lg p-4 text-sm ${
                  syncMessage.includes('sucesso')
                    ? 'bg-success-50 text-success-900 dark:bg-success-900/20 dark:text-success-100'
                    : 'bg-danger-50 text-danger-900 dark:bg-danger-900/20 dark:text-danger-100'
                }`}>
                  {syncMessage}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                    Ativar Compartilhamento
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Permite que apps e serviços autorizados acessem seus dados bancários de forma segura
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success-600 dark:text-success-400" />
                      <span className="text-gray-900 dark:text-gray-100">
                        Contas bancárias
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success-600 dark:text-success-400" />
                      <span className="text-gray-900 dark:text-gray-100">
                        Histórico de transações
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success-600 dark:text-success-400" />
                      <span className="text-gray-900 dark:text-gray-100">
                        Chaves PIX
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success-600 dark:text-success-400" />
                      <span className="text-gray-900 dark:text-gray-100">
                        Saldo em tempo real
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Status: Desativado
                    </span>
                    <button
                      onClick={handleToggleOpenFinance}
                      className="rounded-full border-2 border-primary-500 bg-white px-4 py-2 text-sm font-medium text-primary-600 transition-all hover:bg-primary-50 dark:border-gray-600 dark:bg-gray-800 dark:text-primary-400 dark:hover:bg-gray-900"
                    >
                      Ativar
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggleOpenFinance}
                className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Configurar Open Finance
              </button>
            </div>
          )}

          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <p className="font-semibold mb-2">
              Conformidade BACEN - Resolução Conjunta nº 16/2025
            </p>
            <ul className="space-y-1">
              <li>• Integração segura com múltiplos bancos via APIs autenticadas</li>
              <li>• Compartilhamento controlado de dados via Open Finance</li>
              <li>• Consentimento explícito do usuário para compartilhamento</li>
              <li>• Criptografia de ponta a ponta em todas as transações</li>
              <li>• Auditoria de acesso e rastreabilidade de dados</li>
              <li>• Conformidade com LGPD (Lei Geral de Proteção de Dados)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
