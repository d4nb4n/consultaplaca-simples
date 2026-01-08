import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  // Mantém a permissão para o AI Studio enviar dados
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  // 📥 Dados recebidos do formulário
  let { nome, telefone, email, cep, placa, blindado, importado, utilizacao } = req.body;

  try {
    // 1. Consulta a API de placa para pegar Marca/Modelo/Ano/Tipo
    const consulta = await fetch(
      `https://consultaplaca-simples.vercel.app/api/placa?id=${placa}`
    );

    let dadosPlaca = {};
    if (consulta.ok) {
      dadosPlaca = await consulta.json();
    }

    // 2. Configurar Autenticação do Google (Usa o .env.local ou Vercel)
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 3. Conectar à Planilha
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // 4. Salvar na Planilha (Certifique-se que os nomes das colunas batem com a linha 1)
    await sheet.addRow({
      'Data/Hora': new Date().toLocaleString('pt-BR'),
      'Nome': nome,
      'WhatsApp': telefone,
      'Placa': placa.toUpperCase(),
      'Tipo Veículo': dadosPlaca.tipo || 'Carro',
      'Marca/Modelo': `${dadosPlaca.marca || ''} ${dadosPlaca.modelo || ''}`.trim() || 'n/a',
      'Ano': dadosPlaca.ano || 'n/a',
      'Status': 'Novo',
      'Origem': 'Landpage AI Studio'
    });

    return res.status(200).json({ sucesso: true, message: "Lead salvo na planilha!" });

  } catch (err) {
    console.error("Erro no processo:", err);
    return res.status(500).json({ erro: "Falha no cadastro", detalhe: err.message });
  }
}