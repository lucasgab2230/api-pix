import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Stringifiable } from 'jspdf-autotable/dist/types';

export function exportToPDF(transactions: any[], filename: string = 'extrato.pdf') {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Extrato de Transações PIX', 14, 20);

  doc.setFontSize(10);
  doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

  const tableData = transactions.map((t, index) => [
    index + 1,
    t.description || 'PIX',
    t.senderName,
    t.receiverName,
    new Date(t.createdAt).toLocaleDateString('pt-BR'),
    t.amount.toFixed(2),
    t.status === 'completed' ? 'Concluída' : 
    t.status === 'pending' ? 'Pendente' : 
    t.status === 'failed' ? 'Falhou' : 
    t.status === 'cancelled' ? 'Cancelada' : t.status,
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Descrição', 'Remetente', 'Destinatário', 'Data', 'Valor', 'Status']],
    body: tableData as Stringifiable[][],
    theme: 'grid',
    styles: {
      fontSize: 8,
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 50 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30, halign: 'right' as const },
      6: { cellWidth: 25 },
    },
  });

  const totalSent = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceived = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Total Enviado: R$ ${totalSent.toFixed(2)}`, 14, finalY);
  doc.text(`Total Recebido: R$ ${totalReceived.toFixed(2)}`, 14, finalY + 8);
  doc.text(`Saldo: R$ ${(totalReceived - totalSent).toFixed(2)}`, 14, finalY + 16);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text('Documento gerado automaticamente por PIX BaaS', 14, 270);

  doc.save(filename);
}

export function exportToCSV(transactions: any[], filename: string = 'extrato.csv') {
  const headers = ['ID', 'Descrição', 'Remetente', 'Destinatário', 'Data', 'Valor', 'Status', 'Criado Em', 'Atualizado Em'];
  
  const csvData = [
    headers.join(','),
    ...transactions.map(t => [
      t.id,
      `"${t.description || 'PIX'}"`,
      `"${t.senderName}"`,
      `"${t.receiverName}"`,
      `"${new Date(t.createdAt).toLocaleDateString('pt-BR')}"`,
      t.amount.toFixed(2),
      t.status,
      `"${new Date(t.createdAt).toLocaleString('pt-BR')}"`,
      `"${new Date(t.updatedAt).toLocaleString('pt-BR')}"`,
    ].join(',')),
  ].join('\n');

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function generateBalanceReport(pixKeys: any[], transactions: any[]) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Relatório Financeiro', 14, 20);

  doc.setFontSize(10);
  doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
  doc.text('', 14, 35);

  const keysData = pixKeys.map((k, index) => [
    index + 1,
    k.name,
    k.type,
    k.key,
    k.bank,
    k.account,
    k.balance.toFixed(2),
    k.active ? 'Ativa' : 'Inativa',
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Nome', 'Tipo', 'Chave', 'Banco', 'Conta', 'Saldo', 'Status']],
    body: keysData as Stringifiable[][],
    theme: 'grid',
    styles: {
      fontSize: 8,
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
    },
    columnStyles: {
      0: { cellWidth: 6 },
      1: { cellWidth: 35 },
      2: { cellWidth: 12 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25, halign: 'right' as const },
      7: { cellWidth: 15 },
    },
  });

  const totalBalance = pixKeys.reduce((sum, k) => sum + k.balance, 0);
  const keysY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Saldo Total: R$ ${totalBalance.toFixed(2)}`, 14, keysY);
  doc.text(`Total de Chaves: ${pixKeys.length}`, 14, keysY + 8);

  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const totalSent = completedTransactions
    .filter(t => t.senderName === 'Você')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = completedTransactions
    .filter(t => t.receiverName === 'Você')
    .reduce((sum, t) => sum + t.amount, 0);

  doc.text(`Total Enviado: R$ ${totalSent.toFixed(2)}`, 14, keysY + 16);
  doc.text(`Total Recebido: R$ ${totalReceived.toFixed(2)}`, 14, keysY + 24);
  doc.text(`Saldo de Transações: R$ ${(totalReceived - totalSent).toFixed(2)}`, 14, keysY + 32);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text('Documento gerado automaticamente por PIX BaaS', 14, 260);

  doc.save('relatorio-financeiro.pdf');
}
