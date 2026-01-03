import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { id } = req.query;

  // Novo site como fonte
  const targetUrl = `https://www.keplaca.com/placa?placa-fipe=${id}`;

  try {
    const response = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0" } // simula navegador
    });
    const html = await response.text();

    // Log para depuração
    console.log("HTML recebido:", html.substring(0, 500));

    const $ = cheerio.load(html);

    // Estrutura inicial dos dados
    const dados = {
      placa: id,
      marca: "",
      modelo: "",
      ano: "",
      anoModelo: "",
      cor: "",
      municipio: "",
      uf: "",
      chassi: "",
      fipe: [],
      ipva: []
    };

    // Exemplo de seletor (precisaremos ajustar conforme HTML real)
    dados.marca = $("td:contains('Marca')").next().text().trim();
    dados.modelo = $("td:contains('Modelo')").next().text().trim();
    dados.ano = $("td:contains('Ano')").next().text().trim();
    dados.cor = $("td:contains('Cor')").next().text().trim();

    res.status(200).json(dados);
  } catch (err) {
    console.error("Erro ao consultar:", err);
    res.status(500).json({ erro: "Falha ao consultar placa" });
  }
}
