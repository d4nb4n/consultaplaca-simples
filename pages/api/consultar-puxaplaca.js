import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { placa } = req.query;

  if (!placa) {
    console.error("[CONSULTA] Erro: Tentativa de consulta sem placa.");
    return res.status(400).json({ error: 'Placa é obrigatória' });
  }

  console.log(`[CONSULTA] Iniciando busca para a placa: ${placa}`);

  try {
    const url = `https://puxaplaca.com.br/placa/${placa}`;
    
    // Configuração de timeout e headers mais realistas para evitar bloqueios
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    console.log(`[CONSULTA] Resposta do site recebida. Status: ${response.status}`);

    const $ = cheerio.load(response.data);
    
    // Log para verificar se o HTML contém o que esperamos
    const htmlSnippet = response.data.substring(0, 500);
    // console.log("[CONSULTA] Preview do HTML:", htmlSnippet);

    const dados = {
      marca_modelo: $('td:contains("Marca/Modelo")').next().text().trim(),
      ano_fabricacao: $('td:contains("Ano Fabricação")').next().text().trim(),
      ano_modelo: $('td:contains("Ano Modelo")').next().text().trim(),
      cor: $('td:contains("Cor")').next().text().trim(),
    };

    // Validação de dados vazios
    if (!dados.marca_modelo) {
      console.warn("[CONSULTA] Aviso: HTML lido com sucesso, mas seletores não encontraram dados. O layout do site pode ter mudado.");
    } else {
      console.log("[CONSULTA] Dados extraídos com sucesso:", dados);
    }

    return res.status(200).json(dados);

  } catch (error) {
    // LOG DETALHADO PARA O PAINEL VERCEL
    console.error("[CONSULTA] ERRO CRÍTICO:");
    console.error("- Mensagem:", error.message);
    
    if (error.response) {
      // O site respondeu com erro (ex: 403 Forbidden ou 404)
      console.error("- Status do Site:", error.response.status);
      console.error("- Headers do Site:", error.response.headers);
      return res.status(error.response.status).json({ 
        error: "O site de consulta bloqueou a requisição ou a placa não existe.",
        code: error.response.status 
      });
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta (timeout)
      console.error("- Erro de Rede: O site não respondeu a tempo.");
      return res.status(504).json({ error: "O site de consulta demorou muito para responder." });
    } else {
      return res.status(500).json({ error: error.message });
    }
  }
}