// Versão Blindada - 08/01/2026 - v3
import cheerio from "cheerio";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: "Placa obrigatória" });

  const placa = String(id).trim().toUpperCase();
  const sites = [
    `https://www.keplaca.com/placa?placa-fipe=${placa}`,
    `https://puxaplaca.com.br/placa/${placa}`
  ];

  const services = [
    {
      name: "ZenRows",
      key: process.env.ZENROWS_KEY,
      // Ativa js_render e premium_proxy para evitar bloqueios detectados no painel
      url: (target) => `https://api.zenrows.com/v1/?apikey=${process.env.ZENROWS_KEY}&url=${encodeURIComponent(target)}&js_render=true&premium_proxy=true`
    },
    {
      name: "ScrapDo",
      key: process.env.SCRAPDO_KEY,
      url: (target) => `https://api.scrape.do?token=${process.env.SCRAPDO_KEY}&url=${encodeURIComponent(target)}&render=true`
    }
  ];

  let mensagemErroFinal = "Nenhum serviço disponível ou chaves expiradas.";

  try {
    for (const site of sites) {
      for (const service of services) {
        if (!service.key) continue;

        try {
          const response = await fetch(service.url(site));
          if (!response.ok) {
            mensagemErroFinal = `${service.name} retornou status ${response.status}`;
            continue;
          }
          
          const html = await response.text();

          // SÓ CHAMA O CHEERIO SE O HTML FOR VÁLIDO
          if (html && typeof html === 'string' && html.length > 500 && !html.includes("Attention Required")) {
            const $ = cheerio.load(html);
            const bodyText = $("body").text().replace(/\s+/g, " ").trim();
            
            // Extração robusta de dados
            let tipo = /Moto|Motocicleta/i.test(bodyText) ? "Moto" : "Carro";
            let marca = bodyText.match(/Marca:\s*([A-Za-zÀ-ú0-9\- ]+)/i)?.[1] || "";
            let modelo = bodyText.match(/Modelo:\s*([A-Za-zÀ-ú0-9\- ]+)/i)?.[1] || "";
            let ano = bodyText.match(/\b(19|20)\d{2}\b/)?.[0] || "n/a";

            if (marca || modelo) {
              return res.status(200).json({ 
                placa, tipo, marca, modelo, ano, 
                fonte: service.name 
              });
            }
          } else {
            mensagemErroFinal = `${service.name} retornou HTML vazio ou página de bloqueio.`;
          }
        } catch (err) {
          mensagemErroFinal = `Erro na rede (${service.name}): ${err.message}`;
        }
      }
    }

    return res.status(500).json({ erro: "Dados não encontrados", detalhe: mensagemErroFinal });
  } catch (err) {
    return res.status(500).json({ erro: "Falha geral", detalhe: err.message });
  }
}