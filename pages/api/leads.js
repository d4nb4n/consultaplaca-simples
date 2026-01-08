import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
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
    
    // Mapeia os dados para o formato que o seu LeadsTable.tsx espera
    const leads = rows.map(row => ({
      id: row.get('Placa') + row.get('Data/Hora'), // ID único simples
      name: row.get('Nome'),
      phone: row.get('WhatsApp'),
      plate: row.get('Placa'),
      vehicle: row.get('Veículo'),
      year: row.get('Ano'),
      status: 'Novo', // Status padrão
      createdAt: row.get('Data/Hora')
    }));

    return res.status(200).json(leads.reverse()); // Mostra os mais recentes primeiro
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Falha ao ler planilha", detalhe: err.message });
  }
}