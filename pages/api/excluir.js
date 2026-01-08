import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;

  if (!id) return res.status(400).json({ erro: "ID não informado" });

  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    // Localiza a linha pelo ID curto
    const row = rows.find(r => r.get('ID') === id);

    if (row) {
      row.set('Visivel', 'Não');
      await row.save();
      return res.status(200).json({ sucesso: true });
    }

    return res.status(404).json({ erro: "Lead não encontrado" });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}