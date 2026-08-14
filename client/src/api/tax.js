import api from './axios';

export const getCapitalGains = (params = {}) =>
  api.get('/tax/capital-gains', { params }).then((r) => r.data);

export async function downloadStatementPdf() {
  const res = await api.get('/tax/statement.pdf', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finvault-statement-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
