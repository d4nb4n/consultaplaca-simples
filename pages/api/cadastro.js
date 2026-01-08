import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  let { nome, telefone, placa } = req.body;

  try {
    const placaLimpa = placa ? placa.trim().toUpperCase() : "";
    const urlConsulta = `https://consultaplaca-simples.vercel.app/api/placa?id=${placaLimpa}`;
    let dadosPlaca = { tipo: 'Carro', marca: '', modelo: '', ano: 'n/a' };

    try {
      const consulta = await fetch(urlConsulta);
      if (consulta.ok) dadosPlaca = await consulta.json();
    } catch (e) {
      console.error("Erro na consulta da placa:", e.message);
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow({
      'Data/Hora': new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      'Nome': nome || 'Não informado',
      'WhatsApp': telefone || 'Não informado',
      'Placa': placaLimpa,
      'Tipo Veículo': dadosPlaca.tipo || 'Carro',
      'Marca/Modelo': dadosPlaca.marca ? `${dadosPlaca.marca} ${dadosPlaca.modelo}` : "Pendente/Erro API",
      'Ano': dadosPlaca.ano || 'n/a',
      'Status': 'Novo',
      'Origem': 'Landpage Principal'
    });

    return res.status(200).json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: "Erro no cadastro", detalhe: err.message });
  }
}