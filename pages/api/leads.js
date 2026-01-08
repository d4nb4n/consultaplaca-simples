import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    
    // Busca todas as linhas da planilha
    const rows = await sheet.getRows();
    
    // Filtra apenas os leads onde a coluna 'Visivel' é 'Sim'
    // E mapeia para o formato que o front-end espera
    const leads = rows
      .filter(row => row.get('Visivel') === 'Sim') 
      .map(row => ({
        id: row.get('ID'),
        name: row.get('Nome'),
        phone: row.get('WhatsApp'),
        plate: row.get('Placa'),
        date: row.get('Data'),      // Coluna Data separada
        hour: row.get('Hora'),      // Coluna Hora separada
        vehicle: row.get('Veículo'),
        year: row.get('Ano'),
        status: row.get('Status') || 'Novo',
        blindado: row.get('Blindado'),
        importado: row.get('Importado'),
        utilizacao: row.get('Utilização')
      }));

    // Retorna os leads (mais recentes primeiro)
    return res.status(200).json(leads.reverse());
    
  } catch (err) {
    console.error("Erro ao ler leads:", err.message);
    return res.status(500).json({ erro: "Falha ao carregar leads", detalhe: err.message });
  }
}