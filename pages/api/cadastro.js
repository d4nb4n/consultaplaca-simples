import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  // Configuração de CORS para permitir que o front-end envie dados
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  // 1. Recebe os dados vindo do formulário (sem marca_modelo ou ano por enquanto)
  const { nome, telefone, email, cep, placa, blindado, importado, utilizacao } = req.body;

  console.log("Recebido para cadastro:", { nome, telefone, placa });

  try {
    // 2. Configura a autenticação com o Google Sheets usando as variáveis de ambiente do Vercel
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    
    // Carrega as informações da planilha
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Pega a primeira aba da planilha

    // 3. Adiciona a nova linha na planilha
    // Nota: Deixamos 'Veículo' e 'Ano' como "A consultar" para o consultor preencher depois
    await sheet.addRow({
      'Data/Hora': new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      'Nome': nome,
      'WhatsApp': telefone,
      'E-mail': email || '',
      'CEP': cep || '',
      'Placa': placa.toUpperCase(),
      'Veículo': 'A consultar', 
      'Ano': 'A consultar',
      'Blindado': blindado,
      'Importado': importado,
      'Utilização': utilizacao
    });

    console.log("Lead salvo com sucesso na planilha!");

    return res.status(200).json({ sucesso: true, mensagem: "Lead cadastrado com sucesso" });

  } catch (err) {
    console.error("Erro ao salvar na planilha:", err.message);
    return res.status(500).json({ erro: "Falha ao salvar os dados", detalhe: err.message });
  }
}