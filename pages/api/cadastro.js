import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { nome, telefone, email, placa, blindado, importado, utilizacao } = req.body;

  try {
    // 1. Consulta a placa (usando a sua própria API interna)
    const consulta = await fetch(`https://${req.headers.host}/api/placa?id=${placa}`);
    const dadosPlaca = await consulta.json();

    // 2. Configura Google Sheets
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // 3. Adiciona a linha
    await sheet.addRow({
      'Data/Hora': new Date().toLocaleString('pt-BR'),
      'Nome': nome,
      'WhatsApp': telefone,
      'Placa': placa.toUpperCase(),
      'Veículo': dadosPlaca.marca_modelo || "Pendente",
      'Ano': dadosPlaca.ano || "n/a",
      'Blindado': blindado,
      'Utilização': utilizacao
    });

    return res.status(200).json({ sucesso: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: err.message });
  }
}