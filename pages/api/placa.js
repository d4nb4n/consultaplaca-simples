import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { id, url } = req.query;

  console.log("🔍 API /placa chamada com id:", id); // LOG ADICIONADO

  if (!id) {
    return res.status(400).json({ erro: "Parâmetro 'id' (placa) é obrigatório" });
  }

  const targetUrl = url
    ? url
    : `https://puxaplaca.com.br/placa/${id}`;

  const apiKey = process.env.ZENROWS_KEY;
  if (!apiKey) {
    return res.status(500).json({ erro: "ZENROWS_KEY não configurada no ambiente" });
  }

  const proxyUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(
    targetUrl
  )}&js_render=true`;

  try {
    const response = await fetch(proxyUrl);
    const html = await response.text();

    console.log("HTML recebido:", html.substring(0, 500)); // LOG EXISTENTE

    const $ = cheerio.load(html);
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    // Veículo: remove prefixo "Placa XYZ -" e sufixo "- Puxa Placa"
    let veiculo = $("title").text().trim();
    veiculo = veiculo.replace(/^Placa\s+[A-Z0-9\-]+\s*-\s*/i, "");
    veiculo = veiculo.replace(/\s*-\s*Puxa Placa$/i, "").trim();

    // Cor: separa corretamente
    let cor = bodyText.match(/Cor:\s*([A-Za-zÀ-ÿ]+)/i)?.[1] || "";
    cor = cor.replace(/Passageiros$/i, "").trim();

    // Ano
    const ano = bodyText.match(/\b(19|20)\d{2}\b/)?.[0] || "";

    // Município e UF
    const cidadeUfMatch = bodyText.match(/([A-ZÁ-Ú][A-Za-zÀ-ÿ]+)\s*\(([A-Z]{2})\)/i);
    const municipio = cidadeUfMatch?.[1]?.trim() || "";
    const uf = cidadeUfMatch?.[2]?.trim() || "";

    const dados = {
      placa: id.toUpperCase(),
      veiculo,
      cor,
      ano,
      municipio,
      uf,
      fonte: targetUrl,
    };

    res.status(200).json(dados);
  } catch (err) {
    console.error("Erro ao consultar:", err);
    res.status(500).json({ erro: "Falha ao consultar placa" });
  }
}
