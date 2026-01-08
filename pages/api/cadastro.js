import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  // 🛡️ Configuração de CORS para permitir requisições do frontend/AI Studio
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
    // 1. Tentar consultar a API de placa interna
    // Usamos a URL completa para garantir que o Vercel localize a função em produção
    const placaLimpa = placa ? placa.trim().toUpperCase() : "";
    const urlConsulta = `https://consultaplaca-simples.vercel.app/api/placa?id=${placaLimpa}`;
    
    let dadosPlaca = { tipo: 'Carro', marca: '', modelo: '', ano: 'n/a' };

    try {
      const consulta = await fetch(urlConsulta);
      if (consulta.ok) {
        dadosPlaca = await consulta.json();
      } else {
        console.error(`API de Placa respondeu com status: ${consulta.status}`);
      }
    } catch (fetchError) {
      console.error("Erro ao conectar na API de placa:", fetchError.message);
    }

    // 2. Autenticação no Google Sheets usando variáveis de ambiente (Vercel/Local)
    //
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 3. Conexão com a Planilha via ID
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // 4. Preparar os campos para a planilha
    // Se a marca/modelo vierem vazios, indicamos que a consulta falhou na planilha
    const marcaModelo = dadosPlaca.marca && dadosPlaca.modelo 
      ? `${dadosPlaca.marca} ${dadosPlaca.modelo}` 
      : "Pendente / API Offline";

    // 5. Inserir a linha na planilha
    await sheet.addRow({
      'Data/Hora': new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      'Nome': nome || 'Não informado',
      'WhatsApp': telefone || 'Não informado',
      'Placa': placaLimpa,
      'Tipo Veículo': dadosPlaca.tipo || 'Carro',
      'Marca/Modelo': marcaModelo,
      'Ano': dadosPlaca.ano || 'n/a',
      'Status': 'Novo',
      'Origem': 'Landpage Principal'
    });

    return res.status(200).json({ 
      sucesso: true, 
      message: "Lead salvo com sucesso!",
      detalhes_veiculo: dadosPlaca 
    });

  } catch (err) {
    console.error("Erro crítico no cadastro:", err);
    return res.status(500).json({ 
      erro: "Falha ao processar cadastro", 
      detalhe: err.message 
    });
  }
}