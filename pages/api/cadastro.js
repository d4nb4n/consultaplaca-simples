import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid'; // Instale: npm install uuid

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  const { nome, telefone, email, cep, placa, blindado, importado, utilizacao } = req.body;
  
  // Gera um ID curto de 5 caracteres para não quebrar o layout
  const shortId = uuidv4().split('-')[0].toUpperCase().substring(0, 5);

  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow({
      'ID': shortId, // ID independente
      'Data': new Date().toLocaleDateString('pt-BR'), // Coluna própria
      'Hora': new Date().toLocaleTimeString('pt-BR'), // Coluna própria
      'Nome': nome,
      'WhatsApp': telefone,
      'Placa': placa.toUpperCase(),
      'Status': 'Novo',
      'Visivel': 'Sim', // Controle de visualização (Soft Delete)
      'Veículo': 'Pendente',
      'Blindado': blindado,
      'Utilização': utilizacao
    });

    return res.status(200).json({ sucesso: true, id: shortId });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}