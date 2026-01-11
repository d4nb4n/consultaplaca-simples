import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { placa } = req.query;

  if (!placa) return res.status(400).json({ error: 'Placa é obrigatória' });

  try {
    // Acessa o site diretamente
    const { data } = await axios.get(`https://puxaplaca.com.br/placa/${placa}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });

    const $ = cheerio.load(data);
    
    // Extração baseada na estrutura comum desses sites (tabelas ou listas)
    // Nota: Os seletores abaixo são genéricos, se o site mudar, ajustamos aqui.
    const dados = {
      marca_modelo: $('td:contains("Marca/Modelo")').next().text().trim(),
      ano_fabricacao: $('td:contains("Ano Fabricação")').next().text().trim(),
      ano_modelo: $('td:contains("Ano Modelo")').next().text().trim(),
      cor: $('td:contains("Cor")').next().text().trim(),
    };

    return res.status(200).json(dados);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar placa' });
  }
}