import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPDF(transactions: unknown[], filename: string = 'extrato.pdf') {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Extrato de Transações PIX', 14, 20);

  doc.setFontSize(10);
  doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

  const tableData = transactions.map((t: any, index: number) => [
    index + 1,
    t.description || 'PIX',
    t.senderName || '',
    t.receiverName || '',
    new Date(t.createdAt || Date.now()).toLocaleDateString('pt-BR'),
    (t.amount || 0).toFixed(2),
    t.status === 'completed' ? 'Concluída' :
    t.status === 'pending' ? 'Pendente' :
    t.status === 'failed' ? 'Falhou' :
    t.status === 'cancelled' ? 'Cancelada' : t.status || '',
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Descrição', 'Remetente', 'Destinatário', 'Data', 'Valor', 'Status']],
    body: tableData as any[][],
    theme: 'grid',
    styles: {
      fontSize: 8,
    },
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
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
    .filter((t: any) => t.status === 'completed')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const totalReceived = transactions
    .filter((t: any) => t.status === 'completed')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const finalY = (doc as any).lastAutoTable?.finalY ?? 62 + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Enviado: R$ ${totalSent.toFixed(2)}`, 14, finalY);
  doc.text(`Total Recebido: R$ ${totalReceived.toFixed(2)}`, 14, finalY + 8);
  doc.text(`Saldo: R$ ${(totalReceived - totalSent).toFixed(2)}`, 14, finalY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Documento gerado automaticamente por PIX BaaS', 14, 270);

  doc.save(filename);
}

export function exportToCSV(transactions: unknown[], filename: string = 'extrato.csv') {
  const headers = ['ID', 'Descrição', 'Remetente', 'Destinatário', 'Data', 'Valor', 'Status', 'Criado Em', 'Atualizado Em'];
  
  const csvData = [
    headers.join(','),
    ...transactions.map((t: any) => [
      t.id || '',
      `"${t.description || 'PIX'}"`,
      `"${t.senderName || ''}"`,
      `"${t.receiverName || ''}"`,
      `"${new Date(t.createdAt || Date.now()).toLocaleDateString('pt-BR')}"`,
      (t.amount || 0).toFixed(2),
      t.status || '',
      `"${new Date(t.createdAt || Date.now()).toLocaleString('pt-BR')}"`,
      `"${new Date(t.updatedAt || Date.now()).toLocaleString('pt-BR')}"`,
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

export function generateBalanceReport(pixKeys: unknown[], transactions: unknown[]) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Relatório Financeiro', 14, 20);

  doc.setFontSize(10);
  doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
  doc.text('', 14, 35);

  const keysData = pixKeys.map((k: any, index: number) => [
    index + 1,
    k.name || '',
    k.type || '',
    k.key || '',
    k.bank || '',
    k.account || '',
    (k.balance || 0).toFixed(2),
    k.active ? 'Ativa' : 'Inativa',
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Nome', 'Tipo', 'Chave', 'Banco', 'Conta', 'Saldo', 'Status']],
    body: keysData as any[][],
    theme: 'grid',
    styles: {
      fontSize: 8,
    },
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
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

  const totalBalance = (pixKeys as Array<{ balance: number }>).reduce((sum, k) => sum + k.balance, 0);
  const keysY = (doc as any).lastAutoTable?.finalY ?? 62 + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Saldo Total: R$ ${totalBalance.toFixed(2)}`, 14, keysY);
  doc.text(`Total de Chaves: ${pixKeys.length}`, 14, keysY + 8);

  const completedTransactions = transactions.filter((t: any) => t.status === 'completed');
  const totalSent = completedTransactions
    .filter((t: any) => t.senderName === 'Você')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const totalReceived = completedTransactions
    .filter((t: any) => t.receiverName === 'Você')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  doc.text(`Total Enviado: R$ ${totalSent.toFixed(2)}`, 14, keysY + 16);
  doc.text(`Total Recebido: R$ ${totalReceived.toFixed(2)}`, 14, keysY + 24);
  doc.text(`Saldo de Transações: R$ ${(totalReceived - totalSent).toFixed(2)}`, 14, keysY + 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Documento gerado automaticamente por PIX BaaS', 14, 260);

  doc.save('relatorio-financeiro.pdf');
}
